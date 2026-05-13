import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CalendarRange, FilterX, Plus, LogOut, 
  FileText, Pencil, Trash2, CheckCircle, AlertTriangle, 
  RefreshCw, History, Package, User, Calendar, Paperclip, 
  Image as ImageIcon
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   VoucherGroupRow Component
   Memoized row for the desktop table.
═══════════════════════════════════════════════════════════════════ */

export const VoucherGroupRow = React.memo(function VoucherGroupRow({
  group, idx, kind, expandedGroupId, isExporting, isViewer, theme, headerPartyLabel,
  triggerExport, openEditGroup, openDeleteGroup, setExpandedGroupId, onResetStatus
}) {
  const isExpanded = expandedGroupId === group.groupId;

  return (
    <tr
      onClick={() => setExpandedGroupId((id) => (id === group.groupId ? null : group.groupId))}
      className="group hover:bg-slate-50/50 cursor-pointer transition-colors hover-stable no-select-click h-[56px]"
      style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden', transform: 'translate3d(0, 0, 0)' }}
    >
      <td className="px-4 text-center border-x border-slate-50/50 dark:border-slate-700/30">
        <span className="text-[11px] font-black text-slate-400 group-hover:text-primary transition-colors">{idx + 1}</span>
      </td>
      <td className="px-6 text-center border-x border-slate-50/50 dark:border-slate-700/30">
        <span className="text-xs font-black text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-lg border border-primary/10">
          {group.voucherCode || '—'}
        </span>
      </td>
      <td className="px-6 text-center border-x border-slate-50/50 dark:border-slate-700/30">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
          {group.date || '—'}
        </span>
      </td>
      <td className="px-6 text-right border-x border-slate-50/50 dark:border-slate-700/30">
        <div className="font-black text-slate-800 dark:text-white truncate">
          {kind === 'in' ? group.supplier : group.rep || '—'}
        </div>
      </td>
      <td className="px-6 text-center border-x border-slate-50/50 dark:border-slate-700/30">
        <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-xs border border-slate-200 dark:border-slate-700">
          {group.lineCount}
        </span>
      </td>
      <td className="px-6 text-right border-x border-slate-50/50 dark:border-slate-700/30">
        <div className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
           {(group.line_note || '').split(/\[تعديل بعد الفوترة\]|\[تم الإلغاء\]|\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0].trim() || '—'}
           {(group.line_note || '').includes('<!--') && (
             <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 ml-1">
               <History size={10} />
             </div>
           )}
        </div>
      </td>
      <td className="px-6 text-center border-x border-slate-50/50 dark:border-slate-700/30">
         {group.lines.some(l => l.status === 'cancelled') ? (
           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black shadow-sm">
              <AlertTriangle size={10} /> ملغي
           </span>
         ) : (group.lines.some(l => l.status === 'مفوتر') || group.isTransfer) ? (
           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black shadow-sm">
              <CheckCircle size={10} /> {group.isTransfer ? 'تحويل مكتمل' : 'مفوتر'}
           </span>
         ) : (
           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black shadow-sm">
              <RefreshCw size={10} className="animate-spin-slow" /> قيد المراجعة
           </span>
         )}
      </td>
      <td className="px-6 text-center border-x border-slate-50/50 dark:border-slate-700/30">
        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
          {!isViewer && (
            <>
              {group.lines.some(l => l.status === 'cancelled') ? (
                <span className="text-[10px] font-bold text-rose-400 italic px-2">سند ملغي</span>
              ) : group.lines.some(l => l.status === 'مفوتر') ? (
                <button 
                  onClick={() => onResetStatus(group)}
                  className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all"
                  title="إلغاء الفوترة لإتاحة التعديل"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => openEditGroup(group)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                    title="تعديل السند"
                  >
                    <Pencil size={14} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => openDeleteGroup(group)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    title="حذف السند"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}, (prev, next) => (
  prev.group.groupId === next.group.groupId &&
  prev.group.lines.length === next.group.lines.length &&
  prev.group.lines.every((l, i) => l.status === next.group.lines[i]?.status) &&
  prev.expandedGroupId === next.expandedGroupId &&
  prev.isExporting === next.isExporting &&
  prev.isViewer === next.isViewer &&
  prev.kind === next.kind &&
  prev.headerPartyLabel === next.headerPartyLabel &&
  prev.idx === next.idx
));

/* ═══════════════════════════════════════════════════════════════════
   VoucherGroupDetails Component
   Memoized expanded details section.
═══════════════════════════════════════════════════════════════════ */

export const VoucherGroupDetails = React.memo(function VoucherGroupDetails({
  group, kind, isViewer, theme, openEdit, openDelete,
}) {
  const [showHistory, setShowHistory] = React.useState(false);

  const historyData = React.useMemo(() => {
    const match = (group.line_note || '').match(/<!--(\{.*?\})-->/s);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch(e) { return null; }
  }, [group.line_note]);

  return (
    <tr>
      <td colSpan="8" className="px-6 py-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] mb-6 mt-2 border border-slate-100 dark:border-slate-800 shadow-inner"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 dark:border-slate-700/50 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                    الجهة المستلمة
                  </span>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">
                    {kind === 'in' ? group.supplier : group.rep || '—'}
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 dark:border-slate-700/50 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">تاريخ العملية</span>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                    {group.date || '—'}
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 dark:border-slate-700/50 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">ملاحظات ومرفقات</span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate italic">
                      {(group.line_note || '').split(/<!--|\[تعديل بعد الفوترة\]|\[تم الإلغاء\]|\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:/)[0].trim() || 'لا توجد ملاحظات'}
                    </p>
                    {group.attachment && (
                      <a href={group.attachment} target="_blank" rel="noreferrer" className="p-1 bg-blue-50 text-blue-500 rounded-md hover:bg-blue-100 transition-colors shrink-0">
                        <Paperclip size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <div />
              <div className="flex items-center gap-2">
                {group.isTransfer && (
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black shadow-sm">
                      <Package size={12} /> تحويل مخزني مكتمل
                   </div>
                )}
                {group.status === 'cancelled' && (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-black animate-pulse shadow-sm">
                    <AlertTriangle size={14} /> تم إلغاء هذا السند بالكامل
                  </div>
                )}
                {historyData && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(v => !v)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black transition-all shadow-sm ${showHistory ? 'bg-amber-400 text-amber-950 border-amber-300' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                  >
                    <RefreshCw size={12} />
                    {showHistory ? 'عرض النسخة الحالية' : 'عرض النسخة السابقة'}
                  </button>
                )}
              </div>
            </div>

            {showHistory && historyData && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 space-y-3">
                <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-amber-50/80 text-amber-600 font-black text-[9px] uppercase tracking-widest border-b border-amber-100">
                      <tr>
                        <th className="px-4 py-2.5 text-center w-10">م</th>
                        <th className="px-4 py-2.5">الصنف</th>
                        <th className="px-4 py-2.5 text-center">الكمية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {historyData.lines.filter(l => !l.is_summary).map((l, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-center">{i + 1}</td>
                          <td className="px-4 py-2.5 font-black">{l.item}</td>
                          <td className="px-4 py-2.5 text-center font-black">{l.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <table className="w-full text-right text-xs border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-4 py-2 w-12 text-center">م</th>
                  <th className="px-4 py-2">الصنف والشركة</th>
                  <th className="px-4 py-2 text-center">الكمية</th>
                  <th className="px-4 py-2 text-center">القسم</th>
                  {!isViewer && group.status !== 'cancelled' && <th className="px-4 py-2 text-center">إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {group.lines.filter(l => !l.is_summary).map((l, lIdx) => (
                  <tr key={l.id} className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-xl shadow-sm group/row">
                    <td className="px-4 py-2 text-center rounded-r-xl border-y border-r border-slate-50 dark:border-slate-700/50">{lIdx + 1}</td>
                    <td className="px-4 py-2 font-black border-y border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-300" />
                        <span>{l.item}</span>
                        {l.company && <span className="text-[10px] font-bold text-slate-400">({l.company})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center border-y border-slate-50 dark:border-slate-700/50">
                      <span className={`px-3 py-1 rounded-lg font-black text-xs ${theme.qtyBadge}`}>
                        {l.qty} {l.unit}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-slate-500 text-[10px] font-bold border-y border-slate-50 dark:border-slate-700/50">{l.cat || '—'}</td>
                    {!isViewer && group.status !== 'cancelled' && (
                      <td className="px-4 py-2 text-center rounded-l-xl border-y border-l border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(l); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); openDelete(l); }} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </td>
    </tr>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   VoucherSidePanel Main Component
═══════════════════════════════════════════════════════════════════ */

export default function VoucherSidePanel({
  kind, cfg, theme, settings,
  filterSearch, setFilterSearch,
  filterDateFrom, setFilterDateFrom,
  filterDateTo, setFilterDateTo,
  isDateFilterOpen, setIsDateFilterOpen,
  resetFilters,
  filteredGroups,
  expandedGroupId, setExpandedGroupId,
  openModal,
  triggerExport,
  openEditGroup,
  openDeleteGroup,
  onResetStatus,
  openEdit,
  openDelete,
  isViewer,
  isExporting
}) {
  const headerPartyLabel = kind === 'in' ? 'المورد' : 'المستفيد';
  const glowImg = `hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]`;
  const glowEdit = `hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]`;
  const glowDel = `hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]`;
  const actionBtnBase = 'inline-flex items-center justify-center rounded-xl border font-bold text-xs transition-all duration-200';

  return (
    <div className="flex flex-col gap-4">
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${theme.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg ${theme.shadow} shrink-0`}>
            {cfg.Icon && <cfg.Icon size={28} />}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              {settings?.labels?.[kind === 'in' ? 'voucherIn' : 'voucherOut'] || cfg.pageTitle}
            </h1>
            <p className="text-slate-400 mt-1 font-bold text-[11px]">{cfg.pageSubtitle}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-4 px-4">
          <div className="relative flex-1 w-full group">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={`ابحث برقم السند أو ${headerPartyLabel}...`}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[13px] font-bold rounded-2xl pr-12 pl-4 h-12 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 shadow-inner" 
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto relative">
            <button 
              onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
              className={`h-12 px-5 rounded-2xl border transition-all flex items-center gap-3 font-black text-[12px] shadow-sm ${
                isDateFilterOpen || filterDateFrom || filterDateTo 
                  ? `bg-${cfg.accent}-50 border-${cfg.accent}-200 text-${cfg.accent}-600` 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
              }`}
            >
              <CalendarRange size={18} />
              <span>{filterDateFrom || filterDateTo ? 'تصفية مفعلة' : 'فلتر التاريخ'}</span>
            </button>

            {isDateFilterOpen && (
              <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 p-6 z-[100]">
                <div className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">من تاريخ</label>
                    <input 
                      type="date" 
                      className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 text-xs font-black outline-none"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إلى تاريخ</label>
                    <input 
                      type="date" 
                      className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 text-xs font-black outline-none"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { resetFilters(); setIsDateFilterOpen(false); }} className="flex-1 py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black">إعادة تعيين</button>
                    <button onClick={() => setIsDateFilterOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black">إغلاق</button>
                  </div>
                </div>
              </div>
            )}
            
            {filterSearch && (
              <button onClick={resetFilters} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all shadow-sm shadow-rose-500/10">
                <FilterX size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isViewer && (
            <button
              type="button"
              onClick={openModal}
              className={`flex items-center gap-2 px-6 py-2.5 h-11 rounded-xl font-bold text-white bg-gradient-to-br ${theme.gradient} ${theme.shadow} shadow-lg transition-all active:scale-95`}
            >
              <Plus size={20} />
              <span>سند جديد</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => (window.location.hash = '#dashboard')}
            className="w-11 h-11 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-500/20 group"
          >
             <LogOut size={22} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── TABLE AREA ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] gap-6 text-slate-400 opacity-60">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
                <FileText size={40} className="text-slate-300" />
             </div>
             <p className="text-lg font-black">لا توجد سجلات مطابقة</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-4 text-center w-12 border-x border-slate-100 dark:border-slate-700">م</th>
                    <th className="px-6 py-4 text-center w-40 border-x border-slate-100 dark:border-slate-700">رقم السند</th>
                    <th className="px-6 py-4 text-center w-48 border-x border-slate-100 dark:border-slate-700">التاريخ</th>
                    <th className="px-6 py-4 text-right border-x border-slate-100 dark:border-slate-700">{headerPartyLabel}</th>
                    <th className="px-6 py-4 text-center w-28 border-x border-slate-100 dark:border-slate-700">الأصناف</th>
                    <th className="px-6 py-4 text-right w-48 border-x border-slate-100 dark:border-slate-700">الملاحظات</th>
                    <th className="px-6 py-4 text-center w-44 border-x border-slate-100 dark:border-slate-700">الحالة</th>
                    <th className="px-6 py-4 text-center w-48 border-x border-slate-100 dark:border-slate-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGroups.map((group, idx) => (
                    <React.Fragment key={group.groupId}>
                      <VoucherGroupRow
                        group={group}
                        idx={idx}
                        kind={kind}
                        isViewer={isViewer}
                        theme={theme}
                        isExporting={isExporting}
                        headerPartyLabel={headerPartyLabel}
                        setExpandedGroupId={setExpandedGroupId}
                        onResetStatus={onResetStatus}
                        openEditGroup={openEditGroup}
                        openDeleteGroup={openDeleteGroup}
                        triggerExport={triggerExport}
                        expandedGroupId={expandedGroupId}
                      />
                      <AnimatePresence>
                        {expandedGroupId === group.groupId && (
                          <VoucherGroupDetails
                            group={group}
                            kind={kind}
                            isViewer={isViewer}
                            theme={theme}
                            openEdit={openEdit}
                            openDelete={openDelete}
                          />
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGroups.map((group) => (
                <div key={group.groupId} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-400">رقم السند</p>
                      <p className="font-black text-slate-800 dark:text-white">{group.voucherCode || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{group.date}</span>
                  </div>
                  <p className="text-sm font-bold">{headerPartyLabel}: {kind === 'in' ? group.supplier : group.rep || '—'}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => triggerExport(group, 'png')} className={`${actionBtnBase} px-3 py-2 border-emerald-200 text-emerald-600 ${glowImg}`}><ImageIcon size={14} className="ml-1" /> صورة</button>
                    {!isViewer && !group.lines.some(l => l.status === 'مفوتر') && (
                      <>
                        <button onClick={() => openEditGroup(group)} className={`${actionBtnBase} px-3 py-2 border-blue-200 text-blue-600 ${glowEdit}`}><Pencil size={14} className="ml-1" /> تعديل</button>
                        <button onClick={() => openDeleteGroup(group)} className={`${actionBtnBase} px-3 py-2 border-rose-200 text-rose-600 ${glowDel}`}><Trash2 size={14} className="ml-1" /> حذف</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
