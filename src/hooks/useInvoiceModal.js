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
      const now = new Date();
      const invoiceTimestamp = now.toLocaleString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      let txsToInsert = [];

      if (sourceVoucher) {
        const batchId = sourceVoucher.voucherGroupId || sourceVoucher.id;
        const voucherLines = sourceVoucher.lines || [];
        const invoiceLines = invoiceForm.items;

        // Update status for the entire batch
        const { error: batchUpdateErr } = await supabase
          .from('transactions')
          .update({ status: 'مفوتر' })
          .eq('batch_id', batchId);

        if (batchUpdateErr) {
          for (const vLine of voucherLines) {
            await supabase.from('transactions')
              .update({ status: 'مفوتر', notes: vLine.notes ? `${vLine.notes} [تم إصدار الفاتورة]` : '[تم إصدار الفاتورة]' })
              .eq('id', vLine.id);
          }
        }

        // Verify write
        const { data: verifyData } = await supabase
          .from('transactions').select('id, status').eq('batch_id', batchId).limit(5);
        const verified = verifyData && verifyData.some(v => v.status === 'مفوتر');

        if (!verified) {
          const vCode = sourceVoucher.voucherCode || sourceVoucher.reference_number;
          if (vCode) {
            await supabase.from('transactions').update({ status: 'مفوتر' }).eq('reference_number', vCode);
          }
          for (const vLine of voucherLines) {
            await supabase.from('transactions')
              .update({ status: 'مفوتر', notes: vLine.notes ? `${vLine.notes} [تم إصدار الفاتورة]` : '[تم إصدار الفاتورة]' })
              .eq('id', vLine.id);
          }
        }

        // Stock adjustments for qty changes
        for (const vLine of voucherLines) {
          const matchingInvItem = invoiceLines.find(
            it => it.selectedItem?.id === vLine.item_id || it.selectedItemId === vLine.item_id
          );
          if (matchingInvItem) {
            const diff = Number(matchingInvItem.qty) - Number(vLine.qty);
            if (diff !== 0) {
              const currentItem = items.find(i => i.id === vLine.item_id);
              if (currentItem) {
                await supabase.from('products').update({ stock_qty: (currentItem.stockQty || 0) - diff }).eq('id', vLine.item_id);
              }
              await supabase.from('transactions').update({ qty: Number(matchingInvItem.qty) }).eq('id', vLine.id);
            }
          } else {
            // Item removed in review — return stock
            const currentItem = items.find(i => i.id === vLine.item_id);
            if (currentItem) {
              await supabase.from('products').update({ stock_qty: (currentItem.stockQty || 0) + Number(vLine.qty) }).eq('id', vLine.item_id);
            }
          }
        }

        // New items added in review
        for (const invItem of invoiceLines) {
          const itemId = invItem.selectedItem?.id || invItem.selectedItemId;
          if (!itemId || voucherLines.some(vl => vl.item_id === itemId)) continue;
          const currentItem = items.find(i => i.id === itemId);
          if (currentItem) {
            await supabase.from('products').update({ stock_qty: (currentItem.stockQty || 0) - Number(invItem.qty) }).eq('id', itemId);
          }
          await supabase.from('transactions').insert({
            item: invItem.name || invItem.selectedItem?.name,
            item_id: itemId,
            type: sourceVoucher.type || 'outward',
            qty: Number(invItem.qty),
            batch_id: batchId,
            reference_number: sourceVoucher.voucherCode,
            beneficiary: sourceVoucher.clientName,
            rep: invoiceForm.rep || sourceVoucher.rep || sourceVoucher.clientName,
            timestamp: new Date().toISOString(),
            status: 'مفوتر',
            notes: '[إضافة مراجعة]',
          });
        }

        if (setInvoiceTimestamps) setInvoiceTimestamps(prev => ({ ...prev, [sourceVoucher.id]: invoiceTimestamp }));

      } else {
        // ─── Direct Sales Invoice ─────────────────────────────────────
        const batchId = `INV-${Date.now()}`;
        for (const line of invoiceForm.items) {
          const itemId = line.selectedItem?.id || line.selectedItemId;
          if (!itemId) continue;
          const { data: latestProd } = await supabase.from('products').select('stock_qty').eq('id', itemId).single();
          const currentStock = latestProd?.stock_qty || 0;
          await supabase.from('products').update({ stock_qty: currentStock - Number(line.qty) }).eq('id', itemId);
          txsToInsert.push({
            item: line.name || line.selectedItem?.name,
            item_id: itemId,
            type: 'Issue',
            qty: Number(line.qty),
            date: invoiceForm.date,
            timestamp: new Date().toISOString(),
            status: 'مفوتر',
            beneficiary: invoiceForm.client,
            rep: invoiceForm.rep,
            batch_id: batchId,
            reference_number: batchId,
            notes: `${invoiceForm.notes.trim()} [نوع: صادر]`,
          });
        }
        if (txsToInsert.length > 0) {
          const { error: insErr } = await supabase.from('transactions').insert(txsToInsert);
          if (insErr) throw insErr;
        }
      }

      // ─── Invoice image capture + Cloudinary upload ─────────────────
      try {
        const finalBatchId = sourceVoucher
          ? (sourceVoucher.voucherGroupId || sourceVoucher.id)
          : txsToInsert[0]?.batch_id;

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
        await new Promise(r => setTimeout(r, 800));

        const element = document.getElementById('invoice-capture-area');
        if (element) {
          const html2canvasModule = await import('html2canvas');
          const html2canvas = html2canvasModule.default || html2canvasModule;
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const imageUrl = await uploadToCloudinary(blob, invData);
          if (imageUrl && finalBatchId) {
            await supabase.from('transactions').update({ receipt_image: imageUrl }).eq('batch_id', finalBatchId);
          }
        }
        if (setInvoiceDataForCapture) setInvoiceDataForCapture(null);
      } catch (genErr) {
        if (import.meta.env.DEV) console.error('Invoice image generation failed:', genErr);
      }

      toast.success('تم تأكيد الفاتورة بنجاح ✅');
      if (playSuccess) playSuccess();
      performInvoiceReset();
      if (fetchInitialData) fetchInitialData();
    } catch (err) {
      if (import.meta.env.DEV) console.error('performInvoiceSave error:', err);
      toast.error('حدث خطأ تقني أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [
    invoiceForm, sourceVoucher, items,
    uploadToCloudinary, setInvoiceDataForCapture, setInvoiceTimestamps,
    playSuccess, performInvoiceReset, fetchInitialData, setLoading,
  ]);

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
