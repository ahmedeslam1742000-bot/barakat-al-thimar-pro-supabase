import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';


// Clean date formatter helper
const formatDateClean = (dateStr) => {
  if (!dateStr) return '';
  try {
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;

    if (typeof dateStr === 'string' && dateStr.includes('/') && dateStr.length <= 10) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * VoucherStatusColumn - Displays the status of pending, completed, and cancelled vouchers.
 */
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
      className="flex flex-col bg-white rounded-[24px] border border-slate-100/80 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
            <LayoutDashboard size={15} />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-[#0F2747] font-tajawal leading-tight">حالة السندات</h3>
            <p className="text-[10px] text-slate-400 font-readex font-medium">{pendingVouchers.length} قيد الانتظار</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
        <div className="space-y-2">
          {/* Pending Vouchers */}
          <AnimatePresence>
            {pendingVouchers.map((voucher) => {
              const vDate = voucher.timestamp;
              const dayName = vDate.toLocaleDateString('ar-SA', { weekday: 'long' });
              const dateStr = vDate.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
              const isCompleted = voucher.invoiced === true;
              const invoiceDate = invoiceTimestamps[voucher.id] || voucher.invoiceDate;

              return (
                <div
                  key={`${voucher.id}-${voucher.batchId}`}
                  onClick={() => onVoucherClick(voucher)}
                  className="p-1.5 rounded-lg border border-slate-100 bg-white cursor-pointer hover-stable no-select-click hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMarkAsInvoiced(voucher);
                      }}
                      className="shrink-0 mt-0.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        readOnly
                        className="w-4 h-4 rounded border-2 border-slate-300 hover:border-emerald-500 cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold text-[#0F2747] font-tajawal leading-tight truncate">
                        {voucher.isTransfer ? 'تحويل مخزني' : (voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج')} - {voucher.clientName}
                      </h4>
                      {isCompleted && invoiceDate ? (
                        <p className="text-[11px] text-emerald-600 font-readex mt-1 font-bold flex items-center gap-1.5 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100/50 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          تم إصدار الفاتورة بتاريخ: {formatDateClean(invoiceDate)}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] text-slate-400 font-readex mt-0.5 truncate">
                            {dayName} - {dateStr}
                          </p>
                          {voucher.line_note && (
                            <p className="text-[9px] font-black text-indigo-500 font-tajawal truncate bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-fit max-w-full">
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
              <div className="flex items-center gap-2 mt-2 mb-1">
                <div className="h-px flex-1 bg-slate-200"></div>
                <span className="text-[10px] font-medium text-slate-400 font-readex">سندات تمت فوترتها</span>
                <div className="h-px flex-1 bg-slate-200"></div>
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
                      className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 cursor-pointer hover-stable no-select-click hover:bg-emerald-50"
                    >
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="w-4 h-4 rounded border-2 border-emerald-500 accent-emerald-500 cursor-default"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-bold text-[#0F2747] font-tajawal leading-tight truncate">
                            {voucher.isTransfer ? 'تحويل مخزني' : (voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج')} - {voucher.clientName}
                          </h4>
                          {invoiceDate ? (
                            <p className="text-[11px] text-emerald-600 font-readex mt-1 font-bold flex items-center gap-1.5 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100/50 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              تم إصدار الفاتورة بتاريخ: {formatDateClean(invoiceDate)}
                            </p>
                          ) : (
                            <p className="text-[9px] text-slate-400 font-readex mt-0.5 truncate">
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
              <div className="flex items-center gap-2 mt-4 mb-2">
                <div className="h-px flex-1 bg-rose-100"></div>
                <span className="text-[10px] font-bold text-rose-400 font-readex uppercase tracking-wider">سندات ملغاة</span>
                <div className="h-px flex-1 bg-rose-100"></div>
              </div>
              <AnimatePresence>
                {cancelledVouchers.slice(0, 5).map((voucher) => (
                  <motion.div
                    key={`${voucher.id}-${voucher.batchId}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onVoucherClick(voucher)}
                    className="p-2 rounded-xl border border-rose-100 bg-rose-50/30 cursor-pointer hover:bg-rose-50 transition-all opacity-60 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                         <AlertTriangle size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-bold text-slate-500 font-tajawal truncate line-through decoration-rose-300">
                          {voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج'} - {voucher.clientName}
                        </h4>
                        <p className="text-[8px] text-rose-400 font-medium">تم إلغاء هذا السند وإرجاع الكميات</p>
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
