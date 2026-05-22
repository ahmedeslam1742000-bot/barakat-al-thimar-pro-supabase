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
    <motion.div
      whileHover={{ y: -4, scale: 1.01, boxShadow: `0 12px 30px -4px ${accentColor}40` }}
      className="relative flex flex-col justify-between rounded-[24px] cursor-pointer group shadow-sm transition-all duration-300 overflow-hidden no-select-click h-full min-h-[160px]"
      onClick={handleCardClick}
      style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
    >
      {/* --- Card Content --- */}
      <div className="p-5 flex flex-col flex-1 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-col text-white">
            {value !== undefined && value !== null && (
              <span className="text-[32px] font-black font-tajawal leading-none tracking-tight drop-shadow-sm mb-1 mt-8">
                {value}
              </span>
            )}
            <span className="text-[16px] font-black font-tajawal opacity-90 drop-shadow-sm">{label}</span>
          </div>
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <Icon size={24} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* --- Glass Button Action --- */}
      {actionLabel && (
        <div className="px-5 pb-5 relative z-10" onClick={handleActionClick}>
          <div className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl py-2 flex items-center justify-center gap-2 text-[12px] font-black font-tajawal text-white transition-all group/btn">
            <Plus size={14} strokeWidth={3} className="transition-transform group-hover/btn:rotate-90 duration-300" />
            {actionLabel}
          </div>
        </div>
      )}
      
      {/* Decorative Glow */}
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-700 pointer-events-none blur-2xl" />
    </motion.div>
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
