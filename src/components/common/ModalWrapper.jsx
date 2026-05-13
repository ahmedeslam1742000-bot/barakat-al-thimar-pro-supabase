import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

const ModalWrapper = ({ 
  title, 
  isOpen, 
  onClose, 
  children, 
  onSubmit, 
  maxWidth = "max-w-4xl", 
  isSubmitDisabled = false, 
  loading = false, 
  submitLabel = "حفظ البيانات" 
}) => {
  const handleFormSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSubmit) onSubmit(e);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F2747]/60 backdrop-blur-md transition-all duration-300"
          dir="rtl" onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={`w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden`}
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black font-tajawal text-[#0F2747] dark:text-white tracking-tight">{title}</h3>
              </div>
              <button type="button" onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 rounded-2xl transition-all active:scale-90">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} noValidate className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative bg-white dark:bg-slate-900">{children}</div>
                
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl text-sm font-black text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitDisabled || loading} 
                      className="px-8 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                    >
                      {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> جاري الحفظ...</> : <><CheckCircle2 size={18} /> {submitLabel}</>}
                    </button>
                </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalWrapper;
