import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, Trash2, History, RotateCcw, Save, Loader2, 
  FileText, CheckCircle2, ChevronDown, Layers, Timer, User,
  Activity, AlertTriangle
} from 'lucide-react';

/**
 * VoucherDetailModal - Displays details of a specific voucher.
 */
export function VoucherDetailModal({
  isOpen,
  onClose,
  voucher,
  showVoucherHistory,
  setShowVoucherHistory,
  updateVoucherNote,
  handleDeleteTransaction,
  printVoucher,
  duplicateVoucher,
  loading,
  handleMarkAsInvoiced,
  setIsVoucherModalOpen,
  setSelectedVoucher
}) {
  if (!isOpen || !voucher) return null;

  const isIn = voucher.kind === 'in';
  const isCompleted = voucher.invoiced === true;
  const lines = voucher.lines || [];

  // Parse History if available
  const parseHistory = (note) => {
    if (!note) return [];
    const matches = [...note.matchAll(/<!--HIST:(.*?)-->/g)];
    return matches.map(m => {
      try { return JSON.parse(m[1]); }
      catch(e) { return null; }
    }).filter(Boolean).sort((a,b) => new Date(b.at) - new Date(a.at));
  };

  const historyEntries = parseHistory(voucher.line_note);
  const isEdited = historyEntries.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0F2747]/60 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full ${showVoucherHistory ? 'max-w-[1200px]' : 'max-w-4xl'} bg-white rounded-[24px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-500`}
        >
          {(() => {
            let invoiceDate = null;
            if (voucher.line_note && voucher.line_note.includes('[تم إصدار الفاتورة: ')) {
                const match = voucher.line_note.match(/\[تم إصدار الفاتورة: (.*?)\]/);
                if (match) invoiceDate = match[1];
            }
            return (
              <>
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isIn ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                       {isIn ? <FileText size={28} /> : <Printer size={28} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0F2747] font-tajawal">
                        {voucher.isTransfer ? 'تحويل مخزني' : (isIn ? 'تفاصيل سند إدخال' : 'تفاصيل سند إخراج')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-readex flex items-center gap-1">
                          <Timer size={12} /> {voucher.timestamp.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase font-tajawal ${isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {isCompleted ? (invoiceDate ? `فاتورة: ${invoiceDate}` : 'مفوتر') : 'قيد المراجعة'}
                            </span>
                            {isEdited && (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                                    <RotateCcw size={10} /> معدّل
                                </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 ${showVoucherHistory ? 'border-l border-slate-100' : ''}`}>
                    
                    {/* Compact Meta Grid */}
                    <div className="flex flex-wrap gap-4 mb-6">
                       <div className="flex-1 min-w-[180px] p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">المستلم</p>
                          <p className="text-sm font-bold text-[#0F2747] truncate">{voucher.clientName}</p>
                       </div>
                       <div className="flex-1 min-w-[140px] p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">رقم السند</p>
                          <p className="text-sm font-black text-[#0F2747] tabular-nums">{voucher.voucherCode || '-'}</p>
                       </div>
                       <div className="flex-[2] min-w-[240px] p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">الملاحظات</p>
                          <p className="text-xs font-bold text-slate-600 line-clamp-1">
                             {voucher.line_note?.split(/\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0].trim() || '—'}
                          </p>
                       </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 min-h-0 flex flex-col">
                       <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-right border-collapse">
                             <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase font-readex tracking-widest">
                                   <th className="px-5 py-3 w-10 text-center">م</th>
                                   <th className="px-5 py-3">الصنف</th>
                                   <th className="px-5 py-3">الشركة</th>
                                   <th className="px-5 py-3 text-center w-20">الكمية</th>
                                   <th className="px-5 py-3 text-center w-24">القسم</th>
                                   {!isCompleted && <th className="px-5 py-3 text-center w-16">حذف</th>}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                   <tr key={line.id || idx} className="hover:bg-slate-50/30 transition-colors">
                                      <td className="px-5 py-3 text-center text-slate-300 font-readex text-xs">{idx + 1}</td>
                                      <td className="px-5 py-3">
                                         <p className="text-sm font-bold text-[#0F2747]">{(line.item || '').replace(/\s*-\s*-$/, '').replace(/\s*-\s*بدون شركة$/, '').trim()}</p>
                                      </td>
                                      <td className="px-5 py-3 text-xs font-bold text-slate-400">{line.company === '-' || !line.company ? '—' : line.company}</td>
                                      <td className="px-5 py-3 text-center text-sm font-black tabular-nums">{line.qty}</td>
                                      <td className="px-5 py-3 text-center">
                                         <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">{line.cat || '-'}</span>
                                      </td>
                                      {!isCompleted && (
                                         <td className="px-5 py-3 text-center">
                                            <button onClick={() => handleDeleteTransaction(line.id)} className="p-1.5 text-slate-200 hover:text-rose-400 transition-colors">
                                               <Trash2 size={16} />
                                            </button>
                                         </td>
                                      )}
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                        {!isCompleted && !voucher.isTransfer && (
                            <button onClick={() => handleMarkAsInvoiced(voucher)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10">
                                {isIn ? 'اعتماد الوارد' : 'إصدار الفاتورة'}
                            </button>
                        )}
                        <button onClick={() => setShowVoucherHistory(!showVoucherHistory)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${showVoucherHistory ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                            <History size={18} /> سجل التغييرات
                        </button>
                    </div>
                  </div>

                  {/* History Sidebar - Detailed Version */}
                  {showVoucherHistory && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 420, opacity: 1 }} className="bg-[#fcfdfd] flex flex-col shrink-0 border-r border-slate-100">
                      <div className="p-6 bg-white border-b border-slate-100">
                         <h4 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                             <Activity size={16} className="text-indigo-600" /> النسخ المؤرشفة للسند
                         </h4>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                         {historyEntries.length > 0 ? (
                            historyEntries.map((entry, idx) => {
                               // Simple comparison with current lines
                               const oldLines = entry.lines || [];
                               return (
                                   <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                       <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                                           <span className="text-[10px] font-black text-slate-400 tabular-nums">
                                               {new Date(entry.at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                           </span>
                                           <span className="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">نسخة محفوظة</span>
                                       </div>
                                       <div className="p-3">
                                           <table className="w-full text-right text-[10px]">
                                               <thead>
                                                   <tr className="text-slate-400">
                                                       <th className="pb-2 font-black">الصنف</th>
                                                       <th className="pb-2 text-center">الكمية</th>
                                                   </tr>
                                               </thead>
                                               <tbody className="divide-y divide-slate-50">
                                                   {oldLines.map((ol, oIdx) => {
                                                       const currentMatch = lines.find(cl => cl.item === ol.item);
                                                       const isChanged = currentMatch && Number(currentMatch.qty) !== Number(ol.qty);
                                                       const isRemoved = !currentMatch;
                                                       
                                                       return (
                                                           <tr key={oIdx} className={`${isRemoved ? 'bg-rose-50/50' : isChanged ? 'bg-amber-50/50' : ''}`}>
                                                               <td className={`py-2 pr-1 font-bold ${isRemoved ? 'text-rose-600' : isChanged ? 'text-amber-700' : 'text-slate-600'}`}>
                                                                   {ol.item}
                                                                   {isRemoved && <span className="mr-1 text-[8px] font-black bg-rose-100 px-1 rounded">محذوف</span>}
                                                                   {isChanged && <span className="mr-1 text-[8px] font-black bg-amber-100 px-1 rounded">معدل</span>}
                                                               </td>
                                                               <td className="py-2 text-center font-black tabular-nums">{ol.qty}</td>
                                                           </tr>
                                                       );
                                                   })}
                                               </tbody>
                                           </table>
                                           {entry.notes && <p className="mt-3 text-[9px] text-slate-400 bg-slate-50 p-2 rounded italic">ملاحظة سابقة: {entry.notes}</p>}
                                       </div>
                                   </div>
                               );
                            })
                         ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-40">
                               <History size={48} strokeWidth={1} className="mb-4" />
                               <p className="text-xs font-bold">لا توجد نسخ قديمة محفوظة</p>
                            </div>
                         )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            );
          })()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
