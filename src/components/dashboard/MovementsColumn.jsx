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
         else if (movementTypeFilter === 'صادر') matches = (type === 'Issue' || type === 'out' || type === 'صادر' || type === FUNCTIONAL_OUTBOUND_TYPE || type === 'فاتورة مبيعات');
         else if (movementTypeFilter === 'فاتورة') matches = tx.invoiced === true || type === 'فاتورة مبيعات';
         else if (movementTypeFilter === 'مرتجع') matches = type === 'Return' || type === 'مرتجع' || type === 'return' || tx.status === 'مرتجع تالف';
         else if (movementTypeFilter === 'سند إدخال') matches = (type === FUNCTIONAL_INBOUND_TYPE || type === 'adjust_in') && !tx.invoiced && type !== 'فاتورة مبيعات';
         else if (movementTypeFilter === 'سند إخراج') matches = (type === FUNCTIONAL_OUTBOUND_TYPE || type === 'adjust_out') && !tx.invoiced && type !== 'فاتورة مبيعات';
       }
       
       if (matches) movements.push(tx);
    });

    return movements;
  }, [dbTransactionsList, movementTypeFilter, FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE]);

  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col bg-white rounded-[24px] border border-slate-100/80 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
            <History size={15} />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-[#0F2747] font-tajawal leading-tight">آخر الحركات</h3>
            <p className="text-[10px] text-slate-400 font-readex font-medium">{finalTransactions.length} حركة</p>
          </div>
        </div>
        <select 
          value={movementTypeFilter}
          onChange={(e) => setMovementTypeFilter(e.target.value)}
          className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-2.5 py-1.5 outline-none font-black font-tajawal shadow-sm"
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

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
        {finalTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <History size={36} strokeWidth={1.2} className="mb-3" />
            <p className="text-xs font-semibold">لم يتم تسجيل حركات</p>
          </div>
        ) : (
          <div className="space-y-2">
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
              const isDirectInvoice = tx.type === 'فاتورة مبيعات';
              const isOutbound = (type === 'issue' || type === 'out' || type === 'صادر' || isDirectInvoice);
              const isCancelled = tx.status === 'cancelled';

              if (isCancelled) {
                actionTitle = (tx.type === FUNCTIONAL_OUTBOUND_TYPE || tx.type === 'outward' || tx.type === 'Issue') ? 'سند إخراج (ملغي)' : 
                              (tx.type === FUNCTIONAL_INBOUND_TYPE || tx.type === 'in' || tx.type === 'Restock') ? 'سند إدخال (ملغي)' : 'حركة ملغاة';
                actionColor = 'text-slate-400';
                actionBg = 'bg-slate-50';
                actionIcon = <AlertTriangle size={14} className="text-rose-500 animate-pulse" />;
              } else if (isDirectInvoice) {
                actionTitle = 'فاتورة مبيعات';
                actionColor = 'text-blue-600';
                actionBg = 'bg-blue-50';
                actionIcon = <FileText size={14} />;
              } else if (isFunctionalOut) {
                if (tx.invoiced) {
                  actionTitle = 'فاتورة سند';
                  actionColor = 'text-blue-600';
                  actionBg = 'bg-blue-50';
                  actionIcon = <FileText size={14} />;
                } else if (tx.isTransfer) {
                  actionTitle = 'تحويل مخزني';
                  actionColor = 'text-emerald-600';
                  actionBg = 'bg-emerald-50';
                  actionIcon = <Box size={14} />;
                } else {
                  actionTitle = 'سند إخراج';
                  actionColor = 'text-rose-600';
                  actionBg = 'bg-rose-50';
                  actionIcon = <FileOutput size={14} />;
                }
              } else if (isFunctionalIn) {
                actionTitle = 'سند إدخال';
                actionColor = 'text-indigo-600';
                actionBg = 'bg-indigo-50';
                actionIcon = <FileInput size={14} />;
              } else if (isInbound) {
                const isAdj = type === 'adjust_in';
                actionTitle = isAdj ? 'سند إدخال (تعديل)' : 'وارد';
                actionColor = isAdj ? 'text-slate-500' : 'text-emerald-600';
                actionBg = isAdj ? 'bg-slate-50' : 'bg-emerald-50';
                actionIcon = isAdj ? <Pencil size={14} /> : <ArrowDownLeft size={14} />;
              } else if (isReturn) {
                actionTitle = 'مرتجع';
                actionColor = 'text-amber-600';
                actionBg = 'bg-amber-50';
                actionIcon = <RotateCcw size={14} />;
              } else if (isOutbound) {
                actionTitle = tx.invoiced ? 'صادر - فاتورة' : 'صادر';
                actionColor = 'text-blue-600';
                actionBg = 'bg-blue-50';
                actionIcon = <ArrowUpRight size={14} />;
              } else {
                actionTitle = tx.type || 'حركة مخزنية';
                actionColor = 'text-slate-600';
                actionBg = 'bg-slate-50';
                actionIcon = <FileCheck size={14} />;
              }

              const primaryName = (isInbound || isFunctionalIn) 
                ? (tx.supplier || tx.beneficiary || tx.recipient || tx.location || 'مورد غير محدد') 
                : (tx.beneficiary || tx.recipient || tx.supplier || tx.location || 'جهة غير محددة');
              let secondaryName = (isOutbound || isReturn || isFunctionalOut) ? (tx.rep || '') : '';
              
              if (secondaryName.trim() === primaryName.trim()) {
                secondaryName = '';
              }

              const txDate = tx.timestamp ? new Date(tx.timestamp) : new Date();
              const formattedDate = txDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => onTransactionClick(tx)}
                  className="group relative flex items-center gap-4 p-3.5 rounded-2xl border border-slate-50 bg-white hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/20 transition-all duration-300 cursor-pointer overflow-hidden no-select-click"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${actionBg} ${actionColor}`}>
                    {actionIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[10px] font-black font-tajawal uppercase tracking-wider ${actionColor}`}>{actionTitle}</p>
                      <p className="text-[9px] font-bold text-slate-300 font-readex tabular-nums">{formattedDate}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-black text-[#0F2747] font-tajawal truncate pr-1">{primaryName}</p>
                      {secondaryName && <p className="text-[10px] font-bold text-slate-400 font-tajawal bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">{secondaryName}</p>}
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
