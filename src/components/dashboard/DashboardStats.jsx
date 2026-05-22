import React from 'react';
import { Clock, Timer, TrendingUp } from 'lucide-react';
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
      {/* --- SMART WELCOME BANNER --- */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#0F2747] via-[#16335B] to-[#1E3A5F] rounded-[24px] shadow-lg shadow-indigo-900/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-100/10">
        
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner shrink-0">
            <span className="text-3xl drop-shadow-md">👋</span>
          </div>
          <div>
            <h1 className="text-[26px] md:text-[32px] font-black text-white font-tajawal leading-tight tracking-tight mb-2 drop-shadow-md">
              {greeting}، {userName}!
            </h1>
            <p className="text-[13px] text-indigo-100/80 font-bold max-w-xl leading-relaxed flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400 shrink-0" />
              أهلاً بك في لوحة القيادة لنظام بركة الثمار PRO. يمكنك متابعة حركات المخزون والمبيعات لحظة بلحظة.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner">
            <Clock size={16} className="text-indigo-300" />
            <span className="text-[12px] font-bold text-indigo-50 tabular-nums">
              {today}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMorningBrief}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[13px] font-black shadow-lg transition-all"
          >
            <Timer size={18} className="text-amber-400" />
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
