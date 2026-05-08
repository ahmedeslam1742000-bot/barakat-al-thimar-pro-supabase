import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { normalizeArabic } from '../lib/arabicTextUtils';

/**
 * useItemModal — All state & handlers for the Item Registration Modal.
 *
 * Dependencies injected via params:
 *   items                — current product list from Dashboard state
 *   setLoading           — shared loading flag setter
 *   playSuccess          — audio feedback fn
 *   fetchInitialData     — Dashboard data-refetch callback
 *   // Invoice bridge (to clear search on prompt cancel):
 *   setCurrentInvoiceItem  — from useInvoiceModal
 *   invoiceSearchInputRef  — from useInvoiceModal
 *   // Return bridge:
 *   returnForm            — from useReturnModal
 *   setReturnForm         — from useReturnModal
 *   returnSearchInputRef  — from useReturnModal
 */
export function useItemModal({
  items,
  setLoading,
  playSuccess,
  fetchInitialData,
  setCurrentInvoiceItem,
  invoiceSearchInputRef,
  returnForm,
  setReturnForm,
  returnSearchInputRef,
}) {
  // ─── New-Item Prompt State ────────────────────────────────────────────
  const [showNewItemPrompt, setShowNewItemPrompt] = useState(false);
  const [promptItemName, setPromptItemName] = useState('');
  const [promptSource, setPromptSource] = useState('stockIn');
  const newItemRegistrationRef = useRef(null);

  // ─── Modal Open/Close ─────────────────────────────────────────────────
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // ─── Item Form ────────────────────────────────────────────────────────
  const [itemForm, setItemForm] = useState({ name: '', company: '', cat: 'مجمدات', unit: 'كرتونة' });
  const [itemErrors, setItemErrors] = useState({});

  // ─── Batch Entry ──────────────────────────────────────────────────────
  const [sessionItems, setSessionItems] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // ─── Autocomplete ─────────────────────────────────────────────────────
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [activeNameIdx, setActiveNameIdx] = useState(-1);
  const [activeCompIdx, setActiveCompIdx] = useState(-1);

  // ─── Refs ─────────────────────────────────────────────────────────────
  const itemNameInputRef = useRef(null);
  const companyInputRef = useRef(null);
  const catSelectRef = useRef(null);
  const unitInputRef = useRef(null);
  const newCategoryInputRef = useRef(null);

  // ─── Categories & Units ───────────────────────────────────────────────
  const [categories, setCategories] = useState(['مجمدات', 'تبريد', 'بلاستيك']);
  const [units, setUnits] = useState(['كرتونة', 'حبة', 'سطل', 'شوال', 'شدة']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');

  // ─── Confirmation Dialogs ─────────────────────────────────────────────
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // ─── Auto-focus on modal open ─────────────────────────────────────────
  useEffect(() => {
    if (isItemModalOpen) {
      setTimeout(() => itemNameInputRef.current?.focus(), 100);
    }
  }, [isItemModalOpen]);

  // ─── ESC key to close modal ───────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isItemModalOpen) {
        event.preventDefault();
        handleCloseItemModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemModalOpen, itemForm.name, itemForm.company, sessionItems.length]);

  // ─── Keyboard shortcuts for confirmation overlays ─────────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isItemModalOpen) return;
      if (showSaveConfirm) {
        if (e.key === 'Enter') { e.preventDefault(); confirmRegisterBatchSave(); }
        else if (e.key === 'Escape') { e.preventDefault(); setShowSaveConfirm(false); }
        return;
      }
      if (showExitConfirm) {
        if (e.key === 'Enter') { e.preventDefault(); performModalReset(); }
        else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(false); }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); handleCloseItemModal(); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isItemModalOpen, showSaveConfirm, showExitConfirm, sessionItems]);

  // ─── Keyboard shortcuts for new-item prompt ───────────────────────────
  useEffect(() => {
    const handlePromptKeys = (event) => {
      if (!showNewItemPrompt) return;
      if (event.key === 'Enter') { event.preventDefault(); handlePromptYes(); }
      else if (event.key === 'Escape') { event.preventDefault(); handlePromptNo(); }
    };
    window.addEventListener('keydown', handlePromptKeys);
    return () => window.removeEventListener('keydown', handlePromptKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewItemPrompt, promptItemName, promptSource]);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const hasUnsavedData = useCallback(() =>
    itemForm.name.trim() !== '' || itemForm.company.trim() !== '' || sessionItems.length > 0,
  [itemForm, sessionItems]);

  const performModalReset = useCallback(() => {
    setIsItemModalOpen(false);
    setItemForm({ name: '', company: '', cat: categories[0] || 'مجمدات', unit: 'كرتونة' });
    setItemErrors({});
    setIsCustomUnit(false);
    setSessionItems([]);
    setShowExitConfirm(false);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setEditingSessionId(null);
  }, [categories]);

  const handleCloseItemModal = useCallback(() => {
    if (hasUnsavedData()) { setShowExitConfirm(true); }
    else { performModalReset(); }
  }, [hasUnsavedData, performModalReset]);

  const handleAddCategory = useCallback(() => {
    if (newCategoryName.trim()) {
      const trimmed = newCategoryName.trim();
      if (!categories.includes(trimmed)) {
        setCategories(prev => [...prev, trimmed]);
        setItemForm(prev => ({ ...prev, cat: trimmed }));
        setIsAddingCategory(false);
        setNewCategoryName('');
        toast.success(`تم إضافة القسم "${trimmed}" ✅`);
        if (playSuccess) playSuccess();
        setTimeout(() => catSelectRef.current?.focus(), 50);
      } else {
        toast.warning('هذا القسم موجود بالفعل');
      }
    }
  }, [newCategoryName, categories, playSuccess]);

  // ─── New-item prompt ──────────────────────────────────────────────────
  const triggerNewItemRegistration = useCallback((itemName, source) => {
    setPromptItemName(itemName);
    setPromptSource(source);
    setShowNewItemPrompt(true);
  }, []);

  const handlePromptYes = useCallback(() => {
    setShowNewItemPrompt(false);
    setItemForm({ name: promptItemName, company: '', cat: categories[0], unit: units[0] });
    setIsItemModalOpen(true);
    setTimeout(() => companyInputRef.current?.focus(), 150);
  }, [promptItemName, categories, units]);

  const handlePromptNo = useCallback(() => {
    setShowNewItemPrompt(false);
    if (promptSource === 'invoice') {
      if (setCurrentInvoiceItem) setCurrentInvoiceItem({ name: '', selectedItem: null, cat: '', unit: '', qty: '' });
      setTimeout(() => invoiceSearchInputRef?.current?.focus(), 50);
    } else if (promptSource === 'return') {
      if (setReturnForm && returnForm) setReturnForm({ ...returnForm, query: '', selectedItem: null, cat: '', unit: '' });
      setTimeout(() => returnSearchInputRef?.current?.focus(), 50);
    }
  }, [promptSource, setCurrentInvoiceItem, invoiceSearchInputRef, returnForm, setReturnForm, returnSearchInputRef]);

  // ─── Autocomplete inputs ──────────────────────────────────────────────
  const handleNameInput = useCallback((val) => {
    setItemForm(prev => ({ ...prev, name: val }));
    if (!val.trim()) { setNameSuggestions([]); return; }
    const filtered = [...new Set(items.map(i => i.name))]
      .filter(n => (normalizeArabic(n) || '').includes(normalizeArabic(val)))
      .slice(0, 5);
    setNameSuggestions(filtered);
    setActiveNameIdx(-1);
  }, [items]);

  const handleCompanyInput = useCallback((val) => {
    setItemForm(prev => ({ ...prev, company: val }));
    if (!val.trim()) { setCompanySuggestions([]); return; }
    const filtered = [...new Set(items.map(i => i.company || 'بدون شركة'))]
      .filter(c => (normalizeArabic(c) || '').includes(normalizeArabic(val)))
      .slice(0, 5);
    setCompanySuggestions(filtered);
    setActiveCompIdx(-1);
  }, [items]);

  const handleModalKeyDown = useCallback((e, type) => {
    if (showSaveConfirm || showExitConfirm) return;
    const isName = type === 'name';
    const isCompany = type === 'company';
    const suggestions = isName ? nameSuggestions : (isCompany ? companySuggestions : []);
    const activeIdx = isName ? activeNameIdx : (isCompany ? activeCompIdx : -1);
    const setIdx = isName ? setActiveNameIdx : (isCompany ? setActiveCompIdx : () => {});
    const setInput = isName ? handleNameInput : (isCompany ? handleCompanyInput : () => {});
    const setSuggestions = isName ? setNameSuggestions : (isCompany ? setCompanySuggestions : () => {});

    if (e.key === 'ArrowDown') {
      if (suggestions.length > 0) { e.preventDefault(); setIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : prev)); }
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length > 0) { e.preventDefault(); setIdx(prev => (prev > 0 ? prev - 1 : -1)); }
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        setInput(suggestions[activeIdx]);
        setSuggestions([]);
        if (isName) setTimeout(() => companyInputRef.current?.focus(), 50);
      } else if (isName && itemForm.name.trim()) {
        e.preventDefault(); companyInputRef.current?.focus();
      } else if (itemForm.name.trim() && itemForm.company.trim()) {
        e.preventDefault(); addToSession();
      }
    } else if (e.key === 'Tab') {
      setSuggestions([]);
    }
  }, [showSaveConfirm, showExitConfirm, nameSuggestions, companySuggestions,
      activeNameIdx, activeCompIdx, itemForm, handleNameInput, handleCompanyInput]);

  // ─── Add item to session list ─────────────────────────────────────────
  const addToSession = useCallback(() => {
    if (!itemForm.name.trim() || !itemForm.company.trim()) {
      return toast.error('يرجى إكمال البيانات المطلوبة');
    }
    const normName = normalizeArabic(itemForm.name);
    const normComp = normalizeArabic(itemForm.company);

    if (!editingSessionId) {
      if (items.some(i => normalizeArabic(i.name) === normName && normalizeArabic(i.company || 'بدون شركة') === normComp)) {
        return toast.error('هذا الصنف مسجل مسبقاً');
      }
      if (sessionItems.some(i => normalizeArabic(i.name) === normName && normalizeArabic(i.company) === normComp)) {
        return toast.error('تم إضافة الصنف للقائمة بالفعل');
      }
      setSessionItems(prev => [...prev, { ...itemForm, id: Date.now() }]);
      toast.success('تم الإضافة للقائمة ✅');
    } else {
      setSessionItems(prev => prev.map(item => item.id === editingSessionId ? { ...itemForm, id: editingSessionId } : item));
      setEditingSessionId(null);
      toast.success('تم تحديث الصنف في القائمة ✅');
    }

    setItemForm(prev => ({ ...prev, name: '', company: '' }));
    setNameSuggestions([]);
    setCompanySuggestions([]);
    setTimeout(() => itemNameInputRef.current?.focus(), 50);
  }, [itemForm, editingSessionId, items, sessionItems]);

  // ─── Batch save ───────────────────────────────────────────────────────
  const handleRegisterBatchSave = useCallback(() => {
    if (sessionItems.length === 0) return toast.error('القائمة فارغة');
    setShowSaveConfirm(true);
  }, [sessionItems]);

  const confirmRegisterBatchSave = useCallback(async () => {
    setShowSaveConfirm(false);
    if (setLoading) setLoading(true);
    try {
      // Prepare bulk data
      const insertData = sessionItems.map(item => ({
        name: item.name,
        company: item.company,
        cat: item.cat,
        unit: item.unit,
        stock_qty: 0,
        search_key: `${item.name} ${item.company}`.toLowerCase(),
      }));

      const { error } = await supabase.from('products').insert(insertData);
      
      if (error) throw error;

      toast.success('تم التسجيل واعتماد القائمة بنجاح! ✅');
      setSessionItems([]);
      setIsItemModalOpen(false);
      if (fetchInitialData) fetchInitialData();
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      if (setLoading) setLoading(false);
    }
  }, [sessionItems, setLoading, fetchInitialData]);

  const removeSessionItem = useCallback((id) => {
    setSessionItems(prev => prev.filter(item => item.id !== id));
    toast.info('تم حذف الصنف من القائمة');
  }, []);

  // ─── Public API ───────────────────────────────────────────────────────
  return {
    // Prompt state
    showNewItemPrompt, setShowNewItemPrompt,
    promptItemName, setPromptItemName,
    promptSource, setPromptSource,
    newItemRegistrationRef,
    // Modal state
    isItemModalOpen, setIsItemModalOpen,
    itemForm, setItemForm,
    itemErrors, setItemErrors,
    sessionItems, setSessionItems,
    editingSessionId, setEditingSessionId,
    isCustomUnit, setIsCustomUnit,
    // Autocomplete
    nameSuggestions, setNameSuggestions,
    companySuggestions, setCompanySuggestions,
    activeNameIdx, setActiveNameIdx,
    activeCompIdx, setActiveCompIdx,
    // Refs
    itemNameInputRef, companyInputRef, catSelectRef, unitInputRef, newCategoryInputRef,
    // Categories & Units
    categories, setCategories,
    units, setUnits,
    isAddingCategory, setIsAddingCategory,
    newCategoryName, setNewCategoryName,
    newSupplierName, setNewSupplierName,
    // Confirmation dialogs
    showExitConfirm, setShowExitConfirm,
    showSaveConfirm, setShowSaveConfirm,
    // Actions
    hasUnsavedData,
    handleCloseItemModal,
    performModalReset,
    handleAddCategory,
    triggerNewItemRegistration,
    handlePromptYes,
    handlePromptNo,
    handleNameInput,
    handleCompanyInput,
    handleModalKeyDown,
    addToSession,
    handleRegisterBatchSave,
    confirmRegisterBatchSave,
    removeSessionItem,
  };
}
