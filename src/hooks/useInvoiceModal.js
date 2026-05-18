import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

const EMPTY_INVOICE_FORM = () => ({
  client: 'سحب مندوب',
  rep: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  items: [],
});

const EMPTY_INVOICE_ITEM = () => ({
  name: '',
  selectedItem: null,
  cat: '',
  unit: '',
  qty: '',
});

/**
 * useInvoiceModal — All state & handlers for the Sales/Invoice Modal.
 *
 * Dependencies injected via params (not imported directly) so the hook
 * stays pure and testable:
 *   items           — current product list from Dashboard state
 *   setLoading      — shared loading flag setter
 *   playWarning     — audio feedback fn
 *   playSuccess     — audio feedback fn
 *   fetchInitialData — Dashboard data-refetch callback
 *   setInvoiceDataForCapture — setter for off-screen InvoiceTemplate render
 *   setInvoiceTimestamps     — setter for per-voucher invoice timestamp map
 */
export function useInvoiceModal({
  items,
  setLoading,
  playWarning,
  playSuccess,
  fetchInitialData,
  setInvoiceDataForCapture,
  setInvoiceTimestamps,
  setStockSearchActiveIndex,
}) {
  // ─── Modal open/close ───────────────────────────────────────────────
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isVoucherInvoice, setIsVoucherInvoice] = useState(false);
  const [sourceVoucher, setSourceVoucher] = useState(null);

  // ─── Form data ──────────────────────────────────────────────────────
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM());
  const [currentInvoiceItem, setCurrentInvoiceItem] = useState(EMPTY_INVOICE_ITEM());
  const [invoiceErrors, setInvoiceErrors] = useState({});
  const [invoiceSearchActiveIndex, setInvoiceSearchActiveIndex] = useState(-1);

  // ─── Confirmation dialogs ────────────────────────────────────────────
  const [showInvoiceExitConfirm, setShowInvoiceExitConfirm] = useState(false);
  const [showInvoiceSaveConfirm, setShowInvoiceSaveConfirm] = useState(false);

  // ─── Refs ────────────────────────────────────────────────────────────
  const invoiceSearchInputRef = useRef(null);

  // ─── Cloudinary uploader (pure utility) ─────────────────────────────
  const uploadToCloudinary = useCallback(async (blob, data) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const client = (data.clientName || data.client || 'عام').trim();
    const subFolder = data.type === 'sale' ? 'فاتورة_مبيعات' : 'سند_إخراج';
    const folderPath = `vouchers/outward/${subFolder}/${client}/${year}/${month}`;
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'invoices');
    formData.append('folder', folderPath);
    const res = await fetch('https://api.cloudinary.com/v1_1/dvxryz62u/image/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Cloudinary Error: ${errorData.error?.message || res.statusText}`);
    }
    const uploadResult = await res.json();
    return uploadResult.secure_url;
  }, []);

  // ─── Auto-focus on open ──────────────────────────────────────────────
  useEffect(() => {
    if (isSalesModalOpen) {
      setTimeout(() => {
        if (!invoiceForm.rep) {
          document.getElementById('invoiceRepInput')?.focus();
        } else {
          invoiceSearchInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isSalesModalOpen]);

  // ─── Safety reset when modal opens without voucher ───────────────────
  useEffect(() => {
    if (isSalesModalOpen && !isVoucherInvoice) {
      setInvoiceForm(EMPTY_INVOICE_FORM());
      setCurrentInvoiceItem(EMPTY_INVOICE_ITEM());
      setInvoiceErrors({});
    }
  }, [isSalesModalOpen, isVoucherInvoice]);

  // ─── Helpers ─────────────────────────────────────────────────────────
  const hasInvoiceUnsavedData = useCallback(() =>
    invoiceForm.rep.trim() !== '' ||
    currentInvoiceItem.name.trim() !== '' ||
    invoiceForm.items.length > 0,
  [invoiceForm, currentInvoiceItem]);

  const performInvoiceReset = useCallback(() => {
    setIsSalesModalOpen(false);
    setInvoiceForm(EMPTY_INVOICE_FORM());
    setCurrentInvoiceItem(EMPTY_INVOICE_ITEM());
    setInvoiceErrors({});
    setShowInvoiceExitConfirm(false);
    setShowInvoiceSaveConfirm(false);
    setIsVoucherInvoice(false);
    setSourceVoucher(null);
    if (setStockSearchActiveIndex) setStockSearchActiveIndex(-1);
  }, [setStockSearchActiveIndex]);

  const openInvoiceModal = useCallback(() => {
    setInvoiceForm(EMPTY_INVOICE_FORM());
    setCurrentInvoiceItem(EMPTY_INVOICE_ITEM());
    setInvoiceErrors({});
    setIsVoucherInvoice(false);
    setSourceVoucher(null);
    setIsSalesModalOpen(true);
  }, []);

  const handleCloseInvoiceModal = useCallback(() => {
    if (hasInvoiceUnsavedData()) {
      setShowInvoiceExitConfirm(true);
    } else {
      performInvoiceReset();
    }
  }, [hasInvoiceUnsavedData, performInvoiceReset]);

  // ─── Item Table ───────────────────────────────────────────────────────
  const handleAddInvoiceItemToTable = useCallback(() => {
    if (!currentInvoiceItem.selectedItem) return toast.error('حدد الصنف أولاً!');
    if (!currentInvoiceItem.qty || currentInvoiceItem.qty <= 0) return toast.error('أدخل كمية صحيحة!');

    let alreadyReserved = 0;
    if (sourceVoucher) {
      const vLine = (sourceVoucher.lines || []).find(
        vl => vl.item_id === currentInvoiceItem.selectedItem.id
      );
      if (vLine) alreadyReserved = Number(vLine.qty || 0);
    }

    const requestedDelta = Number(currentInvoiceItem.qty) - alreadyReserved;
    if (requestedDelta > 0 && requestedDelta > currentInvoiceItem.selectedItem.stockQty) {
      const availableTotal = (currentInvoiceItem.selectedItem.stockQty || 0) + alreadyReserved;
      return toast.error(`الكمية غير كافية! الرصيد الإجمالي المتاح هو ${availableTotal} (شاملاً رصيد السند)`);
    }

    setInvoiceForm(prev => ({
      ...prev,
      items: [{ ...currentInvoiceItem, qty: Number(currentInvoiceItem.qty) }, ...prev.items],
    }));
    setCurrentInvoiceItem(EMPTY_INVOICE_ITEM());
    setTimeout(() => invoiceSearchInputRef.current?.focus(), 50);
  }, [currentInvoiceItem, sourceVoucher]);

  const handleEditInvoiceItem = useCallback((idx) => {
    setInvoiceForm(prev => {
      const item = prev.items[idx];
      setCurrentInvoiceItem({
        name: item.name,
        selectedItem: item.selectedItem,
        cat: item.cat,
        unit: item.unit,
        qty: item.qty,
      });
      return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
    });
    setTimeout(() => invoiceSearchInputRef.current?.focus(), 50);
  }, []);

  // ─── Validation → triggers confirmation dialog ────────────────────────
  const handleAddInvoice = useCallback((e) => {
    if (e) e.preventDefault();
    if (!invoiceForm.client.trim()) {
      setInvoiceErrors({ client: true });
      return toast.error('أدخل اسم العميل أولاً!');
    }
    if (!isVoucherInvoice && !invoiceForm.rep.trim()) {
      setInvoiceErrors({ rep: true });
      return toast.error('أدخل اسم المندوب!');
    }
    if (invoiceForm.items.length === 0) return toast.error('لا توجد أصناف في الفاتورة!');

    for (let i = 0; i < invoiceForm.items.length; i++) {
      const line = invoiceForm.items[i];
      const invItem = items.find(inv => inv.id === (line.selectedItem?.id || line.selectedItemId));
      let alreadyDeducted = 0;
      if (sourceVoucher) {
        const vLine = (sourceVoucher.lines || []).find(
          vl => vl.item_id === (line.selectedItem?.id || line.selectedItemId)
        );
        if (vLine) alreadyDeducted = Number(vLine.qty || 0);
      }
      const requestedDelta = Number(line.qty) - alreadyDeducted;
      if (!invItem || (requestedDelta > 0 && requestedDelta > invItem.stockQty)) {
        setInvoiceErrors({ [`qty-${i}`]: true });
        if (playWarning) playWarning();
        const availableTotal = (invItem?.stockQty || 0) + alreadyDeducted;
        return toast.error(
          `الكمية غير كافية لـ "${line.selectedItem?.name || line.name}"! الرصيد الإجمالي المتاح هو ${availableTotal} فقط ⛔️`
        );
      }
    }
    setInvoiceErrors({});
    setShowInvoiceSaveConfirm(true);
  }, [invoiceForm, currentInvoiceItem, isVoucherInvoice, sourceVoucher, items, playWarning]);

  // ─── The async save ───────────────────────────────────────────────────
  const performInvoiceSave = useCallback(async () => {
    setShowInvoiceSaveConfirm(false);
    try {
      setLoading(true);
      const rpcPayload = {
        request_id: `invoice-${Date.now()}`,
        mode: sourceVoucher ? 'from_voucher' : 'direct',
        actor_user_id: 'ui-invoice-modal',
        actor_user_name: 'Invoice Modal',
        client_timestamp: new Date().toISOString(),
        invoice_header: {
          date: invoiceForm.date,
          client_name: invoiceForm.client,
          rep_name: invoiceForm.rep,
          notes: invoiceForm.notes?.trim?.() || '',
        },
        lines: invoiceForm.items.map((line) => ({
          item_id: line.selectedItem?.id || line.selectedItemId,
          display_name: line.name || line.selectedItem?.name || '',
          company: line.company || line.selectedItem?.company || 'بدون شركة',
          cat: line.cat || line.selectedItem?.cat || '',
          unit: line.unit || line.selectedItem?.unit || '',
          qty: Number(line.qty || 0),
        })),
      };

      if (sourceVoucher) {
        rpcPayload.source_voucher = {
          batch_id: sourceVoucher.voucherGroupId || sourceVoucher.id,
          voucher_group_id: sourceVoucher.voucherGroupId || sourceVoucher.id,
          voucher_code: sourceVoucher.voucherCode || sourceVoucher.reference_number || '',
          voucher_type: sourceVoucher.type || (sourceVoucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج'),
          client_name: sourceVoucher.clientName || sourceVoucher.beneficiary || sourceVoucher.recipient || '',
          rep: sourceVoucher.rep || '',
        };
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc('inventory_commit_invoice', {
        payload: rpcPayload,
      });

      if (rpcError) throw rpcError;
      if (!rpcResult?.ok) throw new Error(rpcResult?.error_message || 'فشل تنفيذ عملية الفاتورة عبر RPC');

      const invoiceTimestamp = rpcResult?.ui_snapshot?.invoice_timestamp;

      if (sourceVoucher && invoiceTimestamp && setInvoiceTimestamps) {
        setInvoiceTimestamps(prev => ({ ...prev, [sourceVoucher.id]: invoiceTimestamp }));
      }

      // ─── Invoice image capture + Cloudinary upload ─────────────────
      try {
        const finalBatchId = rpcResult?.batch_id;

        const invData = {
          type: sourceVoucher ? 'voucher' : 'sale',
          clientName: sourceVoucher
            ? sourceVoucher.clientName
            : (invoiceForm.rep || invoiceForm.client),
          rep: invoiceForm.rep,
          date: invoiceForm.date,
          batchId: finalBatchId,
          voucherCode: sourceVoucher ? sourceVoucher.voucherCode : null,
          items: invoiceForm.items.map(it => ({
            name: it.name || it.selectedItem?.name,
            company: it.company || it.selectedItem?.company,
            cat: it.cat || it.selectedItem?.cat,
            qty: it.qty,
            unit: it.unit || it.selectedItem?.unit,
          })),
          notes: sourceVoucher
            ? `تحويل السند ${sourceVoucher.voucherCode} إلى فاتورة`
            : (invoiceForm.notes.trim() || 'فاتورة مبيعات'),
        };

        if (setInvoiceDataForCapture) setInvoiceDataForCapture(invData);

        // Wait for the InvoiceTemplate to signal it's rendered and ready for capture
        await new Promise(resolve => {
          const handler = () => {
            window.removeEventListener('invoice-ready', handler);
            resolve();
          };
          window.addEventListener('invoice-ready', handler);
          // Safety fallback to prevent hanging if event never fires
          setTimeout(() => {
            window.removeEventListener('invoice-ready', handler);
            resolve();
          }, 2500);
        });

        const element = document.getElementById('invoice-capture-area');
        if (element) {
          const html2canvasModule = await import('html2canvas');
          const html2canvas = html2canvasModule.default || html2canvasModule;
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const imageUrl = await uploadToCloudinary(blob, invData);
          if (imageUrl && finalBatchId) {
            rpcPayload.invoice_header.receipt_image_url = imageUrl;
            await supabase.from('transactions').update({ receipt_image: imageUrl }).eq('batch_id', finalBatchId);
          }
        }
        if (setInvoiceDataForCapture) setInvoiceDataForCapture(null);
      } catch (genErr) {
        if (import.meta.env.DEV) console.error('Invoice image generation failed:', genErr);
      }

      toast.success(`تم تأكيد الفاتورة بنجاح ✅${rpcResult?.reference_number ? ` (${rpcResult.reference_number})` : ''}`);
      if (playSuccess) playSuccess();
      performInvoiceReset();
      if (fetchInitialData) fetchInitialData();
    } catch (err) {
      if (import.meta.env.DEV) console.error('performInvoiceSave error:', err);
      toast.error(err?.message || 'حدث خطأ تقني أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [
    invoiceForm, sourceVoucher, items,
    uploadToCloudinary, setInvoiceDataForCapture, setInvoiceTimestamps,
    playSuccess, performInvoiceReset, fetchInitialData, setLoading,
  ]);

  // Bypass the unrendered confirmation modal
  useEffect(() => {
    if (showInvoiceSaveConfirm) {
      performInvoiceSave();
    }
  }, [showInvoiceSaveConfirm, performInvoiceSave]);

  // ─── Public API ───────────────────────────────────────────────────────
  return {
    // State
    isSalesModalOpen,
    isVoucherInvoice,
    sourceVoucher,
    invoiceForm,
    setInvoiceForm,
    currentInvoiceItem,
    setCurrentInvoiceItem,
    invoiceErrors,
    setInvoiceErrors,
    invoiceSearchActiveIndex,
    setInvoiceSearchActiveIndex,
    showInvoiceExitConfirm,
    setShowInvoiceExitConfirm,
    showInvoiceSaveConfirm,
    setShowInvoiceSaveConfirm,
    // Refs
    invoiceSearchInputRef,
    // Actions
    setSourceVoucher,
    setIsVoucherInvoice,
    setIsSalesModalOpen,
    openInvoiceModal,
    handleCloseInvoiceModal,
    performInvoiceReset,
    handleAddInvoiceItemToTable,
    handleEditInvoiceItem,
    handleAddInvoice,
    performInvoiceSave,
  };
}
