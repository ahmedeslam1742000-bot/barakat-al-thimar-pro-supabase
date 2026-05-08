import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';

/**
 * VoucherConfirmationModal - Modal for confirming stock-in or invoice generation.
 */
export function VoucherConfirmationModal({
  isOpen,
  onClose,
  voucher,
  onConfirm,
  loading
}) {
  if (!isOpen || !voucher) return null;

  const isIn = voucher.kind === 'in';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F2747]/60 backdrop-blur-md transition-all duration-300"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl border border-slate-100/60 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-bold text-[#0F2747] font-tajawal tracking-tight">
              {isIn ? 'اعتماد سند إدخال' : 'إصدار فاتورة جديدة'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all active:scale-90"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
            <h4 className="text-base font-bold text-[#0F2747] font-tajawal leading-tight">
              {isIn ? 'سند إدخال' : 'سند إخراج'} - {voucher.clientName}
            </h4>
            <p className="text-xs text-slate-400 font-readex mt-2">
              {voucher.timestamp.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-8 w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              <p className="text-[11px] text-slate-500 font-tajawal leading-relaxed">
                {isIn 
                  ? 'سيتم اعتماد هذا السند وتحديث أرصدة المخازن للكميات الواردة. هل تود الاستمرار؟'
                  : 'سيتم تحويل هذا السند إلى فاتورة رسمية معتمدة وتثبيت الكميات الصادرة.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all active:scale-95 font-tajawal disabled:opacity-50 ${isIn ? 'bg-indigo-600 shadow-indigo-200' : 'bg-emerald-600 shadow-emerald-200'}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isIn ? 'تأكيد وحفظ' : 'إصدار الفاتورة'}</>}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-400 bg-white border border-slate-200 hover:bg-slate-50 transition-all font-tajawal disabled:opacity-50"
            >
              تراجع
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
