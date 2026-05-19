import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getItemName, getCompany, getCategory, getUnit, formatItemDisplay } from '../../lib/itemFields';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { normalizeArabic } from '../../lib/arabicTextUtils';
import { useDebounce } from '../../hooks/useDebounce';
import localforage from 'localforage';
import { useAudio } from '../../contexts/AudioContext';
import SmartDateInput from '../../components/SmartDateInput';
import ModalWrapper from '../../components/common/ModalWrapper';

// Modular Components
import VoucherSidePanel from './VoucherSidePanel';
import VoucherEditor from './VoucherEditor';
import VoucherModals from './VoucherModals';
import { VoucherReceiptTemplate, BlankVoucherTemplate } from './VoucherTemplates';

/* ═══════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS & CONFIG
═══════════════════════════════════════════════════════════════════ */

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const cleanNote = (note) => {
  if (!note) return '';
  return note
    .replace(/<!--HIST:.*?-->/g, '')
    .replace(/\[تعديل بعد الفوترة\]/g, '')
    .replace(/\[تم إصدار الفاتورة:.*?\]/g, '')
    .trim();
};

const KIND_CONFIG = {
  outward: {
    txType: 'سند إخراج',
    codePrefix: '',
    counterKey: 'out',
    pageTitle: 'سند إخراج بضاعة',
    pageSubtitle: 'إثبات خروج بضاعة (عهدة مندوب) بدون فاتورة مبيعات.',
    modalTitle: 'سند إخراج بضاعة',
    accent: 'blue',
    Icon: Upload,
    sessionFields: [{ key: 'rep', label: 'اسم المستفيد', required: true, placeholder: 'مثال: أحمد محمد' }],
    pdfTitle: 'إيصال عهدة — سند إخراج',
  },
};

