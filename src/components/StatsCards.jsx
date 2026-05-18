import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Truck, TrendingUp, RotateCcw } from 'lucide-react';

export const StatCard = React.memo(({
  icon: Icon,
  label,
  value,
  subtext,
  actionLabel,
  onAction,
  accentColor = '#10B981',
  navigateTo,
  setActiveView,
}) => {
  const handleCardClick = () => {
    if (navigateTo && setActiveView) setActiveView(navigateTo);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    onAction?.();
  };

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="relative h-full flex flex-col justify-between rounded-[24px] overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-300 border no-select-click"
      onClick={handleCardClick}
      style={{ 
        willChange: 'transform', 
        backfaceVisibility: 'hidden', 
        transform: 'translate3d(0, 0, 0)',
        background: `linear-gradient(135deg, #ffffff 0%, ${accentColor}0a 100%)`,
        borderColor: `${accentColor}20`
      }}
    >
      <div className="p-6 pb-4 flex items-start gap-4">
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
          <span className="text-[14px] font-bold text-slate-500 font-tajawal mb-1.5 group-hover:text-slate-700 transition-colors">{label}</span>
          {value !== undefined && value !== null ? (
            <>
              <span className="text-[34px] font-black font-tajawal leading-none tracking-tight transition-colors drop-shadow-sm" style={{ color: accentColor }}>
                {value}
              </span>
              {subtext && (
                <span className="text-[12px] text-slate-400 font-readex mt-2">{subtext}</span>
              )}
            </>
          ) : (
            <span className="text-[14px] font-medium text-slate-500 font-tajawal leading-relaxed mt-1">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {actionLabel && (
        <div className="px-5 pb-5 mt-auto z-10">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-bold font-tajawal transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{ 
              backgroundColor: accentColor, 
              color: '#ffffff',
              boxShadow: `0 6px 16px -4px ${accentColor}80`
            }}
            onClick={handleActionClick}
          >
            <Plus size={18} strokeWidth={2.5} />
            {actionLabel}
          </button>
        </div>
      )}

      <div
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
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
  setActiveView,
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
      accentColor="#10B981"
      navigateTo="items"
      setActiveView={setActiveView}
    />

    {/* ── كارت 2: الوارد → صفحة المخزون ── */}
    <StatCard
      icon={Truck}
      label="الوارد"
      subtext="إدارة مخزونك الوارد"
      actionLabel="إضافة وارد"
      onAction={onAddStock}
      accentColor="#3B82F6"
      navigateTo="stock-in"
      setActiveView={setActiveView}
    />

    {/* ── كارت 3: الفواتير → صفحة الفواتير ── */}
    <StatCard
      icon={TrendingUp}
      label="الفواتير"
      subtext="إصدار وإدارة المبيعات"
      actionLabel="فاتورة جديدة"
      onAction={onAddInvoice}
      accentColor="#F59E0B"
      navigateTo="stock-out"
      setActiveView={setActiveView}
    />

    {/* ── كارت 4: المرتجعات → صفحة المرتجعات ── */}
    <StatCard
      icon={RotateCcw}
      label="المرتجعات"
      subtext="متابعة الأصناف المرتجعة"
      actionLabel="تسجيل مرتجع"
      onAction={onAddReturn}
      accentColor="#EF4444"
      navigateTo="returns"
      setActiveView={setActiveView}
    />
  </div>
));
StatsCards.displayName = 'StatsCards';

export default StatsCards;
