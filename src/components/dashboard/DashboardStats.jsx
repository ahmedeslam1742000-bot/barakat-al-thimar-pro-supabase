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
      {/* --- SMART WELCOME BANNER --- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#132D50] to-[#1B4D3E] rounded-[24px] shadow-lg shadow-navy-950/20 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10 animate-glow-pulse">
        
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Geometric lines overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg shadow-black/10 shrink-0">
            <Sparkles size={26} className="text-amber-300 drop-shadow-md animate-pulse" />
          </div>
          <div>
            <h1 className="text-[26px] md:text-[32px] font-black text-white font-tajawal leading-tight tracking-tight mb-2 drop-shadow-md bg-gradient-to-l from-white via-white to-amber-200 bg-clip-text text-transparent">
              {greeting}، {userName}!
            </h1>
            <p className="text-[13px] text-navy-100/90 font-medium max-w-xl leading-relaxed flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400 shrink-0" />
              أهلاً بك في لوحة القيادة لنظام بركة الثمار PRO. يمكنك متابعة حركات المخزون والمبيعات لحظة بلحظة.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner">
            <Clock size={16} className="text-navy-300" />
            <span className="text-[12px] font-bold text-navy-50 tabular-nums">
              {today}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.18)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenMorningBrief}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[13px] font-black shadow-lg shadow-black/10 hover:shadow-black/20 transition-all duration-300"
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
