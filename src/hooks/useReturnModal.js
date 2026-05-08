import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

const EMPTY_RETURN_FORM = () => ({
  rep: '',
  date: new Date().toISOString().split('T')[0],
  query: '',
  selectedItem: null,
  qty: '',
  returnStatus: 'سليم',
  cat: '',
  returnee: '',
  unit: '',
});

/**
 * useReturnModal — All state & handlers for the Stock Return Modal.
 *
 * Dependencies injected via params so the hook stays pure and testable:
 *   items           — current product list from Dashboard state
 *   setLoading      — shared loading flag setter
 *   playWarning     — audio feedback fn
 *   playSuccess     — audio feedback fn
 *   fetchInitialData — Dashboard data-refetch callback
 *   setStockSearchActiveIndex — shared search index reset
 *   currentUser     — authenticated user object
 */
export function useReturnModal({
  items,
  setLoading,
  playWarning,
  playSuccess,
  fetchInitialData,
  setStockSearchActiveIndex,
  currentUser,
}) {
  // ─── Modal open/close ───────────────────────────────────────────────
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);

  // ─── Form data ──────────────────────────────────────────────────────
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM());
  const [returnErrors, setReturnErrors] = useState({});
  const [returnItems, setReturnItems] = useState([]);
  const [returnSearchActiveIndex, setReturnSearchActiveIndex] = useState(-1);

  // ─── Confirmation dialogs ────────────────────────────────────────────
  const [showReturnExitConfirm, setShowReturnExitConfirm] = useState(false);
  const [showReturnSaveConfirm, setShowReturnSaveConfirm] = useState(false);

  // ─── Refs ────────────────────────────────────────────────────────────
  const returnSearchInputRef = useRef(null);

  // ─── Auto-focus on open ──────────────────────────────────────────────
  useEffect(() => {
    if (isReturnsModalOpen) {
      setTimeout(() => returnSearchInputRef.current?.focus(), 100);
    }
  }, [isReturnsModalOpen]);

  // ─── Safety reset when modal opens ───────────────────────────────────
  useEffect(() => {
    if (isReturnsModalOpen) {
      setReturnForm(EMPTY_RETURN_FORM());
      setReturnItems([]);
      setReturnErrors({});
    }
  }, [isReturnsModalOpen]);

  // ─── Helpers ─────────────────────────────────────────────────────────
  const hasReturnUnsavedData = useCallback(() =>
    returnForm.returnee.trim() !== '' ||
    returnForm.rep.trim() !== '' ||
    returnForm.query.trim() !== '' ||
    returnItems.length > 0,
  [returnForm, returnItems]);

  const performReturnReset = useCallback(() => {
    setIsReturnsModalOpen(false);
    setReturnForm(EMPTY_RETURN_FORM());
    setReturnItems([]);
    setReturnErrors({});
    setShowReturnExitConfirm(false);
    setShowReturnSaveConfirm(false);
    if (setStockSearchActiveIndex) setStockSearchActiveIndex(-1);
  }, [setStockSearchActiveIndex]);

  const openReturnModal = useCallback(() => {
    setReturnForm(EMPTY_RETURN_FORM());
    setReturnItems([]);
    setReturnErrors({});
    setIsReturnsModalOpen(true);
  }, []);

  const handleCloseReturnModal = useCallback(() => {
    if (hasReturnUnsavedData()) {
      setShowReturnExitConfirm(true);
    } else {
      performReturnReset();
    }
  }, [hasReturnUnsavedData, performReturnReset]);

  // ─── Item Table ───────────────────────────────────────────────────────
  const handleAddReturnItemToTable = useCallback(() => {
    if (!returnForm.selectedItem) return toast.error('حدد الصنف أولاً!');
    if (!returnForm.cat) return toast.error('القسم غير محدد!');
    if (!returnForm.qty || returnForm.qty <= 0) return toast.error('أدخل كمية صحيحة!');

    setReturnItems(prev => [...prev, {
      name: returnForm.query,
      cat: returnForm.cat,
      unit: returnForm.unit || 'كرتونة',
      qty: Number(returnForm.qty),
      selectedItem: returnForm.selectedItem,
      returnStatus: returnForm.returnStatus || 'سليم',
    }]);
    setReturnForm(prev => ({ ...prev, query: '', selectedItem: null, cat: '', unit: '', qty: '' }));
    setTimeout(() => returnSearchInputRef.current?.focus(), 50);
  }, [returnForm]);

  const handleEditReturnItem = useCallback((idx) => {
    setReturnItems(prev => {
      const item = prev[idx];
      setReturnForm(f => ({
        ...f,
        query: item.name,
        selectedItem: item.selectedItem,
        cat: item.cat,
        unit: item.unit,
        qty: item.qty,
        returnStatus: item.returnStatus,
      }));
      return prev.filter((_, i) => i !== idx);
    });
    setTimeout(() => returnSearchInputRef.current?.focus(), 50);
  }, []);

  // ─── Validation → triggers confirmation dialog ────────────────────────
  const handleAddReturn = useCallback((e) => {
    if (e) e.preventDefault();
    if (!returnForm.returnee.trim()) {
      setReturnErrors({ returnee: true });
      return toast.error('يرجى تحديد الشخص أو الجهة التي قامت بالترجيع');
    }
    if (!returnForm.rep?.trim()) {
      setReturnErrors({ rep: true });
      return toast.error('يرجى تحديد المندوب المستلم أولاً');
    }
    if (returnItems.length === 0) return toast.error('لا توجد أصناف مرتجعة!');
    setReturnErrors({});
    setShowReturnSaveConfirm(true);
  }, [returnForm, returnItems]);

  // ─── The async save ───────────────────────────────────────────────────
  const performReturnSave = useCallback(async () => {
    setShowReturnSaveConfirm(false);
    setLoading(true);
    try {
      const batchId = Date.now().toString();
      const now = new Date().toISOString();

      // Update stock for undamaged items
      const additions = {};
      returnItems.forEach(it => {
        if (it.returnStatus === 'سليم') {
          if (!additions[it.selectedItem.id]) additions[it.selectedItem.id] = { id: it.selectedItem.id, qty: 0 };
          additions[it.selectedItem.id].qty += Number(it.qty);
        }
      });
      for (const [id, payload] of Object.entries(additions)) {
        const currentItem = items.find(i => i.id === id);
        if (currentItem) {
          await supabase.from('products').update({ stock_qty: currentItem.stockQty + payload.qty }).eq('id', id);
        }
      }

      // Insert transactions
      const txsToInsert = returnItems.map(it => ({
        item: it.name,
        type: 'return',
        qty: Number(it.qty),
        date: returnForm.date || new Date().toISOString().split('T')[0],
        timestamp: now,
        status: it.returnStatus === 'سليم' ? 'مكتمل' : 'مرتجع تالف',
        loc: returnForm.returnee,
        rep: returnForm.rep,
        beneficiary: returnForm.returnee,
        user_id: null,
        batch_id: batchId,
        item_id: it.selectedItem?.id,
      }));
      await supabase.from('transactions').insert(txsToInsert);

      // Log damaged items to discrepancies table
      const damagedItems = returnItems.filter(it => it.returnStatus === 'تالف');
      if (damagedItems.length > 0) {
        const discrepanciesToInsert = damagedItems.map(it => ({
          item_id: it.selectedItem?.id || null,
          item_name: it.name || it.selectedItem?.name || '',
          expected_qty: 0,
          actual_qty: 0,
          diff: Number(it.qty),
          note: `مرتجع تالف - من: ${returnForm.returnee}${returnForm.rep ? ` / مندوب: ${returnForm.rep}` : ''}`,
          status: 'pending',
          created_at: now,
        }));
        await supabase.from('discrepancies').insert(discrepanciesToInsert);
        toast.warning(`تم تسجيل ${damagedItems.length} صنف في قسم التوالف ❤️`);
      }

      toast.success('تم تسجيل المرتجع بنجاح ✅');
      if (playSuccess) playSuccess();
      performReturnReset();
      if (fetchInitialData) fetchInitialData();
    } catch (err) {
      if (import.meta.env.DEV) console.error('performReturnSave error:', err);
      toast.error('حدث خطأ أثناء حفظ المرتجع.');
    } finally {
      setLoading(false);
    }
  }, [returnForm, returnItems, items, playSuccess, performReturnReset, fetchInitialData, setLoading]);

  // ─── Public API ───────────────────────────────────────────────────────
  return {
    // State
    isReturnsModalOpen,
    setIsReturnsModalOpen,
    returnForm,
    setReturnForm,
    returnErrors,
    setReturnErrors,
    returnItems,
    setReturnItems,
    returnSearchActiveIndex,
    setReturnSearchActiveIndex,
    showReturnExitConfirm,
    setShowReturnExitConfirm,
    showReturnSaveConfirm,
    setShowReturnSaveConfirm,
    // Refs
    returnSearchInputRef,
    // Actions
    openReturnModal,
    handleCloseReturnModal,
    performReturnReset,
    handleAddReturnItemToTable,
    handleEditReturnItem,
    handleAddReturn,
    performReturnSave,
  };
}
