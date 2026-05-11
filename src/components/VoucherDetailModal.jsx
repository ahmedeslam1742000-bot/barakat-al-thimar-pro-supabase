import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, Trash2, History, RotateCcw,
  FileText, CheckCircle2, Timer, User,
  Hash, MessageSquare, Package, ChevronRight,
  ArrowLeft
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

  const cleanNote = (note) => {
    if (!note) return '—';
    return note
      .split(/\[تعديل بعد الفوترة\]|\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0]
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
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.99, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.99, y: 10 }}
          className={`w-full ${showVoucherHistory ? 'max-w-[1240px]' : 'max-w-5xl'} bg-[#fcfdfe] rounded-[2.5rem] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-all duration-300 border border-white`}
        >
          {/* ─── ENHANCED HEADER WITH INTEGRATED INFO ─── */}
          <div className="px-10 py-8 bg-white border-b border-slate-100 flex flex-col gap-6 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isIn ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'}`}>
                        {isIn ? <FileText size={28} /> : <Package size={28} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-[#0f2747]">
                                {voucher.isTransfer ? 'سند تحويل مخزني' : (isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة')}
                            </h3>
                            <div className="flex gap-1.5 translate-y-0.5">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white shadow-sm'}`}>
                                    {isCompleted ? 'مفوتـر' : 'قيد المراجعة'}
                                </span>
                                {isEdited && (
                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-indigo-500 text-white shadow-sm">معدّل</span>
                                )}
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                            <Timer size={14} className="opacity-50" /> {voucher.timestamp.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>

            {/* INTEGRATED META STRIP (Moved from cards to header strip) */}
            <div className="flex items-center gap-8 px-2 py-1 border-t border-slate-50 pt-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><User size={14} /></div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">المستلم</span>
                        <p className="text-[13px] font-black text-[#0f2747]">{voucher.clientName}</p>
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Hash size={14} /></div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">رقم المستند</span>
                        <p className="text-[13px] font-black text-[#0f2747] tabular-nums">{voucher.voucherCode || '-'}</p>
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><MessageSquare size={14} /></div>
                    <div className="min-w-0">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">الملاحظات</span>
                        <p className="text-[13px] font-bold text-slate-600 truncate leading-tight">{cleanNote(voucher.line_note)}</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden bg-[#fcfdfe]">
            {/* ─── MAIN TABLE VIEW ─── */}
            <div className="flex-1 flex flex-col p-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-5 px-1">
                  <h4 className="text-xs font-black text-[#0f2747] uppercase tracking-[0.15em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div> قائمة الأصناف الحالية
                  </h4>
                  <span className="text-[10px] font-black text-slate-300 uppercase">{lines.length} صنف مسجل</span>
              </div>
              
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex-1 flex flex-col">
                  <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full text-right border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 w-16 text-center">م</th>
                            <th className="px-8 py-5">اسم الصنف</th>
                            <th className="px-8 py-5 text-center w-32 border-x border-slate-50">الكمية</th>
                            <th className="px-8 py-5 text-center w-32">القسم</th>
                            {!isCompleted && <th className="px-8 py-5 text-center w-20 border-r border-slate-50">حذف</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {lines.map((line, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-all duration-200">
                              <td className="px-8 py-4 text-center text-slate-300 font-black text-[11px]">{idx + 1}</td>
                              <td className="px-8 py-4">
                                <p className="text-[14px] font-black text-[#0f2747] group-hover:text-teal-600">{(line.item || '').replace(/\s*-\s*-$/, '').trim()}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-slate-400">الشركة: {line.company || '—'}</span>
                                    <span className="text-[9px] font-bold text-slate-400">•</span>
                                    <span className="text-[9px] font-bold text-slate-400">الوحدة: {line.unit || '—'}</span>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className="text-base font-black text-[#0f2747] tabular-nums">{line.qty}</span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{line.cat || '-'}</span>
                              </td>
                              {!isCompleted && (
                                <td className="px-8 py-4 text-center">
                                  <button onClick={() => handleDeleteTransaction(line.id)} className="w-9 h-9 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
              </div>

              <div className="flex items-center justify-between mt-10 shrink-0">
                <button onClick={() => printVoucher(voucher)} className="flex items-center gap-3 px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm">
                    <Printer size={18} /> معاينة الطباعة
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setShowVoucherHistory(!showVoucherHistory)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black transition-all ${showVoucherHistory ? 'bg-[#0f2747] text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                    <History size={18} /> {showVoucherHistory ? 'إغلاق السجل' : 'عرض سجل التغييرات'}
                  </button>
                  {!isCompleted && !voucher.isTransfer && (
                    <button onClick={() => handleMarkAsInvoiced(voucher)} className="flex items-center gap-3 px-10 py-4 bg-teal-500 text-white rounded-2xl text-sm font-black hover:bg-teal-600 shadow-xl shadow-teal-500/20 active:scale-95 transition-all">
                      <CheckCircle2 size={20} /> {isIn ? 'اعتماد الوارد' : 'إصدار الفاتورة'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ─── ENHANCED HISTORY SIDEBAR (Matches Current Design) ─── */}
            <AnimatePresence>
              {showVoucherHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 440, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="bg-[#f8fafb] border-r border-slate-100 flex flex-col shrink-0 overflow-hidden shadow-inner"
                >
                  <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-indigo-600" />
                        <div>
                            <h4 className="text-sm font-black text-[#0f2747]">النسخ المؤرشفة</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">تتبع التغييرات الزمنية</p>
                        </div>
                    </div>
                    <button onClick={() => setShowVoucherHistory(false)} className="text-slate-300 hover:text-slate-600">
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {historyEntries.map((entry, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline Marker */}
                        <div className="absolute top-0 -right-[27px] w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10 shadow-sm" />
                        
                        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                          <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
                            <span className="text-[11px] font-black text-[#0f2747] tabular-nums">
                                {new Date(entry.at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[9px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 uppercase tracking-tighter">نسخة مؤرشفة</span>
                          </div>
                          
                          <div className="p-5">
                            <table className="w-full text-right text-[11px] mb-4">
                              <thead>
                                <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                                  <th className="pb-3 pr-1">الصنف المـؤرشف</th>
                                  <th className="pb-3 text-center w-20">الكمية</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {(entry.lines || []).map((ol, oIdx) => {
                                  const currentMatch = lines.find(cl => cl.item === ol.item);
                                  const isChanged = currentMatch && Number(currentMatch.qty) !== Number(ol.qty);
                                  const isRemoved = !currentMatch;
                                  
                                  return (
                                    <tr key={oIdx} className={`transition-colors ${isRemoved ? 'bg-rose-50/50' : isChanged ? 'bg-amber-50/50' : ''}`}>
                                      <td className={`py-2.5 px-2 font-black leading-tight ${isRemoved ? 'text-rose-500' : isChanged ? 'text-amber-700' : 'text-slate-700'}`}>
                                        {ol.item}
                                        <div className="flex gap-1 mt-1">
                                            {isRemoved && <span className="text-[8px] font-black text-rose-600">× محذوف</span>}
                                            {isChanged && <span className="text-[8px] font-black text-amber-600 flex items-center gap-1">
                                                <ArrowLeft size={8} /> تعدل إلى {currentMatch.qty}
                                            </span>}
                                        </div>
                                      </td>
                                      <td className="py-2.5 text-center font-black tabular-nums">{ol.qty}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {entry.notes && (
                                <div className="mt-2 pt-3 border-t border-slate-50 flex items-start gap-2">
                                    <MessageSquare size={12} className="text-slate-300 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-slate-400 italic line-clamp-2 leading-relaxed">الملاحظة وقتها: {entry.notes}</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {historyEntries.length === 0 && (
                        <div className="py-20 text-center opacity-30">
                            <History size={64} strokeWidth={1} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">لا توجد سجلات مؤرشفة</p>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
