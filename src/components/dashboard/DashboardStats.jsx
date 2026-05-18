import React from 'react';
import { Clock, Timer } from 'lucide-react';
import StatsCards from '../StatsCards';
import { motion } from 'framer-motion';

const DashboardStats = ({
  itemsCount,
  onAddItem,
  onAddStock,
  onAddInvoice,
  onAddReturn,
  onOpenMorningBrief,
  setActiveView,
}) => {
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 shrink-0">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-px h-12 bg-indigo-500/20 hidden md:block" />
          <div>
            <h1 className="text-[28px] font-black text-[#0F2747] dark:text-white font-tajawal leading-tight tracking-tight">
              لوحة القيادة
            </h1>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 font-bold mt-1">
              مرحباً بك في نظام بركة الثمار PRO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMorningBrief}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl text-[12px] font-black shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Timer size={18} />
            الموجز الصباحي
          </motion.button>

          <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <Clock size={16} className="text-indigo-500" />
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 tabular-nums">
              {today}
            </span>
          </div>
        </div>
      </div>

      {/* --- STAT CARDS GRID --- */}
      <StatsCards
        itemsCount={itemsCount}
        onAddItem={onAddItem}
        onAddStock={onAddStock}
        onAddInvoice={onAddInvoice}
        onAddReturn={onAddReturn}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default React.memo(DashboardStats);
