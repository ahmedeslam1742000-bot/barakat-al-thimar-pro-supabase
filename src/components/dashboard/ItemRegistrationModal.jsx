import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, CheckCircle2, Package, 
  Plus, Save, Pencil, Trash2 
} from 'lucide-react';

export default function ItemRegistrationModal({
  isOpen,
  onClose,
  sessionItems,
  showExitConfirm,
  setShowExitConfirm,
  performModalReset,
  showSaveConfirm,
  setShowSaveConfirm,
  confirmRegisterBatchSave,
  itemForm,
  setItemForm,
  handleNameInput,
  handleCompanyInput,
  handleModalKeyDown,
  nameSuggestions,
  setNameSuggestions,
  activeNameIdx,
  companySuggestions,
  setCompanySuggestions,
  activeCompIdx,
  itemNameInputRef,
  companyInputRef,
  newCategoryInputRef,
  isAddingCategory,
  setIsAddingCategory,
  newCategoryName,
  setNewCategoryName,
  handleAddCategory,
  categories,
  isCustomUnit,
  setIsCustomUnit,
  unitInputRef,
  units,
  addToSession,
  editingSessionId,
  setEditingSessionId,
  removeSessionItem,
  loading
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F2747]/60 backdrop-blur-md"
          dir="rtl"
          onClick={onClose}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 flex flex-col h-[85vh] min-h-[650px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-[#1e293b] dark:text-white font-tajawal tracking-tight">تعريف أصناف جديدة</h3>
                <p className="text-[13px] text-slate-400 font-readex mt-1 font-semibold">
                  {sessionItems.length > 0 ? `${sessionItems.length} صنف في الجلسة — اضغط "اعتماد وحفظ" لإتمام التسجيل` : 'أضف الأصناف للقائمة ثم اعتمدها دفعة واحدة'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-500 rounded-2xl transition-all active:scale-90"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Exit Confirmation Overlay */}
              <AnimatePresence>
                {showExitConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[160] flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-b-[2rem]"
                    onClick={e => e.stopPropagation()}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl px-10 py-16 max-w-md w-full mx-4 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <AlertTriangle size={40} />
                      </div>
                      <h4 className="text-2xl font-black font-tajawal text-slate-800 dark:text-white mb-3">تنبيه: بيانات غير محفوظة</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 leading-relaxed px-4">
                        لديك <span className="font-black text-rose-500">{sessionItems.length}</span> صنف في القائمة لم يتم حفظهم بعد. هل أنت متأكد من الخروج؟
                      </p>
                      <div className="flex flex-col gap-3.5 px-4">
                        <button
                          type="button"
                          onClick={performModalReset}
                          className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                        >
                          تأكيد الخروج وفقدان البيانات
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExitConfirm(false)}
                          className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          البقاء في القائمة
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Confirmation Overlay */}
              <AnimatePresence>
                {showSaveConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[160] flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-b-[2rem]"
                    onClick={e => e.stopPropagation()}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl px-10 py-16 max-w-md w-full mx-4 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <CheckCircle2 size={40} />
                      </div>
                      <h4 className="text-2xl font-black font-tajawal text-slate-800 dark:text-white mb-3">تأكيد الحفظ النهائي</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 leading-relaxed px-4">
                        هل أنت متأكد من اعتماد وحفظ <span className="font-black text-emerald-500">{sessionItems.length}</span> صنف في قاعدة البيانات؟
                      </p>
                      <div className="flex flex-col gap-3.5 px-4">
                        <button
                          type="button"
                          onClick={confirmRegisterBatchSave}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          نعم، اعتماد وحفظ الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSaveConfirm(false)}
                          className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          مراجعة القائمة
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Entry Form Row */}
              <div className="px-8 pt-6 pb-4 shrink-0">
                <div className="bg-[#f8fbf9] p-5 rounded-[24px] border border-[#f0f5f3] flex items-end gap-4 shadow-sm relative group/header">
                  {/* Item Name */}
                  <div className="flex-[2.5] relative">
                    <label className="block text-[11px] font-bold text-[#8ba3b5] uppercase mb-2 text-center tracking-widest">اسم الصنف الكامل *</label>
                    <input
                      ref={itemNameInputRef}
                      type="text"
                      autoFocus
                      autoComplete="off"
                      className="w-full h-[46px] rounded-[14px] px-4 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] transition-all text-center shadow-sm placeholder:text-slate-300 placeholder:font-medium text-slate-800"
                      placeholder="مثال: فراولة مركز ماريتا"
                      value={itemForm.name}
                      onChange={e => handleNameInput(e.target.value)}
                      onKeyDown={e => handleModalKeyDown(e, 'name')}
                    />
                    {nameSuggestions.length > 0 && (
                      <div className="absolute z-[100] top-full right-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {nameSuggestions.map((s, i) => (
                          <div key={i} onMouseDown={() => { handleNameInput(s); setNameSuggestions([]); setTimeout(() => companyInputRef.current?.focus(), 50); }} className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors text-center ${activeNameIdx === i ? 'bg-[#10b981] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Company */}
                  <div className="flex-[2.5] relative">
                    <label className="block text-[11px] font-bold text-[#8ba3b5] uppercase mb-2 text-center tracking-widest">الشركة *</label>
                    <input
                      ref={companyInputRef}
                      type="text"
                      autoComplete="off"
                      className="w-full h-[46px] rounded-[14px] px-4 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] transition-all text-center shadow-sm placeholder:text-slate-300 placeholder:font-medium text-slate-800"
                      placeholder="اسم الشركة..."
                      value={itemForm.company}
                      onChange={e => handleCompanyInput(e.target.value)}
                      onKeyDown={e => handleModalKeyDown(e, 'company')}
                    />
                    {companySuggestions.length > 0 && (
                      <div className="absolute z-[100] top-full right-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        {companySuggestions.map((s, i) => (
                          <div key={i} onMouseDown={() => { handleCompanyInput(s); setCompanySuggestions([]); }} className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors text-center ${activeCompIdx === i ? 'bg-[#10b981] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="flex-[1.8] relative">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <label className="text-[11px] font-bold text-[#8ba3b5] uppercase tracking-tighter w-full text-center">القسم</label>
                      <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-[#10b981] hover:scale-110 transition-transform p-0.5 absolute left-2 top-0"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    {isAddingCategory ? (
                      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center bg-white dark:bg-slate-900 border-2 border-[#10b981]/40 rounded-[14px] overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-200 h-[46px]">
                        <input
                          ref={newCategoryInputRef}
                          type="text"
                          autoFocus
                          className="flex-1 h-full px-3 text-[13px] font-bold outline-none bg-transparent text-center text-slate-800"
                          placeholder="قسم جديد..."
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                            if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryName(''); }
                          }}
                        />
                        <button type="button" onClick={handleAddCategory} className="p-2 text-[#10b981] hover:bg-emerald-50 transition-colors"><CheckCircle2 size={16} /></button>
                      </div>
                    ) : (
                      <select
                        className="w-full h-[46px] rounded-[14px] px-2 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] cursor-pointer text-center shadow-sm appearance-none text-slate-800"
                        value={itemForm.cat}
                        onChange={e => setItemForm({ ...itemForm, cat: e.target.value })}
                        onKeyDown={e => handleModalKeyDown(e, 'other')}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="flex-[1.8] relative">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <label className="text-[11px] font-bold text-[#8ba3b5] uppercase tracking-tighter w-full text-center">الوحدة</label>
                      <button type="button" onClick={() => setIsCustomUnit(!isCustomUnit)} className="text-[#10b981] hover:scale-110 transition-transform p-0.5 absolute left-2 top-0"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    {isCustomUnit ? (
                      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center bg-white dark:bg-slate-900 border-2 border-[#10b981]/40 rounded-[14px] overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-200 h-[46px]">
                        <input
                          ref={unitInputRef}
                          type="text"
                          autoFocus
                          className="flex-1 h-full px-3 text-[13px] font-bold outline-none bg-transparent text-center text-slate-800"
                          placeholder="وحدة مخصصة..."
                          value={itemForm.unit}
                          onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); setIsCustomUnit(false); }
                            if (e.key === 'Escape') { setIsCustomUnit(false); }
                          }}
                        />
                        <button type="button" onClick={() => setIsCustomUnit(false)} className="p-2 text-[#10b981] hover:bg-emerald-50 transition-colors"><CheckCircle2 size={16} /></button>
                      </div>
                    ) : (
                      <select
                        className="w-full h-[46px] rounded-[14px] px-2 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] cursor-pointer text-center shadow-sm appearance-none text-slate-800"
                        value={itemForm.unit}
                        onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                        onKeyDown={e => handleModalKeyDown(e, 'other')}
                      >
                        {units && units.length > 0 ? units.map(u => <option key={u} value={u}>{u}</option>) : ['كرتونة','قطعة','كيلو','لتر','طرد','علبة'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Add/Update Button */}
                  <div className="shrink-0 mb-1">
                    <button
                      type="button"
                      onClick={addToSession}
                      className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden group/btn shadow-md ${
                        editingSessionId 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'bg-[#10b981] hover:bg-[#0ea5e9]'
                      } active:scale-95`}
                    >
                      {editingSessionId ? <Save size={20} className="text-white" /> : <Plus size={24} strokeWidth={3} className="text-white" />}
                    </button>
                  </div>
                </div>
                {editingSessionId && (
                  <div className="flex justify-end mt-2 px-1">
                    <button type="button" onClick={() => setEditingSessionId(null)} className="text-[10px] font-black text-rose-500 hover:underline">إلغاء التعديل</button>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-hidden px-8 pb-6 flex flex-col min-h-0">
                <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden flex flex-col min-h-0 shadow-sm">
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full border-separate border-spacing-0 text-center">
                      <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4 w-12 border-b">م</th>
                          <th className="py-3 px-4 border-b w-[35%]">اسم الصنف</th>
                          <th className="py-3 px-4 border-b w-[25%]">الشركة</th>
                          <th className="py-3 px-4 w-32 border-b">القسم</th>
                          <th className="py-3 px-4 w-28 border-b">الوحدة</th>
                          <th className="py-3 px-4 w-24 border-b">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                        {sessionItems.map((item, idx) => (
                          <tr key={item.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${editingSessionId === item.id ? 'bg-orange-50/50 dark:bg-orange-500/5' : ''}`}>
                            <td className="py-3.5 px-4 text-[11px] font-bold text-slate-400 tabular-nums">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-tajawal font-bold text-xs text-slate-800 dark:text-white">{item.name}</td>
                            <td className="py-3.5 px-4"><span className="text-[10px] font-bold text-slate-500">{item.company}</span></td>
                            <td className="py-3.5 px-4"><span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{item.cat}</span></td>
                            <td className="py-3.5 px-4 text-[10px] font-bold text-slate-500">{item.unit}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button type="button" onClick={() => setEditingSessionId(item.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                                <button type="button" onClick={() => removeSessionItem(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 border-t border-slate-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2.5 rounded-[12px] text-sm font-bold text-[#64748b] border border-[#e2e8f0] bg-white hover:bg-slate-50 transition-all active:scale-95"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  disabled={sessionItems.length === 0 || loading}
                  onClick={() => setShowSaveConfirm(true)}
                  className="px-8 py-3 rounded-[12px] text-sm font-black text-white bg-[#86d4b4] hover:bg-[#6ec29e] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 size={18} /> اعتماد وحفظ القائمة ({sessionItems.length})
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
