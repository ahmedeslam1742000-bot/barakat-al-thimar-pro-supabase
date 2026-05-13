import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';

export default function DashboardConfirmationDialogs({
  showInvoiceExitConfirm,
  setShowInvoiceExitConfirm,
  performInvoiceReset,
  showReturnExitConfirm,
  setShowReturnExitConfirm,
  performReturnReset,
  showInvoiceSaveConfirm,
  setShowInvoiceSaveConfirm,
  performInvoiceSave,
  showReturnSaveConfirm,
  setShowReturnSaveConfirm,
  performReturnSave,
  invoiceForm,
  returnForm,
  loading
}) {
  return (
    <>
      {/* Invoice Exit Confirmation */}
      <AnimatePresence>
        {showInvoiceExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                  <AlertTriangle size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">خروج وتجاهل؟</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">الفاتورة الحالية تحتوي على أصناف أو بيانات. هل أنت متأكد من الخروج دون حفظ؟</p>
               <div className="flex flex-col gap-3">
                  <button onClick={performInvoiceReset} className="w-full py-4.5 rounded-2xl bg-rose-500 text-white text-lg font-black shadow-xl hover:bg-rose-600 transition-all font-tajawal">نعم، تجاهل البيانات</button>
                  <button onClick={() => setShowInvoiceExitConfirm(false)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold hover:bg-slate-200 transition-all font-tajawal">تراجع</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Exit Confirmation */}
      <AnimatePresence>
        {showReturnExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
            >
               <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                  <AlertTriangle size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">خروج وتجاهل؟</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">لديك بيانات مرتجع لم يتم حفظها. هل أنت متأكد من الخروج وفقدان هذه البيانات؟</p>
               <div className="flex flex-col gap-3">
                  <button onClick={performReturnReset} className="w-full py-4.5 rounded-2xl bg-rose-500 text-white text-lg font-black shadow-xl hover:bg-rose-600 transition-all font-tajawal">نعم، تجاهل البيانات</button>
                  <button onClick={() => setShowReturnExitConfirm(false)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold hover:bg-slate-200 transition-all font-tajawal">تراجع</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Confirmations */}
      <AnimatePresence>
        {(showInvoiceSaveConfirm || showReturnSaveConfirm) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
            >
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">تأكيد الحفظ</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">
                  {showInvoiceSaveConfirm 
                    ? `هل أنت متأكد من حفظ الفاتورة؟ سيتم تحديث أرصدة المخزن فوراً.` 
                    : `هل أنت متأكد من اعتماد المرتجع من ${returnForm.returnee}؟`}
               </p>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={showInvoiceSaveConfirm ? performInvoiceSave : performReturnSave} 
                    disabled={loading}
                    className="w-full py-4.5 rounded-2xl bg-emerald-600 text-white text-lg font-black shadow-xl shadow-emerald-500/25 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 font-tajawal disabled:opacity-50"
                  >
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={20} /> تأكيد وحفظ</>}
                  </button>
                  <button onClick={() => { setShowInvoiceSaveConfirm(false); setShowReturnSaveConfirm(false); }} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-all font-tajawal">تراجع</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
