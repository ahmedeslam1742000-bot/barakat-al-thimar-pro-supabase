-- Phase 1 / Core inventory RPCs
-- Creates:
--   1) public.inventory_commit_invoice(payload jsonb)
--   2) public.inventory_upsert_voucher(payload jsonb)
--
-- Notes:
-- - Both functions are SECURITY INVOKER and therefore respect existing RLS.
-- - Payload is JSONB to keep the React contract flexible while we stabilize the API.
-- - Responses are JSONB envelopes shaped for the planned ui_snapshot/refresh_hint flow.

create or replace function public.inventory_commit_invoice(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_mode text := coalesce(payload->>'mode', 'direct');
  v_actor_user_id text := nullif(payload->>'actor_user_id', '');
  v_actor_user_name text := nullif(payload->>'actor_user_name', '');
  v_client_timestamp text := payload->>'client_timestamp';
  v_invoice_header jsonb := coalesce(payload->'invoice_header', '{}'::jsonb);
  v_source_voucher jsonb := coalesce(payload->'source_voucher', '{}'::jsonb);
  v_lines jsonb := coalesce(payload->'lines', '[]'::jsonb);
  v_line jsonb;
  v_batch_id text;
  v_reference_number text;
  v_invoice_date date := coalesce(nullif(v_invoice_header->>'date', '')::date, current_date);
  v_invoice_timestamp_text text := to_char(now() at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI');
  v_beneficiary text := nullif(coalesce(v_invoice_header->>'client_name', v_source_voucher->>'client_name', v_source_voucher->>'beneficiary'), '');
  v_rep text := nullif(coalesce(v_invoice_header->>'rep_name', v_source_voucher->>'rep_name', v_source_voucher->>'rep'), '');
  v_notes_base text := coalesce(nullif(v_invoice_header->>'notes', ''), '');
  v_receipt_image text := nullif(v_invoice_header->>'receipt_image_url', '');
  v_voucher_batch_id text := nullif(coalesce(v_source_voucher->>'batch_id', v_source_voucher->>'voucher_group_id', v_source_voucher->>'id'), '');
  v_voucher_code text := nullif(coalesce(v_source_voucher->>'voucher_code', v_source_voucher->>'reference_number'), '');
  v_voucher_type text := coalesce(nullif(v_source_voucher->>'voucher_type', ''), 'سند إخراج');
  v_new_line_count integer := 0;
  v_total_qty numeric := 0;
  v_tx_ids text[] := '{}'::text[];
  v_deleted_tx_ids text[] := '{}'::text[];
  v_affected_item_ids text[] := '{}'::text[];
  v_deleted_count integer := 0;
  v_inserted_count integer := 0;
  v_updated_count integer := 0;
  v_item_id_text text;
  v_item_id_db text;
  v_display_name text;
  v_company text;
  v_cat text;
  v_unit text;
  v_qty numeric;
  v_existing_qty numeric;
  v_diff numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_tx_id text;
  v_exists boolean;
  v_summary_exists boolean;
  v_row_count integer;
  v_balances jsonb;
  v_ui_snapshot jsonb;
begin
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'INVOICE_LINES_REQUIRED',
      detail = 'payload.lines must be a non-empty JSON array';
  end if;

  create temporary table if not exists _invoice_input_lines (
    item_id_text text primary key,
    display_name text,
    company text,
    cat text,
    unit text,
    qty numeric not null
  ) on commit drop;
  truncate _invoice_input_lines;

  for v_line in
    select value
    from jsonb_array_elements(v_lines)
  loop
    v_item_id_text := coalesce(v_line->>'item_id', v_line->>'selectedItemId', v_line#>>'{selectedItem,id}');
    if v_item_id_text is null or btrim(v_item_id_text) = '' then
      raise exception using
        errcode = 'P0001',
        message = 'ITEM_ID_REQUIRED',
        detail = format('A line is missing item_id. request_id=%s', v_request_id);
    end if;

    select p.id::text
      into v_item_id_db
    from public.products p
    where p.id::text = v_item_id_text
    limit 1;

    if v_item_id_db is null then
      raise exception using
        errcode = 'P0001',
        message = 'PRODUCT_NOT_FOUND',
        detail = format('Product not found for item_id=%s', v_item_id_text);
    end if;

    v_qty := coalesce(nullif(v_line->>'qty', '')::numeric, 0);
    if v_qty <= 0 then
      raise exception using
        errcode = 'P0001',
        message = 'INVALID_QTY',
        detail = format('Quantity must be > 0 for item_id=%s', v_item_id_text);
    end if;

    v_display_name := coalesce(nullif(v_line->>'display_name', ''), nullif(v_line->>'name', ''), nullif(v_line#>>'{selectedItem,name}', ''), 'صنف غير محدد');
    v_company := coalesce(nullif(v_line->>'company', ''), nullif(v_line#>>'{selectedItem,company}', ''), 'بدون شركة');
    v_cat := coalesce(nullif(v_line->>'cat', ''), nullif(v_line#>>'{selectedItem,cat}', ''), '');
    v_unit := coalesce(nullif(v_line->>'unit', ''), nullif(v_line#>>'{selectedItem,unit}', ''), '');

    insert into _invoice_input_lines (item_id_text, display_name, company, cat, unit, qty)
    values (v_item_id_db, v_display_name, v_company, v_cat, v_unit, v_qty)
    on conflict (item_id_text) do update
      set qty = _invoice_input_lines.qty + excluded.qty,
          display_name = excluded.display_name,
          company = excluded.company,
          cat = excluded.cat,
          unit = excluded.unit;
  end loop;

  select array_agg(item_id_text order by item_id_text), coalesce(sum(qty), 0), count(*)
    into v_affected_item_ids, v_total_qty, v_new_line_count
  from _invoice_input_lines;

  if coalesce(array_length(v_affected_item_ids, 1), 0) > 0 then
    perform 1
    from public.products p
    where p.id::text = any(v_affected_item_ids)
    order by p.id::text
    for update;
  end if;

  if v_mode = 'direct' then
    v_batch_id := coalesce(nullif(v_invoice_header->>'batch_id', ''), 'INV-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text);
    v_reference_number := coalesce(nullif(v_invoice_header->>'reference_number', ''), v_batch_id);

    for v_item_id_text, v_qty, v_display_name, v_company, v_cat, v_unit in
      select item_id_text, qty, display_name, company, cat, unit
      from _invoice_input_lines
    loop
      select coalesce(p.stock_qty, 0)
        into v_current_stock
      from public.products p
      where p.id::text = v_item_id_text
      for update;

      if v_current_stock < v_qty then
        raise exception using
          errcode = 'P0001',
          message = 'INSUFFICIENT_STOCK',
          detail = format('item_id=%s available=%s requested=%s', v_item_id_text, v_current_stock, v_qty);
      end if;

      v_new_stock := v_current_stock - v_qty;
      update public.products
      set stock_qty = v_new_stock
      where id::text = v_item_id_text;

      insert into public.transactions (
        item,
        item_id,
        company,
        qty,
        unit,
        cat,
        beneficiary,
        rep,
        type,
        date,
        timestamp,
        batch_id,
        reference_number,
        status,
        notes,
        balance_after
      )
      select
        v_display_name,
        p.id,
        nullif(v_company, ''),
        v_qty,
        nullif(v_unit, ''),
        nullif(v_cat, ''),
        v_beneficiary,
        v_rep,
        'Issue',
        v_invoice_date,
        now(),
        v_batch_id,
        v_reference_number,
        'مفوتر',
        trim(both from concat_ws(' ', nullif(v_notes_base, ''), '[نوع: صادر]', '[تم إصدار الفاتورة: ' || v_invoice_timestamp_text || ']')),
        v_new_stock
      from public.products p
      where p.id::text = v_item_id_text
      returning id::text into v_tx_id;

      v_tx_ids := array_append(v_tx_ids, v_tx_id);
      v_inserted_count := v_inserted_count + 1;
    end loop;

  elsif v_mode = 'from_voucher' then
    if v_voucher_batch_id is null then
      raise exception using
        errcode = 'P0001',
        message = 'SOURCE_VOUCHER_REQUIRED',
        detail = 'source_voucher.batch_id is required when mode=from_voucher';
    end if;

    v_batch_id := v_voucher_batch_id;
    v_reference_number := coalesce(v_voucher_code, v_voucher_batch_id);

    create temporary table if not exists _invoice_existing_lines (
      tx_id text primary key,
      item_id_text text,
      qty numeric,
      is_summary boolean,
      notes text,
      item text,
      company text,
      cat text,
      unit text
    ) on commit drop;
    truncate _invoice_existing_lines;

    insert into _invoice_existing_lines (tx_id, item_id_text, qty, is_summary, notes, item, company, cat, unit)
    select
      t.id::text,
      t.item_id::text,
      coalesce(t.qty, 0),
      coalesce(t.is_summary, false),
      t.notes,
      t.item,
      t.company,
      t.cat,
      t.unit
    from public.transactions t
    where t.batch_id = v_batch_id;

    if not exists (select 1 from _invoice_existing_lines) then
      raise exception using
        errcode = 'P0001',
        message = 'VOUCHER_NOT_FOUND',
        detail = format('No transactions found for batch_id=%s', v_batch_id);
    end if;

    for v_tx_id, v_item_id_text, v_existing_qty in
      select e.tx_id, e.item_id_text, e.qty
      from _invoice_existing_lines e
      where e.is_summary = false
    loop
      select exists (
        select 1 from _invoice_input_lines i where i.item_id_text = v_item_id_text
      ) into v_exists;

      if v_exists then
        select i.qty, i.display_name, i.company, i.cat, i.unit
          into v_qty, v_display_name, v_company, v_cat, v_unit
        from _invoice_input_lines i
        where i.item_id_text = v_item_id_text;

        v_diff := v_qty - v_existing_qty;

        select coalesce(stock_qty, 0)
          into v_current_stock
        from public.products
        where id::text = v_item_id_text
        for update;

        if v_diff > 0 and v_current_stock < v_diff then
          raise exception using
            errcode = 'P0001',
            message = 'INSUFFICIENT_STOCK',
            detail = format('item_id=%s available=%s requested_delta=%s', v_item_id_text, v_current_stock, v_diff);
        end if;

        v_new_stock := v_current_stock - v_diff;
        update public.products
        set stock_qty = v_new_stock
        where id::text = v_item_id_text;

        update public.transactions
        set qty = v_qty,
            item = v_display_name,
            company = nullif(v_company, ''),
            cat = nullif(v_cat, ''),
            unit = nullif(v_unit, ''),
            beneficiary = coalesce(v_beneficiary, beneficiary),
            rep = coalesce(v_rep, rep),
            status = 'مفوتر',
            notes = trim(both from concat_ws(' ',
              nullif(regexp_replace(coalesce(notes, ''), '\s*\[تم إصدار الفاتورة(:.*?)?\]', '', 'g'), ''),
              '[تم إصدار الفاتورة: ' || v_invoice_timestamp_text || ']'
            )),
            balance_after = v_new_stock
        where id::text = v_tx_id;

        v_tx_ids := array_append(v_tx_ids, v_tx_id);
        v_updated_count := v_updated_count + 1;
      else
        select coalesce(stock_qty, 0)
          into v_current_stock
        from public.products
        where id::text = v_item_id_text
        for update;

        v_new_stock := v_current_stock + v_existing_qty;

        update public.products
        set stock_qty = v_new_stock
        where id::text = v_item_id_text;

        delete from public.transactions
        where id::text = v_tx_id;

        v_deleted_tx_ids := array_append(v_deleted_tx_ids, v_tx_id);
        v_deleted_count := v_deleted_count + 1;
      end if;
    end loop;

    for v_item_id_text, v_qty, v_display_name, v_company, v_cat, v_unit in
      select i.item_id_text, i.qty, i.display_name, i.company, i.cat, i.unit
      from _invoice_input_lines i
      where not exists (
        select 1
        from _invoice_existing_lines e
        where e.is_summary = false
          and e.item_id_text = i.item_id_text
      )
    loop
      select coalesce(stock_qty, 0)
        into v_current_stock
      from public.products
      where id::text = v_item_id_text
      for update;

      if v_current_stock < v_qty then
        raise exception using
          errcode = 'P0001',
          message = 'INSUFFICIENT_STOCK',
          detail = format('item_id=%s available=%s requested=%s', v_item_id_text, v_current_stock, v_qty);
      end if;

      v_new_stock := v_current_stock - v_qty;

      update public.products
      set stock_qty = v_new_stock
      where id::text = v_item_id_text;

      insert into public.transactions (
        item,
        item_id,
        company,
        qty,
        unit,
        cat,
        beneficiary,
        rep,
        type,
        date,
        timestamp,
        batch_id,
        reference_number,
        status,
        notes,
        balance_after
      )
      select
        v_display_name,
        p.id,
        nullif(v_company, ''),
        v_qty,
        nullif(v_unit, ''),
        nullif(v_cat, ''),
        coalesce(v_beneficiary, v_source_voucher->>'client_name'),
        coalesce(v_rep, v_source_voucher->>'rep'),
        v_voucher_type,
        v_invoice_date,
        now(),
        v_batch_id,
        v_reference_number,
        'مفوتر',
        '[إضافة مراجعة] [تم إصدار الفاتورة: ' || v_invoice_timestamp_text || ']',
        v_new_stock
      from public.products p
      where p.id::text = v_item_id_text
      returning id::text into v_tx_id;

      v_tx_ids := array_append(v_tx_ids, v_tx_id);
      v_inserted_count := v_inserted_count + 1;
    end loop;

    select exists (
      select 1
      from public.transactions
      where batch_id = v_batch_id
        and coalesce(is_summary, false) = true
    ) into v_summary_exists;

    if v_summary_exists then
      update public.transactions
      set qty = v_total_qty,
          total_qty = v_total_qty,
          status = 'مفوتر',
          notes = trim(both from concat_ws(' ',
            nullif(regexp_replace(coalesce(notes, ''), '\s*\[تم إصدار الفاتورة(:.*?)?\]', '', 'g'), ''),
            '[تم إصدار الفاتورة: ' || v_invoice_timestamp_text || ']'
          ))
      where batch_id = v_batch_id
        and coalesce(is_summary, false) = true;
    end if;

    update public.transactions
    set status = 'مفوتر',
        receipt_image = coalesce(v_receipt_image, receipt_image)
    where batch_id = v_batch_id;

  else
    raise exception using
      errcode = 'P0001',
      message = 'UNSUPPORTED_MODE',
      detail = format('Unsupported invoice mode: %s', v_mode);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_id', p.id::text,
        'stock_qty', coalesce(p.stock_qty, 0),
        'damaged_qty', coalesce(p.damaged_qty, 0),
        'changed_by', coalesce(v_actor_user_name, v_actor_user_id),
        'reason', case when v_mode = 'direct' then 'invoice_direct' else 'invoice_from_voucher' end
      )
      order by p.id::text
    ),
    '[]'::jsonb
  )
    into v_balances
  from public.products p
  where p.id::text = any(v_affected_item_ids);

  v_ui_snapshot := jsonb_build_object(
    'invoice_timestamp', v_invoice_timestamp_text,
    'voucher_state', case
      when v_mode = 'from_voucher' then jsonb_build_object(
        'batch_id', v_batch_id,
        'invoiced', true,
        'invoice_date', v_invoice_timestamp_text
      )
      else null
    end,
    'summary', jsonb_build_object(
      'line_count', v_new_line_count,
      'total_qty', v_total_qty,
      'inserted_count', v_inserted_count,
      'updated_count', v_updated_count,
      'deleted_count', v_deleted_count
    )
  );

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_commit_invoice',
    'mode', v_mode,
    'batch_id', v_batch_id,
    'reference_number', v_reference_number,
    'transaction_ids', to_jsonb(v_tx_ids),
    'deleted_transaction_ids', to_jsonb(v_deleted_tx_ids),
    'affected_item_ids', to_jsonb(v_affected_item_ids),
    'balances', v_balances,
    'warnings', '[]'::jsonb,
    'refresh_hint', jsonb_build_object(
      'products', true,
      'transactions', true,
      'dashboard', true,
      'voucher_lists', v_mode = 'from_voucher',
      'returns_list', false
    ),
    'ui_snapshot', v_ui_snapshot,
    'meta', jsonb_build_object(
      'actor_user_id', v_actor_user_id,
      'actor_user_name', v_actor_user_name,
      'client_timestamp', v_client_timestamp
    )
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_commit_invoice',
      'error_code', sqlstate,
      'error_message', sqlerrm,
      'failed_step', 'inventory_commit_invoice',
      'safe_to_retry', false
    );
end;
$$;


create or replace function public.inventory_upsert_voucher(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_mode text := coalesce(payload->>'mode', 'create');
  v_voucher_kind text := coalesce(payload->>'voucher_kind', 'out');
  v_existing_batch_id text := nullif(payload->>'existing_batch_id', '');
  v_header jsonb := coalesce(payload->'header', '{}'::jsonb);
  v_lines jsonb := coalesce(payload->'lines', '[]'::jsonb);
  v_actor_user_id text := nullif(payload->>'actor_user_id', '');
  v_actor_user_name text := nullif(payload->>'actor_user_name', '');
  v_client_timestamp text := payload->>'client_timestamp';
  v_date date := coalesce(nullif(v_header->>'date', '')::date, current_date);
  v_beneficiary text := nullif(coalesce(v_header->>'beneficiary_name', v_header->>'supplier_name', v_header->>'rep_name'), '');
  v_rep text := nullif(coalesce(v_header->>'rep_name', v_header->>'beneficiary_name', v_header->>'supplier_name'), '');
  v_location text := nullif(v_header->>'location_name', '');
  v_notes text := coalesce(nullif(v_header->>'notes', ''), '');
  v_receipt_image text := nullif(v_header->>'receipt_image_url', '');
  v_is_transfer boolean := coalesce((payload->>'is_transfer')::boolean, (v_header->>'is_transfer')::boolean, false);
  v_voucher_code text := nullif(v_header->>'voucher_code', '');
  v_prefix text := coalesce(v_header->>'voucher_code_prefix', '');
  v_counter_key text := coalesce(v_header->>'voucher_counter_key', case when v_voucher_kind = 'in' then 'in' else 'out' end) || extract(year from current_date)::text;
  v_tx_type text := case when v_voucher_kind = 'in' then 'سند إدخال' else 'سند إخراج' end;
  v_batch_id text := coalesce(v_existing_batch_id, 'VCH-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text);
  v_line jsonb;
  v_item_id_text text;
  v_item_id_db text;
  v_item_name text;
  v_company text;
  v_cat text;
  v_unit text;
  v_qty numeric;
  v_existing_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_delta numeric;
  v_tx_id text;
  v_total_qty numeric := 0;
  v_line_count integer := 0;
  v_tx_ids text[] := '{}'::text[];
  v_old_tx_ids text[] := '{}'::text[];
  v_affected_item_ids text[] := '{}'::text[];
  v_balances jsonb;
  v_ui_snapshot jsonb;
  v_history_tag text := '';
  -- Preserve invoice state when editing an already-invoiced voucher
  v_was_invoiced boolean := false;
  v_old_invoice_tag text := '';
  v_old_invoiced_status text := 'قيد المراجعة';
begin
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'VOUCHER_LINES_REQUIRED',
      detail = 'payload.lines must be a non-empty JSON array';
  end if;

  create temporary table if not exists _voucher_input_lines (
    item_id_text text primary key,
    item_name text,
    company text,
    cat text,
    unit text,
    qty numeric not null
  ) on commit drop;
  truncate _voucher_input_lines;

  for v_line in
    select value
    from jsonb_array_elements(v_lines)
  loop
    v_item_id_text := coalesce(v_line->>'item_id', v_line->>'itemId', v_line#>>'{selectedItem,id}');
    if v_item_id_text is null or btrim(v_item_id_text) = '' then
      raise exception using
        errcode = 'P0001',
        message = 'ITEM_ID_REQUIRED',
        detail = format('A voucher line is missing item_id. request_id=%s', v_request_id);
    end if;

    select p.id::text
      into v_item_id_db
    from public.products p
    where p.id::text = v_item_id_text
    limit 1;

    if v_item_id_db is null then
      raise exception using
        errcode = 'P0001',
        message = 'PRODUCT_NOT_FOUND',
        detail = format('Product not found for item_id=%s', v_item_id_text);
    end if;

    v_qty := coalesce(nullif(v_line->>'qty', '')::numeric, 0);
    if v_qty <= 0 then
      raise exception using
        errcode = 'P0001',
        message = 'INVALID_QTY',
        detail = format('Quantity must be > 0 for item_id=%s', v_item_id_text);
    end if;

    v_item_name := coalesce(nullif(v_line->>'item_name', ''), nullif(v_line->>'item', ''), nullif(v_line#>>'{selectedItem,name}', ''), 'صنف غير محدد');
    v_company := coalesce(nullif(v_line->>'company', ''), nullif(v_line#>>'{selectedItem,company}', ''), 'بدون شركة');
    v_cat := coalesce(nullif(v_line->>'cat', ''), nullif(v_line#>>'{selectedItem,cat}', ''), '');
    v_unit := coalesce(nullif(v_line->>'unit', ''), nullif(v_line#>>'{selectedItem,unit}', ''), '');

    insert into _voucher_input_lines (item_id_text, item_name, company, cat, unit, qty)
    values (v_item_id_db, v_item_name, v_company, v_cat, v_unit, v_qty)
    on conflict (item_id_text) do update
      set qty = _voucher_input_lines.qty + excluded.qty,
          item_name = excluded.item_name,
          company = excluded.company,
          cat = excluded.cat,
          unit = excluded.unit;
  end loop;

  select array_agg(item_id_text order by item_id_text), count(*), coalesce(sum(qty), 0)
    into v_affected_item_ids, v_line_count, v_total_qty
  from _voucher_input_lines;

  create temporary table if not exists _voucher_old_lines (
    tx_id text primary key,
    item_id_text text,
    qty numeric,
    is_summary boolean,
    item_name text,
    company text,
    cat text,
    unit text,
    notes text
  ) on commit drop;
  truncate _voucher_old_lines;

  if v_mode = 'edit' then
    if v_existing_batch_id is null then
      raise exception using
        errcode = 'P0001',
        message = 'EXISTING_BATCH_REQUIRED',
        detail = 'existing_batch_id is required when mode=edit';
    end if;

    insert into _voucher_old_lines (tx_id, item_id_text, qty, is_summary, item_name, company, cat, unit, notes)
    select
      t.id::text,
      t.item_id::text,
      coalesce(t.qty, 0),
      coalesce(t.is_summary, false),
      t.item,
      t.company,
      t.cat,
      t.unit,
      t.notes
    from public.transactions t
    where t.batch_id = v_existing_batch_id;

    if not exists (select 1 from _voucher_old_lines) then
      raise exception using
        errcode = 'P0001',
        message = 'VOUCHER_NOT_FOUND',
        detail = format('No transactions found for batch_id=%s', v_existing_batch_id);
    end if;

    select array_agg(distinct item_id_text)
      into v_affected_item_ids
    from (
      select unnest(coalesce(v_affected_item_ids, '{}'::text[])) as item_id_text
      union
      select item_id_text from _voucher_old_lines where is_summary = false
    ) s;

    select coalesce(
      ' <!--HIST:' || jsonb_build_object(
        'at', now(),
        'beneficiary', v_beneficiary,
        'date', v_date,
        'notes', v_notes,
        'lines', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'item', item_name,
                'qty', qty,
                'unit', unit,
                'cat', cat,
                'company', company
              )
              order by tx_id
            ),
            '[]'::jsonb
          )
          from _voucher_old_lines
          where is_summary = false
        )
      )::text || '-->',
      ''
    )
      into v_history_tag;
  end if;

  if coalesce(array_length(v_affected_item_ids, 1), 0) > 0 then
    perform 1
    from public.products p
    where p.id::text = any(v_affected_item_ids)
    order by p.id::text
    for update;
  end if;

  if v_mode = 'create' then
    if v_voucher_code is null then
      begin
        select public.allocate_voucher_code(v_prefix, v_counter_key)
          into v_voucher_code;
      exception
        when undefined_function then
          v_voucher_code := coalesce(v_prefix, '') || floor(random() * 900 + 100)::int::text;
      end;
    end if;

    if exists (
      select 1
      from public.transactions t
      where t.reference_number = v_voucher_code
        and t.type = v_tx_type
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'DUPLICATE_VOUCHER_CODE',
        detail = format('Voucher code already exists: %s', v_voucher_code);
    end if;

    for v_item_id_text, v_item_name, v_company, v_cat, v_unit, v_qty in
      select item_id_text, item_name, company, cat, unit, qty
      from _voucher_input_lines
    loop
      select coalesce(stock_qty, 0)
        into v_current_stock
      from public.products
      where id::text = v_item_id_text
      for update;

      if v_voucher_kind = 'out' and v_current_stock < v_qty then
        raise exception using
          errcode = 'P0001',
          message = 'INSUFFICIENT_STOCK',
          detail = format('item_id=%s available=%s requested=%s', v_item_id_text, v_current_stock, v_qty);
      end if;

      v_new_stock := case
        when v_voucher_kind = 'in' then v_current_stock + v_qty
        else v_current_stock - v_qty
      end;

      update public.products
      set stock_qty = v_new_stock
      where id::text = v_item_id_text;

      insert into public.transactions (
        type,
        date,
        batch_id,
        reference_number,
        beneficiary,
        rep,
        location,
        item,
        item_id,
        company,
        qty,
        unit,
        cat,
        notes,
        receipt_image,
        timestamp,
        is_summary,
        status,
        balance_after
      )
      select
        v_tx_type,
        v_date,
        v_batch_id,
        v_voucher_code,
        v_beneficiary,
        v_rep,
        v_location,
        v_item_name,
        p.id,
        nullif(v_company, ''),
        v_qty,
        nullif(v_unit, ''),
        nullif(v_cat, ''),
        trim(both from concat_ws(' ', nullif(v_notes, ''), case when v_is_transfer then '[نوع: تحويل مخزني]' else null end)),
        v_receipt_image,
        now(),
        false,
        'قيد المراجعة',
        v_new_stock
      from public.products p
      where p.id::text = v_item_id_text
      returning id::text into v_tx_id;

      v_tx_ids := array_append(v_tx_ids, v_tx_id);
    end loop;

    insert into public.transactions (
      type,
      date,
      batch_id,
      reference_number,
      beneficiary,
      rep,
      location,
      item,
      qty,
      total_qty,
      notes,
      receipt_image,
      timestamp,
      is_summary,
      status
    )
    values (
      v_tx_type,
      v_date,
      v_batch_id,
      v_voucher_code,
      v_beneficiary,
      v_rep,
      v_location,
      case when v_voucher_kind = 'in' then 'ملخص سند إدخال' else 'ملخص عهده مندوب' end,
      v_total_qty,
      v_total_qty,
      trim(both from concat_ws(' ',
        nullif(v_notes, ''),
        case when v_is_transfer then '[نوع: تحويل مخزني]' else null end,
        '[مستند رقم ' || v_voucher_code || ']'
      )),
      v_receipt_image,
      now(),
      true,
      'قيد المراجعة'
    )
    returning id::text into v_tx_id;

    v_tx_ids := array_append(v_tx_ids, v_tx_id);

  elsif v_mode = 'edit' then
    select coalesce(reference_number, '')
      into v_voucher_code
    from public.transactions
    where batch_id = v_existing_batch_id
    order by is_summary asc, timestamp desc
    limit 1;

    if nullif(v_header->>'voucher_code', '') is not null then
      v_voucher_code := nullif(v_header->>'voucher_code', '');
    elsif v_voucher_code is null or btrim(v_voucher_code) = '' then
      v_voucher_code := v_existing_batch_id;
    end if;

    if exists (
      select 1
      from public.transactions t
      where t.reference_number = v_voucher_code
        and t.type = v_tx_type
        and t.batch_id <> v_existing_batch_id
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'DUPLICATE_VOUCHER_CODE',
        detail = format('Voucher code already exists: %s', v_voucher_code);
    end if;

    -- ── Capture old invoice state BEFORE deleting rows ───────────────────
    select
      coalesce(bool_or(coalesce(invoiced, false) or status = 'مفوتر'), false),
      coalesce(
        max(case when notes ~ '\[تم إصدار الفاتورة[^\]]*\]'
          then (regexp_match(notes, '\[تم إصدار الفاتورة[^\]]*\]'))[1]
          else null end
        ), ''
      ),
      coalesce(max(case when status = 'مفوتر' then status else null end), 'قيد المراجعة')
    into v_was_invoiced, v_old_invoice_tag, v_old_invoiced_status
    from public.transactions
    where batch_id = v_existing_batch_id;
    -- ─────────────────────────────────────────────────────────────────────

    create temporary table if not exists _voucher_delta (
      item_id_text text primary key,
      new_qty numeric not null default 0,
      old_qty numeric not null default 0
    ) on commit drop;
    truncate _voucher_delta;

    insert into _voucher_delta (item_id_text, new_qty, old_qty)
    select item_id_text, qty, 0
    from _voucher_input_lines
    on conflict (item_id_text) do update set new_qty = excluded.new_qty;

    insert into _voucher_delta (item_id_text, new_qty, old_qty)
    select item_id_text, 0, qty
    from _voucher_old_lines
    where is_summary = false
    on conflict (item_id_text) do update set old_qty = excluded.old_qty;

    for v_item_id_text, v_qty, v_existing_qty in
      select item_id_text, new_qty, old_qty
      from _voucher_delta
    loop
      select coalesce(stock_qty, 0)
        into v_current_stock
      from public.products
      where id::text = v_item_id_text
      for update;

      v_delta := case
        when v_voucher_kind = 'in' then (v_qty - v_existing_qty)
        else (v_existing_qty - v_qty)
      end;

      if v_voucher_kind = 'out' and v_delta < 0 and v_current_stock < abs(v_delta) then
        raise exception using
          errcode = 'P0001',
          message = 'INSUFFICIENT_STOCK',
          detail = format('item_id=%s available=%s required_extra=%s', v_item_id_text, v_current_stock, abs(v_delta));
      end if;

      v_new_stock := v_current_stock + v_delta;

      if v_new_stock < 0 then
        raise exception using
          errcode = 'P0001',
          message = 'NEGATIVE_STOCK_FORBIDDEN',
          detail = format('item_id=%s would result in negative stock', v_item_id_text);
      end if;

      update public.products
      set stock_qty = v_new_stock
      where id::text = v_item_id_text;
    end loop;

    delete from public.transactions
    where batch_id = v_existing_batch_id;

    for v_item_id_text, v_item_name, v_company, v_cat, v_unit, v_qty in
      select item_id_text, item_name, company, cat, unit, qty
      from _voucher_input_lines
    loop
      select coalesce(stock_qty, 0)
        into v_current_stock
      from public.products
      where id::text = v_item_id_text;

      insert into public.transactions (
        type,
        date,
        batch_id,
        reference_number,
        beneficiary,
        rep,
        location,
        item,
        item_id,
        company,
        qty,
        unit,
        cat,
        notes,
        receipt_image,
        timestamp,
        is_summary,
        status,
        balance_after
      )
      select
        v_tx_type,
        v_date,
        v_batch_id,
        v_voucher_code,
        v_beneficiary,
        v_rep,
        v_location,
        v_item_name,
        p.id,
        nullif(v_company, ''),
        v_qty,
        nullif(v_unit, ''),
        nullif(v_cat, ''),
        -- Preserve invoice tag if voucher was already invoiced
        -- Preserve invoice tag if voucher was already invoiced
        trim(both from concat_ws(' ',
          nullif(v_notes, ''),
          case when v_is_transfer then '[نوع: تحويل مخزني]' else null end,
          case when v_was_invoiced and v_old_invoice_tag <> '' then v_old_invoice_tag else null end,
          case when v_was_invoiced and v_notes !~ '\[تعديل بعد الفوترة\]' then '[تعديل بعد الفوترة]' else null end
        )) || v_history_tag,
        v_receipt_image,
        now(),
        false,
        -- Preserve invoiced status if was already invoiced
        case when v_was_invoiced then v_old_invoiced_status else 'قيد المراجعة' end,
        v_current_stock
      from public.products p
      where p.id::text = v_item_id_text
      returning id::text into v_tx_id;

      v_tx_ids := array_append(v_tx_ids, v_tx_id);
    end loop;

    insert into public.transactions (
      type,
      date,
      batch_id,
      reference_number,
      beneficiary,
      rep,
      location,
      item,
      qty,
      total_qty,
      notes,
      receipt_image,
      timestamp,
      is_summary,
      status,
      invoiced,
      deducted
    )
    values (
      v_tx_type,
      v_date,
      v_batch_id,
      v_voucher_code,
      v_beneficiary,
      v_rep,
      v_location,
      case when v_voucher_kind = 'in' then 'ملخص سند إدخال' else 'ملخص عهده مندوب' end,
      v_total_qty,
      v_total_qty,
      trim(both from concat_ws(' ',
        nullif(v_notes, ''),
        case when v_is_transfer then '[نوع: تحويل مخزني]' else null end,
        case when v_was_invoiced and v_old_invoice_tag <> '' then v_old_invoice_tag else null end,
        '[مستند رقم ' || v_voucher_code || ']'
      )) || v_history_tag,
      v_receipt_image,
      now(),
      true,
      case when v_was_invoiced then v_old_invoiced_status else 'قيد المراجعة' end,
      v_was_invoiced,
      v_was_invoiced
    )
    returning id::text into v_tx_id;

    v_tx_ids := array_append(v_tx_ids, v_tx_id);

  else
    raise exception using
      errcode = 'P0001',
      message = 'UNSUPPORTED_MODE',
      detail = format('Unsupported voucher mode: %s', v_mode);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_id', p.id::text,
        'stock_qty', coalesce(p.stock_qty, 0),
        'damaged_qty', coalesce(p.damaged_qty, 0),
        'changed_by', coalesce(v_actor_user_name, v_actor_user_id),
        'reason', case when v_voucher_kind = 'in' then 'voucher_in' else 'voucher_out' end
      )
      order by p.id::text
    ),
    '[]'::jsonb
  )
    into v_balances
  from public.products p
  where p.id::text = any(v_affected_item_ids);

  v_ui_snapshot := jsonb_build_object(
    'voucher_summary', jsonb_build_object(
      'batch_id', v_batch_id,
      'voucher_code', v_voucher_code,
      'voucher_kind', v_voucher_kind,
      'line_count', v_line_count,
      'total_qty', v_total_qty,
      'status', 'قيد المراجعة',
      'beneficiary', v_beneficiary,
      'rep', v_rep,
      'date', v_date
    )
  );

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_upsert_voucher',
    'mode', v_mode,
    'voucher_kind', v_voucher_kind,
    'batch_id', v_batch_id,
    'voucher_code', v_voucher_code,
    'transaction_ids', to_jsonb(v_tx_ids),
    'old_transaction_ids', to_jsonb(v_old_tx_ids),
    'affected_item_ids', to_jsonb(v_affected_item_ids),
    'balances', v_balances,
    'warnings', '[]'::jsonb,
    'refresh_hint', jsonb_build_object(
      'products', true,
      'transactions', true,
      'dashboard', true,
      'voucher_lists', true,
      'returns_list', false
    ),
    'ui_snapshot', v_ui_snapshot,
    'meta', jsonb_build_object(
      'actor_user_id', v_actor_user_id,
      'actor_user_name', v_actor_user_name,
      'client_timestamp', v_client_timestamp
    )
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_upsert_voucher',
      'error_code', sqlstate,
      'error_message', sqlerrm,
      'failed_step', 'inventory_upsert_voucher',
      'safe_to_retry', false
    );
end;
$$;


create or replace function public.inventory_cancel_voucher(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_batch_id text := coalesce(payload->>'batch_id', payload->>'voucher_group_id');
  v_voucher_kind text := coalesce(payload->>'voucher_kind', 'out');
  v_cancel_reason text := coalesce(nullif(payload->>'cancel_reason', ''), '[تم الإلغاء]');
  v_actor text := coalesce(nullif(payload->>'actor_user_name', ''), nullif(payload->>'actor_user_id', ''), 'system');
  v_timestamp_text text := to_char(now() at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI');
  v_affected_item_ids text[] := '{}'::text[];
  v_tx_ids text[] := '{}'::text[];
  v_item_id_text text;
  v_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_balances jsonb;
begin
  if v_batch_id is null or btrim(v_batch_id) = '' then
    raise exception using errcode = 'P0001', message = 'BATCH_ID_REQUIRED';
  end if;

  create temporary table if not exists _voucher_cancel_lines (
    tx_id text primary key,
    item_id_text text,
    qty numeric,
    is_summary boolean
  ) on commit drop;
  truncate _voucher_cancel_lines;

  insert into _voucher_cancel_lines (tx_id, item_id_text, qty, is_summary)
  select t.id::text, t.item_id::text, coalesce(t.qty, 0), coalesce(t.is_summary, false)
  from public.transactions t
  where t.batch_id = v_batch_id
    and coalesce(t.status, '') <> 'cancelled';

  if not exists (select 1 from _voucher_cancel_lines) then
    raise exception using errcode = 'P0001', message = 'VOUCHER_NOT_FOUND', detail = v_batch_id;
  end if;

  select array_agg(distinct item_id_text), array_agg(tx_id order by tx_id)
    into v_affected_item_ids, v_tx_ids
  from _voucher_cancel_lines
  where is_summary = false and item_id_text is not null;

  if coalesce(array_length(v_affected_item_ids, 1), 0) > 0 then
    perform 1
    from public.products p
    where p.id::text = any(v_affected_item_ids)
    order by p.id::text
    for update;
  end if;

  for v_item_id_text, v_qty in
    select item_id_text, sum(qty)
    from _voucher_cancel_lines
    where is_summary = false and item_id_text is not null
    group by item_id_text
  loop
    select coalesce(stock_qty, 0) into v_current_stock
    from public.products
    where id::text = v_item_id_text
    for update;

    v_new_stock := case
      when v_voucher_kind = 'in' then greatest(0, v_current_stock - v_qty)
      else v_current_stock + v_qty
    end;

    update public.products
    set stock_qty = v_new_stock
    where id::text = v_item_id_text;
  end loop;

  update public.transactions
  set status = 'cancelled',
      notes = trim(both from concat_ws(' ', nullif(notes, ''), v_cancel_reason || ' - ' || v_timestamp_text || ' - ' || v_actor))
  where batch_id = v_batch_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_id', p.id::text,
        'stock_qty', coalesce(p.stock_qty, 0),
        'damaged_qty', coalesce(p.damaged_qty, 0),
        'reason', 'voucher_cancelled'
      )
      order by p.id::text
    ),
    '[]'::jsonb
  )
  into v_balances
  from public.products p
  where p.id::text = any(v_affected_item_ids);

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_cancel_voucher',
    'batch_id', v_batch_id,
    'cancelled_transaction_ids', to_jsonb(v_tx_ids),
    'affected_item_ids', to_jsonb(v_affected_item_ids),
    'balances', v_balances,
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', true, 'returns_list', false),
    'ui_snapshot', jsonb_build_object('batch_status', 'cancelled')
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_cancel_voucher',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_delete_voucher_line(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_transaction_id text := payload->>'transaction_id';
  v_voucher_kind text := coalesce(payload->>'voucher_kind', 'out');
  v_batch_id text;
  v_item_id_text text;
  v_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_remaining_total numeric;
  v_balances jsonb;
begin
  if v_transaction_id is null or btrim(v_transaction_id) = '' then
    raise exception using errcode = 'P0001', message = 'TRANSACTION_ID_REQUIRED';
  end if;

  select t.batch_id, t.item_id::text, coalesce(t.qty, 0)
    into v_batch_id, v_item_id_text, v_qty
  from public.transactions t
  where t.id::text = v_transaction_id
    and coalesce(t.is_summary, false) = false
  limit 1;

  if v_batch_id is null then
    raise exception using errcode = 'P0001', message = 'VOUCHER_LINE_NOT_FOUND';
  end if;

  if v_item_id_text is not null then
    select coalesce(stock_qty, 0) into v_current_stock
    from public.products
    where id::text = v_item_id_text
    for update;

    v_new_stock := case
      when v_voucher_kind = 'in' then greatest(0, v_current_stock - v_qty)
      else v_current_stock + v_qty
    end;

    update public.products
    set stock_qty = v_new_stock
    where id::text = v_item_id_text;
  end if;

  delete from public.transactions
  where id::text = v_transaction_id;

  select coalesce(sum(qty), 0)
    into v_remaining_total
  from public.transactions
  where batch_id = v_batch_id
    and coalesce(is_summary, false) = false;

  update public.transactions
  set qty = v_remaining_total,
      total_qty = v_remaining_total
  where batch_id = v_batch_id
    and coalesce(is_summary, false) = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_id', p.id::text,
        'stock_qty', coalesce(p.stock_qty, 0),
        'damaged_qty', coalesce(p.damaged_qty, 0),
        'reason', 'voucher_line_deleted'
      )
    ),
    '[]'::jsonb
  )
  into v_balances
  from public.products p
  where p.id::text = v_item_id_text;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_delete_voucher_line',
    'batch_id', v_batch_id,
    'deleted_transaction_id', v_transaction_id,
    'affected_item_ids', jsonb_build_array(v_item_id_text),
    'balances', v_balances,
    'ui_snapshot', jsonb_build_object('batch_totals', jsonb_build_object('total_qty', v_remaining_total)),
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', true, 'returns_list', false)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_delete_voucher_line',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_update_voucher_line(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_transaction_id text := payload->>'transaction_id';
  v_voucher_kind text := coalesce(payload->>'voucher_kind', 'out');
  v_new_qty numeric := coalesce(nullif(payload->>'qty', '')::numeric, 0);
  v_new_date date := nullif(payload->>'date', '')::date;
  v_new_note text := nullif(payload->>'line_note', '');
  v_batch_id text;
  v_item_id_text text;
  v_old_qty numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_diff numeric;
  v_total_qty numeric;
  v_balances jsonb;
begin
  if v_transaction_id is null or btrim(v_transaction_id) = '' then
    raise exception using errcode = 'P0001', message = 'TRANSACTION_ID_REQUIRED';
  end if;
  if v_new_qty <= 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_QTY';
  end if;

  select t.batch_id, t.item_id::text, coalesce(t.qty, 0)
    into v_batch_id, v_item_id_text, v_old_qty
  from public.transactions t
  where t.id::text = v_transaction_id
    and coalesce(t.is_summary, false) = false
  limit 1;

  if v_batch_id is null then
    raise exception using errcode = 'P0001', message = 'VOUCHER_LINE_NOT_FOUND';
  end if;

  select coalesce(stock_qty, 0)
    into v_current_stock
  from public.products
  where id::text = v_item_id_text
  for update;

  v_diff := v_new_qty - v_old_qty;
  v_new_stock := case
    when v_voucher_kind = 'in' then v_current_stock + v_diff
    else v_current_stock - v_diff
  end;

  if v_voucher_kind = 'out' and v_diff > 0 and v_current_stock < v_diff then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_STOCK', detail = format('available=%s required_extra=%s', v_current_stock, v_diff);
  end if;

  if v_new_stock < 0 then
    raise exception using errcode = 'P0001', message = 'NEGATIVE_STOCK_FORBIDDEN';
  end if;

  update public.products
  set stock_qty = v_new_stock
  where id::text = v_item_id_text;

  update public.transactions
  set qty = v_new_qty,
      date = coalesce(v_new_date, date),
      notes = coalesce(v_new_note, notes),
      balance_after = v_new_stock
  where id::text = v_transaction_id;

  select coalesce(sum(qty), 0)
    into v_total_qty
  from public.transactions
  where batch_id = v_batch_id
    and coalesce(is_summary, false) = false;

  update public.transactions
  set qty = v_total_qty,
      total_qty = v_total_qty
  where batch_id = v_batch_id
    and coalesce(is_summary, false) = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', p.id::text,
    'stock_qty', coalesce(p.stock_qty, 0),
    'damaged_qty', coalesce(p.damaged_qty, 0),
    'reason', 'voucher_line_updated'
  )), '[]'::jsonb)
  into v_balances
  from public.products p
  where p.id::text = v_item_id_text;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_update_voucher_line',
    'batch_id', v_batch_id,
    'updated_transaction_id', v_transaction_id,
    'affected_item_ids', jsonb_build_array(v_item_id_text),
    'balances', v_balances,
    'ui_snapshot', jsonb_build_object('batch_totals', jsonb_build_object('total_qty', v_total_qty)),
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', true, 'returns_list', false)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_update_voucher_line',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_reset_voucher_status(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_batch_id text := coalesce(payload->>'batch_id', payload->>'voucher_group_id');
begin
  if v_batch_id is null or btrim(v_batch_id) = '' then
    raise exception using errcode = 'P0001', message = 'BATCH_ID_REQUIRED';
  end if;

  update public.transactions
  set status = null,
      notes = nullif(
        trim(
          regexp_replace(
            regexp_replace(
              regexp_replace(coalesce(notes, ''), '\s*\[تم إصدار الفاتورة(:.*?)?\]', '', 'g'),
              '\s*\[إضافة مراجعة\]', '', 'g'
            ),
            '\s*\[مستند رقم.*?\]', '', 'g'
          )
        ),
        ''
      )
  where batch_id = v_batch_id;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_reset_voucher_status',
    'batch_id', v_batch_id,
    'refresh_hint', jsonb_build_object('products', false, 'transactions', true, 'dashboard', true, 'voucher_lists', true, 'returns_list', false),
    'ui_snapshot', jsonb_build_object('batch_status', null)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_reset_voucher_status',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_commit_return(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_header jsonb := coalesce(payload->'return_header', payload->'header', '{}'::jsonb);
  v_lines jsonb := coalesce(payload->'lines', '[]'::jsonb);
  v_batch_id text := coalesce(payload->>'batch_id', 'RETURN-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text);
  v_date date := coalesce(nullif(v_header->>'date', '')::date, current_date);
  v_returnee text := coalesce(nullif(v_header->>'returnee_name', ''), nullif(v_header->>'beneficiary_name', ''), '');
  v_rep text := coalesce(nullif(v_header->>'rep_name', ''), '');
  v_now timestamp with time zone := now();
  v_line jsonb;
  v_item_id_text text;
  v_item_id_db text;
  v_item_name text;
  v_company text;
  v_cat text;
  v_unit text;
  v_qty numeric;
  v_status text;
  v_current_stock numeric;
  v_current_damaged numeric;
  v_new_stock numeric;
  v_new_damaged numeric;
  v_tx_id text;
  v_disc_id text;
  v_total_qty numeric := 0;
  v_tx_ids text[] := '{}'::text[];
  v_disc_ids text[] := '{}'::text[];
  v_affected_item_ids text[] := '{}'::text[];
  v_balances jsonb;
begin
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
    raise exception using errcode = 'P0001', message = 'RETURN_LINES_REQUIRED';
  end if;

  create temporary table if not exists _return_input_lines (
    item_id_text text,
    item_name text,
    company text,
    cat text,
    unit text,
    qty numeric,
    status text
  ) on commit drop;
  truncate _return_input_lines;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    v_item_id_text := coalesce(v_line->>'item_id', v_line->>'selectedItemId', v_line#>>'{selectedItem,id}');
    if v_item_id_text is null or btrim(v_item_id_text) = '' then
      raise exception using errcode = 'P0001', message = 'ITEM_ID_REQUIRED';
    end if;

    select p.id::text into v_item_id_db
    from public.products p
    where p.id::text = v_item_id_text
    limit 1;

    if v_item_id_db is null then
      raise exception using errcode = 'P0001', message = 'PRODUCT_NOT_FOUND', detail = v_item_id_text;
    end if;

    v_qty := coalesce(nullif(v_line->>'qty', '')::numeric, 0);
    if v_qty <= 0 then
      raise exception using errcode = 'P0001', message = 'INVALID_QTY';
    end if;

    v_status := coalesce(nullif(v_line->>'transaction_status', ''), nullif(v_line->>'status', ''), nullif(v_line->>'return_status', ''), 'سليم');
    v_item_name := coalesce(nullif(v_line->>'item_name', ''), nullif(v_line->>'name', ''), nullif(v_line#>>'{selectedItem,name}', ''), 'صنف غير محدد');
    v_company := coalesce(nullif(v_line->>'company', ''), nullif(v_line#>>'{selectedItem,company}', ''), 'بدون شركة');
    v_cat := coalesce(nullif(v_line->>'cat', ''), nullif(v_line#>>'{selectedItem,cat}', ''), '');
    v_unit := coalesce(nullif(v_line->>'unit', ''), nullif(v_line#>>'{selectedItem,unit}', ''), '');

    insert into _return_input_lines values (v_item_id_db, v_item_name, v_company, v_cat, v_unit, v_qty, v_status);
  end loop;

  select array_agg(distinct item_id_text), coalesce(sum(qty), 0)
    into v_affected_item_ids, v_total_qty
  from _return_input_lines;

  if coalesce(array_length(v_affected_item_ids, 1), 0) > 0 then
    perform 1 from public.products p where p.id::text = any(v_affected_item_ids) order by p.id::text for update;
  end if;

  for v_item_id_text, v_item_name, v_company, v_cat, v_unit, v_qty, v_status in
    select item_id_text, item_name, company, cat, unit, qty, status
    from _return_input_lines
  loop
    select coalesce(stock_qty, 0), coalesce(damaged_qty, 0)
      into v_current_stock, v_current_damaged
    from public.products
    where id::text = v_item_id_text
    for update;

    v_new_stock := v_current_stock;
    v_new_damaged := v_current_damaged;

    if v_status in ('سليم', 'مكتمل') then
      v_new_stock := v_current_stock + v_qty;
    else
      v_new_damaged := v_current_damaged + v_qty;
    end if;

    update public.products
    set stock_qty = v_new_stock,
        damaged_qty = v_new_damaged
    where id::text = v_item_id_text;

    insert into public.transactions (
      type, item, item_id, company, qty, unit, cat, status, rep, beneficiary, loc, date, timestamp, batch_id, is_summary, balance_after
    )
    select
      'return', v_item_name, p.id, nullif(v_company, ''), v_qty, nullif(v_unit, ''), nullif(v_cat, ''), v_status,
      nullif(v_rep, ''), nullif(v_returnee, ''), nullif(v_returnee, ''), v_date, v_now, v_batch_id, false,
      case when v_status in ('سليم', 'مكتمل') then v_new_stock else v_current_stock end
    from public.products p
    where p.id::text = v_item_id_text
    returning id::text into v_tx_id;

    v_tx_ids := array_append(v_tx_ids, v_tx_id);

    if v_status not in ('سليم', 'مكتمل') then
      insert into public.discrepancies (
        item_id, item_name, expected_qty, actual_qty, diff, note, status, created_at
      ) values (
        nullif(v_item_id_text, '')::uuid, v_item_name, 0, 0, v_qty,
        'مرتجع تالف - من: ' || coalesce(v_returnee, 'غير محدد') || case when v_rep <> '' then ' / مندوب: ' || v_rep else '' end,
        'pending', v_now
      )
      returning id::text into v_disc_id;

      v_disc_ids := array_append(v_disc_ids, v_disc_id);
    end if;
  end loop;

  insert into public.transactions (
    type, item, qty, total_qty, status, rep, beneficiary, loc, date, timestamp, batch_id, is_summary
  ) values (
    'return', 'ملخص مرتجع بضاعة', v_total_qty, v_total_qty, 'مكتمل', nullif(v_rep, ''), nullif(v_returnee, ''), nullif(v_returnee, ''), v_date, v_now, v_batch_id, true
  ) returning id::text into v_tx_id;

  v_tx_ids := array_append(v_tx_ids, v_tx_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', p.id::text,
    'stock_qty', coalesce(p.stock_qty, 0),
    'damaged_qty', coalesce(p.damaged_qty, 0),
    'reason', 'return_committed'
  ) order by p.id::text), '[]'::jsonb)
  into v_balances
  from public.products p
  where p.id::text = any(v_affected_item_ids);

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_commit_return',
    'batch_id', v_batch_id,
    'transaction_ids', to_jsonb(v_tx_ids),
    'discrepancy_ids', to_jsonb(v_disc_ids),
    'affected_item_ids', to_jsonb(v_affected_item_ids),
    'balances', v_balances,
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', false, 'returns_list', true),
    'ui_snapshot', jsonb_build_object('return_summary', jsonb_build_object('total_qty', v_total_qty, 'damaged_count', coalesce(array_length(v_disc_ids, 1), 0)))
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_commit_return',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_update_return(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_transaction_id text := payload->>'transaction_id';
  v_new_state jsonb := coalesce(payload->'new_state', '{}'::jsonb);
  v_old_state jsonb := coalesce(payload->'old_state', '{}'::jsonb);
  v_item_id_text text;
  v_old_qty numeric;
  v_new_qty numeric;
  v_old_status text;
  v_new_status text;
  v_current_stock numeric;
  v_current_damaged numeric;
  v_stock_delta numeric := 0;
  v_damaged_delta numeric := 0;
  v_balances jsonb;
begin
  if v_transaction_id is null or btrim(v_transaction_id) = '' then
    raise exception using errcode = 'P0001', message = 'TRANSACTION_ID_REQUIRED';
  end if;

  if v_old_state = '{}'::jsonb then
    select jsonb_build_object(
      'item_id', t.item_id::text,
      'qty', coalesce(t.qty, 0),
      'status', coalesce(t.status, '')
    )
    into v_old_state
    from public.transactions t
    where t.id::text = v_transaction_id;
  end if;

  v_item_id_text := coalesce(v_new_state->>'item_id', v_old_state->>'item_id');
  v_old_qty := coalesce(nullif(v_old_state->>'qty', '')::numeric, 0);
  v_new_qty := coalesce(nullif(v_new_state->>'qty', '')::numeric, v_old_qty);
  v_old_status := coalesce(v_old_state->>'status', '');
  v_new_status := coalesce(v_new_state->>'status', v_old_status);

  select coalesce(stock_qty, 0), coalesce(damaged_qty, 0)
    into v_current_stock, v_current_damaged
  from public.products
  where id::text = v_item_id_text
  for update;

  if v_old_status in ('سليم', 'مكتمل') then
    v_stock_delta := v_stock_delta - v_old_qty;
  else
    v_damaged_delta := v_damaged_delta - v_old_qty;
  end if;

  if v_new_status in ('سليم', 'مكتمل') then
    v_stock_delta := v_stock_delta + v_new_qty;
  else
    v_damaged_delta := v_damaged_delta + v_new_qty;
  end if;

  update public.products
  set stock_qty = greatest(0, v_current_stock + v_stock_delta),
      damaged_qty = greatest(0, v_current_damaged + v_damaged_delta)
  where id::text = v_item_id_text;

  update public.transactions
  set qty = v_new_qty,
      date = coalesce(nullif(v_new_state->>'date', '')::date, date),
      rep = coalesce(nullif(v_new_state->>'rep_name', ''), rep),
      beneficiary = coalesce(nullif(v_new_state->>'returnee_name', ''), beneficiary),
      loc = coalesce(nullif(v_new_state->>'returnee_name', ''), loc),
      status = v_new_status
  where id::text = v_transaction_id;

  update public.transactions
  set qty = coalesce((
    select sum(qty) from public.transactions t
    where t.batch_id = public.transactions.batch_id
      and coalesce(t.is_summary, false) = false
  ), 0),
      total_qty = coalesce((
        select sum(qty) from public.transactions t
        where t.batch_id = public.transactions.batch_id
          and coalesce(t.is_summary, false) = false
      ), 0)
  where batch_id = (select batch_id from public.transactions where id::text = v_transaction_id)
    and coalesce(is_summary, false) = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', p.id::text,
    'stock_qty', coalesce(p.stock_qty, 0),
    'damaged_qty', coalesce(p.damaged_qty, 0),
    'reason', 'return_updated'
  )), '[]'::jsonb)
  into v_balances
  from public.products p
  where p.id::text = v_item_id_text;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_update_return',
    'updated_transaction_id', v_transaction_id,
    'affected_item_ids', jsonb_build_array(v_item_id_text),
    'balances', v_balances,
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', false, 'returns_list', true)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_update_return',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


create or replace function public.inventory_delete_return(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id text := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_transaction_id text := payload->>'transaction_id';
  v_item_id_text text;
  v_qty numeric;
  v_status text;
  v_batch_id text;
  v_current_stock numeric;
  v_current_damaged numeric;
  v_balances jsonb;
begin
  if v_transaction_id is null or btrim(v_transaction_id) = '' then
    raise exception using errcode = 'P0001', message = 'TRANSACTION_ID_REQUIRED';
  end if;

  select t.item_id::text, coalesce(t.qty, 0), coalesce(t.status, ''), t.batch_id
    into v_item_id_text, v_qty, v_status, v_batch_id
  from public.transactions t
  where t.id::text = v_transaction_id
    and coalesce(t.is_summary, false) = false;

  if v_item_id_text is null then
    raise exception using errcode = 'P0001', message = 'RETURN_LINE_NOT_FOUND';
  end if;

  select coalesce(stock_qty, 0), coalesce(damaged_qty, 0)
    into v_current_stock, v_current_damaged
  from public.products
  where id::text = v_item_id_text
  for update;

  update public.products
  set stock_qty = case when v_status in ('سليم', 'مكتمل') then greatest(0, v_current_stock - v_qty) else v_current_stock end,
      damaged_qty = case when v_status in ('سليم', 'مكتمل') then v_current_damaged else greatest(0, v_current_damaged - v_qty) end
  where id::text = v_item_id_text;

  delete from public.transactions
  where id::text = v_transaction_id;

  update public.transactions
  set qty = coalesce((
    select sum(qty) from public.transactions t
    where t.batch_id = v_batch_id
      and coalesce(t.is_summary, false) = false
  ), 0),
      total_qty = coalesce((
        select sum(qty) from public.transactions t
        where t.batch_id = v_batch_id
          and coalesce(t.is_summary, false) = false
      ), 0)
  where batch_id = v_batch_id
    and coalesce(is_summary, false) = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', p.id::text,
    'stock_qty', coalesce(p.stock_qty, 0),
    'damaged_qty', coalesce(p.damaged_qty, 0),
    'reason', 'return_deleted'
  )), '[]'::jsonb)
  into v_balances
  from public.products p
  where p.id::text = v_item_id_text;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'operation', 'inventory_delete_return',
    'deleted_transaction_id', v_transaction_id,
    'batch_id', v_batch_id,
    'affected_item_ids', jsonb_build_array(v_item_id_text),
    'balances', v_balances,
    'refresh_hint', jsonb_build_object('products', true, 'transactions', true, 'dashboard', true, 'voucher_lists', false, 'returns_list', true)
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'request_id', v_request_id,
      'operation', 'inventory_delete_return',
      'error_code', sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10) inventory_finalize_voucher
--     action = 'mark_invoiced' : اعتماد سند إدخال (status → مفوتر، invoiced/deducted = true)
--     action = 'update_note'   : تحديث ملاحظة السند على كل سطور الباتش
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.inventory_finalize_voucher(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id      text    := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_batch_id        text    := nullif(payload->>'batch_id', '');
  v_action          text    := coalesce(nullif(payload->>'action', ''), 'mark_invoiced');
  v_note            text    := nullif(payload->>'note', '');
  v_actor           text    := coalesce(nullif(payload->>'actor_user_name', ''), nullif(payload->>'actor_user_id', ''), 'system');
  v_timestamp_text  text    := to_char(now() at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI');
  v_date_text       text    := to_char(now() at time zone 'Asia/Riyadh', 'YYYY/MM/DD');
  v_row_count       integer;
begin
  if v_batch_id is null then
    raise exception using errcode = 'P0001', message = 'BATCH_ID_REQUIRED',
      detail = 'payload.batch_id is required';
  end if;

  if not exists (select 1 from public.transactions where batch_id = v_batch_id) then
    raise exception using errcode = 'P0001', message = 'VOUCHER_NOT_FOUND',
      detail = format('No transactions found for batch_id=%s', v_batch_id);
  end if;

  -- ── اعتماد السند كـ مفوتر ──────────────────────────────────────────────────
  if v_action = 'mark_invoiced' then

    -- قفل الصفوف أولاً
    perform 1 from public.transactions
    where batch_id = v_batch_id
    for update;

    update public.transactions
    set
      status   = 'مفوتر',
      invoiced = true,
      deducted = true,
      notes    = trim(both from concat_ws(' ',
        nullif(
          regexp_replace(
            coalesce(notes, ''),
            '\s*\[تم إصدار الفاتورة(:.*?)?\]', '', 'g'
          ),
          ''
        ),
        '[تم إصدار الفاتورة] ' || v_date_text
      ))
    where batch_id = v_batch_id;

    get diagnostics v_row_count = row_count;

    return jsonb_build_object(
      'ok',           true,
      'request_id',   v_request_id,
      'operation',    'inventory_finalize_voucher',
      'action',       v_action,
      'batch_id',     v_batch_id,
      'updated_rows', v_row_count,
      'invoice_date', v_date_text,
      'refresh_hint', jsonb_build_object(
        'products',     false,
        'transactions', true,
        'dashboard',    true,
        'voucher_lists',true,
        'returns_list', false
      ),
      'ui_snapshot', jsonb_build_object(
        'batch_status', 'مفوتر',
        'invoiced',     true,
        'deducted',     true,
        'invoice_date', v_date_text
      )
    );

  -- ── تحديث ملاحظة السند ────────────────────────────────────────────────────
  elsif v_action = 'update_note' then

    perform 1 from public.transactions
    where batch_id = v_batch_id
    for update;

    update public.transactions
    set notes = v_note
    where batch_id = v_batch_id;

    get diagnostics v_row_count = row_count;

    return jsonb_build_object(
      'ok',           true,
      'request_id',   v_request_id,
      'operation',    'inventory_finalize_voucher',
      'action',       v_action,
      'batch_id',     v_batch_id,
      'updated_rows', v_row_count,
      'refresh_hint', jsonb_build_object(
        'products',     false,
        'transactions', true,
        'dashboard',    false,
        'voucher_lists',true,
        'returns_list', false
      ),
      'ui_snapshot', jsonb_build_object('notes_updated', true)
    );

  else
    raise exception using errcode = 'P0001', message = 'UNSUPPORTED_ACTION',
      detail = format('Unsupported action: %s', v_action);
  end if;

exception
  when others then
    return jsonb_build_object(
      'ok',            false,
      'request_id',    v_request_id,
      'operation',     'inventory_finalize_voucher',
      'error_code',    sqlstate,
      'error_message', sqlerrm
    );
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 11) inventory_commit_inbound
--     يستبدل confirmBulkSubmit في StockInwardModal.jsx
--     يقوم بـ: فحص التكرار، قفل الصفوف، تحديث المخزون، إدراج transactions
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.inventory_commit_inbound(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_request_id       text    := coalesce(payload->>'request_id', md5(clock_timestamp()::text || random()::text));
  v_batch_id         text    := coalesce(nullif(payload->>'batch_id', ''), 'STOCKIN-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text);
  v_header           jsonb   := coalesce(payload->'header', '{}'::jsonb);
  v_lines            jsonb   := coalesce(payload->'lines', '[]'::jsonb);
  v_actor_user_id    text    := nullif(payload->>'actor_user_id', '');
  v_actor_user_name  text    := nullif(payload->>'actor_user_name', '');
  v_location         text    := coalesce(nullif(v_header->>'location_name', ''), 'مستودع الرياض');
  v_supplier         text    := coalesce(nullif(v_header->>'supplier_name', ''), v_location);
  v_date             date    := coalesce(nullif(v_header->>'date', '')::date, current_date);
  v_receipt_type     text    := coalesce(nullif(v_header->>'receipt_type', ''), 'بدون');
  v_receipt_number   text    := coalesce(nullif(v_header->>'receipt_number', ''), '');
  v_receipt_image    text    := nullif(v_header->>'receipt_image_url', '');
  v_now              timestamptz := now();
  v_line             jsonb;
  v_item_id_text     text;
  v_item_id_db       text;
  v_item_name        text;
  v_company          text;
  v_cat              text;
  v_unit             text;
  v_qty              numeric;
  v_current_stock    numeric;
  v_new_stock        numeric;
  v_total_qty        numeric  := 0;
  v_tx_id            text;
  v_tx_ids           text[]   := '{}'::text[];
  v_affected_ids     text[]   := '{}'::text[];
  v_balances         jsonb;
begin
  -- ── التحقق من وجود أصناف ─────────────────────────────────────────────────
  if jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) = 0 then
    raise exception using errcode = 'P0001', message = 'INBOUND_LINES_REQUIRED',
      detail = 'payload.lines must be a non-empty JSON array';
  end if;

  -- ── فحص تكرار رقم السند ──────────────────────────────────────────────────
  if btrim(v_receipt_number) <> '' then
    if exists (
      select 1 from public.transactions
      where reference_number = v_receipt_number
        and type in ('وارد', 'Restock', 'in')
      limit 1
    ) then
      raise exception using errcode = 'P0001', message = 'DUPLICATE_RECEIPT_NUMBER',
        detail = format('receipt_number already exists: %s', v_receipt_number);
    end if;
  end if;

  -- ── تحميل الأصناف في جدول مؤقت ──────────────────────────────────────────
  create temporary table if not exists _inbound_input_lines (
    item_id_text text primary key,
    item_name    text,
    company      text,
    cat          text,
    unit         text,
    qty          numeric not null
  ) on commit drop;
  truncate _inbound_input_lines;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    v_item_id_text := coalesce(v_line->>'item_id', v_line->>'itemId');
    if v_item_id_text is null or btrim(v_item_id_text) = '' then
      raise exception using errcode = 'P0001', message = 'ITEM_ID_REQUIRED',
        detail = format('A line is missing item_id. request_id=%s', v_request_id);
    end if;

    select p.id::text into v_item_id_db
    from public.products p
    where p.id::text = v_item_id_text
    limit 1;

    if v_item_id_db is null then
      raise exception using errcode = 'P0001', message = 'PRODUCT_NOT_FOUND',
        detail = format('Product not found for item_id=%s', v_item_id_text);
    end if;

    v_qty := coalesce(nullif(v_line->>'qty', '')::numeric, 0);
    if v_qty <= 0 then
      raise exception using errcode = 'P0001', message = 'INVALID_QTY',
        detail = format('Quantity must be > 0 for item_id=%s', v_item_id_text);
    end if;

    v_item_name := coalesce(nullif(v_line->>'item_name', ''), nullif(v_line->>'item', ''), 'صنف غير محدد');
    v_company   := coalesce(nullif(v_line->>'company', ''), 'بدون شركة');
    v_cat       := coalesce(nullif(v_line->>'cat', ''), '');
    v_unit      := coalesce(nullif(v_line->>'unit', ''), '');

    insert into _inbound_input_lines (item_id_text, item_name, company, cat, unit, qty)
    values (v_item_id_db, v_item_name, v_company, v_cat, v_unit, v_qty)
    on conflict (item_id_text) do update
      set qty       = _inbound_input_lines.qty + excluded.qty,
          item_name = excluded.item_name,
          company   = excluded.company,
          cat       = excluded.cat,
          unit      = excluded.unit;
  end loop;

  -- ── جمع المعرفات + قفل الصفوف ────────────────────────────────────────────
  select array_agg(item_id_text order by item_id_text), coalesce(sum(qty), 0)
    into v_affected_ids, v_total_qty
  from _inbound_input_lines;

  if coalesce(array_length(v_affected_ids, 1), 0) > 0 then
    perform 1 from public.products p
    where p.id::text = any(v_affected_ids)
    order by p.id::text
    for update;
  end if;

  -- ── تحديث المخزون + إدراج سجلات المعاملات ──────────────────────────────
  for v_item_id_text, v_item_name, v_company, v_cat, v_unit, v_qty in
    select item_id_text, item_name, company, cat, unit, qty
    from _inbound_input_lines
  loop
    select coalesce(stock_qty, 0) into v_current_stock
    from public.products
    where id::text = v_item_id_text
    for update;

    v_new_stock := v_current_stock + v_qty;

    update public.products
    set stock_qty = v_new_stock
    where id::text = v_item_id_text;

    insert into public.transactions (
      type,
      item_id,
      item,
      company,
      unit,
      cat,
      qty,
      date,
      location,
      beneficiary,
      recipient,
      receipt_type,
      reference_number,
      receipt_image,
      batch_id,
      is_summary,
      timestamp,
      balance_after,
      status
    )
    select
      'in',
      p.id,
      v_item_name,
      nullif(v_company, ''),
      nullif(v_unit, ''),
      nullif(v_cat, ''),
      v_qty,
      v_date,
      v_location,
      v_supplier,
      v_supplier,
      v_receipt_type,
      nullif(v_receipt_number, ''),
      v_receipt_image,
      v_batch_id,
      false,
      v_now,
      v_new_stock,
      'مكتمل'
    from public.products p
    where p.id::text = v_item_id_text
    returning id::text into v_tx_id;

    v_tx_ids := array_append(v_tx_ids, v_tx_id);
  end loop;

  -- ── سطر الملخص ───────────────────────────────────────────────────────────
  insert into public.transactions (
    type,
    item,
    qty,
    total_qty,
    date,
    location,
    beneficiary,
    recipient,
    receipt_type,
    reference_number,
    receipt_image,
    batch_id,
    is_summary,
    timestamp,
    status
  ) values (
    'in',
    'ملخص توريد',
    v_total_qty,
    v_total_qty,
    v_date,
    v_location,
    v_supplier,
    v_supplier,
    v_receipt_type,
    nullif(v_receipt_number, ''),
    v_receipt_image,
    v_batch_id,
    true,
    v_now,
    'مكتمل'
  ) returning id::text into v_tx_id;

  v_tx_ids := array_append(v_tx_ids, v_tx_id);

  -- ── بناء استجابة الأرصدة ─────────────────────────────────────────────────
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_id',     p.id::text,
        'stock_qty',   coalesce(p.stock_qty, 0),
        'damaged_qty', coalesce(p.damaged_qty, 0),
        'reason',      'inbound_committed'
      )
      order by p.id::text
    ),
    '[]'::jsonb
  )
    into v_balances
  from public.products p
  where p.id::text = any(v_affected_ids);

  return jsonb_build_object(
    'ok',                true,
    'request_id',        v_request_id,
    'operation',         'inventory_commit_inbound',
    'batch_id',          v_batch_id,
    'receipt_number',    v_receipt_number,
    'transaction_ids',   to_jsonb(v_tx_ids),
    'affected_item_ids', to_jsonb(v_affected_ids),
    'total_qty',         v_total_qty,
    'balances',          v_balances,
    'warnings',          '[]'::jsonb,
    'refresh_hint', jsonb_build_object(
      'products',     true,
      'transactions', true,
      'dashboard',    true,
      'voucher_lists',false,
      'returns_list', false
    ),
    'ui_snapshot', jsonb_build_object(
      'inbound_summary', jsonb_build_object(
        'batch_id',   v_batch_id,
        'total_qty',  v_total_qty,
        'line_count', jsonb_array_length(v_lines),
        'location',   v_location,
        'supplier',   v_supplier,
        'date',       v_date
      )
    ),
    'meta', jsonb_build_object(
      'actor_user_id',   v_actor_user_id,
      'actor_user_name', v_actor_user_name
    )
  );

exception
  when others then
    return jsonb_build_object(
      'ok',            false,
      'request_id',    v_request_id,
      'operation',     'inventory_commit_inbound',
      'error_code',    sqlstate,
      'error_message', sqlerrm,
      'safe_to_retry', false
    );
end;
$$;

create or replace function public.inventory_dashboard_today(
  p_target_date date default current_date,
  p_timezone text default 'Asia/Riyadh'
)
returns table (
  target_date date,
  day_start timestamptz,
  day_end timestamptz,
  total_inbound_qty numeric,
  total_sales_qty numeric,
  total_returns_qty numeric,
  total_damaged_qty numeric
)
language plpgsql
set search_path = public
as $$
declare
  v_day_start timestamptz;
  v_day_end   timestamptz;
begin
  /*
    Dashboard daily window is calculated in the requested business timezone,
    then converted back to timestamptz so comparisons stay index-friendly.
  */
  v_day_start := (p_target_date::timestamp at time zone p_timezone);
  v_day_end := ((p_target_date + 1)::timestamp at time zone p_timezone);

  return query
  with day_tx as (
    select
      t.type,
      t.status,
      coalesce(t.qty, 0)::numeric as qty,
      coalesce(t.is_summary, false) as is_summary
    from public.transactions t
    where t.timestamp >= v_day_start
      and t.timestamp < v_day_end
  )
  select
    p_target_date,
    v_day_start,
    v_day_end,
    coalesce(sum(case
      when is_summary = false
       and coalesce(status, '') <> 'cancelled'
       and type in ('in', 'Restock', 'سند إدخال')
      then qty else 0 end), 0) as total_inbound_qty,
    coalesce(sum(case
      when is_summary = false
       and coalesce(status, '') <> 'cancelled'
       and type in ('out', 'Issue', 'صادر', 'سند إخراج', 'سند إخراج صوري')
      then abs(qty) else 0 end), 0) as total_sales_qty,
    coalesce(sum(case
      when is_summary = false
       and coalesce(status, '') <> 'cancelled'
       and type in ('Return', 'مرتجع', 'return')
      then qty else 0 end), 0) as total_returns_qty,
    coalesce(sum(case
      when is_summary = false
       and coalesce(status, '') <> 'cancelled'
       and type in ('Return', 'مرتجع', 'return')
       and coalesce(status, '') in ('تالف', 'مرتجع تالف')
      then qty else 0 end), 0) as total_damaged_qty
  from day_tx;
end;
$$;
