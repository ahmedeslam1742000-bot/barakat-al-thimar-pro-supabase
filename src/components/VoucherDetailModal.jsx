import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, Trash2, History, RotateCcw,
  FileText, CheckCircle2, Timer, User,
  Hash, MessageSquare, Package, ChevronRight,
  ArrowLeft, Calendar
} from 'lucide-react';
import { normalizeArabic } from '../lib/arabicTextUtils';

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

  // Render Table Row
  const TableHeader = ({ isMain }) => (
    <thead className="bg-slate-100/80 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
      <tr className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
        <th className="px-4 py-3 text-center w-10">م</th>
        <th className="px-4 py-3 text-right border-x border-slate-200/50 dark:border-slate-700/50">اسم الصنف</th>
        <th className="px-4 py-3 text-center w-28">الشركة</th>
        <th className="px-4 py-3 text-center w-24 border-x border-slate-200/50 dark:border-slate-700/50">الكمية</th>
        <th className="px-4 py-3 text-center w-24">الوحدة</th>
        <th className="px-4 py-3 text-center w-28 border-x border-slate-200/50 dark:border-slate-700/50">القسم</th>
        <th className="px-4 py-3 text-center w-16">
          {isMain && !isCompleted ? 'إجراء' : ''}
        </th>
      </tr>
    </thead>
  );

  return (
    <AnimatePresence mode="wait">
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
          className={`w-full ${showVoucherHistory ? 'max-w-[95vw]' : 'max-w-5xl'} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden transition-all duration-300 border border-slate-200 dark:border-slate-700`}
        >
          {/* ─── COMPACT HEADER ─── */}
          <header className="px-6 py-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4 shrink-0 relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isIn ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {isIn ? <FileText size={24} /> : <Package size={24} />}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                                {voucher.isTransfer ? 'سند تحويل مخزني' : (isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة')}
                            </h3>
                            <div className="flex gap-1.5">
                                <span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
                                    {isCompleted ? 'مكتمل ومفوتـر' : 'قيد الانتظار'}
                                </span>
                                {isEdited && <span className="text-[10px] font-black px-2 py-1 rounded bg-indigo-500 text-white shadow-sm">معدّل</span>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {!showVoucherHistory && (
                  <div className="flex items-center gap-5 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 max-w-3xl mx-6">
                      <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">المستلم</span>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{voucher.clientName}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">رقم السند</span>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">{voucher.voucherCode || '—'}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-[2] min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">الملاحظات</span>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">{cleanNote(voucher.line_note)}</p>
                      </div>
                  </div>
                )}

                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                    <X size={24} />
                </button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden bg-white dark:bg-slate-900">
            
            {/* ─── MAIN CONTENT: CURRENT ITEMS TABLE ─── */}
            <div className={`flex flex-col p-6 overflow-hidden border-l border-slate-100 dark:border-slate-800 ${showVoucherHistory ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-sm" /> الاصدار الحالي
                  </h4>
                  <span className="text-[11px] font-black text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded flex items-center gap-1.5 shadow-sm">
                      <Calendar size={14} /> 
                      تاريخ هذا الاصدار: {voucher.timestamp.toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>

              {showVoucherHistory && (
                  <div className="flex gap-4 mb-6 bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700 h-[72px] items-center">
                      <div className="flex-1 min-w-0">
                          <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">المستلم الحالي</span>
                          <p className="text-[13px] font-black text-slate-700 dark:text-slate-200 truncate">{voucher.clientName || '—'}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 min-w-0 text-center">
                          <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">رقم السند الحالي</span>
                          <p className="text-[13px] font-black text-slate-700 dark:text-slate-200 tabular-nums">{voucher.voucherCode || '—'}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-[2] min-w-0">
                          <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">الملاحظات الحالية</span>
                          <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 truncate">{cleanNote(voucher.line_note)}</p>
                      </div>
                  </div>
              )}
              
              <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                      <table className="w-full text-right border-collapse text-sm">
                        <TableHeader isMain={true} />
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {lines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                              <td className="px-4 py-2.5 text-center text-slate-400 font-black">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-black text-slate-800 dark:text-slate-200 border-x border-slate-100 dark:border-slate-800/50 text-[13px]">{(line.item || '').replace(/\s*-\s*-$/, '').trim()}</td>
                              <td className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-500">{line.company || '—'}</td>
                              <td className="px-4 py-2.5 text-center font-black tabular-nums border-x border-slate-100 dark:border-slate-800/50 text-[14px]">{line.qty}</td>
                              <td className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-500">{line.unit || '—'}</td>
                              <td className="px-4 py-2.5 text-center border-x border-slate-100 dark:border-slate-800/50 text-[11px] font-bold text-slate-500 w-24">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded border border-indigo-100">{line.cat || '-'}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center w-16">
                                {!isCompleted && (
                                    <button onClick={() => handleDeleteTransaction(line.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                      <Trash2 size={16} />
                                    </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
              </div>

              {/* COMPACT FOOTER */}
              <footer className="flex items-center justify-between mt-6 shrink-0">
                <div />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowVoucherHistory(!showVoucherHistory)} 
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all shadow-sm ${showVoucherHistory ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                  >
                    <History size={18} /> {showVoucherHistory ? 'إغلاق السجل' : 'سجل التغييرات'}
                  </button>
                  {!isCompleted && !voucher.isTransfer && (
                    <button 
                      onClick={() => handleMarkAsInvoiced(voucher)} 
                      className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black hover:bg-emerald-600 shadow-sm active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={20} /> {isIn ? 'اعتماد الدخول' : 'تأكيد وإصدار'}
                    </button>
                  )}
                </div>
              </footer>
            </div>

            {/* ─── SIDEBAR: HISTORY TABLE (SIDE-BY-SIDE) ─── */}
            <AnimatePresence>
              {showVoucherHistory && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '50%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0 overflow-hidden"
                >
                  <div className="p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-amber-500 rounded-sm" /> الاصدار المؤرشف
                        </h4>
                        <span className="text-[11px] font-black text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded flex items-center gap-1.5 shadow-sm">
                            <Calendar size={14} /> 
                            {historyEntries.length > 0 ? (
                                <>تاريخ هذا الاصدار: {(historyEntries.length > 0 ? new Date(historyEntries[0].at) : voucher.timestamp).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                            ) : 'لا يوجد سجل'}
                        </span>
                    </div>

                    <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col shadow-sm bg-white dark:bg-slate-900 relative">
                        {historyEntries.length > 0 ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {historyEntries.map((entry, idx) => {
                                  // Determine if meta data changed in this history entry
                                  const oldClient = entry.clientName || entry.recipient || entry.client;
                                  const oldCode = entry.voucherCode || entry.code;
                                  const oldNotes = entry.notes || entry.line_note;
                                  
                                  const currentClient = voucher.clientName || voucher.recipient;
                                  const currentCode = voucher.voucherCode;
                                  const currentNotes = cleanNote(voucher.line_note);

                                  const hasOldClient = oldClient && normalizeArabic(oldClient) !== normalizeArabic(currentClient);
                                  const hasOldCode = oldCode && normalizeArabic(oldCode) !== normalizeArabic(currentCode);
                                  const hasOldNotes = oldNotes && normalizeArabic(cleanNote(oldNotes)) !== normalizeArabic(currentNotes);
                                  
                                  const hasMetaChanges = hasOldClient || hasOldCode || hasOldNotes;

                                  // Only display the first entry (most recent archive) as full view to mimic side-by-side
                                  if (idx !== 0) return null;

                                  return (
                                    <div key={idx} className="flex flex-col h-full">
                                      {hasMetaChanges && (
                                        <div className="flex gap-4 mb-6 bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700 h-[72px] items-center">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">المستلم القديم</span>
                                                <p className={`text-[13px] font-black truncate ${hasOldClient ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{oldClient || '—'}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                            <div className="flex-1 min-w-0 text-center">
                                                <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">رقم السند القديم</span>
                                                <p className={`text-[13px] font-black tabular-nums ${hasOldCode ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{oldCode || '—'}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                                            <div className="flex-[2] min-w-0">
                                                <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-widest">الملاحظات القديمة</span>
                                                <p className={`text-[13px] font-bold truncate ${hasOldNotes ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{cleanNote(oldNotes)}</p>
                                            </div>
                                        </div>
                                      )}

                                      <table className="w-full text-right border-collapse text-sm">
                                        <TableHeader isMain={false} />
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {(entry.lines || []).map((ol, oIdx) => {
                                            // Normalize the base item name (ignore company suffix after ' - ') for flexible matching
                                            const olBaseName = normalizeArabic(ol.item.split(' - ')[0].trim());
                                            
                                            // Match current line by base name only (flexible match)
                                            const currentMatch = lines.find(cl => {
                                              const clBase = normalizeArabic((cl.item || '').split(' - ')[0].trim());
                                              return clBase === olBaseName;
                                            });
                                            
                                            const isRemoved = !currentMatch;
                                            const isChanged = !isRemoved && Number(currentMatch.qty) !== Number(ol.qty);
                                            const isUnchanged = !isRemoved && !isChanged;
                                            
                                            // Extract display name & company from archived item string
                                            const parts = ol.item.split(' - ');
                                            const rawName = parts[0];
                                            const rawCompany = parts.length > 1 ? parts[1] : '—';

                                            return (
                                              <tr key={oIdx} className={`group transition-all duration-200 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${
                                                isRemoved ? 'bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-500/10' : 
                                                isChanged ? 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-500/10' : 
                                                'bg-white hover:bg-slate-50/50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                                              }`}>
                                                <td className="px-4 py-2.5 text-center text-slate-400 font-black">{oIdx + 1}</td>
                                                <td className={`px-4 py-2.5 font-black border-x border-slate-100 dark:border-slate-800/50 text-[13px] ${
                                                  isRemoved ? 'text-rose-700 dark:text-rose-400 line-through decoration-rose-300/60' : 
                                                  isChanged ? 'text-amber-700 dark:text-amber-500' : 
                                                  'text-slate-700 dark:text-slate-200'
                                                }`}>
                                                    {rawName}
                                                    {isRemoved && (
                                                      <span className="mr-3 text-[9px] font-black text-rose-600 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/30 no-underline inline-block">
                                                        🗑 محذوف
                                                      </span>
                                                    )}
                                                    {isChanged && (
                                                      <span className="mr-3 text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30 no-underline inline-block">
                                                        ✏️ تعديل كمية
                                                      </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-500">{rawCompany}</td>
                                                <td className={`px-4 py-2.5 text-center font-black tabular-nums border-x border-slate-100 dark:border-slate-800/50 text-[14px] ${
                                                  isChanged ? 'text-amber-600 dark:text-amber-400 line-through decoration-amber-300/60' : 
                                                  isRemoved ? 'text-rose-400' : 
                                                  'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {ol.qty}
                                                    {isChanged && (
                                                      <span className="text-emerald-600 dark:text-emerald-400 no-underline mr-2 text-[13px]">← {currentMatch.qty}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-500 w-24">—</td>
                                                <td className="px-4 py-2.5 text-center border-x border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-400 w-28">—</td>
                                                <td className="px-4 py-2.5 text-center w-16">
                                                  {isRemoved && <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200">حذف</span>}
                                                  {isChanged && <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200">تعديل</span>}
                                                  {isUnchanged && <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">كما هو</span>}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                <History size={64} strokeWidth={1} className="mb-4 text-slate-400" />
                                <p className="text-sm font-black text-slate-500 uppercase">لا توجد تغييرات مؤرشفة</p>
                            </div>
                        )}
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
