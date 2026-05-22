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
  colorFrom = '#10B981',
  colorTo = '#059669',
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
      {/* ── الكارت الرئيسي ── */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        className="relative flex flex-col justify-center bg-white dark:bg-[#111C44] rounded-[24px] cursor-pointer group border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden no-select-click flex-1 min-h-[140px]"
        onClick={handleCardClick}
      >
        {/* Subtle background glow effect */}
        <div 
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20 dark:opacity-10 transition-opacity group-hover:opacity-30 pointer-events-none"
          style={{ backgroundColor: colorFrom }}
        />

        {/* محتوى الكارت */}
        <div className="p-5 flex items-center justify-between gap-4 relative z-10">
          {/* النص على اليمين (لأننا في RTL) */}
          <div className="flex flex-col items-start text-right flex-1">
            {value !== undefined && value !== null && (
              <span className="text-[34px] font-black font-tajawal leading-none text-slate-800 dark:text-white mb-2 tracking-tight">
                {value}
              </span>
            )}
            <span className="text-[16px] font-bold font-tajawal text-slate-700 dark:text-slate-200">{label}</span>
            <span className="text-[12px] font-medium font-readex text-slate-400 dark:text-slate-500 mt-1">{subtext}</span>
          </div>

          {/* أيقونة على اليسار */}
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
              boxShadow: `0 10px 25px -5px ${colorFrom}66`
            }}
          >
            <Icon size={28} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </motion.div>

      {/* ── زر الإجراء المنفصل ── */}
      {actionLabel && (
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleActionClick}
          className="w-full rounded-[16px] py-3.5 px-4 flex items-center justify-center gap-2 text-[14px] font-black font-tajawal cursor-pointer text-white shrink-0 transition-all duration-300"
          style={{
            background: `linear-gradient(to right, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 8px 25px -6px ${colorFrom}66`,
          }}
        >
          <Plus size={18} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-300" />
          {actionLabel}
        </motion.button>
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
    {/* ── كارت 1: إجمالي الأصناف ── */}
    <StatCard
      icon={Package}
      label="إجمالي الأصناف"
      value={itemsCount}
      subtext="صنف مسجل"
      actionLabel="إضافة صنف"
      onAction={onAddItem}
      colorFrom="#10B981" // Modern Emerald
      colorTo="#047857"
      navigateTo="items"
    />

    {/* ── كارت 2: الوارد ── */}
    <StatCard
      icon={Truck}
      label="الوارد"
      subtext="إدارة مخزونك الوارد"
      actionLabel="إضافة وارد"
      onAction={onAddStock}
      colorFrom="#6366F1" // Modern Indigo
      colorTo="#4338CA"
      navigateTo="stock-in"
    />

    {/* ── كارت 3: الفواتير ── */}
    <StatCard
      icon={TrendingUp}
      label="الفواتير"
      subtext="إصدار وإدارة المبيعات"
      actionLabel="فاتورة جديدة"
      onAction={onAddInvoice}
      colorFrom="#F59E0B" // Modern Amber
      colorTo="#B45309"
      navigateTo="stock-out"
    />

    {/* ── كارت 4: المرتجعات ── */}
    <StatCard
      icon={RotateCcw}
      label="المرتجعات"
      subtext="متابعة الأصناف المرتجعة"
      actionLabel="تسجيل مرتجع"
      onAction={onAddReturn}
      colorFrom="#F43F5E" // Modern Rose/Red
      colorTo="#BE123C"
      navigateTo="returns"
    />
  </div>
));
StatsCards.displayName = 'StatsCards';

export default StatsCards;
