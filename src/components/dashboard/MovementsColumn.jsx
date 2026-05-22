import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { History, FileText, FileCheck, AlertTriangle, Box, FileOutput, FileInput, Pencil, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

/**
 * MovementsColumn - Displays the history of recent transactions.
 */
export const MovementsColumn = React.memo(function MovementsColumn({ 
  dbTransactionsList, 
  movementTypeFilter, 
  setMovementTypeFilter,
  onTransactionClick,
  cardVariants,
  FUNCTIONAL_INBOUND_TYPE,
  FUNCTIONAL_OUTBOUND_TYPE
}) {
  const finalTransactions = useMemo(() => {
    const movements = [];
    const seenGroups = new Set();

    dbTransactionsList.forEach(tx => {
       if (tx.type === 'product_add' || tx.type === 'AddProduct' || tx.is_summary === true) return;

       const groupId = tx.voucherGroupId || tx.batchId || tx.reference_number || tx.id;
       if (seenGroups.has(groupId)) return;
       seenGroups.add(groupId);

       let matches = true;
       if (movementTypeFilter !== 'الكل') {
         const type = tx.type || '';
         if (movementTypeFilter === 'وارد') matches = type === 'Restock' || type === 'وارد' || type === 'in' || type === FUNCTIONAL_INBOUND_TYPE;
         else if (movementTypeFilter === 'صادر') matches = (type === 'Issue' || type === 'out' || type === 'صادر' || type === FUNCTIONAL_OUTBOUND_TYPE);
         else if (movementTypeFilter === 'فاتورة') matches = tx.isInvoice === true;
         else if (movementTypeFilter === 'مرتجع') matches = type === 'Return' || type === 'مرتجع' || type === 'return' || tx.status === 'مرتجع تالف';
         else if (movementTypeFilter === 'سند إدخال') matches = (type === FUNCTIONAL_INBOUND_TYPE || type === 'adjust_in') && !tx.isInvoice;
         else if (movementTypeFilter === 'سند إخراج') matches = (type === FUNCTIONAL_OUTBOUND_TYPE || type === 'adjust_out') && !tx.isInvoice;
       }
       
       if (matches) movements.push(tx);
    });

    return movements;
  }, [dbTransactionsList, movementTypeFilter, FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE]);

  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col bg-white dark:bg-[#111C44] rounded-[24px] shadow-sm overflow-hidden h-full border border-slate-100 dark:border-slate-800/50"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <History size={18} />
          </div>
          <div className="text-right">
            <h3 className="text-[15px] font-black text-slate-800 dark:text-white font-tajawal leading-tight mb-0.5">آخر الحركات</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-readex font-bold">{finalTransactions.length} حركة مسجلة</p>
          </div>
        </div>
        <select 
          value={movementTypeFilter}
          onChange={(e) => setMovementTypeFilter(e.target.value)}
          className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 outline-none font-black font-tajawal hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
        >
          <option value="الكل">كل الأنواع</option>
          <option value="وارد">وارد</option>
          <option value="صادر">صادر</option>
          <option value="فاتورة">فاتورة</option>
          <option value="مرتجع">مرتجع</option>
          <option value="سند إدخال">سند إدخال</option>
          <option value="سند إخراج">سند إخراج</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
        {finalTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
            <History size={36} strokeWidth={1.2} className="mb-3" />
            <p className="text-xs font-semibold">لم يتم تسجيل حركات</p>
          </div>
        ) : (
          <div className="relative before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 space-y-5">
            {finalTransactions.slice(0, 50).map((tx, idx) => {
              let actionTitle = '';
              let actionColor = 'text-slate-600';
              let actionBg = 'bg-slate-100';
              let actionIcon = <FileCheck size={14} />;

              const type = String(tx.type || '').toLowerCase();
              const isFunctionalIn = tx.type === FUNCTIONAL_INBOUND_TYPE;
              const isFunctionalOut = tx.type === FUNCTIONAL_OUTBOUND_TYPE;
              const isReturn = type === 'return' || type === 'مرتجع' || tx.status === 'مرتجع تالف';
              const isInbound = type === 'in' || type === 'وارد' || type === 'restock' || type === 'adjust_in';
              const isOutbound = (type === 'issue' || type === 'out' || type === 'صادر');
              const isCancelled = tx.status === 'cancelled';

              if (isCancelled) {
                actionTitle = (tx.type === FUNCTIONAL_OUTBOUND_TYPE || tx.type === 'outward' || tx.type === 'Issue') ? 'سند إخراج (ملغي)' : 
                              (tx.type === FUNCTIONAL_INBOUND_TYPE || tx.type === 'in' || tx.type === 'Restock') ? 'سند إدخال (ملغي)' : 'حركة ملغاة';
                actionColor = 'text-slate-400';
                actionBg = 'bg-slate-100';
                actionIcon = <AlertTriangle size={14} className="text-rose-500" />;
              } else if (isFunctionalOut) {
                if (tx.isInvoice) {
                  actionTitle = 'فاتورة سند';
                  actionColor = 'text-blue-600';
                  actionBg = 'bg-blue-100';
                  actionIcon = <FileText size={14} />;
                } else if (tx.isTransfer) {
                  actionTitle = 'تحويل مخزني';
                  actionColor = 'text-emerald-600';
                  actionBg = 'bg-emerald-100';
                  actionIcon = <Box size={14} />;
                } else {
                  actionTitle = 'سند إخراج';
                  actionColor = 'text-rose-600';
                  actionBg = 'bg-rose-100';
                  actionIcon = <FileOutput size={14} />;
                }
              } else if (isFunctionalIn) {
                actionTitle = 'سند إدخال';
                actionColor = 'text-indigo-600';
                actionBg = 'bg-indigo-100';
                actionIcon = <FileInput size={14} />;
              } else if (isInbound) {
                const isAdj = type === 'adjust_in';
                actionTitle = isAdj ? 'سند إدخال (تعديل)' : 'وارد';
                actionColor = isAdj ? 'text-slate-500' : 'text-emerald-600';
                actionBg = isAdj ? 'bg-slate-100' : 'bg-emerald-100';
                actionIcon = isAdj ? <Pencil size={14} /> : <ArrowDownLeft size={14} />;
              } else if (isReturn) {
                actionTitle = 'مرتجع';
                actionColor = 'text-amber-600';
                actionBg = 'bg-amber-100';
                actionIcon = <RotateCcw size={14} />;
              } else if (isOutbound) {
                actionTitle = tx.isInvoice ? 'صادر - فاتورة' : 'صادر';
                actionColor = 'text-blue-600';
                actionBg = 'bg-blue-100';
                actionIcon = <ArrowUpRight size={14} />;
              } else {
                actionTitle = tx.type || 'حركة مخزنية';
                actionColor = 'text-slate-600';
                actionBg = 'bg-slate-100';
                actionIcon = <FileCheck size={14} />;
              }

              const primaryName = (isInbound || isFunctionalIn) 
                ? (tx.supplier || tx.beneficiary || tx.recipient || tx.location || 'مورد غير محدد') 
                : (tx.beneficiary || tx.recipient || tx.supplier || tx.location || 'جهة غير محددة');
              const secondaryName = (isOutbound || isReturn || isFunctionalOut) ? (tx.rep || '') : '';

              const txDate = tx.timestamp ? new Date(tx.timestamp) : new Date();
              const formattedDate = txDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => onTransactionClick(tx)}
                  className="group relative flex items-start gap-4 cursor-pointer no-select-click"
                >
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white dark:border-[#111C44] transition-transform group-hover:scale-110 ${actionBg} ${actionColor}`}>
                    {actionIcon}
                  </div>
                  <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 group-hover:shadow-sm transition-all duration-300 mt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className={`text-[11px] font-black font-tajawal uppercase tracking-wider ${actionColor}`}>{actionTitle}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-readex tabular-nums">{formattedDate}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-black text-slate-800 dark:text-white font-tajawal truncate pr-1">{primaryName}</p>
                      {secondaryName && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-tajawal bg-slate-200/50 dark:bg-slate-700/50 px-2.5 py-0.5 rounded-md shrink-0">{secondaryName}</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});
