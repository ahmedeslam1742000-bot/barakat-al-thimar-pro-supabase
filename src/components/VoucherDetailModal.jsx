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
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`w-full ${showVoucherHistory ? 'max-w-[1200px]' : 'max-w-4xl'} bg-white rounded-[24px] shadow-2xl border border-slate-100/60 flex flex-col max-h-[85vh] overflow-hidden transition-all duration-500`}
        >
          {(() => {
            const lines = voucher.lines || [];
            return (
              <>
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isIn ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                       {isIn ? <FileText size={28} /> : <Printer size={28} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0F2747] font-tajawal tracking-tight">
                        {voucher.isTransfer ? 'تحويل مخزني' : (isIn ? 'تفاصيل سند إدخال' : 'تفاصيل سند إخراج')}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-bold text-slate-400 font-readex flex items-center gap-1.5">
                          <Timer size={14} /> {voucher.timestamp.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-tajawal ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isCompleted ? 'تمت الفوترة' : 'قيد الانتظار'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all active:scale-90">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex flex-1 overflow-hidden">
                  <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 ${showVoucherHistory ? 'border-l border-slate-100' : ''}`}>
                    {/* Voucher Meta Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                       <div className="p-5 rounded-[20px] bg-slate-50/50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 font-readex">الجهة / المستلم</p>
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400"><User size={18} /></div>
                             <p className="text-sm font-bold text-[#0F2747] font-tajawal">{voucher.clientName}</p>
                          </div>
                       </div>
                       <div className="p-5 rounded-[20px] bg-slate-50/50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 font-readex">كود المستند</p>
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400"><History size={18} /></div>
                             <p className="text-sm font-black text-[#0F2747] font-readex tabular-nums">{voucher.voucherCode || 'غير متوفر'}</p>
                          </div>
                       </div>
                       <div className="p-5 rounded-[20px] bg-slate-50/50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 font-readex">إجمالي الكمية</p>
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400"><Layers size={18} /></div>
                             <p className="text-sm font-black text-[#0F2747] font-readex tabular-nums">{voucher.quantity} وحدة</p>
                          </div>
                       </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                       <div className="flex items-center justify-between mb-5">
                          <h4 className="text-sm font-bold text-[#0F2747] font-tajawal">الأصناف المسجلة</h4>
                          <span className="text-[10px] font-bold text-slate-400 font-readex">{lines.length} صنف</span>
                       </div>
                       <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                          <table className="w-full text-right border-collapse">
                             <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-readex">الصنف والشركة</th>
                                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-readex text-center">الكمية</th>
                                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-readex text-center">الوحدة</th>
                                   {!isCompleted && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-readex text-center">إجراء</th>}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                   <tr key={line.id || idx} className="group hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4">
                                         <p className="text-sm font-bold text-[#0F2747] font-tajawal">{line.item}</p>
                                         <p className="text-[10px] text-slate-400 font-readex mt-0.5">{line.company} • {line.cat}</p>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                         <span className="text-sm font-black text-[#0F2747] font-readex tabular-nums">{line.qty}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                         <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 font-readex">{line.unit}</span>
                                      </td>
                                      {!isCompleted && (
                                         <td className="px-6 py-4 text-center">
                                            <button 
                                              disabled={loading}
                                              onClick={() => handleDeleteTransaction(line.id)}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
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

                    {/* Note Editor */}
                    <div className="mb-6 p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 border-dashed">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 font-readex flex items-center gap-2">
                          <Activity size={14} /> ملاحظات السند
                       </h4>
                       <textarea
                         className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all font-tajawal min-h-[60px] resize-none"
                         defaultValue={voucher.line_note?.split(/\[تعديل حديث\]|<!--/)[0].trim() || ''}
                         placeholder="أضف ملاحظاتك هنا..."
                         onBlur={(e) => updateVoucherNote(voucher, e.target.value)}
                       />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-4 mt-auto pt-6 border-t border-slate-100">
                       <div className="flex items-center gap-3">
                          <button
                            onClick={() => printVoucher(voucher)}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0F2747] text-white text-sm font-bold hover:bg-[#15345b] shadow-lg shadow-indigo-900/20 transition-all active:scale-95 font-tajawal"
                          >
                             <Printer size={18} /> طباعة السند
                          </button>
                          <button
                            onClick={() => duplicateVoucher(voucher)}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-[#0F2747] text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 font-tajawal"
                          >
                             <RotateCcw size={18} /> تكرار السند
                          </button>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          {!isCompleted && !voucher.isTransfer && (
                             <button
                               onClick={() => {
                                  setSelectedVoucher(voucher);
                                  setIsVoucherModalOpen(true);
                               }}
                               className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 font-tajawal"
                             >
                                <CheckCircle2 size={18} /> {isIn ? 'اعتماد الإدخال' : 'إصدار فاتورة'}
                             </button>
                          )}
                          <button
                            onClick={() => setShowVoucherHistory(!showVoucherHistory)}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all font-tajawal ${showVoucherHistory ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                          >
                             <History size={18} /> سجل التغييرات
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* History Sidebar */}
                  {showVoucherHistory && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 380, opacity: 1 }}
                      className="bg-slate-50/50 flex flex-col shrink-0 overflow-hidden"
                    >
                      <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50">
                         <h4 className="text-sm font-bold text-[#0F2747] font-tajawal">سجل الحركات</h4>
                         <span className="text-[10px] font-black text-slate-400 font-readex uppercase tracking-widest">الأحدث أولاً</span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                         {lines.some(l => l.historyLog) ? (
                            lines.map(l => l.historyLog).filter(Boolean).flat().sort((a,b) => new Date(b.at) - new Date(a.at)).map((entry, idx) => (
                               <div key={idx} className="relative pr-6 pb-6 border-r-2 border-slate-200 last:pb-0">
                                  <div className="absolute top-0 -right-[7px] w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                                  <div className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-100">
                                     <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase font-readex">{entry.type === 'edit' ? 'تعديل بيانات' : 'عملية نظام'}</p>
                                        <p className="text-[9px] font-bold text-slate-300 font-readex">{new Date(entry.at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                                     </div>
                                     <p className="text-[11px] font-bold text-slate-600 font-tajawal leading-relaxed">{entry.msg}</p>
                                     <p className="text-[9px] font-black text-slate-400 mt-2 font-readex">بواسطة: {entry.by || 'النظام'}</p>
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center px-10">
                               <History size={32} strokeWidth={1.5} className="mb-4 opacity-50" />
                               <p className="text-xs font-bold font-tajawal">لا يوجد سجل تاريخي متاح لهذه السند حالياً</p>
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
