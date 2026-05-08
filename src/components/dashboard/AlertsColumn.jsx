import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertOctagon, Layers } from 'lucide-react';

/**
 * AlertsColumn - Displays inventory alerts and low stock items.
 */
export const AlertsColumn = React.memo(function AlertsColumn({ 
  items, 
  alertCatFilter, 
  setAlertCatFilter, 
  alertSearch, 
  alertUrgencyFilter,
  cardVariants 
}) {
  const finalAlerts = React.useMemo(() => {
    return items.filter(i => {
      if (alertCatFilter !== 'الكل' && i.cat !== alertCatFilter) return false;
      if (alertSearch && !i.name.includes(alertSearch) && !i.company.includes(alertSearch)) return false;
      if (alertUrgencyFilter === 'حرج' && i.stockQty >= 50) return false;
      if (alertUrgencyFilter === 'تحذير' && (i.stockQty < 50 || i.stockQty >= 100)) return false;
      if (alertUrgencyFilter === 'آمن' && i.stockQty < 100) return false;
      return true;
    }).sort((a,b) => a.stockQty - b.stockQty);
  }, [items, alertCatFilter, alertSearch, alertUrgencyFilter]);

  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col bg-white rounded-[24px] border border-slate-100/80 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle size={15} />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-[#0F2747] font-tajawal leading-tight">تنبيهات المخزن</h3>
            <p className="text-[10px] text-slate-400 font-readex font-medium">{finalAlerts.length} صنف</p>
          </div>
        </div>
        <select
          className="text-[10px] font-medium text-slate-500 outline-none cursor-pointer hover:text-slate-600 transition-colors border border-slate-100 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50"
          value={alertCatFilter}
          onChange={e => setAlertCatFilter(e.target.value)}
        >
          <option value="الكل">الأقسام</option>
          {[...new Set(items.map(i => i.cat).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
        {finalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <CheckCircle2 size={32} strokeWidth={1.2} className="mb-2" />
            <p className="text-xs font-semibold">المخزون آمن</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {finalAlerts.map((item, idx) => {
                let statusColor, iconColor, icon, barColor, urgencyLabel, urgencyBg;
                if (item.stockQty < 70) {
                  statusColor = '#EF4444';
                  iconColor = 'text-red-500';
                  icon = <AlertOctagon size={12} />;
                  barColor = '#EF4444';
                  urgencyLabel = 'حرج';
                  urgencyBg = 'bg-red-50 text-red-600';
                } else if (item.stockQty >= 70 && item.stockQty <= 100) {
                  statusColor = '#F59E0B';
                  iconColor = 'text-amber-500';
                  icon = <AlertTriangle size={12} />;
                  barColor = '#F59E0B';
                  urgencyLabel = 'تحذير';
                  urgencyBg = 'bg-amber-50 text-amber-600';
                } else {
                  statusColor = '#10B981';
                  iconColor = 'text-emerald-500';
                  icon = <CheckCircle2 size={12} />;
                  barColor = '#10B981';
                  urgencyLabel = 'آمن';
                  urgencyBg = 'bg-emerald-50 text-emerald-600';
                }
                const stockPct = Math.min((item.stockQty / 200) * 100, 100);
                
                return (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="group/alert relative p-4 rounded-2xl border border-slate-50 bg-white hover:bg-slate-50/50 hover:shadow-md hover:shadow-slate-200/20 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full opacity-0 group-hover/alert:opacity-100 transition-opacity" style={{ backgroundColor: barColor }} />
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/alert:scale-110`} style={{ backgroundColor: barColor + '15', color: barColor }}>
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-black text-slate-800 font-tajawal truncate group-hover/alert:text-[#0F2747] transition-colors">
                              {item.name} <span className="text-slate-500 font-bold text-[11px] mr-1">- {item.company || 'بدون شركة'}</span>
                            </h4>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg font-tajawal uppercase tracking-wider ${urgencyBg}`}>{urgencyLabel}</span>
                            <span className="text-sm font-black tabular-nums" style={{ color: statusColor }}>{item.stockQty}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative w-full h-[4px] bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stockPct}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 + (idx * 0.05) }}
                          className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                          style={{ background: `linear-gradient(to left, ${barColor}, ${barColor}dd)` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
});
