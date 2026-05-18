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
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative h-full flex flex-col rounded-[20px] overflow-hidden cursor-pointer group bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/80 hover-stable no-select-click"
      onClick={handleCardClick}
      style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translate3d(0, 0, 0)' }}
    >
      <div className="p-6 flex items-start gap-4 flex-1">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: accentColor + '18', color: accentColor }}
        >
          <Icon size={26} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[14px] font-bold text-slate-500 font-tajawal mb-1">{label}</span>
          {value !== undefined && value !== null ? (
            <>
              <span className="text-[32px] font-black text-[#0F2747] font-tajawal leading-none tracking-tight">
                {value}
              </span>
              {subtext && (
                <span className="text-[12px] text-slate-400 font-readex mt-2">{subtext}</span>
              )}
            </>
          ) : (
            <span className="text-[13px] font-medium text-slate-400 font-tajawal leading-relaxed mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {actionLabel && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 px-6 py-3 text-xs font-semibold font-tajawal transition-all duration-200 hover:brightness-90 active:scale-[0.98]"
            style={{ color: accentColor }}
            onClick={handleActionClick}
          >
            <Plus size={14} strokeWidth={2.5} />
            {actionLabel}
          </button>
        </div>
      )}

      <div
        className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500"
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
