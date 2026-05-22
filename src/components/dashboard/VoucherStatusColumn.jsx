import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';

/**
 * VoucherStatusColumn - Displays the status of pending, completed, and cancelled vouchers.
 */
const cleanInvoiceDate = (dateStr) => {
  if (!dateStr) return '—';
  const datePart = dateStr.trim().split(/\s+/)[0];
  const parts = datePart.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return datePart;
};

export const VoucherStatusColumn = React.memo(function VoucherStatusColumn({ 
  pendingVouchers, 
  completedVouchers, 
  cancelledVouchers,
  invoiceTimestamps,
  onVoucherClick,
  onMarkAsInvoiced,
  cardVariants 
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/50 shadow-sm overflow-hidden h-full"
    >
      {/* Top Accent Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-650 shrink-0"></div>

      <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650">
            <LayoutDashboard size={15} className="animate-pulse" />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-black text-[#0F2747] font-tajawal leading-tight">حالة السندات</h3>
            <p className="text-[10px] text-slate-400 font-readex font-bold">{pendingVouchers.length} قيد الانتظار</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
        <div className="space-y-3.5">
          {/* Pending Vouchers */}
          <AnimatePresence>
            {pendingVouchers.map((voucher) => {
              const vDate = voucher.timestamp;
              const dayName = vDate.toLocaleDateString('ar-SA', { weekday: 'long' });
              const dateStr = vDate.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
              const isCompleted = voucher.invoiced === true;
              const invoiceDate = invoiceTimestamps[voucher.id] || voucher.invoiceDate;
              const sideColor = voucher.isTransfer ? '#10b981' : (voucher.kind === 'in' ? '#6366f1' : '#f59e0b');

              return (
                <div
                  key={`${voucher.id}-${voucher.batchId}`}
                  onClick={() => onVoucherClick(voucher)}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-white/60 cursor-pointer hover:bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/60 transition-all duration-300 no-select-click"
                  style={{ borderRight: `3px solid ${sideColor}` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMarkAsInvoiced(voucher);
                      }}
                      className="shrink-0 mt-0.5 cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center hover:border-emerald-600 hover:scale-105 active:scale-95 transition-all bg-white shadow-sm">
                        {isCompleted && (
                          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500 shadow-sm" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12px] font-black text-[#0F2747] font-tajawal leading-tight truncate">
                        {voucher.isTransfer ? 'تحويل مخزني' : (voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج')} - {voucher.clientName}
                      </h4>
                      {isCompleted && invoiceDate ? (
                        <p className="text-[9px] text-emerald-650 font-readex mt-1 truncate font-medium">
                          تم إصدار الفاتورة بتاريخ: {cleanInvoiceDate(invoiceDate)}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <p className="text-[9.5px] text-slate-400 font-readex font-medium truncate">
                            {dayName} - {dateStr}
                          </p>
                          {voucher.line_note && (
                            <p className="text-[9px] font-black text-indigo-600 font-tajawal truncate bg-indigo-500/5 px-2 py-0.5 rounded-lg border border-indigo-150/10 w-fit max-w-full">
                              {voucher.line_note.split(/\[تعديل بعد الفوترة\]|\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0].trim()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>

          {/* Invoiced Vouchers */}
          {completedVouchers.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <div className="h-px flex-1 bg-slate-200/60"></div>
                <span className="text-[10px] font-bold text-slate-400 font-readex uppercase tracking-wider">سندات تمت فوترتها</span>
                <div className="h-px flex-1 bg-slate-200/60"></div>
              </div>
              <AnimatePresence>
                {completedVouchers.slice(0, 10).map((voucher) => {
                  const vDate = voucher.timestamp;
                  const dayName = vDate.toLocaleDateString('ar-SA', { weekday: 'long' });
                  const dateStr = vDate.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
                  const invoiceDate = invoiceTimestamps[voucher.id] || voucher.invoiceDate;

                  return (
                    <div
                      key={`${voucher.id}-${voucher.batchId}`}
                      onClick={() => onVoucherClick(voucher)}
                      className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/20 cursor-pointer hover:bg-emerald-50/40 hover:border-emerald-350 hover:shadow-md hover:shadow-slate-100/60 transition-all duration-300 no-select-click"
                      style={{ borderRight: '3px solid #10b981' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shadow-sm">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12px] font-black text-[#0F2747] font-tajawal leading-tight truncate">
                            {voucher.isTransfer ? 'تحويل مخزني' : (voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج')} - {voucher.clientName}
                          </h4>
                          {invoiceDate ? (
                            <p className="text-[9px] text-emerald-650 font-readex mt-1 truncate font-medium">
                              تم إصدار الفاتورة بتاريخ: {cleanInvoiceDate(invoiceDate)}
                            </p>
                          ) : (
                            <p className="text-[9.5px] text-slate-400 font-readex font-medium mt-1 truncate">
                              {dayName} - {dateStr}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AnimatePresence>
            </>
          )}

          {/* Cancelled Vouchers */}
          {cancelledVouchers.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-5 mb-2.5">
                <div className="h-px flex-1 bg-rose-100/60"></div>
                <span className="text-[10px] font-bold text-rose-400 font-readex uppercase tracking-wider">سندات ملغاة</span>
                <div className="h-px flex-1 bg-rose-100/60"></div>
              </div>
              <AnimatePresence>
                {cancelledVouchers.slice(0, 5).map((voucher) => (
                  <motion.div
                    key={`${voucher.id}-${voucher.batchId}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onVoucherClick(voucher)}
                    className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 cursor-pointer hover:bg-rose-50/20 hover:border-rose-250 transition-all duration-300 opacity-70 group"
                    style={{ borderRight: '3px solid #ef4444' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6.5 h-6.5 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                         <AlertTriangle size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[12px] font-black text-slate-500 font-tajawal truncate line-through decoration-rose-350">
                          {voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج'} - {voucher.clientName}
                        </h4>
                        <p className="text-[8.5px] text-rose-450 font-medium mt-0.5">تم إلغاء هذا السند وإرجاع الكميات</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});