function accentTheme(accent) {
  const isRose = accent === 'rose';
  const isEmerald = accent === 'emerald';
  
  return {
    ring: isRose ? 'focus:ring-rose-500/20 focus:border-rose-500' : (isEmerald ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-blue-500/20 focus:border-blue-500'),
    gradient: isRose ? 'from-rose-500 to-rose-700' : (isEmerald ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-600'),
    shadow: isRose ? 'shadow-rose-500/25' : (isEmerald ? 'shadow-emerald-500/25' : 'shadow-blue-500/25'),
    qtyBadge: isEmerald ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700',
    pdfRgb: isRose ? [244, 63, 94] : (isEmerald ? [16, 185, 129] : [59, 130, 246]),
  };
}

const LabelClass = 'block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 mr-1 uppercase tracking-wide';

function emptySession(kind) {
  const base = { date: formatDate(new Date()), voucher_no: '', attachment: null };
  return { ...base, rep: '', line_note: '', outwardType: 'sale' };
}

async function allocateVoucherCode(kind) {
  try {
    const cfg = KIND_CONFIG[kind];
    if (!cfg) return `${Math.floor(Math.random() * 900) + 100}`;
    
    const year = new Date().getFullYear();
    const key = `${cfg.counterKey}${year}`;
    
    const { data, error } = await supabase.rpc('allocate_voucher_code', {
      p_prefix: cfg.codePrefix || '',
      p_key: key
    });
    
    if (error) throw error;
    return data || '';
  } catch (err) {
    console.error('Voucher code allocation error:', err);
    return '';
  }
}

const uploadToCloudinary = async (blob, voucherCode) => {
  try {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'barakat_docs'); // Assuming this preset exists
    formData.append('public_id', `voucher_${voucherCode}_${Date.now()}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/dwp8vunp5/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return null;
  }
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN WORKSPACE COMPONENT
═══════════════════════════════════════════════════════════════════ */

export default function VoucherWorkspace({ kind }) {
  const cfg = KIND_CONFIG[kind];
  const theme = accentTheme(cfg.accent);
  const { playSuccess, playWarning } = useAudio();
  const { currentUser, isViewer } = useAuth();
  const { settings } = useSettings();
  const { items, dbTransactionsList: transactions, fetchInitialData } = useData();

  // --- STATE ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(() => emptySession(kind));
  const [modalDrafts, setModalDrafts] = useState([]);
  const [searchNameText, setSearchNameText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftLineNote, setDraftLineNote] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);
  const itemNameRef = useRef(null);
  const receiptRef = useRef(null);
  const blankRef = useRef(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingLineIds, setEditingLineIds] = useState([]);
  const [preservedVoucherCode, setPreservedVoucherCode] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [editForm, setEditForm] = useState({ qty: '', date: '', lineNote: '' });
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  const [exportJob, setExportJob] = useState(null);
  const isExporting = !!exportJob;
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [groupToReset, setGroupToReset] = useState(null);
  const [originalHistoryTags, setOriginalHistoryTags] = useState('');

  // --- COMPUTED ---
  const voucherTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type === cfg.txType) return true;
      // Also match legacy types if necessary
      if (kind === 'outward' && t.type === 'outward') return true;
      if (kind === 'in' && t.type === 'in') return true;
      return false;
    });
  }, [transactions, cfg.txType, kind]);

  const voucherGroups = useMemo(() => {
    const map = new Map();
    voucherTxs.forEach((t) => {
      const gid = t.batch_id || t.reference_number || `legacy_${t.id}`;
      if (!map.has(gid)) map.set(gid, { groupId: gid, lines: [] });
      map.get(gid).lines.push(t);
    });
    return [...map.values()].map((g) => {
      g.lines.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const repLine = g.lines.find(l => !l.is_summary) || g.lines[0];
      return {
        ...g,
        date: repLine?.date || formatDate(repLine?.timestamp),
        rep: repLine?.rep,
        line_note: repLine?.notes || '',
        attachment: repLine?.attachment || null,
        voucherCode: (repLine?.reference_number || '').replace(/^[A-Z]+-\d+-/g, '').replace(/^[A-Z]+-/g, ''),
        lineCount: g.lines.length,
        isTransfer: (repLine?.notes || '').includes('[نوع: تحويل مخزني]'),
        lastTs: Math.max(...g.lines.map(l => new Date(l.timestamp).getTime() || 0))
      };
    }).sort((a, b) => b.lastTs - a.lastTs);
  }, [voucherTxs]);

  const debouncedSearch = useDebounce(filterSearch, 300);
  const filteredGroups = useMemo(() => {
    return voucherGroups.filter((g) => {
      if (debouncedSearch.trim()) {
        const q = normalizeArabic(debouncedSearch);
        const match = normalizeArabic(g.rep || '').includes(q) || 
                      normalizeArabic(g.voucherCode || '').includes(q) || 
                      g.lines.some(l => normalizeArabic(l.item || '').includes(q));
        if (!match) return false;
      }
      if (filterDateFrom && g.date < filterDateFrom) return false;
      if (filterDateTo && g.date > filterDateTo) return false;
      return true;
    });
  }, [voucherGroups, debouncedSearch, filterDateFrom, filterDateTo]);

  // --- HANDLERS ---
  const openModal = async () => {
    try {
      setLoading(true);
      // We no longer auto-allocate to avoid accidental saves.
      // The user can fill it manually.
      setSession(s => ({ ...s, voucher_no: '' }));
      setIsAddModalOpen(true);
    } catch (err) {
      console.error('openModal error:', err);
      toast.error('حدث خطأ أثناء فتح النموذج');
    } finally {
      setLoading(false);
    }
  };

  const clearRow = useCallback(() => {
    setSelectedItem(null);
    setSearchNameText('');
    setDraftQty('');
    setDraftUnit('');
    setDraftLineNote('');
    setTimeout(() => itemNameRef.current?.focus(), 50);
  }, []);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchNameText(formatItemDisplay(getItemName(item), getCompany(item)));
    setDraftUnit(getUnit(item) || 'كرتونة');
    setTimeout(() => document.getElementById(`voucher-qty-${kind}`)?.focus(), 50);
  };

  const pushDraft = () => {
    if (!selectedItem || !draftQty || Number(draftQty) <= 0) return;
    const row = {
      draftId: editingDraftId || crypto.randomUUID(),
      itemId: selectedItem.id,
      item: getItemName(selectedItem),
      company: getCompany(selectedItem),
      cat: getCategory(selectedItem),
      unit: draftUnit || getUnit(selectedItem),
      qty: Number(draftQty),
      lineNote: draftLineNote.trim(),
    };
    if (editingDraftId) {
      setModalDrafts(p => p.map(x => x.draftId === editingDraftId ? row : x));
      setEditingDraftId(null);
    } else {
      setModalDrafts(p => [row, ...p]);
    }
    playSuccess();
    clearRow();
  };

  const handleEditDraft = (d) => {
    setEditingDraftId(d.draftId);
    setSelectedItem(items.find(i => i.id === d.itemId));
    setSearchNameText(formatItemDisplay(d.item, d.company));
    setDraftQty(String(d.qty));
    setDraftUnit(d.unit);
    setTimeout(() => document.getElementById(`voucher-qty-${kind}`)?.focus(), 50);
  };

  const handleRemoveDraft = (id) => {
    setModalDrafts(p => p.filter(x => x.draftId !== id));
    if (editingDraftId === id) {
      setEditingDraftId(null);
      clearRow();
    }
  };

  const triggerSave = (e) => { e.preventDefault(); setIsConfirmSaveOpen(true); };

  const executeSave = async () => {
    setIsConfirmSaveOpen(false);
    setLoading(true);
    try {
      const batchId = editingGroupId || crypto.randomUUID();
      const refNo = preservedVoucherCode || session.voucher_no;

      // ─── 0. Create History Tag if Editing ───
      let finalNote = session.line_note;
      if (editingGroupId) {
        const groupToEdit = voucherGroups.find(g => g.groupId === editingGroupId);
        if (groupToEdit) {
          const historyEntry = {
            at: new Date().toISOString(),
            by: currentUser.name || currentUser.id || 'User',
            date: groupToEdit.date || groupToEdit.lines?.[0]?.date || null,
            clientName: groupToEdit.rep || groupToEdit.supplier || '—',
            voucherCode: groupToEdit.voucherCode,
            notes: cleanNote(groupToEdit.line_note),
            lines: groupToEdit.lines.filter(l => !l.is_summary).map(l => ({ 
              item: l.item, 
              qty: l.qty,
              company: l.company,
              unit: l.unit
            }))
          };
          const newTag = `<!--HIST:${JSON.stringify(historyEntry)}-->`;
          // Combine original tags + new tag
          finalNote = `${session.line_note} ${originalHistoryTags} ${newTag}`.trim();
        }
      }

      // ─── 1. Single Network Request via RPC (Transaction) ───
      const rpcPayload = {
        mode: kind, // 'outward' or 'in'
        type: cfg.txType,
        batch_id: batchId,
        reference_number: refNo,
        date: session.date,
        supplier: kind === 'in' ? session.supplier : null,
        rep: kind === 'outward' ? session.rep : null,
        notes: finalNote,
        delete_line_ids: editingGroupId && editingLineIds.length > 0 ? editingLineIds : [],
        lines: modalDrafts.map(d => ({
          item_id: d.itemId,
          qty: d.qty
        }))
      };

      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_voucher_transaction', {
        payload: rpcPayload
      });

      if (rpcError) throw rpcError;
      if (!rpcResult?.ok) throw new Error(rpcResult?.error_message || 'حدث خطأ غير معروف في المعاملة');

      toast.success(editingGroupId ? 'تم تحديث السند بنجاح ✅' : 'تم حفظ السند بنجاح ✅');
      closeAddModal();
      
      if (fetchInitialData) fetchInitialData();
      
      {
          // Force a refresh of the list
          setLoading(true);
          setTimeout(() => setLoading(false), 500);
      }
    } catch (err) {
      console.error('executeSave error:', err);
      toast.error('فشل في حفظ السند: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const openEditGroup = (group) => {
    setEditingGroupId(group.groupId);
    setEditingLineIds(group.lines.map(l => l.id));
    setPreservedVoucherCode(group.voucherCode);
    setSession({
      rep: group.rep || '',
      date: group.date,
      voucher_no: group.voucherCode,
      line_note: cleanNote(group.line_note)
    });
    // Extract and preserve existing history tags
    const tagsMatch = (group.line_note || '').match(/<!--HIST:.*?-->/g);
    setOriginalHistoryTags(tagsMatch ? tagsMatch.join(' ') : '');
    
    setModalDrafts(group.lines.filter(l => !l.is_summary && l.item_id).map(l => ({
      draftId: l.id,
      itemId: l.item_id,
      item: l.item,
      qty: l.qty,
      unit: l.unit,
      cat: l.cat
    })));
    setIsAddModalOpen(true);
  };

  const openDeleteGroup = (group) => { setGroupToDelete(group); setIsDeleteGroupOpen(true); };

  const handleDeleteGroupSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('transactions').delete().eq('batch_id', groupToDelete.groupId);
    if (error) toast.error(error.message);
    else toast.success('تم حذف السند بنجاح');
    setIsDeleteGroupOpen(false);
    setLoading(false);
  };

  const onResetStatus = (group) => { setGroupToReset(group); setIsResetConfirmOpen(true); };
  const handleResetStatusSubmit = async () => {
    setIsResetConfirmOpen(false);
    if (!groupToReset) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'قيد الانتظار' })
        .eq('batch_id', groupToReset.groupId);
        
      if (error) throw error;
      toast.success('تم فك قفل السند بنجاح ✅');
    } catch (err) {
      toast.error('حدث خطأ أثناء فك القفل: ' + err.message);
    } finally {
      setGroupToReset(null);
      setLoading(false);
    }
  };

  const openEdit = (line) => { setSelectedTx(line); setEditForm({ qty: line.qty, date: line.date, lineNote: line.notes }); setIsEditOpen(true); };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('transactions').update({ qty: editForm.qty, notes: editForm.lineNote }).eq('id', selectedTx.id);
    if (error) toast.error(error.message);
    else toast.success('تم التحديث');
    setIsEditOpen(false);
    setLoading(false);
  };

  const openDelete = (line) => { setSelectedTx(line); setIsDeleteOpen(true); };
  const handleDeleteSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('transactions').delete().eq('id', selectedTx.id);
    if (error) toast.error(error.message);
    else toast.success('تم الحذف');
    setIsDeleteOpen(false);
    setLoading(false);
  };

  const triggerCloseAddModal = () => (modalDrafts.length > 0 ? setIsConfirmCloseOpen(true) : closeAddModal());
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingGroupId(null);
    setModalDrafts([]);
    setSession(emptySession(kind));
    setOriginalHistoryTags('');
    setIsConfirmCloseOpen(false);
  };

  const resetFilters = () => { setFilterSearch(''); setFilterDateFrom(''); setFilterDateTo(''); };
  const triggerExport = (group, mode) => setExportJob({ group, mode });

  // ─── Native Browser Print ──────────────────────────────────────────
  useEffect(() => {
    if (!exportJob || exportJob.mode === 'silent-capture') return;
    // Give the template time to render, then trigger native print
    const timer = setTimeout(() => {
      window.print();
      toast.success('تم إرسال السند للطابعة 🖨️');
      setExportJob(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [exportJob]);

  const itemSuggestions = useMemo(() => {
    if (!searchNameText || selectedItem) return [];
    const q = normalizeArabic(searchNameText);
    return items.filter(i => normalizeArabic(getItemName(i)).includes(q)).slice(0, 10);
  }, [items, searchNameText, selectedItem]);

  // --- RENDER ---
  const partyLabel = kind === 'in' ? 'المورد' : 'المستفيد';
  const partyValue = kind === 'in' ? session.supplier : session.rep;
  const userName = currentUser?.email;
  const accentHex = theme.pdfRgb ? `rgb(${theme.pdfRgb.join(',')})` : '#3b82f6';
  const accentLight = theme.pdfRgb ? `rgba(${theme.pdfRgb.join(',')}, 0.1)` : 'rgba(59, 130, 246, 0.1)';
  const accentDark = theme.pdfRgb ? `rgb(${theme.pdfRgb.map(c => Math.max(0, c - 40)).join(',')})` : '#1d4ed8';

  const paddedLines = useMemo(() => {
    if (!exportJob) return [];
    const lines = exportJob.group.lines.filter(l => !l.is_summary);
    return [...lines, ...Array(Math.max(0, 15 - lines.length)).fill(null)];
  }, [exportJob]);

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-6 animate-in fade-in duration-500 font-readex" dir="rtl">
      
      {/* Off-screen Templates — visible only during print */}
      <div ref={receiptRef}
        className="hidden print:block"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px', background: '#fff' }}
      >
        {exportJob && exportJob.mode !== 'blank-png' && (
          <VoucherReceiptTemplate kind={kind} group={exportJob.group} paddedLines={paddedLines} accentHex={accentHex} accentLight={accentLight} accentDark={accentDark} partyLabel={partyLabel} partyValue={partyValue} userName={userName} settings={settings} />
        )}
      </div>
      <div ref={blankRef}
        className="hidden print:block"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px', background: '#fff' }}
      >
        {exportJob && exportJob.mode === 'blank-png' && (
          <BlankVoucherTemplate kind={kind} accentHex={accentHex} accentLight={accentLight} accentDark={accentDark} partyLabel={partyLabel} settings={settings} />
        )}
      </div>

      <VoucherSidePanel
        kind={kind} cfg={cfg} theme={theme} settings={settings}
        filterSearch={filterSearch} setFilterSearch={setFilterSearch}
        filterDateFrom={filterDateFrom} setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo} setFilterDateTo={setFilterDateTo}
        isDateFilterOpen={isDateFilterOpen} setIsDateFilterOpen={setIsDateFilterOpen}
        resetFilters={resetFilters}
        filteredGroups={filteredGroups}
        expandedGroupId={expandedGroupId} setExpandedGroupId={setExpandedGroupId}
        openModal={openModal}
        triggerExport={triggerExport}
        openEditGroup={openEditGroup}
        openDeleteGroup={openDeleteGroup}
        onResetStatus={onResetStatus}
        openEdit={openEdit}
        openDelete={openDelete}
        isViewer={isViewer}
        isExporting={isExporting}
      />

      <ModalWrapper
        title={editingGroupId ? `تعديل السند ${preservedVoucherCode || ''}` : cfg.modalTitle}
        isOpen={isAddModalOpen}
        onClose={triggerCloseAddModal}
        onSubmit={triggerSave}
        maxWidth="max-w-6xl"
        submitLabel={editingGroupId ? `حفظ التعديلات (${modalDrafts.length} سطر)` : `حفظ السند (${modalDrafts.length} سطر)`}
        loading={loading}
        disableSubmit={modalDrafts.length === 0}
        accent={cfg.accent}
      >
        <VoucherEditor
          kind={kind} cfg={cfg} theme={theme}
          session={session} setSession={setSession}
          selectedItem={selectedItem} setSelectedItem={setSelectedItem}
          searchNameText={searchNameText} setSearchNameText={setSearchNameText}
          draftQty={draftQty} setDraftQty={setDraftQty}
          draftUnit={draftUnit} setDraftUnit={setDraftUnit}
          modalDrafts={modalDrafts} setModalDrafts={setModalDrafts}
          editingDraftId={editingDraftId} setEditingDraftId={setEditingDraftId}
          itemSuggestions={itemSuggestions}
          searchIdx={searchIdx} setSearchIdx={setSearchIdx}
          itemNameRef={itemNameRef}
          handleSelect={handleSelect}
          clearRow={clearRow}
          pushDraft={pushDraft}
          handleEditDraft={handleEditDraft}
          handleRemoveDraft={handleRemoveDraft}
          toast={toast}
        />
      </ModalWrapper>

      <ModalWrapper
        title="تعديل سطر السند"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        maxWidth="max-w-md"
        height="h-auto"
        submitLabel="حفظ التغييرات"
        loading={loading}
        accent={cfg.accent}
      >
        <div className="space-y-5">
          <div>
            <label className={LabelClass}>الكمية</label>
            <input type="number" min="1" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-lg font-black rounded-xl px-4 py-3 text-center outline-none focus:ring-4 focus:ring-primary/10" value={editForm.qty} onChange={(e) => setEditForm(f => ({ ...f, qty: e.target.value }))} required />
          </div>
          <div>
            <label className={LabelClass}>التاريخ</label>
            <SmartDateInput 
              value={editForm.date} 
              onChange={(val) => setEditForm(f => ({ ...f, date: val }))} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black rounded-xl px-4 py-3 pr-11 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              required 
            />
          </div>
        </div>
      </ModalWrapper>

      <VoucherModals
        kind={kind} cfg={cfg} loading={loading}
        isDeleteOpen={isDeleteOpen} setIsDeleteOpen={setIsDeleteOpen} handleDeleteSubmit={handleDeleteSubmit}
        isDeleteGroupOpen={isDeleteGroupOpen} setIsDeleteGroupOpen={setIsDeleteGroupOpen} groupToDelete={groupToDelete} setGroupToDelete={setGroupToDelete} handleDeleteGroupSubmit={handleDeleteGroupSubmit}
        isResetConfirmOpen={isResetConfirmOpen} setIsResetConfirmOpen={setIsResetConfirmOpen} handleResetStatusSubmit={handleResetStatusSubmit}
        isConfirmCloseOpen={isConfirmCloseOpen} setIsConfirmCloseOpen={setIsConfirmCloseOpen} closeAddModal={closeAddModal}
        isConfirmSaveOpen={isConfirmSaveOpen} setIsConfirmSaveOpen={setIsConfirmSaveOpen} executeSave={executeSave}
        expandedGroupId={expandedGroupId} setExpandedGroupId={setExpandedGroupId} voucherGroups={voucherGroups}
      />
    </div>
  );
}
