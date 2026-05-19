import { useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ClipboardList, Search, Snowflake, Thermometer, Package, PackageX,
  Printer, LogOut, LayoutGrid, Box, FileDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { normalizeArabic } from '../lib/arabicTextUtils';
import { useDebounce } from '../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { isInvalidCompany, getItemName } from '../lib/itemFields';

const InventoryItemRow = React.memo(({ item, idx, lowStockThreshold }) => {
  const safeThreshold = Number(lowStockThreshold || 0);
  const goodQty = Number(item.stockQty) || 0;
  const isCritical = safeThreshold > 0 && goodQty <= Math.max(1, Math.floor(safeThreshold / 2));
  const isWarning = safeThreshold > 0 && !isCritical && goodQty <= safeThreshold;

  return (
  <tr className={`group transition-colors ${isCritical ? 'hover:bg-rose-50/70 dark:hover:bg-rose-950/20' : isWarning ? 'hover:bg-amber-50/70 dark:hover:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
    <td className={`px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center text-sm font-black transition-colors border-r-4 ${isCritical ? 'border-r-rose-400 text-rose-500 group-hover:text-rose-600' : isWarning ? 'border-r-amber-400 text-amber-500 group-hover:text-amber-600' : 'border-r-transparent text-slate-400 group-hover:text-[#279489]'}`}>{idx + 1}</td>
    <td className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
      <div className="font-bold text-sm text-slate-800 dark:text-white">
        {getItemName(item)}
        {!isInvalidCompany(item.company) && (
          <span className="text-slate-400 font-normal"> - {item.company}</span>
        )}
      </div>
      {(isCritical || isWarning) && (
        <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black border ${isCritical ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
          {isCritical ? 'حرج' : 'تنبيه'}
        </span>
      )}
      </div>
    </td>
    <td className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 text-[10px] font-bold bg-slate-50 border border-slate-200">{item.cat || 'أخرى'}</span></td>
    <td className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 text-[10px] font-bold">{item.unit || '-'}</span></td>
    <td className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center">
      <div className={`text-sm font-black ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>{goodQty}</div>
    </td>
    <td className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-center">
      <div className={`text-sm font-black ${Number(item.damagedQty) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{Number(item.damagedQty) || 0}</div>
    </td>
  </tr>
  );
});

export default function () {
  const navigate = useNavigate();
  const { items } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');
  const { isViewer } = useAuth();
  const { settings } = useSettings();

  // Client-side sort (avoids compound index)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Prioritize "مجمدات"
      if (a.cat === 'مجمدات' && b.cat !== 'مجمدات') return -1;
      if (a.cat !== 'مجمدات' && b.cat === 'مجمدات') return 1;
      
      const catOrder = (a.cat || '').localeCompare(b.cat || '', 'ar');
      if (catOrder !== 0) return catOrder;
      return (a.name || '').localeCompare(b.name || '', 'ar');
    });
  }, [items]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredItems = useMemo(() => {
    const q = normalizeArabic(debouncedSearchTerm);
    let result = sortedItems.filter(i => {
      // searchKey is usually normalized. We can also fallback to normName + normCompany
      const searchData = i.searchKey || `${i.normName || ''} ${i.normCompany || ''} ${i.cat || ''}`;
      const matchesSearch = q === '' || searchData.includes(q);
      const matchesCat = catFilter === 'الكل' || i.cat === catFilter;
      return matchesSearch && matchesCat;
    });
    return result;
  }, [sortedItems, debouncedSearchTerm, catFilter]);
  const getCategoryIcon = (cat) => {
    if (!cat) return <Box size={16} />;
    if (cat.includes('مجمدات')) return <Snowflake size={16} />;
    if (cat.includes('تبريد') || cat.includes('مبرد')) return <Thermometer size={16} />;
    if (cat.includes('بلاستيك') || cat.includes('تغليف')) return <Package size={16} />;
    return <Box size={16} />;
  };

  // --- GROUPING ---
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      const cat = item.cat || 'أخرى';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const totals = useMemo(() => ({
    itemCount: filteredItems.length,
    goodQty: filteredItems.reduce((sum, item) => sum + Number(item.stockQty || 0), 0),
    damagedQty: filteredItems.reduce((sum, item) => sum + Number(item.damagedQty || 0), 0),
  }), [filteredItems]);

  const lowStockThreshold = Number(settings?.lowStockThreshold ?? 50);
  const lowStockItemsCount = useMemo(
    () => filteredItems.filter((item) => Number(item.stockQty || 0) <= lowStockThreshold).length,
    [filteredItems, lowStockThreshold]
  );

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Approximate row height
    overscan: 5,
  });

  const handlePrintPDF = () => {
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const sortedCats = Object.keys(groupedItems).sort((a, b) => {
      if (a === '\u0645\u062c\u0645\u062f\u0627\u062a') return -1;
      if (b === '\u0645\u062c\u0645\u062f\u0627\u062a') return 1;
      return a.localeCompare(b, 'ar');
    });

    let tablesHtml = '';
    sortedCats.forEach(cat => {
      let rows = '';
      groupedItems[cat].forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f0faf9';
        const cleanName = getItemName(item);
        const itemDisplayName = cleanName + (isInvalidCompany(item.company) ? '' : ` <span style="color:#64748b;font-weight:700;"> - ${item.company}</span>`);
        rows += `<tr style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${bg};">
          <td style="border:1px solid #cbd5e1;padding:10px 12px;text-align:center;font-size:14px;font-weight:700;color:#334155;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:10px 12px;text-align:right;font-size:14px;font-weight:700;color:#1e293b;">${itemDisplayName}</td>
          <td style="border:1px solid #cbd5e1;padding:10px 12px;text-align:center;font-size:14px;font-weight:700;color:#334155;">${item.unit || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:10px 12px;text-align:center;font-size:16px;font-weight:900;color:#059669;">${Number(item.stockQty) || 0}</td>
          <td style="border:1px solid #cbd5e1;padding:10px 12px;text-align:center;font-size:16px;font-weight:900;color:#e11d48;">${Number(item.damagedQty) || 0}</td>
        </tr>`;
      });
      tablesHtml += `
        <div style="margin-bottom:32px;">
          <div style="font-size:18px;font-weight:900;margin-bottom:10px;padding-right:12px;border-right:5px solid #279489;color:#1e293b;">${cat}</div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;">
            <thead>
              <tr>
                <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#279489;border:1px solid #279489;padding:11px 12px;text-align:center;font-size:14px;width:48px;color:#ffffff;font-weight:700;">م</th>
                <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#279489;border:1px solid #279489;padding:11px 12px;text-align:right;font-size:14px;color:#ffffff;font-weight:700;">اسم الصنف</th>
                <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#279489;border:1px solid #279489;padding:11px 12px;text-align:center;font-size:14px;width:120px;color:#ffffff;font-weight:700;">وحدة القياس</th>
                <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#279489;border:1px solid #279489;padding:11px 12px;text-align:center;font-size:14px;width:90px;color:#ffffff;font-weight:700;">السليم</th>
                <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#279489;border:1px solid #279489;padding:11px 12px;text-align:center;font-size:14px;width:90px;color:#ffffff;font-weight:700;">التالف</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>جرد المستودع</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin:0; padding:0; }
    body { font-family: 'Tajawal', Arial, sans-serif; background:#fff; color:#1e293b; padding:0; margin:0; }
    .page { padding: 0; }
    @page { size: A4 portrait; margin: 1.5cm; }
    @media print { 
      body { padding:0; margin:0; } 
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="page">
    <table style="width: 100%; border: none;">
      <thead style="display: table-header-group;">
        <tr>
          <td style="border: none; padding-bottom: 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #1e293b;position:relative;">
              <div style="text-align:right;">
                <div style="font-size:26px;font-weight:900;">بركة الثمار</div>
                <div style="font-size:16px;color:#64748b;margin-top:4px;">مستودع الأحساء</div>
              </div>
              <div style="position:absolute;left:50%;transform:translateX(-50%);text-align:center;">
                <div style="font-size:40px;font-weight:900;">جرد المستودع</div>
              </div>
              <div style="font-size:15px;font-weight:700;text-align:left;">${date}</div>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: none;">
            ${tablesHtml}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=794,height=1123');
    if (!win) {
      toast.error('لم نتمكن من فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleExportExcel = async () => {
    const [ExcelJS, { saveAs }] = await Promise.all([
      import('exceljs'),
      import('file-saver')
    ]);
    const workbook = new ExcelJS.Workbook();
    const dateStr = new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });

    // ─── 1. PROCESS CATEGORIES INTO SEPARATE SHEETS ───
    const sortedCats = Object.keys(groupedItems).sort((a, b) => {
      if (a === 'مجمدات') return -1;
      if (b === 'مجمدات') return 1;
      return a.localeCompare(b, 'ar');
    });

    sortedCats.forEach((cat) => {
      const safeCatName = cat.substring(0, 31).replace(/[\][*?\/\\:']/g, '');
      const catSheet = workbook.addWorksheet(safeCatName, {
        views: [{ rightToLeft: true, showGridLines: true }]
      });

      // Set columns
      catSheet.columns = [
        { key: 'index', width: 8 },
        { key: 'name', width: 45 },
        { key: 'company', width: 30 },
        { key: 'unit', width: 15 },
        { key: 'goodQty', width: 15 },
        { key: 'damagedQty', width: 15 }
      ];

      // Header Row
      const headerRow = catSheet.addRow(['م', 'اسم الصنف', 'الشركة', 'الوحدة', 'السليم', 'التالف']);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2747' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { 
          top: {style:'thin'}, 
          bottom: {style:'thin'}, 
          left: {style:'thin'}, 
          right: {style:'thin'} 
        };
      });

      // Data Rows
      groupedItems[cat].forEach((item, idx) => {
        const row = catSheet.addRow({
          index: idx + 1,
          name: item.name,
          company: isInvalidCompany(item.company) ? '—' : item.company,
          unit: item.unit || '—',
          goodQty: Number(item.stockQty) || 0,
          damagedQty: Number(item.damagedQty) || 0
        });

        row.height = 25;
        const isEven = idx % 2 === 0;
        const rowFill = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Segoe UI', size: 11 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 || colNumber === 3 ? 'right' : 'center' };
          cell.border = {
            top: {style:'thin', color: {argb:'FFEDF2F7'}},
            bottom: {style:'thin', color: {argb:'FFEDF2F7'}},
            left: {style:'thin', color: {argb:'FFEDF2F7'}},
            right: {style:'thin', color: {argb:'FFEDF2F7'}}
          };
          
          if (colNumber === 5 && item.stockQty <= 0) {
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFE11D48' } };
          }
          if (colNumber === 6 && Number(item.damagedQty) > 0) {
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFE11D48' } };
          }
        });
      });

      // Enable AutoFilter
      catSheet.autoFilter = `A1:F1`;
    });

    // ─── 2. GENERATE FILE ───
    const buffer = await workbook.xlsx.writeBuffer();
    const dateForFile = new Date().toISOString().split('T')[0];
    saveAs(new Blob([buffer]), `جرد_المستودع_حسب_الأقسام_${dateForFile}.xlsx`);
  };




  if (!items || items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center font-readex">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-black text-slate-400 animate-pulse">جاري تحميل بيانات الجرد...</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2 font-readex h-full overflow-hidden" dir="rtl">
      {/* ═══ MAIN APP VIEW (HIDDEN ON PRINT) ═══ */}
      <div className="flex flex-col h-full gap-3 sm:gap-4 print:hidden">
        {/* ═══ TOP BAR ═══ */}
        <div className="shrink-0 flex items-center gap-3 flex-wrap bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#279489]/10 rounded-2xl flex items-center justify-center shrink-0">
              <ClipboardList size={24} className="text-[#279489]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black font-tajawal text-slate-800 dark:text-white mb-0.5">جرد المستودع</h1>
              <p className="text-[11px] font-bold text-slate-500">إدارة الجرد والمطابقة</p>
            </div>
          </div>

          <div className="relative flex-1 min-w-[250px] group">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#279489] transition-colors pointer-events-none" />
            <input
              type="text" dir="rtl"
              placeholder="ابحث عن الصنف، الشركة، أو القسم..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-bold rounded-2xl pr-12 pl-4 py-3 outline-none focus:ring-4 focus:ring-[#279489]/5 focus:border-[#279489]/40 transition-all placeholder:text-slate-400 text-center"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate({ to: '/' })} title="العودة للرئيسية" className="flex items-center justify-center w-11 h-11 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl transition-all hover:bg-rose-100 hover:scale-105 active:scale-95"><LogOut size={20} strokeWidth={2.5} className="rotate-180" /></button>
            <button onClick={handleExportExcel} title="تصدير ملف اكسيل" className="flex items-center justify-center w-11 h-11 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-all hover:bg-emerald-100 hover:scale-105 active:scale-95"><FileDown size={20} strokeWidth={2.5} /></button>
            <button onClick={handlePrintPDF} title="طباعة التقرير" className="flex items-center justify-center w-11 h-11 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-all hover:bg-indigo-100 hover:scale-105 active:scale-95"><Printer size={20} strokeWidth={2.5} /></button>
          </div>
        </div>

        {/* ═══ CATEGORY HUB ═══ */}
        <div dir="rtl" className="shrink-0 flex gap-2 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCatFilter('الكل')} className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2.5 ${catFilter === 'الكل' ? 'bg-[#0F2747] border-[#0F2747] shadow-lg shadow-[#0F2747]/20 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}>
            <LayoutGrid size={16} strokeWidth={catFilter === 'الكل' ? 2.5 : 2} />
            <span className="font-tajawal font-bold text-xs pt-0.5">كل الأقسام</span>
          </button>
          {[...new Set(items.map(i => i.cat).filter(Boolean))].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2.5 ${catFilter === cat ? 'bg-[#279489] border-[#279489] shadow-lg shadow-teal-600/20 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}>
              <div className="opacity-80">{getCategoryIcon(cat)}</div>
              <span className="font-tajawal font-bold text-xs pt-0.5">{cat}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className="text-[11px] font-black text-slate-400 mb-2">عدد الأصناف الظاهرة</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">{totals.itemCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/40 shadow-sm p-4">
            <div className="text-[11px] font-black text-emerald-600 mb-2">إجمالي السليم</div>
            <div className="text-2xl font-black text-emerald-600 tabular-nums">{totals.goodQty}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/40 shadow-sm p-4">
            <div className="text-[11px] font-black text-rose-600 mb-2">إجمالي التالف</div>
            <div className="text-2xl font-black text-rose-600 tabular-nums">{totals.damagedQty}</div>
          </div>
        </div>

        {/* ═══ TABLE ═══ */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 relative">
            <table className="w-full text-right border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700 w-16 text-center rounded-tr-xl border-r-4 border-r-transparent">م</th>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700">اسم الصنف</th>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700 text-center w-32">القسم</th>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700 text-center w-28">الوحدة</th>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700 text-center w-32">السليم</th>
                  <th className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl px-4 py-2.5 text-rose-600 dark:text-rose-400 font-bold text-[13px] border-b border-slate-200 dark:border-slate-700 text-center w-32 rounded-tl-xl">التالف</th>
                </tr>
              </thead>
              <tbody>
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={6} /></tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = filteredItems[virtualRow.index];
                  return (
                    <InventoryItemRow 
                      key={item.id} 
                      item={item} 
                      idx={virtualRow.index} 
                      lowStockThreshold={settings?.lowStockThreshold} 
                    />
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} colSpan={6} /></tr>
                )}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="flex flex-col items-center justify-center text-slate-400"><PackageX size={48} className="mb-4 opacity-50" strokeWidth={1.5} /><p className="text-lg font-bold">لا توجد أصناف مطابقة للبحث</p></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* ═══ PRINT TEMPLATE (VISIBLE ONLY ON PRINT) ═══ */}
      <div className="hidden print:block font-tajawal text-slate-900 bg-white w-full" dir="rtl">
        <div className="flex items-center justify-between mb-8 pb-6 border-b-[3px] border-slate-900 relative">
          <div className="text-right">
            <h2 className="text-3xl font-black mb-1">بركة الثمار</h2>
            <p className="text-xl text-slate-500 font-bold">مستودع الأحساء</p>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2"><h1 className="text-5xl font-black">جرد المستودع</h1></div>
          <div className="text-left font-bold text-xl">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        {Object.keys(groupedItems).sort((a, b) => {
          if (a === 'مجمدات') return -1;
          if (b === 'مجمدات') return 1;
          return a.localeCompare(b);
        }).map(cat => (
          <div key={cat} className="mb-10 break-inside-avoid">
            <h3 className="text-2xl font-black mb-4 border-r-[6px] border-slate-900 pr-4">{cat}</h3>
            <table className="w-full border-collapse border-2 border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border-2 border-slate-900 py-4 px-3 w-16 text-xl font-black">م</th>
                  <th className="border-2 border-slate-900 py-4 px-3 text-xl font-black">اسم الصنف والشركة</th>
                  <th className="border-2 border-slate-900 py-4 px-3 w-40 text-xl font-black">وحدة القياس</th>
                  <th className="border-2 border-slate-900 py-4 px-3 w-32 text-xl font-black">السليم</th>
                  <th className="border-2 border-slate-900 py-4 px-3 w-32 text-xl font-black">التالف</th>
                </tr>
              </thead>
              <tbody>
                {groupedItems[cat].map((item, idx) => (
                  <tr key={item.id} className="border-b-2 border-slate-900">
                    <td className="border-x-2 border-slate-900 py-3 px-3 text-lg font-bold">{idx + 1}</td>
                    <td className="border-x-2 border-slate-900 py-3 px-3 text-right text-xl font-bold">
                      {getItemName(item)}
                      {!isInvalidCompany(item.company) && (
                        <span className="text-slate-600 font-bold"> - {item.company}</span>
                      )}
                    </td>
                    <td className="border-x-2 border-slate-900 py-3 px-3 text-lg font-bold">{item.unit}</td>
                    <td className="border-x-2 border-slate-900 py-3 px-3 text-2xl font-black text-emerald-700">{Number(item.stockQty) || 0}</td>
                    <td className="border-x-2 border-slate-900 py-3 px-3 text-2xl font-black text-rose-700">{Number(item.damagedQty) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
