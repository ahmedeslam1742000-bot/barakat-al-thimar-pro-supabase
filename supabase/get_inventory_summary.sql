-- =====================================================
-- Supabase RPC: get_inventory_summary
-- يُرجع ملخص مخزون كل منتج (إجمالي الوارد + السليم + التالف)
-- شغّل هذا الكود في Supabase → SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS TABLE (
  item_id     UUID,
  item_name   TEXT,
  company     TEXT,
  cat         TEXT,
  unit        TEXT,
  total_in    NUMERIC,
  stock_qty   NUMERIC,
  damaged_qty NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id                   AS item_id,
    p.name                 AS item_name,
    p.company,
    p.cat,
    p.unit,
    COALESCE(SUM(CASE WHEN t.type = 'in' AND t.is_summary IS NOT TRUE THEN t.qty ELSE 0 END), 0) AS total_in,
    COALESCE(p.stock_qty, 0)   AS stock_qty,
    COALESCE(p.damaged_qty, 0) AS damaged_qty
  FROM products p
  LEFT JOIN transactions t ON t.item_id = p.id
  GROUP BY p.id, p.name, p.company, p.cat, p.unit, p.stock_qty, p.damaged_qty
  ORDER BY p.cat, p.name;
$$;

-- Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_inventory_summary() TO anon, authenticated;
