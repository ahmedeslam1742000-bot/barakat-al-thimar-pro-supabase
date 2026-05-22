import React from 'react';
import { Clock, Timer, TrendingUp, Sparkles } from 'lucide-react';
import StatsCards from '../StatsCards';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const DashboardStats = ({
  itemsCount,
  onAddItem,
  onAddStock,
  onAddInvoice,
  onAddReturn,
  onOpenMorningBrief,
  
}) => {
  const { currentUser } = useAuth();

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeHour = new Date().getHours();
  const greeting = timeHour < 12 ? 'صباح الخير' : 'مساء الخير';
  const userName = currentUser?.name || currentUser?.username || 'يا بطل';

  return (
    <div className="flex flex-col gap-6 shrink-0">
      {/* --- SMART WELCOME BANNER (Horizon UI Premium Style) --- */}
      <div className="relative bg-white dark:bg-[#111C44] rounded-[24px] shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        
        {/* Soft Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-[16px] flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
            <span className="text-3xl">👋</span>
          </div>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black text-slate-800 dark:text-white font-tajawal leading-tight tracking-tight mb-1.5">
              {greeting}، <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>!
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500 shrink-0" />
              أهلاً بك في لوحة القيادة لنظام بركة الثمار PRO. يمكنك متابعة حركات المخزون والمبيعات لحظة بلحظة.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <Clock size={16} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
              {today}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMorningBrief}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[14px] text-[13px] font-black shadow-lg shadow-emerald-500/20 transition-all font-tajawal"
          >
            <Timer size={18} className="text-emerald-100" />
            الموجز الصباحي
          </motion.button>
        </div>
      </div>

      {/* --- STAT CARDS GRID --- */}
      <StatsCards
        itemsCount={itemsCount}
        onAddItem={onAddItem}
        onAddStock={onAddStock}
        onAddInvoice={onAddInvoice}
        onAddReturn={onAddReturn}
        
      />
    </div>
  );
};

export default React.memo(DashboardStats);
