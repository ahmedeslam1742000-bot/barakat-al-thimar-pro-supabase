import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import localforage from 'localforage';
import { formatItemNameWithCompany } from '../lib/itemFields';

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
 *   invoiceTimestamps  — optional externally-owned voucher invoice dates map
 *   setInvoiceTimestamps — optional setter for the shared invoice dates map
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
  invoiceTimestamps: controlledInvoiceTimestamps,
  setInvoiceTimestamps: controlledSetInvoiceTimestamps,
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
  const [localInvoiceTimestamps, setLocalInvoiceTimestamps] = useState({});
  const invoiceTimestamps = controlledInvoiceTimestamps ?? localInvoiceTimestamps;
  const setInvoiceTimestamps = controlledSetInvoiceTimestamps ?? setLocalInvoiceTimestamps;

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

  // ─── Finalize an inbound voucher → inventory_finalize_voucher RPC ────
  const finalizeInboundVoucher = useCallback(async (voucher) => {
    try {
      const { data } = await api.patch(`/vouchers/${voucher.id}/status`, { status: 'مكتمل' });
      setIsVoucherModalOpen(false);
      setSelectedVoucher(null);
      toast.success('تم اعتماد سند الإدخال بنجاح ✅');
      if (playSuccess) playSuccess();
      if (fetchInitialData) fetchInitialData();
    } catch {
      toast.error('تعذر اعتماد سند الإدخال.');
      if (playWarning) playWarning();
    }
  }, [playSuccess, playWarning, fetchInitialData]);

  // ─── Export outbound voucher → prefill the Invoice Modal ─────────────
  const handleExportInvoiceToInvoice = useCallback((voucher) => {
    if (!voucher) return;

    const lineItems = (voucher.lines || [])
      .map((line) => {
        const matchedItem = findItemFromVoucherLine(line);
        if (!matchedItem) return null;
        return {
          selectedItem: matchedItem,
          name: formatItemNameWithCompany(matchedItem.name, matchedItem.company),
          company: matchedItem.company,
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
      await api.delete(`/vouchers/${voucher.id}`);
      toast.success('تم حذف السند وإرجاع الكميات للمخزن بنجاح ✅');
      if (playSuccess) playSuccess();
      closeVoucherDetail();
      if (fetchInitialData) fetchInitialData();
    } catch (err) {
      toast.error(err?.message || 'حدث خطأ أثناء حذف السند.');
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [setLoading, playSuccess, closeVoucherDetail, fetchInitialData]);

  // ─── Navigate to voucher edit page ───────────────────────────────────
  const handleEditVoucher = useCallback(async (voucher) => {
    const view = voucher.kind === 'in' ? 'voucher-in' : 'voucher-outward';
    try {
      await localforage.setItem('edit_voucher_id', voucher.id);
      if (setActiveView) setActiveView(view);
      closeVoucherDetail();
    } catch (err) {
      toast.error('فشل حفظ التعديل محلياً.');
    }
  }, [setActiveView, closeVoucherDetail]);

  // ─── Mark voucher as invoiced ─────────────────────────────────────────
  const handleMarkAsInvoiced = useCallback(async (voucher = null) => {
    const v = voucher || selectedVoucher;
    if (!v) return;

    if (v.kind === 'in') {
      // Inbound: approve/finalize directly
      try {
        await api.patch(`/vouchers/${v.id}/status`, { status: 'مكتمل' });

        const invoiceTimestamp = new Date().toLocaleDateString('ar-SA', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
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

    // Outbound: open the invoice modal to issue a proper invoice
    // This will PATCH status to 'مفوتر' on save, correctly moving it out of pendingVouchers
    closeVoucherDetail();
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
        const current = detailVoucher || selectedVoucher;
        await api.put(`/vouchers/${voucher.id}`, {
          type: current.type || (current.kind === 'in' ? 'سند إدخال' : 'سند إخراج'),
          status: current.status || 'مكتمل',
          date: current.timestamp ? new Date(current.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          client_name: current.clientName,
          notes: newNote,
          items: current.lines.map(l => ({
            product_id: l.item_id || l.itemId,
            qty: l.qty,
            unit: l.unit
          }))
        });
        toast.success('تم تحديث الملاحظات ✅');
        if (fetchInitialData) fetchInitialData();
      } catch {
        toast.error('حدث خطأ أثناء تحديث الملاحظات.');
      }
    },

    handleDeleteTransaction: async (txId) => {
      if (!window.confirm('هل أنت متأكد من حذف هذا الصنف من السند؟')) return;
      try {
        const targetVoucher = detailVoucher || selectedVoucher;
        if (!targetVoucher) return;
        
        const remainingItems = targetVoucher.lines.filter(l => l.id !== txId);
        if (remainingItems.length === 0) {
          toast.error('لا يمكن حذف الصنف الوحيد في السند. يمكنك حذف السند بالكامل بدلاً من ذلك.');
          return;
        }

        await api.put(`/vouchers/${targetVoucher.id}`, {
          type: targetVoucher.type || (targetVoucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج'),
          status: targetVoucher.status || 'مكتمل',
          date: targetVoucher.timestamp ? new Date(targetVoucher.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          client_name: targetVoucher.clientName,
          notes: targetVoucher.notes,
          items: remainingItems.map(l => ({
            product_id: l.item_id || l.itemId,
            qty: l.qty,
            unit: l.unit
          }))
        });
        
        toast.success('تم حذف الصنف بنجاح ✅');
        if (fetchInitialData) fetchInitialData();
      } catch (err) {
        toast.error(err?.message || 'حدث خطأ أثناء حذف الصنف.');
      } finally {
        if (setLoading) setLoading(false);
      }
    },

    printVoucher: (voucher) => {
      if (!voucher) return;
      const newWin = window.open('about:blank', '_blank');
      localforage.setItem('print_voucher_data', voucher).then(() => {
        if (newWin) newWin.location.href = '/print';
      }).catch(err => {
        toast.error('فشل تحضير الفاتورة للطباعة. يرجى المحاولة مرة أخرى.');
        if (newWin) newWin.close();
      });
    },

    duplicateVoucher: async (voucher) => {
      if (!voucher) return;
      const view = voucher.kind === 'in' ? 'voucher-in' : 'voucher-outward';
      try {
        await localforage.setItem('duplicate_voucher_data', voucher);
        if (setActiveView) setActiveView(view);
        setIsVoucherDetailOpen(false);
      } catch (err) {
        toast.error('فشل حفظ السند المكرر. الذاكرة قد تكون ممتلئة.');
      }
    },

    handleConfirmVoucher: async () => {
      if (!selectedVoucher) return;
      await handleMarkAsInvoiced(selectedVoucher);
      setIsVoucherModalOpen(false);
      setSelectedVoucher(null);
    },
  };
}
