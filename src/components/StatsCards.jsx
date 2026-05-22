import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Truck, TrendingUp, RotateCcw } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export const StatCard = React.memo(({
  icon: Icon,
  label,
  value,
  subtext,
  actionLabel,
  onAction,
  accentColor = '#059669',
  navigateTo,
  
}) => {
  const navigate = useNavigate();
  const handleCardClick = () => {
    if (navigateTo) navigate({ to: '/' + navigateTo });
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    onAction?.();
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="relative flex flex-col justify-center bg-white dark:bg-[#111C44] rounded-[24px] cursor-pointer group border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden no-select-click flex-1 min-h-[130px]"
        onClick={handleCardClick}
      >
        {/* Soft Background Gradient Glow */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
          style={{ background: `radial-gradient(circle at top right, ${accentColor}15 0%, transparent 70%)` }} 
        />
        
        {/* --- Card Content --- */}
        <div className="p-6 flex flex-col flex-1 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" 
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <Icon size={24} strokeWidth={2.5} />
            </div>
            {value !== undefined && value !== null && (
               <span className="text-[32px] font-black font-tajawal leading-none tracking-tight text-slate-800 dark:text-white">
                 {value}
               </span>
            )}
          </div>
          
          <div className="flex flex-col text-right">
            <span className="text-[15px] font-black font-tajawal text-slate-800 dark:text-white mb-1">{label}</span>
            <span className="text-[11px] font-bold font-readex text-slate-400 dark:text-slate-500">{subtext}</span>
          </div>
        </div>
      </motion.div>

      {/* --- Detached Action Button --- */}
      {actionLabel && (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleActionClick}
          className="w-full rounded-[16px] py-3 px-4 flex items-center justify-center gap-2 text-[13px] font-black font-tajawal cursor-pointer text-white shadow-sm hover:shadow-md transition-all group/btn shrink-0" 
          style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px 0 ${accentColor}30` }}
        >
          <Plus size={16} strokeWidth={3} className="transition-transform group-hover/btn:rotate-90 duration-300" />
          {actionLabel}
        </motion.div>
      )}
    </div>
  );
});
StatCard.displayName = 'StatCard';

const StatsCards = React.memo(({
  itemsCount,
  onAddItem,
  onAddStock,
  onAddInvoice,
  onAddReturn,
  
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
    {/* ── كارت 1: إجمالي الأصناف ── */}
    <StatCard
      icon={Package}
      label="إجمالي الأصناف"
      value={itemsCount}
      subtext="صنف مسجل"
      actionLabel="إضافة صنف"
      onAction={onAddItem}
      accentColor="#059669" // الأخضر الأنضج
      navigateTo="items"
      
    />

    {/* ── كارت 2: الوارد → صفحة المخزون ── */}
    <StatCard
      icon={Truck}
      label="الوارد"
      subtext="إدارة مخزونك الوارد"
      actionLabel="إضافة وارد"
      onAction={onAddStock}
      accentColor="#4F46E5" // الأزرق (Indigo) الأنضج
      navigateTo="stock-in"
      
    />

    {/* ── كارت 3: الفواتير → صفحة الفواتير ── */}
    <StatCard
      icon={TrendingUp}
      label="الفواتير"
      subtext="إصدار وإدارة المبيعات"
      actionLabel="فاتورة جديدة"
      onAction={onAddInvoice}
      accentColor="#D97706" // الذهبي الأنضج
      navigateTo="stock-out"
      
    />

    {/* ── كارت 4: المرتجعات → صفحة المرتجعات ── */}
    <StatCard
      icon={RotateCcw}
      label="المرتجعات"
      subtext="متابعة الأصناف المرتجعة"
      actionLabel="تسجيل مرتجع"
      onAction={onAddReturn}
      accentColor="#DC2626" // الأحمر الأنضج
      navigateTo="returns"
      
    />
  </div>
));
StatsCards.displayName = 'StatsCards';

export default StatsCards;
