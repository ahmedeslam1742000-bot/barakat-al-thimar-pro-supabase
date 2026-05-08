import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Truck, TrendingUp, RotateCcw } from 'lucide-react';

/**
 * StatCard — A single premium stat card with an action button.
 * Memoized to prevent re-renders when sibling state changes in Dashboard.
 */
export const StatCard = React.memo(({ icon: Icon, label, value, subtext, actionLabel, onClick, accentColor = '#10B981' }) => (
  <motion.div
    whileHover={{ y: -4, transition: { duration: 0.25 } }}
    className="relative rounded-[20px] overflow-hidden cursor-pointer group bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/80 hover-stable no-select-click"
    onClick={onClick}
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
        <span className="text-[32px] font-bold text-[#0F2747] font-tajawal leading-none tracking-tight">{value}</span>
        {subtext && <span className="text-[11px] text-slate-400 font-readex mt-1.5">{subtext}</span>}
      </div>
    </div>
    {/* Action Button */}
    {actionLabel && (
      <div className="px-6 pb-5">
        <div
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold font-tajawal transition-all duration-200 hover:brightness-95"
          style={{ backgroundColor: accentColor + '12', color: accentColor }}
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
));
StatCard.displayName = 'StatCard';

/**
 * StatsCards — Grid of 4 daily KPI cards.
 * Receives computed values + action handlers as props so Dashboard
 * doesn't re-render this grid for unrelated state changes.
 */
const StatsCards = React.memo(({
  itemsCount,
  stockInCount,
  salesCount,
  returnsCount,
  damageCount,
  onAddItem,
  onAddStock,
  onAddInvoice,
  onAddReturn,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
    <StatCard
      icon={Package}
      label="إجمالي الأصناف"
      value={itemsCount}
      subtext="صنف مسجل"
      actionLabel="إضافة صنف"
      onClick={onAddItem}
      accentColor="#10B981"
    />
    <StatCard
      icon={Truck}
      label="الوارد"
      value={stockInCount}
      subtext="وحدة مُورّدة"
      actionLabel="إضافة وارد"
      onClick={onAddStock}
      accentColor="#3B82F6"
    />
    <StatCard
      icon={TrendingUp}
      label="الفواتير"
      value={salesCount}
      subtext="وحدة مُباعة"
      actionLabel="فاتورة جديدة"
      onClick={onAddInvoice}
      accentColor="#F59E0B"
    />
    <StatCard
      icon={RotateCcw}
      label={damageCount > 0 ? `المرتجعات (${damageCount} تالف)` : 'المرتجعات'}
      value={returnsCount}
      subtext="وحدة مُرتجعة"
      actionLabel="تسجيل مرتجع"
      onClick={onAddReturn}
      accentColor="#EF4444"
    />
  </div>
));
StatsCards.displayName = 'StatsCards';

export default StatsCards;
