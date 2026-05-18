import React from 'react';
import { Search, Plus, Trash2, Pencil, RotateCcw, CheckCircle2 } from 'lucide-react';
import ModalWrapper from '../common/ModalWrapper';
import SmartDateInput from '../SmartDateInput';

export default function ReturnModal({
  isOpen,
  onClose,
  onSubmit,
  returnForm,
  setReturnForm,
  returnItems,
  setReturnItems,
  returnErrors,
  setReturnErrors,
  items,
  returnSearchInputRef,
  returnSearchActiveIndex,
  setReturnSearchActiveIndex,
  handleAddReturnItemToTable,
  handleEditReturnItem,
  triggerNewItemRegistration,
  loading
}) {
  return (
    <ModalWrapper 
      title="تسجيل مرتجع مخزني" 
      maxWidth="max-w-6xl" 
      isOpen={isOpen} 
      onClose={onClose} 
      onSubmit={onSubmit} 
      compact 
      loading={loading}
    >
      {/* Header Fields - Returnee, Representative, and Date */}
      <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">اسم المرجع / العميل <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={`w-full bg-white border ${!returnForm.returnee.trim() ? 'border-red-200 ring-2 ring-red-500/5' : 'border-slate-200'} text-slate-800 text-[13px] font-black rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
            value={returnForm.returnee}
            onChange={(e) => {
              setReturnForm({...returnForm, returnee: e.target.value});
              if (e.target.value.trim()) setReturnErrors(prev => ({...prev, returnee: false}));
            }}
            placeholder="من قام بالإرجاع؟"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">المندوب المستلم <span className="text-red-500">*</span></label>
          <input
            type="text"
            list="reps-datalist"
            className={`w-full h-[38px] bg-white border ${!returnForm.rep.trim() && returnErrors.rep ? "border-red-200 ring-2 ring-red-500/5" : "border-slate-200"} text-slate-800 text-[13px] font-black rounded-xl px-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
            value={returnForm.rep}
            onChange={(e) => { setReturnForm({...returnForm, rep: e.target.value}); if (e.target.value.trim()) setReturnErrors(prev => ({...prev, rep: false})); }}
            placeholder="اسم المندوب"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">تاريخ الإرجاع</label>
          <SmartDateInput 
            value={returnForm.date} 
            onChange={(val) => setReturnForm({...returnForm, date: val})} 
            className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-4 py-2 pr-10 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-readex text-center" 
          />
        </div>
      </div>

      {/* Top Section (Fixed Entry) */}
      <div className="bg-slate-50/50 p-2.5 rounded-[1.2rem] border border-slate-100 mb-2 shadow-sm">
        <div className="flex items-center gap-2 mb-2 mr-1">
          <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
          <h4 className="text-[11px] font-black text-slate-700 font-tajawal">إضافة سريع للمرتجعات</h4>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[200px] relative group/ret">
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 mr-1 uppercase h-[15px] leading-[15px]">البحث عن صنف</label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={returnSearchInputRef}
                type="text"
                className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl pr-9 pl-3 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 transition-all font-tajawal placeholder:text-slate-300 placeholder:font-semibold"
                placeholder="اكتب للبحث..."
                value={returnForm.query}
                onChange={(e) => {
                  setReturnForm({...returnForm, query: e.target.value, selectedItem: null, cat: '', unit: ''});
                  setReturnSearchActiveIndex(-1);
                }}
                onBlur={() => {
                  if (returnForm.query.trim().length >= 2 && !returnForm.selectedItem) {
                    const matchFound = items.some(i => i.name.includes(returnForm.query) || (i.company && i.company.includes(returnForm.query)));
                    if (!matchFound) triggerNewItemRegistration(returnForm.query.trim(), 'return');
                  }
                }}
                onKeyDown={(e) => {
                  const suggestions = items.filter(i => i.name.includes(returnForm.query) || (i.company && i.company.includes(returnForm.query)));
                  if (e.key === 'ArrowDown') { e.preventDefault(); setReturnSearchActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setReturnSearchActiveIndex(prev => prev > 0 ? prev - 1 : 0); }
                  else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (returnSearchActiveIndex >= 0 && suggestions[returnSearchActiveIndex]) {
                      const invItem = suggestions[returnSearchActiveIndex];
                      setReturnForm({...returnForm, query: `${invItem.name} - ${invItem.company}`, selectedItem: invItem, cat: invItem.cat || invItem.category || '', unit: invItem.unit || 'كرتونة', returnStatus: returnForm.returnStatus || 'سليم' });
                      setReturnSearchActiveIndex(-1);
                      setTimeout(() => document.getElementById('returnQtyInput')?.focus(), 10);
                    } else if (returnForm.selectedItem) {
                      setTimeout(() => document.getElementById('returnQtyInput')?.focus(), 10);
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="w-[85px]">
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الكمية</label>
            <input
              type="number"
              id="returnQtyInput"
              className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-2 outline-none focus:ring-4 focus:ring-amber-500/5 transition-all text-center"
              placeholder="0"
              value={returnForm.qty}
              onChange={(e) => setReturnForm({...returnForm, qty: e.target.value})}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReturnItemToTable(); } }}
            />
          </div>

          <div className="w-[120px]">
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الحالة</label>
            <select
              className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[11px] font-black rounded-xl px-2 outline-none focus:ring-4 focus:ring-amber-500/5 transition-all text-center appearance-none"
              value={returnForm.returnStatus}
              onChange={(e) => setReturnForm({...returnForm, returnStatus: e.target.value})}
            >
              <option value="سليم">سليم (للمخزن)</option>
              <option value="تالف">تالف (توالف)</option>
            </select>
          </div>

          <button
            type="button"
            className="w-[38px] h-[38px] bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
            onClick={handleAddReturnItemToTable}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Middle Section (Table) */}
      <div className="card overflow-hidden flex flex-col flex-1 min-h-[45vh] bg-white border border-slate-100 rounded-[2rem]">
        <div className="overflow-y-auto w-full overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full min-w-max text-right text-xs whitespace-nowrap">
            <thead className="bg-white sticky top-0 z-10">
              <tr className="text-[11px] font-black text-slate-600 border-b border-slate-200">
                <th className="px-3 py-2 w-10 text-center">م</th>
                <th className="px-3 py-2 min-w-[180px]">اسم الصنف</th>
                <th className="px-3 py-2 w-24">القسم</th>
                <th className="px-3 py-2 w-20">الوحدة</th>
                <th className="px-3 py-2 w-20 text-center">الكمية</th>
                <th className="px-3 py-2 w-20 text-center">الحالة</th>
                <th className="px-3 py-2 w-14 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {returnItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <RotateCcw size={32} className="mb-2" />
                      <p className="font-bold">لم يتم إضافة أصناف مرتجعة بعد</p>
                    </div>
                  </td>
                </tr>
              ) : (
                returnItems.map((item, idx) => (
                  <tr key={idx} className={`transition-colors group ${item.returnStatus === 'تالف' ? 'bg-red-50/30 hover:bg-red-50' : 'bg-white hover:bg-slate-50'} border-b border-slate-50`}>
                    <td className="px-3 py-2 text-[10px] font-black text-slate-400 text-center tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-2 text-xs font-black text-slate-800">{item.name || '-'}</td>
                    <td className="px-3 py-2 text-[10px]"><span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-black">{item.cat}</span></td>
                    <td className="px-3 py-2 text-[10px] font-black text-slate-600">{item.unit}</td>
                    <td className="px-3 py-2 text-xs font-black text-emerald-600 text-center">+{item.qty}</td>
                    <td className="px-3 py-2 text-center text-[10px] font-black">
                      {item.returnStatus === 'تالف' ? <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">تالف</span> : <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">سليم</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button type="button" onClick={() => handleEditReturnItem(idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md"><Pencil size={14} /></button>
                        <button type="button" onClick={() => setReturnItems(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
        {returnItems.length > 0 && (
          <button 
            type="submit" 
            disabled={!returnForm.returnee.trim()}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> حفظ واعتماد {returnItems.length} صنف
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}
