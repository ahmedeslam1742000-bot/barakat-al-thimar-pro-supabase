import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { normalizeArabic } from '../lib/arabicTextUtils';

// Voucher type constants (mirror of Dashboard module-level consts)
const FUNCTIONAL_INBOUND_TYPE = 'سند إدخال';
const FUNCTIONAL_OUTBOUND_TYPE = 'سند إخراج';
const FUNCTIONAL_VOUCHER_TYPES = [FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE];

/**
 * processTx — Normalize a raw Supabase transaction row into the app's
 * internal format. Pure function, used in both the initial fetch and
 * the real-time subscription handler.
 */
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

/**
 * useDataFetcher — Core data-layer hook for the Barakat Dashboard.
 *
 * Responsibilities:
 *  - Own the primary data state: items, transactions, reps
 *  - Provide fetchInitialData (stable ref, safe to pass as a dep)
 *  - Set up real-time Supabase subscriptions
 *  - Derive all voucher groupings and daily shift stats via useMemo
 *
 * Dependencies injected via params:
 *   currentUser — authenticated user object (used as subscription trigger)
 */
const DataContext = createContext(null);

export function DataProvider({ children, currentUser }) {
  // ─── Primary Data State ───────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [dbTransactionsList, setDbTransactionsList] = useState([]);
  const [receiptVouchers, setReceiptVouchers] = useState([]);
  const [repsList, setRepsList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    stockInCount: 0,
    salesCount: 0,
    returnsCount: 0,
    damageCount: 0,
  });
  const [hasDashboardStats, setHasDashboardStats] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      const { data: repsData } = await supabase.from('reps').select('name');
      if (repsData) setRepsList(repsData.map(r => r.name));

      const { data: itemsData, error: itemsError } = await supabase
        .from('products')
        .select('id, name, company, cat, unit, stock_qty, damaged_qty, search_key, created_at, price, old_price')
        .order('name')
        .limit(10000);
      if (itemsError) throw itemsError;
      if (itemsData) {
        setItems(itemsData.map(d => ({
          ...d,
          stockQty: Number(d.stock_qty) || 0,
          damagedQty: Number(d.damaged_qty) || 0,
          searchKey: d.search_key || (d.name ? `${d.name} ${d.company || ''} ${d.cat || ''}` : ''),
          createdAt: d.created_at,
          normName: normalizeArabic(d.name),
          normCompany: normalizeArabic(d.company || 'بدون شركة')
        })));
      }

      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('id, type, timestamp, item, company, qty, unit, cat, supplier, beneficiary, loc, location, rep, recipient, reference_number, batch_id, is_summary, item_id, notes, status')
        .order('timestamp', { ascending: false })
        .limit(1500);
      if (transError) throw transError;
      if (transData) {
        setDbTransactionsList(transData.map(processTx));
      }

      const { data: rvData, error: rvError } = await supabase
        .from('receipt_vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500);
      if (rvData) {
        setReceiptVouchers(rvData.map(r => ({
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
        })));
      }

      const { data: dashboardRpcData, error: dashboardRpcError } = await supabase.rpc('inventory_dashboard_today');
      if (!dashboardRpcError && dashboardRpcData) {
        const payload = Array.isArray(dashboardRpcData) ? dashboardRpcData[0] : dashboardRpcData;
        setDashboardStats({
          stockInCount: Number(payload?.total_inbound_qty || 0),
          salesCount: Number(payload?.total_sales_qty || 0),
          returnsCount: Number(payload?.total_returns_qty || 0),
          damageCount: Number(payload?.total_damaged_qty || 0),
        });
        setHasDashboardStats(true);
      } else {
        setHasDashboardStats(false);
      }
    } catch (err) {
      setHasDashboardStats(false);
      if (import.meta.env.DEV) console.error('useDataFetcher fetchInitialData error:', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Real-time subscriptions ──────────────────────────────────────────
  useEffect(() => {
    // ⚠️ لا تمرر async function مباشرة كـ listener — يسبب Unhandled Promise Rejection
    // ✅ دائماً لف الـ async function في arrow function مشفوهة
    const itemsChannel = supabase
      .channel('public:products:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        try {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [{
              ...payload.new,
              stockQty: Number(payload.new.stock_qty) || 0,
              damagedQty: Number(payload.new.damaged_qty) || 0,
              searchKey: payload.new.search_key || (payload.new.name ? `${payload.new.name} ${payload.new.company || ''} ${payload.new.cat || ''}` : ''),
              createdAt: payload.new.created_at,
              normName: normalizeArabic(payload.new.name),
              normCompany: normalizeArabic(payload.new.company || 'بدون شركة')
            }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(p => p.id === payload.new.id ? {
              ...payload.new,
              stockQty: Number(payload.new.stock_qty) || 0,
              damagedQty: Number(payload.new.damaged_qty) || 0,
              searchKey: payload.new.search_key || (payload.new.name ? `${payload.new.name} ${payload.new.company || ''} ${payload.new.cat || ''}` : ''),
              createdAt: payload.new.created_at,
              normName: normalizeArabic(payload.new.name),
              normCompany: normalizeArabic(payload.new.company || 'بدون شركة')
            } : p));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(p => p.id !== payload.old.id));
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Realtime] products handler error:', err);
        }
      })
      .subscribe((status) => {

      });

    const transChannel = supabase
      .channel('public:transactions:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        try {
          if (payload.eventType === 'INSERT') {
            setDbTransactionsList(prev => [processTx(payload.new), ...prev].slice(0, 200));
          } else if (payload.eventType === 'UPDATE') {
            setDbTransactionsList(prev => prev.map(t => t.id === payload.new.id ? processTx(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setDbTransactionsList(prev => prev.filter(t => t.id !== payload.old.id));
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Realtime] transaction handler error:', err);
        }
      })
      .subscribe((status) => {

      });

    const rvChannel = supabase
      .channel('public:receipt_vouchers:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipt_vouchers' }, (payload) => {
        try {
          if (payload.eventType === 'INSERT') {
            const r = payload.new;
            setReceiptVouchers(prev => [{
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
            }, ...prev].slice(0, 1500));
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new;
            setReceiptVouchers(prev => prev.map(v => v.id === r.id ? {
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
            } : v));
          } else if (payload.eventType === 'DELETE') {
            setReceiptVouchers(prev => prev.filter(v => v.id !== payload.old.id));
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Realtime] receipt_vouchers handler error:', err);
        }
      })
      .subscribe((status) => {

      });

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(transChannel);
      supabase.removeChannel(rvChannel);
    };
  }, [currentUser, fetchInitialData]);

  // ─── Initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ─── Voucher derivations ──────────────────────────────────────────────

  const voucherTransactionsMemo = useMemo(() => {
    if (dbTransactionsList.length === 0) return [];
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

  const canonicalVoucherTransactions = useMemo(() => {
    const groupedVouchers = new Map();
    const uniqueVouchers = groupedVouchers;
    dbTransactionsList
      .filter(v => v.documentary === true && (v.type === 'سند إخراج صوري' || v.type === 'Issue'))
      .forEach(v => {
        if (!v?.id || uniqueVouchers.has(v.id)) return;
        uniqueVouchers.set(v.id, {
          ...v,
          invoiced: v.invoiced === true,
          deducted: v.deducted === true,
        });
      });
    return Array.from(uniqueVouchers.values());
  }, [voucherTransactionsMemo]); // eslint-disable-line react-hooks/exhaustive-deps

  const functionalVoucherGroups = useMemo(() => {
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

  // ─── Shift-based daily stats ──────────────────────────────────────────
  const shiftStartTime = useMemo(() => {
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(7, 0, 0, 0);
    if (now < shiftStart) shiftStart.setDate(shiftStart.getDate() - 1);
    return shiftStart;
  }, []);

  const fallbackDashboardStats = useMemo(() => {
    let stockIn = 0, sales = 0, returns = 0, damage = 0;
    // Optimization: limit loop to maximum 100 recent items to prevent blocking the main thread
    const recentTx = dbTransactionsList.slice(0, 100);
    
    for (const t of recentTx) {
      if (t.is_summary === true) continue;
      const txTime = t.timestamp ? new Date(t.timestamp) : new Date();
      const inShift = txTime >= shiftStartTime;
      const notCancelled = t.status !== 'cancelled';
      if (notCancelled && inShift) {
        if (t.type === 'in' || t.type === 'Restock' || (t.type === FUNCTIONAL_INBOUND_TYPE && t.isFunctional === true))
          stockIn += Number(t.qty || 0);
        if (t.type === 'Issue' || t.type === 'out' || t.type === 'صادر' || (t.type === FUNCTIONAL_OUTBOUND_TYPE && t.isFunctional === true))
          sales += Math.abs(Number(t.qty || 0));
        if (t.type === 'Return' || t.type === 'مرتجع' || t.type === 'return')
          returns += Number(t.qty || 0);
      }
      if (t.is_summary !== true && t.status === 'مرتجع تالف' && inShift)
        damage += Number(t.qty || 0);
    }
    return { stockInCount: stockIn, salesCount: sales, returnsCount: returns, damageCount: damage };
  }, [dbTransactionsList, shiftStartTime]);

  const stockInCount = hasDashboardStats ? dashboardStats.stockInCount : fallbackDashboardStats.stockInCount;
  const salesCount = hasDashboardStats ? dashboardStats.salesCount : fallbackDashboardStats.salesCount;
  const returnsCount = hasDashboardStats ? dashboardStats.returnsCount : fallbackDashboardStats.returnsCount;
  const damageCount = hasDashboardStats ? dashboardStats.damageCount : fallbackDashboardStats.damageCount;

  // ─── Morning Brief Data ──────────────────────────────────────────────
  const morningBriefData = useMemo(() => {
    // Basic logic: items with stock < 50
    const atRiskItems = items
      .filter(item => item.stockQty < 50)
      .map(item => ({
        id: item.id,
        name: item.name,
        company: item.company || 'بدون شركة',
        cat: item.cat || 'أخرى',
        totalQtyAtRisk: item.stockQty,
        isExpired: false, // Placeholders for future expiry logic
        isUrgent: item.stockQty < 20,
        daysLeft: 0,
      }))
      .sort((a, b) => a.totalQtyAtRisk - b.totalQtyAtRisk);

    return {
      atRiskItems,
      totalQty: atRiskItems.reduce((sum, item) => sum + item.totalQtyAtRisk, 0)
    };
  }, [items]);

  const value = {
    // Core data
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    fetchInitialData,
    // Voucher derivations
    voucherTransactionsMemo,
    canonicalVoucherTransactions,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    // Daily stats
    stockInCount,
    salesCount,
    returnsCount,
    damageCount,
    shiftStartTime,
    // Morning Brief
    morningBriefData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
