import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Truck, TrendingUp, RotateCcw } from 'lucide-react';

/**
 * StatCard — A single premium stat card with an action button.
 * - navigateTo: navigates to a page when the card body is clicked.
 * - onAction:   opens a modal when the bottom action button is clicked.
 * - hideIfZero: shows '—' instead of 0 (for stats not yet loaded from server).
 */
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
    if (navigateTo && setActiveView) {
      setActiveView(navigateTo);
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    onAction?.();
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative rounded-[20px] overflow-hidden cursor-pointer group bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/80 hover-stable no-select-click"
      onClick={handleCardClick}
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      <div className="p-6 pb-3 flex items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: accentColor + '18', color: accentColor }}
        >
          <Icon size={26} strokeWidth={1.8} />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-500 font-readex mb-1">{label}</span>
          <span className="text-[32px] font-bold text-[#0F2747] font-tajawal leading-none tracking-tight">
            {value}
          </span>
          {subtext && (
            <span className="text-[11px] text-slate-400 font-readex mt-1.5">{subtext}</span>
          )}
        </div>
      </div>

      {/* Action Button — click opens modal, does NOT navigate */}
      {actionLabel && (
        <div className="px-6 pb-5">
          <div
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold font-tajawal transition-all duration-200 hover:brightness-95"
            style={{ backgroundColor: accentColor + '12', color: accentColor }}
            onClick={handleActionClick}
          >
            <Plus size={14} strokeWidth={2.5} />
            {actionLabel}
          </div>
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

/**
 * StatsCards — Grid of 4 KPI cards.
 * Card body click → navigates to page.
 * Action button click → opens modal.
 */
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
      value={0}
      subtext="وحدة مُورّدة"
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
      value={0}
      subtext="وحدة مُباعة"
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
      value={0}
      subtext="وحدة مُرتجعة"
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
