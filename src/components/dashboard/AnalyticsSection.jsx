import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Activity, LayoutGrid, Package, Filter, Calendar, Building2, ChevronDown 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell, LabelList 
} from 'recharts';

const AnalyticsSection = ({ 
  dynamicSalesData,
  chartMode, 
  items,
}) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.name === 'لا توجد بيانات') return null;

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl" dir="rtl">
          <p className="font-black text-slate-800 dark:text-white text-[11px] mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
            {data.name}
          </p>
          <div className="space-y-1.5">
             <div className="flex justify-between items-center gap-4 text-[10px]">
               <span className="text-slate-400 font-bold">الشركة:</span>
               <span className="text-slate-700 dark:text-slate-300 font-black">{data.company || '-'}</span>
             </div>
             <div className="flex justify-between items-center gap-4 text-[10px]">
               <span className="text-slate-400 font-bold">الكمية:</span>
               <span className="text-indigo-600 font-black">{data.sales} وحدة</span>
             </div>
             <div className="flex justify-between items-center gap-4 text-[10px]">
               <span className="text-slate-400 font-bold">التاريخ:</span>
               <span className="text-slate-700 dark:text-slate-300 font-black">{data.date || '-'}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomBarLabel = ({ x, y, width, value }) => {
    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#6366f1" 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="text-[10px] font-black"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* --- Main Chart Area --- */}
      <div className="h-[340px] w-full min-w-0 relative">
        {dynamicSalesData.length <= 1 && dynamicSalesData[0]?.name === 'لا توجد بيانات' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-4">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
                <TrendingUp size={40} className="opacity-50" />
             </div>
             <p className="text-sm font-black">لا توجد بيانات كافية لعرضها في الرسم البياني</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dynamicSalesData} 
              margin={{ top: 30, right: 20, left: -10, bottom: 40 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey={chartMode === 'item' ? 'name' : 'name'} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                dy={15}
                angle={dynamicSalesData.length > 5 ? -25 : 0}
                textAnchor={dynamicSalesData.length > 5 ? "end" : "middle"}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: '#f8fafc', radius: 12, opacity: 0.4 }} 
              />
              <Bar 
                dataKey="sales" 
                fill="url(#barGradient)" 
                radius={[10, 10, 0, 0]} 
                barSize={dynamicSalesData.length > 15 ? 20 : 40}
                animationDuration={1500}
              >
                <LabelList 
                  dataKey="sales" 
                  content={renderCustomBarLabel} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- Legend --- */}
      <div className="flex items-center justify-end gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">حجم المبيعات الفعلي</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="text-[11px] font-black text-slate-400">تحليل الأداء المقارن</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnalyticsSection);
