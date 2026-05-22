import { useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Pencil, X, Check, Tags,
  TrendingUp, TrendingDown, LogOut,
  AlertCircle, LayoutGrid, Snowflake, Box, Thermometer, Package
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { normalizeArabic } from '../lib/arabicTextUtils';
import { getItemName, isInvalidCompany } from '../lib/itemFields';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useDebounce } from '../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';

// ── Inline-editable Row ───────────────────────────────────────────
const PriceItemRow = React.memo(({ item, idx, isViewer, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef(null);

  const startEdit = () => {
    if (isViewer) return;
    setDraft(String(item.price ?? ''));
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  const save = async () => {
    const val = Number(draft);
    if (draft === '' || isNaN(val) || val < 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }
    if (val === item.price) { cancel(); return; }
    setSaving(true);
    try {
      await onSave(item, val);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  return (
    <tr className={`group transition-colors h-[52px] ${editing ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/10'}`}>
      {/* م */}
      <td className="px-6 py-2 text-center align-middle">
        <span className="text-[13px] font-bold text-slate-300 tabular-nums">{idx + 1}</span>
      </td>

      {/* الصنف */}
      <td className="px-6 py-2 align-middle">
        <span className="text-[15px] font-black text-slate-800 tracking-tight whitespace-nowrap">
          {getItemName(item)}
          {!isInvalidCompany(item.company) && ` - ${item.company}`}
        </span>
      </td>

      {/* القسم */}
      <td className="px-6 py-2 text-center align-middle">
        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border bg-slate-50 text-slate-500 border-slate-100">
          {item.cat || 'أخرى'}
        </span>
      </td>

      {/* الوحدة */}
      <td className="px-6 py-2 text-center align-middle">
        <span className="text-[11px] font-bold text-slate-400">{item.unit || 'وحدة'}</span>
      </td>

      {/* السعر السابق */}
      <td className="px-6 py-2 text-center align-middle">
        <div className="flex items-center justify-center text-slate-400 font-bold tabular-nums">
          <span className="text-lg">{item.old_price || 0}</span>
        </div>
      </td>

      {/* السعر الحالي — قابل للتعديل inline */}
      <td className="px-6 py-2 text-center align-middle">
        {editing ? (
          <div className="flex items-center justify-center gap-1">
            <input
              ref={inputRef}
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              disabled={saving}
              className="w-24 h-9 rounded-xl border-2 border-indigo-400 bg-white text-center text-lg font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-300 tabular-nums shadow-md"
              style={{ MozAppearance: 'textfield' }}
            />
            {/* زرار حفظ */}
            <button
              onClick={save}
              disabled={saving}
              className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 transition-all shadow"
              title="حفظ (Enter)"
            >
              {saving
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Check size={15} strokeWidth={3} />}
            </button>
            {/* زرار إلغاء */}
            <button
              onClick={cancel}
              disabled={saving}
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 transition-all shadow"
              title="إلغاء (Esc)"
            >
              <X size={15} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-black tabular-nums bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-flex mx-auto">
            <span className="text-xl">{item.price || 0}</span>
            {item.price > (item.old_price || 0) ? (
              <TrendingUp size={14} />
            ) : item.price < (item.old_price || 0) ? (
              <TrendingDown size={14} />
            ) : null}
          </div>
        )}
      </td>

      {/* إجراء */}
      <td className="px-6 py-2 text-center align-middle">
        {!isViewer && !editing && (
          <button 
            onClick={startEdit}
            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm group/btn mx-auto"
            title="تعديل السعر"
          >
            <Pencil size={16} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        )}
      </td>
    </tr>
  );
});

// ── Main Component ────────────────────────────────────────────────
export default function PriceList() {
  const navigate = useNavigate();
  const { isViewer } = useAuth();
  const { items, fetchInitialData } = useData();
  const [searchQuery, setSearchQuery]   = useState('');
  const debouncedSearchQuery            = useDebounce(searchQuery, 300);
  const [selectedCat, setSelectedCat]   = useState('الكل');
  const parentRef                       = useRef(null);

  const categories = useMemo(() => {
    const cats = ['الكل', ...new Set(items.map(item => item.cat).filter(Boolean))];
    return cats;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const q = normalizeArabic(debouncedSearchQuery);
    return items.filter(item => {
      const matchesSearch = !q || (item.normName && item.normName.includes(q)) || 
                            (item.normCompany && item.normCompany.includes(q));
      const matchesCat = selectedCat === 'الكل' || item.cat === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [items, debouncedSearchQuery, selectedCat]);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  // ── Save handler (passed to each row) ──
  const handleSave = useCallback(async (item, newPrice) => {
    const { error } = await supabase
      .from('products')
      .update({ old_price: item.price || 0, price: newPrice })
      .eq('id', item.id);
    if (error) {
      toast.error(`خطأ: ${error.message}`);
      throw error;
    }
    toast.success(`✅ تم تحديث سعر "${getItemName(item)}" إلى ${newPrice}`);
    if (fetchInitialData) fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6 font-readex h-full overflow-hidden relative" dir="rtl">
      
      {/* ═══ HEADER ═══ */}
      <div className="shrink-0 flex items-center gap-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Tags size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black font-tajawal tracking-tight text-slate-900 leading-none">قائمة الأسعار</h1>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">إدارة وتسعير المنتجات</p>
          </div>
        </div>

        <div className="w-px h-10 bg-slate-100 mx-2" />

        <div className="relative flex-1 group">
          <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="ابحث عن صنف لتعديل سعره..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold rounded-2xl pr-12 pl-4 py-3.5 outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
          />
        </div>

        <button 
          onClick={() => navigate({ to: '/' })}
          className="flex items-center justify-center w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
        >
          <LogOut size={22} className="rotate-180" />
        </button>
      </div>

      {/* ═══ CATEGORY FILTER ═══ */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-2" dir="rtl">
        {categories.map(cat => {
          const isActive = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-black text-sm
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}
              `}
            >
              <div className={isActive ? 'text-white' : 'text-slate-300'}>
                {cat === 'الكل'    && <LayoutGrid size={18} />}
                {cat === 'مجمدات' && <Snowflake   size={18} />}
                {cat === 'بلاستيك'&& <Box         size={18} />}
                {cat === 'تبريد'  && <Thermometer size={18} />}
                {!['الكل','مجمدات','بلاستيك','تبريد'].includes(cat) && <Package size={18} />}
              </div>
              {cat}
            </button>
          );
        })}
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="flex-1 overflow-hidden bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
        <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
              <AlertCircle size={48} strokeWidth={1.5} />
              <p className="text-lg font-black">لا توجد أصناف تطابق بحثك</p>
            </div>
          ) : (
            <table className="w-full text-right border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
                <tr className="text-slate-400 font-black text-[11px] uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-2 text-center w-16">م</th>
                  <th className="px-6 py-2">اسم الصنف</th>
                  <th className="px-6 py-2 text-center w-32">القسم</th>
                  <th className="px-6 py-2 text-center w-32">الوحدة</th>
                  <th className="px-6 py-2 text-center w-40">السعر السابق</th>
                  <th className="px-6 py-2 text-center w-52">السعر الحالي</th>
                  <th className="px-6 py-2 text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={7} /></tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                  <PriceItemRow 
                    key={filteredItems[virtualRow.index].id} 
                    item={filteredItems[virtualRow.index]} 
                    idx={virtualRow.index} 
                    isViewer={isViewer} 
                    onSave={handleSave}
                  />
                ))}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} colSpan={7} /></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
