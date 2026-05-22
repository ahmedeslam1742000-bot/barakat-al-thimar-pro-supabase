import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileInput, FileOutput, Box, RotateCcw, ArrowDownLeft, ArrowUpRight, Calendar, User, Activity, Eye, RefreshCw } from 'lucide-react';
import { getItemName, isInvalidCompany } from '../lib/itemFields';

/**
 * TransactionDetailModal - Displays detailed information about a batch of transactions.
 */
export function TransactionDetailModal({ 
  isOpen, 
  onClose, 
  transactions, 
  items,
  FUNCTIONAL_INBOUND_TYPE,
  FUNCTIONAL_OUTBOUND_TYPE
}) {
  if (!isOpen || !transactions || transactions.length === 0) return null;

  const firstTx = transactions[0];
  const type = String(firstTx.type || '').toLowerCase();
  const isFunctionalIn = firstTx.isFunctional && (type === 'in' || type === 'سند إدخال' || (firstTx.item && firstTx.item.includes('ملخص سند')));
  const isFunctionalOut = firstTx.isFunctional && (type === 'outward' || type === 'سند إخراج' || (firstTx.item && (firstTx.item.includes('ملخص عهده') || firstTx.item.includes('عهده'))));
  const isReturn = type === 'return' || type === 'مرتجع' || firstTx.status === 'مرتجع تالف';
  const isInbound = !isFunctionalIn && (type === 'in' || type === 'وارد' || type === 'restock' || type === 'adjust_in');
  const isOutbound = !isFunctionalOut && (type === 'issue' || type === 'out' || type === 'صادر' || type === 'outward');

  let typeLabel = '';
  let themeColor = 'indigo';
  let themeIcon = <FileText size={28} />;

  if (isFunctionalIn) {
    typeLabel = 'سند إدخال';
    themeColor = 'indigo';
    themeIcon = <FileInput size={28} />;
  } else if (isFunctionalOut) {
    const isTransfer = firstTx.isTransfer;
    const isInvoicedVoucher = firstTx.isInvoice;
    typeLabel = isTransfer ? 'تحويل مخزني' : (isInvoicedVoucher ? 'فاتورة سند' : 'سند إخراج');
    themeColor = isTransfer ? 'emerald' : (isInvoicedVoucher ? 'blue' : 'rose');
    themeIcon = isTransfer ? <Box size={28} /> : (isInvoicedVoucher ? <FileText size={28} /> : <FileOutput size={28} />);
  } else if (isInbound) {
    const isAdj = type === 'adjust_in';
    typeLabel = isAdj ? 'سند إدخال (تعديل)' : 'حركة وارد';
    themeColor = isAdj ? 'slate' : 'emerald';
    themeIcon = isAdj ? <ArrowDownLeft size={28} /> : <ArrowDownLeft size={28} />;
  } else if (isReturn) {
    typeLabel = 'مرتجع مخزني';
    themeColor = 'amber';
    themeIcon = <RotateCcw size={28} />;
  } else if (isOutbound) {
    typeLabel = firstTx.isInvoice ? 'فاتورة مبيعات' : 'حركة صادر';
    themeColor = 'blue';
    themeIcon = <ArrowUpRight size={28} />;
  } else {
    typeLabel = 'حركة مخزنية';
    themeColor = 'slate';
    themeIcon = <FileText size={28} />;
  }

  const txDate = firstTx.timestamp ? new Date(firstTx.timestamp) : new Date();
  const formattedDate = txDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const isSalesInvoice = isOutbound && firstTx.isInvoice;
  const primaryName = isSalesInvoice 
    ? (firstTx.rep || 'مندوب غير محدد')
    : (isInbound || isFunctionalIn) 
      ? (firstTx.supplier || firstTx.beneficiary || firstTx.recipient || firstTx.location || 'بدون مورد') 
      : (firstTx.beneficiary || firstTx.recipient || firstTx.supplier || firstTx.location || 'جهة غير محددة');
  
  const isModifiedVoucher = firstTx.isEdited;
  const currentNotes = (firstTx.notes || '')
                        .split(/فاتورة مباشرة|\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0]
                        .trim();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-8 py-8 shrink-0 overflow-hidden">
             <div className={`absolute inset-0 bg-gradient-to-br ${
               themeColor === 'rose' ? 'from-rose-500 to-rose-700' : 
               themeColor === 'emerald' ? 'from-emerald-500 to-teal-700' : 
               themeColor === 'amber' ? 'from-amber-500 to-orange-600' : 
               'from-indigo-500 to-blue-700'
             } transition-all duration-500`} />
             <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl animate-pulse" />
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[22px] flex items-center justify-center text-white shadow-2xl border border-white/30">
                         {themeIcon}
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-xl font-black font-tajawal text-white tracking-tight">{typeLabel}</h3>
                         </div>
                         <div className="flex items-center gap-4 text-white/80">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold font-readex">
                               <Calendar size={12} className="opacity-70" />
                               {formattedDate}
                            </div>

                            {isModifiedVoucher && (
                              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg">
                                 <RefreshCw size={10} className="animate-spin-slow" />
                                 معدل
                              </span>
                            )}
                         </div>
                      </div>
                   </div>
                   
                   <button 
                     onClick={onClose}
                     className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-90 border border-white/10"
                   >
                      <X size={20} />
                   </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                   <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 group/card transition-all hover:bg-white/15">
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">الجهة</p>
                      <div className="flex items-center gap-2">
                         <User size={14} className="text-white/80" />
                         <p className="text-xs font-black text-white truncate">{primaryName}</p>
                      </div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 group/card transition-all hover:bg-white/15 overflow-hidden">
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">ملاحظات</p>
                      <div className="flex items-center gap-2">
                         <FileText size={14} className="text-white/80" />
                         <p className="text-xs font-bold text-white truncate italic opacity-90">
                            {currentNotes || 'لا توجد ملاحظات'}
                         </p>
                      </div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 group/card transition-all hover:bg-white/15">
                      <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">النوع</p>
                      <div className="flex items-center gap-2">
                         <Activity size={14} className="text-white/80" />
                         <p className="text-xs font-black text-white flex items-center gap-2">
                            {typeLabel}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50/30 custom-scrollbar">
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-50/50 text-slate-400 font-black text-[9px] uppercase tracking-widest border-b border-slate-100 sticky top-0 backdrop-blur-md z-10">
                       <tr>
                          <th className="px-4 py-3 text-center w-10">م</th>
                          <th className="px-4 py-3 text-right">الصنف</th>
                          <th className="px-4 py-3 text-center">الشركة</th>
                          <th className="px-4 py-3 text-center">القسم</th>
                          <th className="px-4 py-3 text-center">الوحدة</th>
                          <th className="px-4 py-3 text-center">الكمية</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {transactions.filter(t => t.is_summary !== true).map((tx, idx) => {
                         const itemFromId = tx.item_id ? items.find(i => i.id === tx.item_id) : null;
                         const itemName = getItemName({ name: itemFromId ? itemFromId.name : (tx.item || tx.itemName || 'صنف غير معروف') });
                         const itemCompany = itemFromId ? itemFromId.company : (tx.company || '');
                         const itemCat = tx.cat || itemFromId?.cat || '-';
                         
                         return (
                           <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-3 text-center font-black text-slate-300 tabular-nums">{idx + 1}</td>
                              <td className="px-4 py-3">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">{itemName}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <span className="text-[10px] font-bold text-slate-500">{!isInvalidCompany(itemCompany) ? itemCompany : '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">
                                    {itemCat}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <span className="text-[10px] font-bold text-slate-400">{tx.unit || 'وحدة'}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <div className={`text-xs font-black tabular-nums ${isInbound || isFunctionalIn || type === 'return' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isInbound || isFunctionalIn || type === 'return' ? `+${Math.abs(tx.qty)}` : `-${Math.abs(tx.qty)}`}
                                 </div>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
               </div>
           </div>

          {/* Footer Section */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-6">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">الإجمالي</span>
                   <p className="text-base font-black text-slate-800 font-tajawal tabular-nums">
                      {transactions.reduce((acc, curr) => acc + Number(curr.qty || 0), 0)} وحدة
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                {transactions.some(t => t.receipt_image) && (
                  <button 
                    onClick={() => window.open(transactions.find(t => t.receipt_image).receipt_image, '_blank')}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-200 transition-all active:scale-95 border border-emerald-200"
                  >
                     <Eye size={16} />
                     عرض الفاتورة
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className={`px-8 py-2 rounded-xl text-xs font-black text-white shadow-lg transition-all active:scale-95 ${
                    themeColor === 'amber' ? 'bg-amber-600 shadow-amber-600/30' :
                    themeColor === 'rose' ? 'bg-rose-600 shadow-rose-600/30' :
                    themeColor === 'emerald' ? 'bg-emerald-600 shadow-emerald-600/30' :
                    'bg-indigo-600 shadow-indigo-600/30'
                  } hover:brightness-110`}
                >
                   إغلاق
                </button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
