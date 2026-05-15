import React from 'react';
import { Search, Plus, Trash2, Pencil, Package } from 'lucide-react';
import ModalWrapper from '../common/ModalWrapper';
import SmartDateInput from '../SmartDateInput';
import { formatItemNameWithCompany, isInvalidCompany } from '../../lib/itemFields';

export default function InvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  isVoucherInvoice,
  invoiceForm,
  setInvoiceForm,
  currentInvoiceItem,
  setCurrentInvoiceItem,
  invoiceErrors,
  setInvoiceErrors,
  repsList,
  items,
  invoiceSearchInputRef,
  invoiceSearchActiveIndex,
  setInvoiceSearchActiveIndex,
  handleAddInvoiceItemToTable,
  handleEditInvoiceItem,
  loading
}) {
  return (
    <ModalWrapper 
      title={isVoucherInvoice ? "مراجعة فاتورة صادر" : "إنشاء فاتورة صادر (نظام بريميوم)"} 
      maxWidth="max-w-6xl" 
      isOpen={isOpen} 
      onClose={onClose} 
      onSubmit={onSubmit} 
      compact
      loading={loading}
    >
      {/* Header Fields - Client, Representative, and Date */}
      <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {!isVoucherInvoice && (
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">المندوب المسجل <span className="text-red-500">*</span></label>
            <input
              type="text"
              list="reps-datalist"
              className={`w-full h-[38px] bg-white border ${!invoiceForm.rep.trim() && invoiceErrors.rep ? 'border-red-200 ring-2 ring-red-500/5' : 'border-slate-200'} text-slate-800 text-[13px] font-black rounded-xl px-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
              value={invoiceForm.rep}
              onChange={(e) => {
                setInvoiceForm({...invoiceForm, rep: e.target.value});
                if (e.target.value.trim()) setInvoiceErrors(prev => ({...prev, rep: false}));
              }}
              autoComplete="off" id="invoiceRepInput" placeholder="اسم مندوب المبيعات"
            />
            <datalist id="reps-datalist">
              {repsList.map(rep => <option key={rep} value={rep} />)}
            </datalist>
          </div>
        )}

        <div className={`flex flex-col ${isVoucherInvoice ? 'md:col-span-2' : ''}`}>
          <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">تاريخ الفاتورة</label>
          <div className="relative">
            <SmartDateInput 
              value={invoiceForm.date} 
              onChange={(val) => setInvoiceForm({...invoiceForm, date: val})} 
              className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-4 pr-10 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-readex text-center" 
            />
          </div>
        </div>

        {!isVoucherInvoice && (
          <div className="flex flex-col md:col-span-2 mt-1">
            <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">ملاحظات إضافية (اختياري)</label>
            <textarea
              placeholder="اكتب أي ملاحظات هنا..."
              className="w-full h-[60px] bg-white border border-slate-200 text-slate-800 text-[12px] font-bold rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal resize-none"
              value={invoiceForm.notes || ''}
              onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
            />
          </div>
        )}
      </div>

      {/* Item Entry Section */}
      {!isVoucherInvoice && (
        <div className={`p-2.5 rounded-[1.2rem] border mb-2 shadow-sm ${isVoucherInvoice ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2 mr-1">
            <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
            <h4 className="text-[11px] font-black text-slate-700 font-tajawal">إضافة سريع للأصناف</h4>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex-1 min-w-[250px] relative group/item">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 mr-1 uppercase h-[15px] leading-[15px]">البحث عن صنف</label>
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={invoiceSearchInputRef}
                  type="text"
                  autoComplete="off"
                  className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl pr-9 pl-3 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all font-tajawal placeholder:text-slate-300 placeholder:font-semibold"
                  placeholder="اكتب اسم الصنف هنا..."
                  value={currentInvoiceItem.name}
                  onChange={(e) => {
                    setCurrentInvoiceItem({...currentInvoiceItem, name: e.target.value, selectedItem: null, cat: '', unit: ''});
                    setInvoiceSearchActiveIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const suggestions = items.filter(i => i.name.includes(currentInvoiceItem.name) || (i.company && i.company.includes(currentInvoiceItem.name)));
                    if (e.key === 'ArrowDown') { e.preventDefault(); setInvoiceSearchActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setInvoiceSearchActiveIndex(prev => prev > 0 ? prev - 1 : 0); }
                    else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (invoiceSearchActiveIndex >= 0 && suggestions[invoiceSearchActiveIndex]) {
                        const invItem = suggestions[invoiceSearchActiveIndex];
                        setCurrentInvoiceItem({ 
                          ...currentInvoiceItem, 
                          name: formatItemNameWithCompany(invItem.name, invItem.company), 
                          selectedItem: invItem, 
                          cat: invItem.cat || invItem.category || '', 
                          unit: invItem.unit || 'كرتونة' 
                        });
                        setInvoiceSearchActiveIndex(-1);
                        setTimeout(() => document.getElementById('invoiceQtyInput')?.focus(), 10);
                      } else if (currentInvoiceItem.selectedItem) {
                        setTimeout(() => document.getElementById('invoiceQtyInput')?.focus(), 10);
                      }
                    }
                  }}
                />
              </div>
              {currentInvoiceItem.name && !currentInvoiceItem.selectedItem && (
                <div className="hidden group-focus-within/item:block absolute top-[110%] right-0 w-full max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1.5 backdrop-blur-xl custom-scrollbar">
                  {items.filter(i => i.name.includes(currentInvoiceItem.name) || (i.company && i.company.includes(currentInvoiceItem.name))).map((invItem, idx) => (
                    <button key={invItem.id} type="button" className={`w-full text-right px-3 py-2 rounded-lg transition-all ${invoiceSearchActiveIndex === idx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`} onMouseDown={(e) => {
                      e.preventDefault();
                      setCurrentInvoiceItem({
                        ...currentInvoiceItem,
                        name: formatItemNameWithCompany(invItem.name, invItem.company),
                        selectedItem: invItem,
                        cat: invItem.cat || invItem.category || '',
                        unit: invItem.unit || 'كرتونة'
                      });
                      setInvoiceSearchActiveIndex(-1);
                      setTimeout(() => { document.getElementById('invoiceQtyInput')?.focus(); }, 10);
                    }}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{invItem.name}</span>
                          <span className="text-[9px] font-bold opacity-60">{invItem.company}</span>
                        </div>
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">رصيد: {invItem.stockQty}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[85px]">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الكمية</label>
              <input
                type="number"
                id="invoiceQtyInput"
                className="w-full h-[38px] bg-white border-2 border-indigo-400/50 focus:border-indigo-500 text-indigo-700 text-sm rounded-xl px-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center font-black tabular-nums shadow-inner"
                placeholder="0"
                value={currentInvoiceItem.qty}
                onChange={(e) => { if (e.target.value.length <= 4) setCurrentInvoiceItem({...currentInvoiceItem, qty: e.target.value}); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInvoiceItemToTable(); } }}
              />
            </div>

            <div className="w-[85px]">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">القسم</label>
              <input type="text" className="w-full h-[38px] bg-slate-100/50 border border-slate-200/60 text-slate-600 text-[12px] font-black rounded-xl px-2 outline-none cursor-default text-center transition-all" value={currentInvoiceItem.cat || '-'} readOnly />
            </div>

            <div className="w-[85px]">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الوحدة</label>
              <input type="text" className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[12px] font-black rounded-xl px-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all text-center" value={currentInvoiceItem.unit} onChange={(e) => setCurrentInvoiceItem({...currentInvoiceItem, unit: e.target.value})} placeholder="كرتونة" />
            </div>

            <button
              type="button"
              className={`w-[38px] h-[38px] ${currentInvoiceItem.selectedItem ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'} text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center hover:scale-105 active:scale-95 shrink-0`}
              onClick={handleAddInvoiceItemToTable}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Middle Section (The Table) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[45vh] shadow-sm">
        <div className="overflow-y-auto w-full overflow-x-auto flex-1 custom-scrollbar pt-2">
          <table className="w-full min-w-max text-right text-xs whitespace-nowrap">
            <thead className="bg-slate-50/30 sticky top-0 z-10 backdrop-blur-md">
              <tr className="text-[10px] font-black text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4 w-16 text-center">م</th>
                <th className="px-6 py-4 min-w-[250px]">اسم الصنف</th>
                <th className="px-6 py-4 w-32">التصنيف</th>
                <th className="px-6 py-4 w-24 text-center">الوحدة</th>
                <th className="px-6 py-4 w-32 text-center">الكمية</th>
                {!isVoucherInvoice && <th className="px-6 py-4 w-20 text-center">الإجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoiceForm.items.length === 0 ? (
                <tr>
                  <td colSpan={isVoucherInvoice ? 5 : 6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100/50">
                        <Package size={32} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 font-tajawal">{isVoucherInvoice ? 'لا توجد أصناف منقولة من السند' : 'ابدأ بإضافة الأصناف للفاتورة من الأعلى'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoiceForm.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-all group border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 text-[11px] font-black text-slate-300 text-center tabular-nums">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-700">
                      {item.name}
                      {item.company && !isInvalidCompany(item.company) && (
                        <span className="text-slate-400 font-bold text-[11px] mr-2"> - {item.company}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black">{item.cat || 'بدون تصنيف'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{item.unit || 'كرتونة'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl ${isVoucherInvoice ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-red-50 text-red-600 border-red-100'} border font-black text-sm tabular-nums`}>
                        {isVoucherInvoice ? item.qty : `-${item.qty}`}
                      </div>
                    </td>
                    {!isVoucherInvoice && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                          <button type="button" onClick={() => handleEditInvoiceItem(idx)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Pencil size={18} /></button>
                          <button type="button" onClick={() => setInvoiceForm({...invoiceForm, items: invoiceForm.items.filter((_, i) => i !== idx)})} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalWrapper>
  );
}
