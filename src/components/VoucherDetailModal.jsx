import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, Trash2, History, RotateCcw,
  FileText, CheckCircle2, Timer, User,
  Activity, Hash, MessageSquare, ArrowLeftRight
} from 'lucide-react';

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

  // Robust cleaning of redundant phrases in notes
  const cleanNote = (note) => {
    if (!note) return '—';
    return note
      .replace(/\[تعديل بعد الفوترة\]/g, '')
      .split(/\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0]
      .trim() || '—';
  };

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
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className={`w-full ${showVoucherHistory ? 'max-w-6xl' : 'max-w-4xl'} bg-[#fcfdfe] rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-500 border border-white`}
        >
          {(() => {
            let invoiceDate = null;
            if (voucher.line_note && voucher.line_note.includes('[تم إصدار الفاتورة: ')) {
                const match = voucher.line_note.match(/\[تم إصدار الفاتورة: (.*?)\]/);
                if (match) invoiceDate = match[1];
            }
            return (
              <>
                {/* ─── PREMIUM HEADER ─── */}
                <div className="px-10 py-8 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-inner ${isIn ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'}`}>
                       {isIn ? <FileText size={32} strokeWidth={1.5} /> : <ArrowLeftRight size={32} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black text-[#0F2747] font-tajawal">
                            {voucher.isTransfer ? 'سند تحويل مخزني' : (isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة')}
                        </h3>
                        <div className="flex items-center gap-1.5 translate-y-0.5">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white shadow-sm'}`}>
                                {isCompleted ? 'مفوتـر' : 'قيد المراجعة'}
                            </span>
                            {isEdited && (
                                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-indigo-500 text-white flex items-center gap-1 shadow-sm">
                                    <RotateCcw size={10} /> معدّل
                                </span>
                            )}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-400 font-readex flex items-center gap-1.5 opacity-80">
                         <Timer size={14} className="text-slate-300" /> {voucher.timestamp.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar p-10 ${showVoucherHistory ? 'border-l border-slate-100' : ''}`}>
                    
                    {/* ─── INFO CARDS ─── */}
                    <div className="grid grid-cols-12 gap-4 mb-10">
                       <div className="col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3 text-slate-400">
                             <User size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">المستلم / الجهة</span>
                          </div>
                          <p className="text-sm font-black text-[#0F2747] truncate">{voucher.clientName}</p>
                       </div>
                       
                       <div className="col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3 text-slate-400">
                             <Hash size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">رقم السند</span>
                          </div>
                          <p className="text-sm font-black text-[#0F2747] tabular-nums tracking-wider">{voucher.voucherCode || '—'}</p>
                       </div>

                       <div className="col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3 text-slate-400">
                             <MessageSquare size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">ملاحظات إضافية</span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 line-clamp-1 leading-relaxed">
                             {cleanNote(voucher.line_note)}
                             {invoiceDate && <span className="mr-2 text-emerald-600 font-black px-2 py-0.5 bg-emerald-50 rounded-lg text-[9px] uppercase border border-emerald-100">مفوتر بتاريخ: {invoiceDate}</span>}
                          </p>
                       </div>
                    </div>

                    {/* ─── ITEMS TABLE ─── */}
                    <div className="flex-1 min-h-0 flex flex-col">
                       <div className="flex items-center justify-between mb-4 px-2">
                           <h4 className="text-xs font-black text-[#0f2747] uppercase tracking-widest flex items-center gap-2">
                               <Activity size={14} className="text-teal-500" /> قائمة الأصناف المسجلة
                           </h4>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{lines.length} صنف مضاف</span>
                       </div>
                       <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-sm flex-1">
                          <table className="w-full text-right border-collapse">
                             <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                   <th className="px-8 py-5 w-16 text-center border-l border-slate-50">م</th>
                                   <th className="px-8 py-5">وصف الصنف</th>
                                   <th className="px-8 py-5 text-center w-32 border-x border-slate-50">الكمية</th>
                                   <th className="px-8 py-5 text-center w-32">القسم</th>
                                   {!isCompleted && <th className="px-8 py-5 text-center w-20 border-r border-slate-50">إجراء</th>}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                   <tr key={line.id || idx} className="group hover:bg-slate-50/50 transition-colors">
                                      <td className="px-8 py-4 text-center text-slate-300 font-readex text-[11px] font-black">{idx + 1}</td>
                                      <td className="px-8 py-4">
                                         <p className="text-[13px] font-black text-[#0F2747] mb-0.5 group-hover:text-teal-600 transition-colors">{(line.item || '').replace(/\s*-\s*-$/, '').replace(/\s*-\s*بدون شركة$/, '').trim()}</p>
                                         <span className="text-[9px] font-bold text-slate-400 tracking-wider">الشركة: {line.company === '-' || !line.company ? '—' : line.company}</span>
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                         <span className="text-base font-black text-[#0F2747] tabular-nums">{line.qty}</span>
                                         <span className="mr-1 text-[10px] font-bold text-slate-400">{line.unit}</span>
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                         <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{line.cat || '-'}</span>
                                      </td>
                                      {!isCompleted && (
                                         <td className="px-8 py-4 text-center">
                                            <button onClick={() => handleDeleteTransaction(line.id)} className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                               <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                         </td>
                                      )}
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    {/* ─── FOOTER ACTIONS ─── */}
                    <div className="flex items-center justify-between gap-4 mt-10 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                             {/* Placeholder for future left-side actions */}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowVoucherHistory(!showVoucherHistory)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all ${showVoucherHistory ? 'bg-[#0f2747] text-white shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                                <History size={20} strokeWidth={2.5} /> سجل التغييرات
                            </button>
                            {!isCompleted && !voucher.isTransfer && (
                                <button onClick={() => handleMarkAsInvoiced(voucher)} className="px-10 py-4 bg-teal-500 text-white rounded-2xl text-sm font-black hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/20 active:scale-95 flex items-center gap-3">
                                    <CheckCircle2 size={20} strokeWidth={2.5} /> {isIn ? 'اعتماد الوارد' : 'إصدار الفاتورة'}
                                </button>
                            )}
                        </div>
                    </div>
                  </div>

                  {/* ─── HISTORY SIDEBAR (PREMIUM COMPARISON) ─── */}
                  {showVoucherHistory && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 440, opacity: 1 }} className="bg-[#f8fafb] flex flex-col shrink-0 border-r border-slate-100 shadow-inner">
                      <div className="p-8 bg-white/50 border-b border-slate-100">
                         <h4 className="text-sm font-black text-[#0F2747] flex items-center gap-3">
                             <Activity size={18} className="text-indigo-600" /> أرشيف التعديلات المحفوظة
                         </h4>
                         <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">مقارنة لحظية مع السند الحالي</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                         {historyEntries.length > 0 ? (
                            historyEntries.map((entry, idx) => {
                               const oldLines = entry.lines || [];
                               return (
                                   <div key={idx} className="relative">
                                       {/* Timeline Dot */}
                                       <div className="absolute top-0 -right-[27px] w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10 shadow-sm" />
                                       
                                       <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                           <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                                               <span className="text-[11px] font-black text-[#0f2747] tabular-nums">
                                                   {new Date(entry.at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                               </span>
                                               <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full uppercase border border-indigo-100/50 shadow-sm">نسخة سابقة</span>
                                           </div>
                                           <div className="p-5">
                                               <table className="w-full text-right text-[11px]">
                                                   <thead>
                                                       <tr className="text-slate-400 font-black uppercase tracking-tighter">
                                                           <th className="pb-3 px-1">الصنف المـؤرشف</th>
                                                           <th className="pb-3 text-center w-16">الكمية</th>
                                                       </tr>
                                                   </thead>
                                                   <tbody className="divide-y divide-slate-50">
                                                       {oldLines.map((ol, oIdx) => {
                                                           const currentMatch = lines.find(cl => cl.item === ol.item);
                                                           const isChanged = currentMatch && Number(currentMatch.qty) !== Number(ol.qty);
                                                           const isRemoved = !currentMatch;
                                                           
                                                           return (
                                                               <tr key={oIdx} className={`transition-colors ${isRemoved ? 'bg-rose-50/40' : isChanged ? 'bg-amber-50/40' : ''}`}>
                                                                   <td className={`py-3 px-2 font-black leading-snug ${isRemoved ? 'text-rose-600' : isChanged ? 'text-amber-700' : 'text-[#0f2747]/70'}`}>
                                                                       {ol.item}
                                                                       <div className="flex gap-1 mt-1">
                                                                          {isRemoved && <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm">محذوف حالياً</span>}
                                                                          {isChanged && <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-sm">تعدل إلى {currentMatch.qty}</span>}
                                                                       </div>
                                                                   </td>
                                                                   <td className="py-3 text-center font-black tabular-nums text-slate-800">{ol.qty}</td>
                                                               </tr>
                                                           );
                                                       })}
                                                   </tbody>
                                               </table>
                                               {entry.notes && (
                                                  <div className="mt-4 pt-4 border-t border-slate-50">
                                                     <p className="text-[10px] text-slate-400 bg-slate-50/80 p-3 rounded-2xl italic font-bold">
                                                        <MessageSquare size={10} className="inline ml-1 opacity-50" />
                                                        {entry.notes}
                                                     </p>
                                                  </div>
                                               )}
                                           </div>
                                       </div>
                                   </div>
                               );
                            })
                         ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-200 opacity-50">
                               <History size={64} strokeWidth={1} className="mb-4" />
                               <p className="text-sm font-black font-tajawal uppercase tracking-widest">لا يوجد سجل محفوظ</p>
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
