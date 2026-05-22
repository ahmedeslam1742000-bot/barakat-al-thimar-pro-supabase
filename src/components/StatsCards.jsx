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
        whileHover={{ y: -4, transition: { duration: 0.3 } }}
        className="relative flex-1 flex flex-col justify-center rounded-[24px] overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 no-select-click"
        onClick={handleCardClick}
        style={{ 
          willChange: 'transform', 
          backfaceVisibility: 'hidden', 
          transform: 'translate3d(0, 0, 0)',
          background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}06 50%, #ffffff 100%)`,
          borderColor: `${accentColor}30`
        }}
      >
        <div className="p-5 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
            style={{ 
              backgroundColor: accentColor + '15', 
              color: accentColor,
              boxShadow: `0 8px 24px -6px ${accentColor}40`
            }}
          >
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="flex flex-col justify-center pt-1 z-10">
            <span className="text-[15px] font-black text-slate-800 font-tajawal mb-1 transition-colors">{label}</span>
            {value !== undefined && value !== null ? (
              <>
                <span className="text-[32px] font-black font-tajawal leading-none tracking-tight transition-colors drop-shadow-sm" style={{ color: accentColor }}>
                  {value}
                </span>
                {subtext && (
                  <span className="text-[11px] font-bold text-slate-500 font-readex mt-1.5">{subtext}</span>
                )}
              </>
            ) : (
              <span className="text-[13px] font-bold text-slate-600 font-tajawal leading-relaxed mt-1">
                {subtext}
              </span>
            )}
          </div>
        </div>

        <div
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
      </motion.div>

      {actionLabel && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-[16px] text-[14px] font-black font-tajawal transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          style={{ 
            backgroundColor: accentColor,
            color: '#ffffff',
            boxShadow: `0 4px 12px -4px ${accentColor}60`
          }}
          onClick={handleActionClick}
        >
          <Plus size={18} strokeWidth={2.5} />
          {actionLabel}
        </button>
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
