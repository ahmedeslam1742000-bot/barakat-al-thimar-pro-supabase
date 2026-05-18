import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { normalizeArabic } from '../lib/arabicTextUtils';
import { useMemo } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const FUNCTIONAL_INBOUND_TYPE = 'سند إدخال';
const FUNCTIONAL_OUTBOUND_TYPE = 'سند إخراج';
const FUNCTIONAL_VOUCHER_TYPES = [FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE];

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeItem(d) {
  return {
    ...d,
    stockQty: Number(d.stock_qty) || 0,
    damagedQty: Number(d.damaged_qty) || 0,
    searchKey: d.search_key || (d.name ? `${d.name} ${d.company || ''} ${d.cat || ''}` : ''),
    createdAt: d.created_at,
    normName: normalizeArabic(d.name),
    normCompany: normalizeArabic(d.company || 'بدون شركة'),
  };
}

function processTx(d) {
  if (!d) return null;
  return {
    ...d,
    itemId: d.item_id,
    referenceNumber: d.reference_number || '',
    voucherCode: d.reference_number || '',
    voucherGroupId: d.batch_id || '',
    batchId: d.batch_id || '',
    isInvoice: d.status === 'مفوتر' || (typeof d.notes === 'string' && d.notes.includes('[تم إصدار الفاتورة]')),
    isTransfer: (typeof d.notes === 'string' && d.notes.includes('[نوع: تحويل مخزني]')),
    isFunctional: d.type === 'سند إدخال' || d.type === 'سند إخراج' || d.type === 'outward' || d.type === 'in' || (typeof d.item === 'string' && (d.item.includes('ملخص') || d.item.includes('عهده'))),
    isEdited: (typeof d.notes === 'string' && d.notes.includes('[تعديل حديث]')),
    historyLog: (() => {
      if (typeof d.notes !== 'string') return null;
      try {
        const match = d.notes.match(/<!--(\{.*\})-->/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      } catch (err) {
        return null;
      }
      return null;
    })(),
  };
}

function normalizeVoucher(r) {
  return {
    id: r.id,
    date: r.date,
    repName: r.rep_name,
    customerName: r.customer_name,
    voucherNo: r.voucher_no,
    invoiceNo: r.invoice_no || '',
    isAccountPayment: !r.invoice_no || r.invoice_no === 'دفعة من الحساب',
    amount: Number(r.amount),
    type: r.type,
    is_deposited: r.is_deposited || false,
    deposited_at: r.deposited_at || null,
  };
}

function normalizeExpense(e) {
  return {
    id: e.id,
    date: e.date,
    repName: e.rep_name,
    amount: Number(e.amount),
    statement: e.statement,
    is_settled: e.is_settled || false,
    settlement_batch_id: e.settlement_batch_id || null,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useItemsQuery(enabled = true) {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company, cat, unit, stock_qty, damaged_qty, search_key, created_at, price, old_price')
        .order('name')
        .limit(500);
      if (error) throw error;
      return data.map(normalizeItem);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useTransactionsQuery(enabled = true) {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, timestamp, item, company, qty, unit, cat, supplier, beneficiary, loc, location, rep, recipient, reference_number, batch_id, is_summary, item_id, notes, status')
        .order('timestamp', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data.map(processTx);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReceiptVouchersQuery(enabled = true) {
  return useQuery({
    queryKey: ['receipt_vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipt_vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return data.map(normalizeVoucher);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRepExpensesQuery(enabled = true) {
  return useQuery({
    queryKey: ['representative_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representative_expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data.map(normalizeExpense);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRepsQuery(enabled = true) {
  return useQuery({
    queryKey: ['reps'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reps').select('name');
      if (error) throw error;
      return data.map(r => r.name);
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Computed Selectors Hook ──────────────────────────────────────────────────

export function useComputedData(dbTransactionsList = [], items = []) {
  const voucherTransactionsMemo = useMemo(() => {
    if (!dbTransactionsList || dbTransactionsList.length === 0) return [];
    const outboundTx = dbTransactionsList
      .filter(tx => tx.type === 'Issue' || tx.type === 'سند إخراج' || tx.type === 'سند إخراج صوري')
      .map(tx => ({
        ...tx,
        clientName: tx.rep || tx.loc || tx.beneficiary || 'غير محدد',
        itemName: tx.item || 'صنف غير محدد',
        quantity: Number(tx.qty || 0),
        timestamp: tx.timestamp ? new Date(tx.timestamp) : new Date(),
        batchId: tx.batchId,
        invoiced: tx.invoiced === true,
        voucherCode: tx.voucherCode || '',
      }));
    return outboundTx
      .filter(v => v.documentary === true && (v.type === 'سند إخراج صوري' || v.type === 'Issue'))
      .reduce((acc, voucher) => {
        if (!voucher?.id || acc.some(v => v.id === voucher.id)) return acc;
        acc.push({ ...voucher, invoiced: voucher.invoiced === true, deducted: voucher.deducted === true });
        return acc;
      }, [])
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [dbTransactionsList]);

  const functionalVoucherGroups = useMemo(() => {
    if (!dbTransactionsList || dbTransactionsList.length === 0) return [];
    const groupedVouchers = new Map();

    dbTransactionsList.forEach((tx) => {
      if (tx.isFunctional !== true || !FUNCTIONAL_VOUCHER_TYPES.includes(tx.type) || tx.is_summary === true) return;

      const groupId = tx.voucherGroupId || tx.id;
      const txDate = tx.timestamp ? new Date(tx.timestamp) : new Date();

      if (!groupedVouchers.has(groupId)) {
        groupedVouchers.set(groupId, {
          id: groupId,
          voucherGroupId: groupId,
          voucherCode: tx.voucherCode || '',
          type: tx.type,
          kind: tx.type === FUNCTIONAL_INBOUND_TYPE ? 'in' : 'outward',
          clientName: tx.rep || tx.supplier || tx.loc || 'غير محدد',
          timestamp: txDate,
          invoiced: false,
          isTransfer: tx.notes && tx.notes.includes('[نوع: تحويل مخزني]'),
          deducted: false,
          isFunctional: true,
          line_note: tx.notes || '',
          lines: [],
        });
      }

      const group = groupedVouchers.get(groupId);
      if (tx.notes && tx.notes.includes('[نوع: تحويل مخزني]')) group.isTransfer = true;
      group.lines.push({ ...tx, quantity: Number(tx.qty || 0), timestamp: txDate });

      const txIsInvoiced =
        tx.status === 'مفوتر' ||
        tx.invoiced === true ||
        (tx.notes && (tx.notes.includes('[تمت الفوترة]') || tx.notes.includes('[تم إصدار الفاتورة]')));

      const txIsCancelled = tx.status === 'cancelled';
      if (txIsInvoiced) {
        group.invoiced = true;
        if (tx.notes && tx.notes.includes('[تم إصدار الفاتورة: ')) {
          const match = tx.notes.match(/\[تم إصدار الفاتورة: (.*?)\]/);
          if (match && match[1]) group.invoiceDate = match[1];
        }
      }
      if (txIsCancelled) group.isCancelled = true;
      if (txDate > group.timestamp) group.timestamp = txDate;
    });

    return Array.from(groupedVouchers.values())
      .map((voucher) => {
        const richNote = voucher.lines.find(l => (l.notes || '').includes('<!--'));
        if (richNote) voucher.line_note = richNote.notes;
        return {
          ...voucher,
          itemName: voucher.lines.map(line => line.item).join('، '),
          quantity: voucher.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [dbTransactionsList]);

  const pendingVouchers = useMemo(
    () => functionalVoucherGroups.filter(v => !v.invoiced && !v.isCancelled && !v.isTransfer).sort((a, b) => b.timestamp - a.timestamp),
    [functionalVoucherGroups]
  );

  const completedVouchers = useMemo(
    () => functionalVoucherGroups.filter(v => (v.invoiced || v.isTransfer) && !v.isCancelled).sort((a, b) => b.timestamp - a.timestamp),
    [functionalVoucherGroups]
  );

  const cancelledVouchers = useMemo(
    () => functionalVoucherGroups.filter(v => v.isCancelled).sort((a, b) => b.timestamp - a.timestamp),
    [functionalVoucherGroups]
  );

  const morningBriefData = useMemo(() => {
    if (!items || items.length === 0) return { atRiskItems: [], totalQty: 0 };
    const atRiskItems = items
      .filter(item => item.stockQty < 50)
      .map(item => ({
        id: item.id,
        name: item.name,
        company: item.company || 'بدون شركة',
        cat: item.cat || 'أخرى',
        totalQtyAtRisk: item.stockQty,
        isExpired: false,
        isUrgent: item.stockQty < 20,
        daysLeft: 0,
      }))
      .sort((a, b) => a.totalQtyAtRisk - b.totalQtyAtRisk);

    return {
      atRiskItems,
      totalQty: atRiskItems.reduce((sum, item) => sum + item.totalQtyAtRisk, 0),
    };
  }, [items]);

  return {
    voucherTransactionsMemo,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    morningBriefData,
  };
}
