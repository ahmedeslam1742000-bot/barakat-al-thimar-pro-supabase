import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Layers, Clock } from 'lucide-react';

/**
 * MorningBriefModal - Displays the morning inventory health report.
 */
export function MorningBriefModal({ isOpen, onClose, data }) {
  if (!isOpen || !data || data.atRiskItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0F2747]/40 backdrop-blur-sm"
        dir="rtl" 
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 24 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }} 
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl border border-slate-100/60 overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747] font-tajawal">تقرير الصباح</h3>
                <p className="text-[11px] text-slate-400 font-readex">
                  {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Summary Banner */}
          <div className="mx-7 mt-5 p-5 rounded-2xl bg-gradient-to-r from-[#0F2747] to-[#15345b] text-white flex items-center justify-between shrink-0">
            <div>
              <p className="text-[11px] opacity-70 mb-1 font-readex">أصناف معرضة</p>
              <p className="text-2xl font-bold font-tajawal">{data.atRiskItems.length}</p>
            </div>
            <div className="text-left border-r border-white/20 pr-6">
              <p className="text-[11px] opacity-70 mb-1 font-readex">إجمالي الكمية</p>
              <p className="text-2xl font-bold font-tajawal">{data.totalQty} وحدة</p>
            </div>
          </div>

          {/* Items List */}
          <div className="px-7 py-4 space-y-2 overflow-y-auto custom-scrollbar flex-1">
            {data.atRiskItems.slice(0, 12).map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.isExpired || item.isUrgent ? 'bg-red-50/60 border-red-100/60' : 'bg-amber-50/60 border-amber-100/60'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Layers size={15} className="text-[#0F2747]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#0F2747] font-tajawal truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-readex">{item.company} • {item.cat}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold bg-white border border-slate-100 px-2.5 py-1 rounded-lg shadow-sm tabular-nums">{item.totalQtyAtRisk}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 font-readex ${item.isExpired ? 'bg-red-500 text-white' : item.isUrgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Clock size={11} />
                    {item.isExpired ? 'منتهي' : `${item.daysLeft} يوم`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-readex">مراجعة المخزون ضرورية</p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#10B981] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-tajawal">تم — متابعة</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
