import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, Trash2, History, RotateCcw,
  FileText, CheckCircle2, Timer, User,
  Hash, MessageSquare, Package, ChevronRight
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
    // Remove all system tags and history markers
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
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className={`w-full ${showVoucherHistory ? 'max-w-6xl' : 'max-w-4xl'} bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300`}
        >
          {/* HEADER */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isIn ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f2747]">
                  {voucher.isTransfer ? 'سند تحويل مخزني' : (isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة')}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                    {isCompleted ? 'مفوتـر' : 'قيد المراجعة'}
                  </span>
                  {isEdited && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">معدّل</span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-2">
                    <Timer size={12} /> {voucher.timestamp.toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
              
              {/* TOP INFO STRIP */}
              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase tracking-widest">المستلم</span>
                  <p className="text-sm font-black text-[#0f2747] truncate">{voucher.clientName}</p>
                </div>
                <div className="w-32 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase tracking-widest">رقم السند</span>
                  <p className="text-sm font-black text-[#0f2747] tabular-nums">{voucher.voucherCode || '-'}</p>
                </div>
                <div className="flex-[2] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase tracking-widest">الملاحظات</span>
                  <p className="text-xs font-bold text-slate-600 truncate">{cleanNote(voucher.line_note)}</p>
                </div>
              </div>

              {/* TABLE AREA */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Package size={16} className="text-teal-500" />
                  <h4 className="text-xs font-black text-[#0f2747] uppercase tracking-widest">قائمة الأصناف</h4>
                  <span className="text-[10px] font-bold text-slate-300 mr-auto">{lines.length} صنف</span>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4 text-center w-12">م</th>
                        <th className="px-6 py-4">الصنف</th>
                        <th className="px-6 py-4 text-center w-24">الكمية</th>
                        <th className="px-6 py-4 text-center w-24">القسم</th>
                        {!isCompleted && <th className="px-6 py-4 text-center w-16">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-3 text-center text-slate-300 font-readex text-xs">{idx + 1}</td>
                          <td className="px-6 py-3">
                            <p className="text-[13px] font-black text-[#0f2747]">{(line.item || '').replace(/\s*-\s*-$/, '').trim()}</p>
                            <span className="text-[9px] font-bold text-slate-400">{line.company || '—'}</span>
                          </td>
                          <td className="px-6 py-3 text-center font-black text-sm tabular-nums">{line.qty}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{line.cat || '-'}</span>
                          </td>
                          {!isCompleted && (
                            <td className="px-6 py-3 text-center">
                              <button onClick={() => handleDeleteTransaction(line.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
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

              {/* BUTTONS */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => printVoucher(voucher)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all">
                    <Printer size={16} /> طباعة
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowVoucherHistory(!showVoucherHistory)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${showVoucherHistory ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                    <History size={16} /> سجل التغييرات
                  </button>
                  {!isCompleted && !voucher.isTransfer && (
                    <button onClick={() => handleMarkAsInvoiced(voucher)} className="flex items-center gap-2 px-8 py-3 bg-teal-500 text-white rounded-xl text-xs font-black hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-95">
                      <CheckCircle2 size={16} /> {isIn ? 'اعتماد الوارد' : 'إصدار الفاتورة'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* HISTORY SIDEBAR */}
            <AnimatePresence>
              {showVoucherHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 380, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="bg-[#fcfdfe] border-r border-slate-100 flex flex-col shrink-0 overflow-hidden"
                >
                  <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#0f2747] flex items-center gap-2">
                      <History size={16} className="text-indigo-600" /> نسخ السند السابقة
                    </h4>
                    <button onClick={() => setShowVoucherHistory(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {historyEntries.map((entry, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-500 tabular-nums">{new Date(entry.at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded border border-indigo-100">محفوظة</span>
                        </div>
                        <div className="p-3">
                          <table className="w-full text-right text-[10px]">
                            <tbody className="divide-y divide-slate-50">
                              {(entry.lines || []).map((ol, oIdx) => {
                                const current = lines.find(cl => cl.item === ol.item);
                                const diff = current ? (Number(current.qty) !== Number(ol.qty)) : true;
                                return (
                                  <tr key={oIdx} className={diff ? 'bg-amber-50/40' : ''}>
                                    <td className={`py-1.5 font-bold ${diff ? 'text-amber-700' : 'text-slate-600'}`}>{ol.item}</td>
                                    <td className="py-1.5 text-center font-black">{ol.qty}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
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
