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
      {/* ── الكارت الرئيسي ── */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        className="relative flex flex-col justify-between bg-white dark:bg-[#111C44] rounded-[20px] cursor-pointer group border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden no-select-click flex-1 min-h-[130px]"
        onClick={handleCardClick}
        style={{ isolation: 'isolate' }}
      >
        {/* شريط لوني علوي */}
        <div
          className="absolute top-0 right-0 left-0 h-1 rounded-t-[20px]"
          style={{ backgroundColor: accentColor }}
        />

        {/* محتوى الكارت */}
        <div className="p-5 flex items-center justify-between gap-4 mt-1">
          {/* أيقونة على اليمين */}
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 shadow-sm"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            <Icon size={26} strokeWidth={2.5} />
          </div>

          {/* النص على اليسار */}
          <div className="flex flex-col items-end text-right flex-1">
            {value !== undefined && value !== null && (
              <span className="text-[30px] font-black font-tajawal leading-none text-slate-800 dark:text-white mb-1">
                {value}
              </span>
            )}
            <span className="text-[15px] font-black font-tajawal text-slate-700 dark:text-slate-100">{label}</span>
            <span className="text-[11px] font-semibold font-readex text-slate-400 dark:text-slate-400 mt-0.5">{subtext}</span>
          </div>
        </div>
      </motion.div>

      {/* ── زر الإجراء المنفصل ── */}
      {actionLabel && (
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleActionClick}
          className="w-full rounded-[14px] py-3 px-4 flex items-center justify-center gap-2 text-[13px] font-black font-tajawal cursor-pointer text-white shrink-0 transition-all duration-200"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 6px 20px -4px ${accentColor}55`,
          }}
        >
          <Plus size={16} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-300" />
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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
    {/* ── كارت 1: إجمالي الأصناف ── */}
    <StatCard
      icon={Package}
      label="إجمالي الأصناف"
      value={itemsCount}
      subtext="صنف مسجل"
      actionLabel="إضافة صنف"
      onAction={onAddItem}
      accentColor="#059669"
      navigateTo="items"
    />

    {/* ── كارت 2: الوارد ── */}
    <StatCard
      icon={Truck}
      label="الوارد"
      subtext="إدارة مخزونك الوارد"
      actionLabel="إضافة وارد"
      onAction={onAddStock}
      accentColor="#4F46E5"
      navigateTo="stock-in"
    />

    {/* ── كارت 3: الفواتير ── */}
    <StatCard
      icon={TrendingUp}
      label="الفواتير"
      subtext="إصدار وإدارة المبيعات"
      actionLabel="فاتورة جديدة"
      onAction={onAddInvoice}
      accentColor="#D97706"
      navigateTo="stock-out"
    />

    {/* ── كارت 4: المرتجعات ── */}
    <StatCard
      icon={RotateCcw}
      label="المرتجعات"
      subtext="متابعة الأصناف المرتجعة"
      actionLabel="تسجيل مرتجع"
      onAction={onAddReturn}
      accentColor="#DC2626"
      navigateTo="returns"
    />
  </div>
));
StatsCards.displayName = 'StatsCards';

export default StatsCards;
