import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';
import { useData } from '../contexts/DataContext';
import { useTransactionAnalytics } from '../hooks/useTransactionAnalytics';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Filter, Calendar, Building2, Search } from 'lucide-react';

export default function () {
  const navigate = useNavigate();
  const { items, dbTransactionsList } = useData();
  
  const {
    chartMode, setChartMode,
    chartDateRange, setChartDateRange,
    chartCompanyFilter, setChartCompanyFilter,
    chartItemFilter, setChartItemFilter,
    selectedCategory, setSelectedCategory,
    dynamicSalesData,
    categorySummary,
    topSellingItems
  } = useTransactionAnalytics({ dbTransactionsList, items });

  const companies = ['الكل', ...new Set(items.map(i => i.company).filter(Boolean))];

  return (
    <div className="flex-1 flex flex-col gap-5 font-readex h-full overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 p-2" dir="rtl">
      {/* ─── TOP NAVIGATION & FILTERS ─── */}
      <div className="shrink-0 flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate({ to: '/' })}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 shadow-sm"
            >
              <ArrowRight size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black font-tajawal text-slate-900 dark:text-white leading-tight">مركز تحليل المبيعات</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">تقارير الأداء وتوجهات الأصناف</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setChartMode('category')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${chartMode === 'category' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              تحليل بالأقسام
            </button>
            <button 
              onClick={() => setChartMode('item')}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${chartMode === 'item' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              تحليل بالأصناف
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-50 dark:bg-slate-800 w-full" />

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
             <Filter size={16} className="text-slate-400 mr-2" />
             
             {/* Date Range Select */}
             <div className="relative">
               <select 
                 value={chartDateRange}
                 onChange={(e) => setChartDateRange(e.target.value)}
                 className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 py-2.5 text-[11px] font-black text-slate-600 dark:text-slate-300 outline-none hover:border-indigo-400 transition-all cursor-pointer min-w-[150px]"
               >
                 <option>هذا الشهر</option>
                 <option>آخر 7 أيام</option>
                 <option>هذا العام</option>
                 <option>الكل</option>
               </select>
               <Calendar size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             {/* Company Filter */}
             <div className="relative">
               <select 
                 value={chartCompanyFilter}
                 onChange={(e) => setChartCompanyFilter(e.target.value)}
                 className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 py-2.5 text-[11px] font-black text-slate-600 dark:text-slate-300 outline-none hover:border-indigo-400 transition-all cursor-pointer max-w-[180px] truncate"
               >
                 <option value="الكل">جميع الشركات</option>
                 {companies.filter(c => c !== 'الكل').map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <Building2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             {/* Item Search Filter (Conditional or Global) */}
             <div className="relative flex-1 min-w-[200px]">
               <input 
                 type="text"
                 placeholder="بحث سريع عن صنف..."
                 value={chartItemFilter === 'الكل' ? '' : chartItemFilter}
                 onChange={(e) => setChartItemFilter(e.target.value || 'الكل')}
                 className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 py-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-400"
               />
               <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN DASHBOARD GRID ─── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        
        {/* --- Sidebar: Category Selection --- */}
        <aside className="w-full lg:w-72 flex flex-col gap-4 shrink-0 overflow-hidden">
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-5 flex flex-col gap-4 overflow-hidden shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} />
              تحليل الأقسام
            </h3>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
              <button
                onClick={() => setSelectedCategory('الكل')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedCategory === 'الكل' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
              >
                <span className="text-sm font-black">جميع الأقسام</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === 'الكل' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {categorySummary.length}
                </span>
              </button>

              {categorySummary.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex flex-col gap-1 p-4 rounded-2xl transition-all border ${selectedCategory === cat.name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black truncate">{cat.name}</span>
                    <span className={`text-[10px] font-black ${selectedCategory === cat.name ? 'text-white/60' : 'text-slate-400'}`}>
                      {cat.sales} وحدة
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full ${selectedCategory === cat.name ? 'bg-white' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.min(100, (cat.sales / (categorySummary[0]?.sales || 1)) * 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* --- Main Content: Chart & Stats --- */}
        <main className="flex-1 flex flex-col gap-5 min-h-0 overflow-y-auto no-scrollbar">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">إجمالي مبيعات القسم</p>
              <h4 className="text-2xl font-black text-indigo-600">{selectedCategory === 'الكل' ? categorySummary.reduce((s,c)=>s+c.sales, 0) : categorySummary.find(c=>c.name===selectedCategory)?.sales || 0} وحدة</h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">تنوع المنتجات</p>
              <h4 className="text-2xl font-black text-emerald-600">{selectedCategory === 'الكل' ? items.length : categorySummary.find(c=>c.name===selectedCategory)?.itemsCount.size || 0} صنف</h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">النطاق الزمني</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">{chartDateRange}</h4>
            </div>
          </div>

          {/* Main Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <AnalyticsSection
              dynamicSalesData={dynamicSalesData}
              chartMode={chartMode}
              setChartMode={setChartMode}
              chartDateRange={chartDateRange}
              setChartDateRange={setChartDateRange}
              chartCompanyFilter={chartCompanyFilter}
              setChartCompanyFilter={setChartCompanyFilter}
              chartItemFilter={chartItemFilter}
              setChartItemFilter={setChartItemFilter}
              items={items}
            />
          </div>

          {/* Top Selling Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 mb-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">الأكثر مبيعاً في هذا القسم</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">تحليل مفصل للأصناف الأعلى طلباً</p>
              </div>
              <TrendingUp className="text-slate-200" size={32} />
            </div>

            <div className="overflow-hidden border border-slate-50 dark:border-slate-800 rounded-3xl">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="px-6 py-4">الصنف</th>
                    <th className="px-6 py-4">الشركة</th>
                    <th className="px-6 py-4">الكمية المباعة</th>
                    <th className="px-6 py-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {topSellingItems.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{item.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400">{item.company}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-indigo-600">{item.sales} وحدة</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-indigo-400'}`} />
                           <span className="text-[10px] font-black text-slate-500 uppercase">{idx === 0 ? 'رائد السوق' : 'مستقر'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {topSellingItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-300 font-bold text-sm">
                        لا توجد بيانات لهذا التصنيف حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
