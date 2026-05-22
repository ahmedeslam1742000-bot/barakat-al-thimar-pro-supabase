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
      {/* --- SMART WELCOME BANNER (Horizon UI Style) --- */}
      <div className="bg-white dark:bg-[#111C44] rounded-[20px] shadow-sm p-4 px-6 flex items-center justify-between border border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-black text-slate-800 dark:text-white font-tajawal">تعالى</span>
          <span className="text-xl">👋</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenMorningBrief}
          className="bg-[#059669] hover:bg-[#047857] text-white px-5 py-2.5 rounded-[12px] text-[13px] font-black shadow-md shadow-emerald-500/20 transition-all font-readex"
        >
          Morning Briefing
        </motion.button>
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
