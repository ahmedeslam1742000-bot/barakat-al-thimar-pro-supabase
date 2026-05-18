import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { normalizeArabic } from '../lib/arabicTextUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const FUNCTIONAL_INBOUND_TYPE = 'سند إدخال';
const FUNCTIONAL_OUTBOUND_TYPE = 'سند إخراج';
const FUNCTIONAL_VOUCHER_TYPES = [FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE];

// ─── Helper Functions (خارج الـ Component لمنع إعادة إنشائها في كل render) ──

/**
 * normalizeItem — تحويل بيانات المنتج الخام إلى التنسيق الداخلي للتطبيق.
 */
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

/**
 * normalizeVoucher — تحويل بيانات سند القبض الخام إلى التنسيق الداخلي.
 */
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

/**
 * normalizeExpense — تحويل بيانات المصروف الخام إلى التنسيق الداخلي.
 */
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

/**
 * processTx — Normalize a raw Supabase transaction row into the app's
 * internal format. Pure function, used in the initial fetch.
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

// ─── Context ──────────────────────────────────────────────────────────────────
const DataContext = createContext(null);

export function DataProvider({ children, currentUser }) {
  // ─── Primary Data State ───────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [dbTransactionsList, setDbTransactionsList] = useState([]);
  const [receiptVouchers, setReceiptVouchers] = useState([]);
  const [repExpenses, setRepExpenses] = useState([]);
  const [repsList, setRepsList] = useState([]);

  // ─── Fetch (Promise.all للتوازي) ──────────────────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      const [
        repsResult,
        itemsResult,
        transResult,
        rvResult,
        expResult,
      ] = await Promise.all([
        supabase.from('reps').select('name'),
        supabase
          .from('products')
          .select('id, name, company, cat, unit, stock_qty, damaged_qty, search_key, created_at, price, old_price')
          .order('name')
          .limit(500),
        supabase
          .from('transactions')
          .select('id, type, timestamp, item, company, qty, unit, cat, supplier, beneficiary, loc, location, rep, recipient, reference_number, batch_id, is_summary, item_id, notes, status')
          .order('timestamp', { ascending: false })
          .limit(300),
        supabase
          .from('receipt_vouchers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('representative_expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (repsResult.data) {
        setRepsList(repsResult.data.map(r => r.name));
      }

      if (itemsResult.error) throw itemsResult.error;
      if (itemsResult.data) {
        setItems(itemsResult.data.map(normalizeItem));
      }

      if (transResult.error) throw transResult.error;
      if (transResult.data) {
        setDbTransactionsList(transResult.data.map(processTx));
      }

      if (rvResult.data) {
        setReceiptVouchers(rvResult.data.map(normalizeVoucher));
      }

      if (expResult.data) {
        setRepExpenses(expResult.data.map(normalizeExpense));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchInitialData error:', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Morning Brief Data ───────────────────────────────────────────────
  const morningBriefData = useMemo(() => {
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

  // ─── Context Value (memoized لمنع إعادة التصيير الغير ضرورية) ─────────
  const value = useMemo(() => ({
    // Core data
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    receiptVouchers, setReceiptVouchers,
    repExpenses, setRepExpenses,
    fetchInitialData,
    // Voucher derivations
    voucherTransactionsMemo,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    // Morning Brief
    morningBriefData,
  }), [
    items,
    dbTransactionsList,
    repsList,
    receiptVouchers,
    repExpenses,
    fetchInitialData,
    voucherTransactionsMemo,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    morningBriefData,
  ]);

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
