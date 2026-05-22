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
