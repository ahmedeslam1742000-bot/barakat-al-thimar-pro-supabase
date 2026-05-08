import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

/**
 * useVoucherDetail — State & action handlers for the Voucher Detail Modal.
 *
 * Dependencies injected via params:
 *   items              — current product list from Dashboard state
 *   setLoading         — shared loading flag setter
 *   playWarning        — audio feedback fn
 *   playSuccess        — audio feedback fn
 *   fetchInitialData   — Dashboard data-refetch callback
 *   setActiveView      — navigation callback (for handleEditVoucher)
 *   // Invoice bridge (from useInvoiceModal):
 *   setSourceVoucher   — set the voucher being invoiced
 *   setInvoiceForm     — pre-fill invoice form
 *   setCurrentInvoiceItem — reset current item
 *   setIsVoucherInvoice   — toggle read-only mode
 *   setIsSalesModalOpen   — open invoice modal
 */
export function useVoucherDetail({
  items,
  setLoading,
  playWarning,
  playSuccess,
  fetchInitialData,
  setActiveView,
  // Invoice bridge
  setSourceVoucher,
  setInvoiceForm,
  setCurrentInvoiceItem,
  setIsVoucherInvoice,
  setIsSalesModalOpen,
}) {
  // ─── Modal / Detail View State ────────────────────────────────────────
  const [showVoucherHistory, setShowVoucherHistory] = useState(false);
  const [voucherTransactions, setVoucherTransactions] = useState([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [activeVoucherId, setActiveVoucherId] = useState(null);
  const voucherOpenLockRef = useRef({ id: null, at: 0 });
  const [isVoucherDetailOpen, setIsVoucherDetailOpen] = useState(false);
  const [detailVoucher, setDetailVoucher] = useState(null);
  const [invoiceTimestamps, setInvoiceTimestamps] = useState({}); // { voucherId: timestamp }

  // ─── Open voucher detail (debounce-locked to prevent double-opens) ───
  const openVoucherModal = useCallback((voucher) => {
    const now = Date.now();
    if (voucherOpenLockRef.current.id === voucher.id && now - voucherOpenLockRef.current.at < 250) return;
    voucherOpenLockRef.current = { id: voucher.id, at: now };
    setActiveVoucherId(voucher.id);
    setSelectedVoucher(voucher);
    setIsVoucherModalOpen(true);
  }, []);

  // ─── Close voucher detail ─────────────────────────────────────────────
  const closeVoucherDetail = useCallback(() => {
    setIsVoucherDetailOpen(false);
    setShowVoucherHistory(false);
  }, []);

  // ─── Resolve a product from a voucher transaction line ───────────────
  const findItemFromVoucherLine = useCallback((line) => {
    if (line.itemId) {
      const byId = items.find(item => item.id === line.itemId);
      if (byId) return byId;
    }
    const itemName = line.item || '';
    return (
      items.find(item => `${item.name} - ${item.company}` === itemName) ||
      items.find(item => itemName.includes(item.name) && (item.company === 'بدون شركة' || itemName.includes(item.company))) ||
      items.find(item => itemName.includes(item.name)) ||
      null
    );
  }, [items]);

  // ─── Finalize an inbound voucher (mark as invoiced, no stock change) ─
  const finalizeInboundVoucher = useCallback(async (voucher) => {
    try {
      for (const line of voucher.lines) {
        await supabase.from('transactions').update({ invoiced: true, deducted: true }).eq('id', line.id);
      }
      setIsVoucherModalOpen(false);
      setSelectedVoucher(null);
      toast.success('تم اعتماد سند الإدخال بنجاح ✅');
      if (playSuccess) playSuccess();
    } catch {
      toast.error('تعذر اعتماد سند الإدخال.');
      if (playWarning) playWarning();
    }
  }, [playSuccess, playWarning]);

  // ─── Export outbound voucher → prefill the Invoice Modal ─────────────
  const handleExportInvoiceToInvoice = useCallback((voucher) => {
    if (!voucher) return;

    const lineItems = (voucher.lines || [])
      .map((line) => {
        const matchedItem = findItemFromVoucherLine(line);
        if (!matchedItem) return null;
        return {
          selectedItem: matchedItem,
          name: `${matchedItem.name} - ${matchedItem.company}`,
          cat: matchedItem.cat,
          unit: matchedItem.unit,
          qty: Number(line.qty || 0),
        };
      })
      .filter(Boolean);

    const sourceVoucherData = {
      ...voucher,
      deducted: true,
      kind: voucher.kind === 'in' ? 'in' : 'outward',
    };
    if (setSourceVoucher) setSourceVoucher(sourceVoucherData);

    const invoiceBase = {
      client: voucher.clientName || voucher.recipient || 'عميل نقدي',
      rep: '',
      date: new Date().toISOString().split('T')[0],
      items: lineItems,
    };
    if (setInvoiceForm) setInvoiceForm(invoiceBase);
    if (setCurrentInvoiceItem) setCurrentInvoiceItem({ name: '', selectedItem: null, cat: '', unit: '', qty: '' });

    closeVoucherDetail();
    if (setIsVoucherInvoice) setIsVoucherInvoice(true);
    if (setIsSalesModalOpen) setIsSalesModalOpen(true);
  }, [
    findItemFromVoucherLine, closeVoucherDetail,
    setSourceVoucher, setInvoiceForm, setCurrentInvoiceItem,
    setIsVoucherInvoice, setIsSalesModalOpen,
  ]);

  // ─── Delete voucher + reverse stock ──────────────────────────────────
  const handleDeleteVoucher = useCallback(async (voucher) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السند نهائياً؟ سيتم استرجاع الكميات للمخزن.')) return;
    try {
      if (setLoading) setLoading(true);
      const lines = voucher.lines || [];

      for (const line of lines) {
        if (line.deducted !== false) {
          const currentItem = items.find(i => i.id === line.item_id);
          if (currentItem) {
            const type = line.type || '';
            const isIn = type.includes('إدخال') || type === 'Restock';
            const delta = isIn ? -Number(line.qty) : Number(line.qty);
            const newStock = currentItem.stockQty + delta;
            await supabase.from('products').update({ stock_qty: Math.max(0, newStock) }).eq('id', line.item_id);
          }
        }
      }

      const { error } = await supabase.from('transactions').delete().eq('batch_id', voucher.id);
      if (error) throw error;

      toast.success('تم حذف السند وإرجاع الكميات للمخزن بنجاح ✅');
      if (playSuccess) playSuccess();
      closeVoucherDetail();
      if (fetchInitialData) fetchInitialData();
    } catch {
      toast.error('حدث خطأ أثناء حذف السند.');
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [items, setLoading, playSuccess, closeVoucherDetail, fetchInitialData]);

  // ─── Navigate to voucher edit page ───────────────────────────────────
  const handleEditVoucher = useCallback((voucher) => {
    const view = voucher.kind === 'in' ? 'voucher-in' : 'voucher-outward';
    localStorage.setItem('edit_voucher_id', voucher.id);
    if (setActiveView) setActiveView(view);
    closeVoucherDetail();
  }, [setActiveView, closeVoucherDetail]);

  // ─── Mark voucher as invoiced ─────────────────────────────────────────
  const handleMarkAsInvoiced = useCallback(async (voucher = null) => {
    const v = voucher || selectedVoucher;
    if (!v) return;

    if (v.kind === 'in') {
      try {
        if (setLoading) setLoading(true);
        const now = new Date();
        const invoiceTimestamp = now.toLocaleDateString('ar-SA', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        const lines = v.lines || [];
        for (const line of lines) {
          await supabase.from('transactions').update({
            status: 'مفوتر',
            notes: line.notes
              ? `${line.notes} [تم إصدار الفاتورة] ${invoiceTimestamp}`
              : `[تم إصدار الفاتورة] ${invoiceTimestamp}`,
          }).eq('id', line.id);
        }

        setInvoiceTimestamps(prev => ({ ...prev, [v.id]: invoiceTimestamp }));
        setVoucherTransactions(prev =>
          prev.map(item =>
            item.id === v.id
              ? { ...item, invoiced: true, deducted: true, invoiceDate: invoiceTimestamp }
              : item
          )
        );
        setDetailVoucher(prev =>
          prev && prev.id === v.id
            ? { ...prev, invoiced: true, deducted: true, invoiceDate: invoiceTimestamp }
            : prev
        );

        toast.success('تم اعتماد السند بنجاح ✅');
        if (playSuccess) playSuccess();
        if (fetchInitialData) fetchInitialData();
      } catch {
        toast.error('تعذر اعتماد السند.');
        if (playWarning) playWarning();
      } finally {
        if (setLoading) setLoading(false);
      }
      return;
    }

    // For outbound: open the invoice modal pre-filled
    handleExportInvoiceToInvoice(v);
  }, [
    selectedVoucher, setLoading, playSuccess, playWarning,
    fetchInitialData, handleExportInvoiceToInvoice,
  ]);

  // ─── Public API ───────────────────────────────────────────────────────
  return {
    // State
    showVoucherHistory, setShowVoucherHistory,
    voucherTransactions, setVoucherTransactions,
    isVoucherModalOpen, setIsVoucherModalOpen,
    selectedVoucher, setSelectedVoucher,
    activeVoucherId, setActiveVoucherId,
    isVoucherDetailOpen, setIsVoucherDetailOpen,
    detailVoucher, setDetailVoucher,
    invoiceTimestamps, setInvoiceTimestamps,
    // Actions
    openVoucherModal,
    closeVoucherDetail,
    findItemFromVoucherLine,
    finalizeInboundVoucher,
    handleExportInvoiceToInvoice,
    handleDeleteVoucher,
    handleEditVoucher,
    handleMarkAsInvoiced,

    // ─── New Helper Actions ──────────────────────────────────────────
    updateVoucherNote: async (voucher, newNote) => {
      try {
        if (!voucher?.id) return;
        const { error } = await supabase
          .from('transactions')
          .update({ notes: newNote })
          .eq('batch_id', voucher.id);
        
        if (error) throw error;
        toast.success('تم تحديث الملاحظات ✅');
        if (fetchInitialData) fetchInitialData();
      } catch {
        toast.error('حدث خطأ أثناء تحديث الملاحظات.');
      }
    },

    handleDeleteTransaction: async (txId) => {
      if (!window.confirm('هل أنت متأكد من حذف هذا الصنف من السند؟')) return;
      try {
        if (setLoading) setLoading(true);
        const { error } = await supabase.from('transactions').delete().eq('id', txId);
        if (error) throw error;
        
        toast.success('تم حذف الصنف بنجاح ✅');
        if (fetchInitialData) fetchInitialData();
      } catch {
        toast.error('حدث خطأ أثناء حذف الصنف.');
      } finally {
        if (setLoading) setLoading(false);
      }
    },

    printVoucher: (voucher) => {
      if (!voucher) return;
      // Typical pattern: set something in localStorage and open /print
      localStorage.setItem('print_voucher_data', JSON.stringify(voucher));
      window.open('/print', '_blank');
    },

    duplicateVoucher: (voucher) => {
      if (!voucher) return;
      const view = voucher.kind === 'in' ? 'voucher-in' : 'voucher-outward';
      localStorage.setItem('duplicate_voucher_data', JSON.stringify(voucher));
      if (setActiveView) setActiveView(view);
      setIsVoucherDetailOpen(false);
    },

    handleConfirmVoucher: async () => {
      if (!selectedVoucher) return;
      await handleMarkAsInvoiced(selectedVoucher);
      setIsVoucherModalOpen(false);
      setSelectedVoucher(null);
    },
  };
}
