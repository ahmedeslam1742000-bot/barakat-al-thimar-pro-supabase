import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, CalendarRange, Info, Truck, Package, 
  UploadCloud, CheckCircle, X, Search, Plus, 
  RefreshCw, Trash2, Pencil, Box
} from 'lucide-react';
import { getItemName, getCompany, getCategory, getUnit } from '../../lib/itemFields';
import SmartDateInput from '../../components/SmartDateInput';

/* ═══════════════════════════════════════════════════════════════════
   VoucherEditor Component
   Handles:
   - Voucher Session Header (Recipient, Date, No, Notes, Attachment)
   - Real-time Item Search & Selection
   - Quantity & Unit entry
   - Draft List (Current items in the voucher)
═══════════════════════════════════════════════════════════════════ */

export default function VoucherEditor({
  kind, cfg, theme,
  session, setSession,
  selectedItem, setSelectedItem,
  searchNameText, setSearchNameText,
  draftQty, setDraftQty,
  draftUnit, setDraftUnit,
  modalDrafts, setModalDrafts,
  editingDraftId, setEditingDraftId,
  itemSuggestions,
  searchIdx, setSearchIdx,
  itemNameRef,
  handleSelect,
  clearRow,
  pushDraft,
  handleEditDraft,
  handleRemoveDraft,
  toast
}) {
  return (
    <div className="flex flex-col gap-4 font-readex">
      {/* ─── ULTRA-COMPACT SESSION HEADER (Grid 12) ─── */}
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
        
        {/* Supplier / Rep Name */}
        <div className="md:col-span-3 space-y-1">
          <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1">
            <User size={10} className="text-primary" /> {cfg.sessionFields[0].label} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[11px] font-black rounded-full px-4 py-2 outline-none focus:border-primary/50 transition-all text-slate-700 dark:text-white shadow-sm"
            placeholder={cfg.sessionFields[0].placeholder}
            value={session[cfg.sessionFields[0].key] || ''}
            onChange={(e) => setSession((s) => ({ ...s, [cfg.sessionFields[0].key]: e.target.value }))}
          />
        </div>

        {/* Voucher Date */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1">
            <CalendarRange size={10} className="text-primary" /> تاريخ السند <span className="text-rose-500">*</span>
          </label>
          <SmartDateInput
            value={session.date}
            onChange={(val) => setSession((s) => ({ ...s, date: val }))}
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[11px] font-black rounded-full px-4 py-2 pr-10 outline-none focus:border-primary/50 transition-all text-slate-700 dark:text-white shadow-sm"
          />
        </div>

        {/* Voucher Number */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1">
            رقم السند <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[11px] font-black rounded-full px-4 py-2 outline-none focus:border-primary/50 transition-all text-slate-700 dark:text-white shadow-sm"
            placeholder="رقم السند..."
            value={session.voucher_no || ''}
            onChange={(e) => setSession((s) => ({ ...s, voucher_no: e.target.value }))}
          />
        </div>

        {/* Notes / Customer / Rep */}
        <div className={`${kind === 'outward' ? 'md:col-span-3' : 'md:col-span-4'} space-y-1`}>
          <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Info size={10} className="text-primary" /> ملاحظات إضافية للسند
          </label>
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[11px] font-black rounded-full px-4 py-2 outline-none focus:border-primary/50 transition-all text-slate-700 dark:text-white shadow-sm"
            placeholder="تفاصيل إضافية..."
            value={session.line_note || ''}
            onChange={(e) => setSession((s) => ({ ...s, line_note: e.target.value }))}
          />
        </div>

        {/* Operation Type (Outward Only) */}
        {kind === 'outward' && (
          <div className="md:col-span-1 flex flex-col justify-end pb-1">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSession(s => ({ ...s, outwardType: 'sale' }))}
                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${session.outwardType === 'sale' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                title="مبيعات / عهدة"
              >
                <Truck size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSession(s => ({ ...s, outwardType: 'transfer', rep: 'بركة الثمار - الرياض' }))}
                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${session.outwardType === 'transfer' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                title="تحويل للمخزن الرئيسي"
              >
                <Package size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Attachment Button (Colorful & Animated) */}
        <div className="md:col-span-1 flex flex-col justify-end">
          <div className="flex justify-start pb-0.5">
            <motion.label
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className={`relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all shadow-lg ${
                session.attachment 
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30'
              }`}
              title="المرفق"
            >
              {session.attachment ? <CheckCircle size={16} strokeWidth={3} /> : <UploadCloud size={16} strokeWidth={3} />}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSession((s) => ({ ...s, attachment: file }));
                    toast.success('تم إرفاق الملف بنجاح');
                  }
                }}
              />
              {session.attachment && (
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-rose-600 transition-colors"
                     onClick={(e) => { e.preventDefault(); setSession(s => ({ ...s, attachment: null })); }}>
                  <X size={8} strokeWidth={4} />
                </div>
              )}
            </motion.label>
          </div>
        </div>
      </div>

      {/* ─── SINGLE ROW ITEM ENTRY ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-[2rem] shadow-sm relative z-20">
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-${cfg.accent}-500/5 to-transparent pointer-events-none rounded-[2rem]`}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center relative z-10">
          {/* Item Search */}
          <div className="lg:col-span-5 relative">
            {selectedItem ? (
              <div className="flex items-center justify-between w-full h-[44px] rounded-full px-5 border-2 border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
                <div className="truncate text-[13px] font-black flex items-center gap-2">
                  <Package size={18} className="text-emerald-600 shrink-0" />
                  <span>{getItemName(selectedItem)}</span>
                  <span className="text-slate-400 font-bold">-</span>
                  <span className="text-slate-700">{getCompany(selectedItem)}</span>
                </div>
                <button type="button" onClick={clearRow} className="shrink-0 p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="relative group">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  ref={itemNameRef}
                  type="text"
                  className="w-full h-[44px] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-[12px] font-black rounded-full px-12 outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder-slate-400 shadow-sm"
                  placeholder="ابحث عن صنف للتكملة التلقائية..."
                  value={searchNameText}
                  onChange={(e) => { setSearchNameText(e.target.value); setSearchIdx(-1); }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx((p) => (p < itemSuggestions.length - 1 ? p + 1 : p)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx((p) => (p > 0 ? p - 1 : 0)); }
                    else if (e.key === 'Enter') {
                      if (searchIdx >= 0 && itemSuggestions[searchIdx]) {
                        e.preventDefault(); handleSelect(itemSuggestions[searchIdx]);
                      } else if (selectedItem && draftQty > 0) {
                        e.preventDefault(); pushDraft();
                      }
                    }
                  }}
                />
                <AnimatePresence>
                  {(itemSuggestions.length > 0 || (searchNameText.length >= 2 && !selectedItem)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full inset-x-0 mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[999] overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar"
                    >
                      {itemSuggestions.length > 0 ? (
                        itemSuggestions.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${idx === searchIdx ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            onClick={() => handleSelect(item)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${idx === searchIdx ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                <Box size={14} />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[12px] font-black truncate">{getItemName(item)}</span>
                                <span className="text-[10px] text-slate-400 font-bold truncate">{getCompany(item)}</span>
                              </div>
                            </div>
                            <div className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0 mr-2">
                              {getCategory(item)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center gap-3">
                           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-slate-300">
                              <Search size={20} strokeWidth={1.5} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-black text-slate-600 dark:text-slate-300">لم يتم العثور على نتائج لـ "{searchNameText}"</p>
                              <p className="text-[10px] font-bold text-slate-400">تأكد من كتابة اسم الصنف أو الشركة بشكل صحيح</p>
                           </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="lg:col-span-2">
            <input
              id={`voucher-qty-${kind}`}
              type="number" min="1"
              disabled={!selectedItem}
              className={`w-full h-[44px] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-center text-[14px] font-black rounded-full outline-none transition-all ${selectedItem ? 'focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10' : 'opacity-50 cursor-not-allowed'}`}
              placeholder="كمية"
              value={draftQty}
              onChange={(e) => setDraftQty(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') { 
                  e.preventDefault(); 
                  if (selectedItem && draftQty > 0) pushDraft(); 
                } 
              }}
            />
          </div>

          {/* Category & Unit */}
          <div className="lg:col-span-4 flex gap-2">
            <div className={`flex-1 h-[44px] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-[11px] font-black text-slate-500 truncate px-3 transition-opacity ${!selectedItem ? 'opacity-50' : ''}`} title="القسم">
              {selectedItem ? getCategory(selectedItem) : 'القسم'}
            </div>
            <div className={`flex-1 relative group h-[44px] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center px-3 transition-all ${!selectedItem ? 'opacity-70' : 'hover:border-primary/40'}`} title="الوحدة">
                <button 
                  type="button"
                  id={`unit-plus-btn-${kind}`}
                  className={`absolute -top-2.5 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all z-20 ${
                    !selectedItem 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white hover:scale-110'
                  }`}
                  onClick={() => {
                    if (!selectedItem) {
                       toast.info('يرجى اختيار صنف أولاً لتعديل وحدته');
                       return;
                    }
                    const input = document.getElementById(`unit-input-${kind}`);
                    if (input) {
                      input.focus();
                      input.select();
                    }
                  }}
                >
                  <Plus size={14} strokeWidth={3} />
                </button>

                {selectedItem ? (
                  <input 
                    id={`unit-input-${kind}`}
                    type="text"
                    className="w-full h-full text-center bg-transparent outline-none text-[11px] font-black text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    value={draftUnit}
                    onChange={(e) => setDraftUnit(e.target.value)}
                    placeholder={getUnit(selectedItem) || 'الوحدة'}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        if (draftQty > 0) pushDraft(); 
                      } 
                    }}
                  />
                ) : (
                  <span className="text-[11px] font-black text-slate-400">الوحدة</span>
                )}
            </div>
          </div>

          {/* Action Button (Add/Update) */}
          <div className="lg:col-span-1">
            <motion.button
              whileHover={selectedItem ? { scale: 1.05 } : {}}
              whileTap={selectedItem ? { scale: 0.95 } : {}}
              type="button"
              onClick={(e) => { 
                e.preventDefault(); 
                if (!selectedItem) {
                  toast.error('يرجى اختيار صنف أولاً من قائمة البحث');
                  itemNameRef.current?.focus();
                  return;
                }
                pushDraft(); 
              }}
              className={`w-11 h-11 flex items-center justify-center rounded-full text-white transition-all shadow-lg relative overflow-hidden ${
                editingDraftId 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-95'
              }`}
              title={editingDraftId ? 'تحديث السطر (Enter)' : 'إضافة للجدول (Enter)'}
            >
              <motion.div 
                layoutId="ping"
                className="absolute inset-0 bg-white/20 rounded-full"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {editingDraftId ? (
                <RefreshCw size={22} strokeWidth={3} className="animate-spin-slow" />
              ) : (
                <Plus size={28} strokeWidth={3} className="relative z-10" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── PREMIUM TABLE AREA ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
           <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Package size={16} className="text-primary" />
              قائمة المحتويات
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                {modalDrafts.length} أسطر
              </span>
           </h4>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-right text-[11px] font-bold border-separate border-spacing-y-1 px-4">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                <tr className="text-slate-400 font-black uppercase text-[9px] tracking-widest">
                  <th className="px-4 py-4 text-center w-10">م</th>
                  <th className="px-4 py-4">اسم الصنف والشركة</th>
                  <th className="px-4 py-4 text-center">الكمية</th>
                  <th className="px-4 py-4 text-center">القسم</th>
                  <th className="px-4 py-4 text-center">الوحدة</th>
                  <th className="px-4 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {modalDrafts.length > 0 ? (
                  modalDrafts.map((d, i) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={d.draftId}
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${editingDraftId === d.draftId ? 'bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/20' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}
                    >
                      <td className="px-4 py-3 text-center text-slate-400 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">{i + 1}</td>
                      <td className="px-4 py-3 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-slate-800 dark:text-slate-200">{d.item}</span>
                          <span className="text-[9px] text-slate-400">{d.company}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                        <span className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-primary font-black shadow-sm border border-slate-100 dark:border-slate-700">
                          {d.qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">{d.cat}</td>
                      <td className="px-4 py-3 text-center text-slate-500 border-y border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{d.unit}</span>
                      </td>
                      <td className="px-4 py-3 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditDraft(d)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                            title="تعديل السطر"
                          >
                            <Pencil size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraft(d.draftId)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                            title="حذف من المسودة"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-20">
                          <Box size={60} strokeWidth={1} />
                          <p className="text-sm font-black">المسودة فارغة، ابدأ بإضافة أصناف</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
