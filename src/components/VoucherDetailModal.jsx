import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, Trash2, History, RotateCcw,
  FileText, CheckCircle2, Timer, User,
  Activity, Hash, MessageSquare, ArrowLeftRight,
  ChevronDown
} from 'lucide-react';

const sectionButtonClass = 'flex w-full items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-right transition-all hover:border-slate-300 hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200';

const diffToneMap = {
  added: {
    label: 'مضاف',
    container: 'bg-emerald-50/90 border-emerald-200',
    badge: 'bg-emerald-500 text-white',
    text: 'text-emerald-700',
  },
  removed: {
    label: 'محذوف',
    container: 'bg-rose-50/90 border-rose-200',
    badge: 'bg-rose-500 text-white',
    text: 'text-rose-700',
  },
  changed: {
    label: 'معدّل',
    container: 'bg-amber-50/90 border-amber-200',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-700',
  },
  unchanged: {
    label: 'بدون تغيير',
    container: 'bg-white border-slate-200',
    badge: 'bg-slate-100 text-slate-500 border border-slate-200',
    text: 'text-slate-600',
  },
};

const cleanNote = (note) => {
  if (!note) return '—';
  return note
    .replace(/\[تعديل بعد الفوترة\]/g, '')
    .split(/\[تعديل حديث\]|\[تم تعديله\]|\[تم إصدار الفاتورة|\[تمت الفوترة\]|\[إضافة مراجعة\]|\[مستند رقم|\[نوع:|<!--/)[0]
    .trim() || '—';
};

const sanitizeItemLabel = (value) => (value || '')
  .replace(/\s*-\s*-$/, '')
  .replace(/\s*-\s*بدون شركة$/, '')
  .trim();

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const formatDateTimeLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildLineIdentity = (line) => [
  normalizeValue(sanitizeItemLabel(line?.item)),
  normalizeValue(line?.company === '-' ? '' : line?.company),
  normalizeValue(line?.cat),
  normalizeValue(line?.unit),
].join('|');

const buildLineExactKey = (line) => [
  buildLineIdentity(line),
  Number(line?.qty) || 0,
].join('|');

const createGroupedLineMap = (lines, keyBuilder) => {
  const map = new Map();
  lines.forEach((line, idx) => {
    const key = keyBuilder(line);
    const row = {
      sourceIndex: idx,
      line,
      label: sanitizeItemLabel(line?.item || '—'),
    };
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row);
  });
  return map;
};

const compareVoucherLines = (previousLines, currentLines) => {
  const previousExact = createGroupedLineMap(previousLines, buildLineExactKey);
  const currentExact = createGroupedLineMap(currentLines, buildLineExactKey);
  const previousByIdentity = createGroupedLineMap(previousLines, buildLineIdentity);
  const currentByIdentity = createGroupedLineMap(currentLines, buildLineIdentity);
  const rows = [];

  const consumeFromBucket = (map, key) => {
    const bucket = map.get(key);
    if (!bucket || bucket.length === 0) return null;
    const value = bucket.shift();
    if (bucket.length === 0) map.delete(key);
    return value;
  };

  const consumeExactMatches = () => {
    Array.from(new Set([...previousExact.keys(), ...currentExact.keys()])).forEach((key) => {
      while (previousExact.has(key) && currentExact.has(key)) {
        const previousRow = consumeFromBucket(previousExact, key);
        const currentRow = consumeFromBucket(currentExact, key);
        consumeFromBucket(previousByIdentity, buildLineIdentity(previousRow.line));
        consumeFromBucket(currentByIdentity, buildLineIdentity(currentRow.line));

        rows.push({
          key: `exact-${key}-${previousRow.sourceIndex}-${currentRow.sourceIndex}`,
          status: 'unchanged',
          previousLine: previousRow.line,
          currentLine: currentRow.line,
          label: currentRow.label || previousRow.label,
          sortIndex: Math.min(previousRow.sourceIndex, currentRow.sourceIndex),
        });
      }
    });
  };

  const consumeIdentityMatches = () => {
    Array.from(new Set([...previousByIdentity.keys(), ...currentByIdentity.keys()])).forEach((key) => {
      while (previousByIdentity.has(key) && currentByIdentity.has(key)) {
        const previousRow = consumeFromBucket(previousByIdentity, key);
        const currentRow = consumeFromBucket(currentByIdentity, key);

        rows.push({
          key: `changed-${key}-${previousRow.sourceIndex}-${currentRow.sourceIndex}`,
          status: 'changed',
          previousLine: previousRow.line,
          currentLine: currentRow.line,
          label: currentRow.label || previousRow.label,
          sortIndex: Math.min(previousRow.sourceIndex, currentRow.sourceIndex),
        });
      }
    });
  };

  const consumeRemaining = (map, status) => {
    Array.from(map.entries()).forEach(([key, bucket]) => {
      bucket.forEach((row) => {
        rows.push({
          key: `${status}-${key}-${row.sourceIndex}`,
          status,
          previousLine: status === 'removed' ? row.line : null,
          currentLine: status === 'added' ? row.line : null,
          label: row.label,
          sortIndex: row.sourceIndex,
        });
      });
    });
  };

  consumeExactMatches();
  consumeIdentityMatches();
  consumeRemaining(previousByIdentity, 'removed');
  consumeRemaining(currentByIdentity, 'added');

  return rows.sort((a, b) => {
    const order = { changed: 0, added: 1, removed: 2, unchanged: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.sortIndex - b.sortIndex;
  });
};

const parseHistory = (note) => {
  if (!note) return [];
  const matches = [...note.matchAll(/<!--HIST:(.*?)-->/g)];
  return matches
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
};

function ComparisonStat({ label, value, helper, accent = 'slate' }) {
  const accents = {
    slate: 'bg-white border-slate-200 text-[#0F2747]',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`rounded-[24px] border px-5 py-4 shadow-sm ${accents[accent] || accents.slate}`}>
      <p className="text-[11px] font-black tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
      {helper && <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>}
    </div>
  );
}

function InfoField({ icon, label, value, helper, highlight = false }) {
  return (
    <div className={`rounded-[24px] border px-5 py-4 shadow-sm ${highlight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px] font-black tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-base sm:text-lg font-black text-[#0F2747] leading-7 break-words">{value || '—'}</p>
      {helper && <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>}
    </div>
  );
}

function DiffField({ label, currentValue, previousValue, changed }) {
  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${changed ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-black tracking-wide text-slate-500">{label}</span>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${changed ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
          {changed ? 'تغيّر' : 'ثابت'}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-black tracking-wide text-slate-400">النسخة السابقة</p>
          <p className="mt-2 text-sm font-black text-slate-700 break-words leading-6">{previousValue || '—'}</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${changed ? 'border-amber-200 bg-amber-100/60' : 'border-slate-200 bg-slate-50/60'}`}>
          <p className="text-[10px] font-black tracking-wide text-slate-400">السند الحالي</p>
          <p className="mt-2 text-sm font-black text-[#0F2747] break-words leading-6">{currentValue || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function MobileDiffCard({ row }) {
  const tone = diffToneMap[row.status];

  return (
    <div className={`rounded-[24px] border p-4 shadow-sm ${tone.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-black leading-6 ${tone.text}`}>{row.label}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">
            الشركة: {row.currentLine?.company || row.previousLine?.company || '—'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${tone.badge}`}>
          {tone.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
          <p className="text-[10px] font-black tracking-wide text-slate-400">النسخة السابقة</p>
          <p className="mt-2 text-base font-black tabular-nums text-slate-700">
            {row.previousLine ? row.previousLine.qty : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-3 text-center">
          <p className="text-[10px] font-black tracking-wide text-slate-400">السند الحالي</p>
          <p className="mt-2 text-base font-black tabular-nums text-[#0F2747]">
            {row.currentLine ? row.currentLine.qty : '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-center">
          <p className="text-[10px] font-black text-indigo-500">القسم</p>
          <p className="mt-1 text-xs font-black text-indigo-700">
            {row.currentLine?.cat || row.previousLine?.cat || '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
          <p className="text-[10px] font-black text-slate-400">الوحدة</p>
          <p className="mt-1 text-xs font-black text-slate-700">
            {row.currentLine?.unit || row.previousLine?.unit || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileCurrentItemCard({ line, idx, isCompleted, handleDeleteTransaction, loading }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-xl bg-slate-100 px-2 text-[11px] font-black text-slate-500">
              {idx + 1}
            </span>
            <p className="text-sm font-black leading-6 text-[#0F2747]">
              {sanitizeItemLabel(line.item)}
            </p>
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">
            الشركة: {line.company === '-' || !line.company ? '—' : line.company}
          </p>
        </div>

        {!isCompleted && (
          <button
            type="button"
            onClick={() => handleDeleteTransaction(line.id)}
            disabled={loading}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`حذف ${sanitizeItemLabel(line.item)}`}
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <p className="text-[10px] font-black tracking-wide text-slate-400">الكمية</p>
          <p className="mt-2 text-base font-black tabular-nums text-[#0F2747]">{line.qty}</p>
          <p className="mt-1 text-[10px] font-bold text-slate-500">{line.unit}</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-center">
          <p className="text-[10px] font-black tracking-wide text-indigo-500">القسم</p>
          <p className="mt-2 text-xs font-black text-indigo-700">{line.cat || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, sectionKey, openSections, toggleSection, children, defaultBadge }) {
  const isOpen = openSections[sectionKey];

  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50/40">
      <button
        type="button"
        className={sectionButtonClass}
        onClick={() => toggleSection(sectionKey)}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-600">
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-black text-[#0F2747]">{title}</h4>
            {subtitle && <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {defaultBadge}
          <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={18} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function VoucherDetailModal({
  isOpen,
  onClose,
  voucher,
  showVoucherHistory,
  setShowVoucherHistory,
  updateVoucherNote: _updateVoucherNote,
  handleDeleteTransaction,
  printVoucher,
  duplicateVoucher: _duplicateVoucher,
  loading,
  handleMarkAsInvoiced,
  setIsVoucherModalOpen: _setIsVoucherModalOpen,
  setSelectedVoucher: _setSelectedVoucher
}) {
  const [selectedHistoryIndex, setSelectedHistoryIndex] = React.useState(0);
  const [openSections, setOpenSections] = React.useState({
    overview: true,
    comparison: true,
    items: true,
  });

  React.useEffect(() => {
    if (!isOpen || !voucher?.id) return;
    setSelectedHistoryIndex(0);
    setOpenSections({
      overview: true,
      comparison: true,
      items: true,
    });
  }, [isOpen, voucher?.id]);

  if (!isOpen || !voucher) return null;

  const isIn = voucher.kind === 'in';
  const isCompleted = voucher.invoiced === true;
  const lines = voucher.lines || [];
  const voucherDate = voucher.timestamp ? new Date(voucher.timestamp) : null;
  const totalQuantity = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
  const recipientLabel = voucher.isTransfer
    ? 'الجهة المحول إليها'
    : (isIn ? 'المورد / الجهة' : 'المستفيد / الجهة');

  let invoiceDate = null;
  if (voucher.line_note && voucher.line_note.includes('[تم إصدار الفاتورة: ')) {
    const match = voucher.line_note.match(/\[تم إصدار الفاتورة: (.*?)\]/);
    if (match) invoiceDate = match[1];
  }

  const historyEntries = React.useMemo(() => parseHistory(voucher.line_note), [voucher.line_note]);
  const isEdited = historyEntries.length > 0;
  const selectedHistoryEntry = historyEntries[selectedHistoryIndex] || historyEntries[0] || null;

  const comparisonData = React.useMemo(() => {
    if (!selectedHistoryEntry) {
      return {
        previousLines: [],
        lineDiffRows: [],
        fieldComparisons: [],
        changedFieldsCount: 0,
        affectedLineCount: 0,
        addedCount: 0,
        removedCount: 0,
        changedCount: 0,
        previousTotalQuantity: 0,
      };
    }

    const previousLines = selectedHistoryEntry.lines || [];
    const lineDiffRows = compareVoucherLines(previousLines, lines);

    const previousTotalQuantity = previousLines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0);
    const previousNote = cleanNote(selectedHistoryEntry.notes || selectedHistoryEntry.note);
    const currentNote = cleanNote(voucher.line_note);
    const fieldComparisons = [
      {
        key: 'notes',
        label: 'ملاحظات السند',
        previousValue: previousNote,
        currentValue: currentNote,
        changed: normalizeValue(previousNote) !== normalizeValue(currentNote),
      },
      {
        key: 'itemCount',
        label: 'عدد الأصناف',
        previousValue: `${previousLines.length} صنف`,
        currentValue: `${lines.length} صنف`,
        changed: previousLines.length !== lines.length,
      },
      {
        key: 'quantity',
        label: 'إجمالي الكمية',
        previousValue: `${previousTotalQuantity}`,
        currentValue: `${totalQuantity}`,
        changed: previousTotalQuantity !== totalQuantity,
      },
    ];

    return {
      previousLines,
      lineDiffRows,
      fieldComparisons,
      changedFieldsCount: fieldComparisons.filter((item) => item.changed).length,
      affectedLineCount: lineDiffRows.filter((item) => item.status !== 'unchanged').length,
      addedCount: lineDiffRows.filter((item) => item.status === 'added').length,
      removedCount: lineDiffRows.filter((item) => item.status === 'removed').length,
      changedCount: lineDiffRows.filter((item) => item.status === 'changed').length,
      previousTotalQuantity,
    };
  }, [selectedHistoryEntry, lines, totalQuantity, voucher.line_note]);

  const summaryCards = [
    {
      label: 'الحقول المتأثرة',
      value: comparisonData.changedFieldsCount,
      helper: selectedHistoryEntry ? 'مقارنة مع النسخة المرجعية' : 'لا توجد نسخة مرجعية بعد',
      accent: 'amber',
    },
    {
      label: 'البنود المتغيرة',
      value: comparisonData.affectedLineCount,
      helper: `${comparisonData.changedCount} تعديل | ${comparisonData.addedCount} إضافة | ${comparisonData.removedCount} حذف`,
      accent: 'indigo',
    },
    {
      label: 'آخر تحديث محفوظ',
      value: selectedHistoryEntry ? formatDateTimeLabel(selectedHistoryEntry.at) : '—',
      helper: selectedHistoryEntry ? `النسخة ${historyEntries.length - selectedHistoryIndex}` : 'لم يتم حفظ نسخة سابقة',
      accent: 'teal',
    },
  ];

  const toggleSection = (key) => {
    setOpenSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const primaryActionLabel = isIn ? 'اعتماد الوارد' : 'إصدار الفاتورة';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className={`w-full ${showVoucherHistory ? 'max-w-[1440px]' : 'max-w-[1180px]'} flex max-h-[92vh] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-slate-50 shadow-2xl transition-all duration-500`}
        >
          <div className="shrink-0 border-b border-slate-200 bg-white/95">
            <div className="flex items-start justify-between gap-4 px-6 py-6 sm:px-8 lg:px-10">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] shadow-inner ${isIn ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                  {isIn ? <FileText size={32} strokeWidth={1.5} /> : <ArrowLeftRight size={32} strokeWidth={1.5} />}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-2xl font-black leading-tight text-[#0F2747] font-tajawal">
                      {voucher.isTransfer ? 'سند تحويل مخزني' : (isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة')}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isCompleted ? 'bg-emerald-500 text-white' : 'border border-amber-200 bg-amber-100 text-amber-700'}`}>
                        {isCompleted ? 'مفوتر' : 'قيد المراجعة'}
                      </span>
                      {isEdited && (
                        <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-[11px] font-black text-indigo-700">
                          <RotateCcw size={10} />
                          تمت مراجعته
                        </span>
                      )}
                      {voucher.isTransfer && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                          تحويل
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                    <Timer size={14} className="text-slate-400" />
                    {voucherDate ? voucherDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    <span className="text-slate-300">•</span>
                    <span>رقم السند: {voucher.voucherCode || '—'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{lines.length} صنف</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                aria-label="إغلاق النافذة"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:px-8 lg:grid-cols-4 lg:px-10">
              <InfoField
                icon={<User size={14} />}
                label={recipientLabel}
                value={voucher.clientName || '—'}
                helper="الجهة المرتبطة بالسند الحالي"
                highlight
              />
              <InfoField
                icon={<Hash size={14} />}
                label="المرجع"
                value={voucher.voucherCode || '—'}
                helper="المعرف المعتمد للمراجعة"
              />
              <InfoField
                icon={<Activity size={14} />}
                label="عدد الأصناف"
                value={`${lines.length} صنف`}
                helper="إجمالي البنود الحالية"
              />
              <InfoField
                icon={<Timer size={14} />}
                label="إجمالي الكمية"
                value={`${totalQuantity}`}
                helper="مجموع الكميات الحالية"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className={`flex flex-1 flex-col overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 ${showVoucherHistory ? 'xl:border-l xl:border-slate-200' : ''}`}>
              <div className="mb-6 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:sticky sm:top-0 sm:z-10">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black tracking-wide text-indigo-600">ملخص المراجعة</p>
                    <h4 className="mt-1 text-lg sm:text-xl font-black text-[#0F2747]">
                      {selectedHistoryEntry ? 'مقارنة مباشرة بين السند الحالي والنسخة السابقة' : 'عرض تفصيلي للسند الحالي'}
                    </h4>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {selectedHistoryEntry
                        ? 'التلوين يوضح التعديلات والإضافات والحذف مع الحفاظ على سياق المراجعة.'
                        : 'افتح سجل التغييرات لعرض المقارنة مع النسخ السابقة.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowVoucherHistory(!showVoucherHistory)}
                      className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-black transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 ${showVoucherHistory ? 'bg-[#0F2747] text-white shadow-lg shadow-slate-900/10' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <History size={18} strokeWidth={2.5} />
                      {showVoucherHistory ? 'إخفاء المقارنة' : 'فتح المقارنة'}
                    </button>

                    {!isCompleted && !voucher.isTransfer && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsInvoiced(voucher)}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-teal-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                        {loading ? 'جارٍ التنفيذ...' : primaryActionLabel}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => printVoucher(voucher)}
                      className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                      <Printer size={18} strokeWidth={2.2} />
                      طباعة السند
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {summaryCards.map((card) => (
                    <ComparisonStat
                      key={card.label}
                      label={card.label}
                      value={card.value}
                      helper={card.helper}
                      accent={card.accent}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <SectionCard
                  title="بيانات السند المرجعية"
                  subtitle="بيانات مرئية عالية التباين لتسهيل القراءة السريعة قبل المقارنة"
                  icon={<FileText size={18} />}
                  sectionKey="overview"
                  openSections={openSections}
                  toggleSection={toggleSection}
                  defaultBadge={
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                      بيانات أساسية
                    </span>
                  }
                >
                  <div className="grid grid-cols-1 gap-4 pt-4 xl:grid-cols-12">
                    <div className="xl:col-span-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-slate-500">
                        <MessageSquare size={14} />
                        <span className="text-[11px] font-black tracking-wide">ملاحظات السند</span>
                      </div>
                      <p className="text-base font-black leading-8 text-[#0F2747] break-words">
                        {cleanNote(voucher.line_note)}
                      </p>
                      {invoiceDate && (
                        <div className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                          مفوتر بتاريخ: {invoiceDate}
                        </div>
                      )}
                    </div>

                    <div className="xl:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <ComparisonStat label="رقم السند" value={voucher.voucherCode || '—'} helper="مرجع ثابت للمراجعة" />
                      <ComparisonStat label="عدد النسخ" value={historyEntries.length || 0} helper="نسخ محفوظة داخل السجل" accent="indigo" />
                      <ComparisonStat label="آخر تحديث" value={isEdited ? formatDateTimeLabel(historyEntries[0]?.at) : '—'} helper={isEdited ? 'تم حفظ نسخة مرجعية' : 'لا توجد نسخ محفوظة'} accent="teal" />
                    </div>
                  </div>
                </SectionCard>

                {showVoucherHistory && (
                  <SectionCard
                    title="مقارنة السند الحالي بالنسخة السابقة"
                    subtitle="مقارنة واضحة بين النسخة المرجعية والسند الحالي مع إبراز الفروقات لونيًا"
                    icon={<History size={18} />}
                    sectionKey="comparison"
                    openSections={openSections}
                    toggleSection={toggleSection}
                    defaultBadge={
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-600">
                        {selectedHistoryEntry ? `نسخة ${historyEntries.length - selectedHistoryIndex}` : 'لا توجد نسخة'}
                      </span>
                    }
                  >
                    {selectedHistoryEntry ? (
                      <div className="space-y-5 pt-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black tracking-wide text-slate-400">النسخة السابقة</p>
                                <h5 className="mt-1 text-lg font-black text-[#0F2747]">المرجع المقارن</h5>
                              </div>
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                                {formatDateTimeLabel(selectedHistoryEntry.at)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <ComparisonStat label="عدد الأصناف" value={comparisonData.previousLines.length} helper="محتوى النسخة السابقة" />
                              <ComparisonStat label="إجمالي الكمية" value={comparisonData.previousTotalQuantity} helper="قبل التعديل" accent="amber" />
                            </div>
                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[11px] font-black tracking-wide text-slate-500">ملاحظات النسخة السابقة</p>
                              <p className="mt-2 text-sm font-black leading-7 text-slate-700 break-words">
                                {cleanNote(selectedHistoryEntry.notes || selectedHistoryEntry.note)}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-teal-200 bg-teal-50/50 p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black tracking-wide text-teal-600">السند الحالي</p>
                                <h5 className="mt-1 text-lg font-black text-[#0F2747]">النسخة النشطة</h5>
                              </div>
                              <span className="rounded-full border border-teal-200 bg-white px-3 py-1 text-[10px] font-black text-teal-700">
                                جاهز للمراجعة
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <ComparisonStat label="عدد الأصناف" value={lines.length} helper="بعد التعديل" accent="teal" />
                              <ComparisonStat label="إجمالي الكمية" value={totalQuantity} helper="القيمة الحالية" accent="indigo" />
                            </div>
                            <div className="mt-4 rounded-[24px] border border-teal-200 bg-white/80 p-4">
                              <p className="text-[11px] font-black tracking-wide text-slate-500">ملاحظات السند الحالي</p>
                              <p className="mt-2 text-sm font-black leading-7 text-[#0F2747] break-words">
                                {cleanNote(voucher.line_note)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                          {comparisonData.fieldComparisons.map((field) => (
                            <DiffField
                              key={field.key}
                              label={field.label}
                              currentValue={field.currentValue}
                              previousValue={field.previousValue}
                              changed={field.changed}
                            />
                          ))}
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h5 className="text-sm font-black text-[#0F2747]">مراجعة البنود</h5>
                                <p className="mt-1 text-xs font-bold text-slate-500">يعرض الجدول الحالي والنسخة السابقة جنبًا إلى جنب مع نوع التغيير.</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {['changed', 'added', 'removed', 'unchanged'].map((status) => (
                                  <span
                                    key={status}
                                    className={`rounded-full px-3 py-1 text-[10px] font-black ${diffToneMap[status].badge}`}
                                  >
                                    {diffToneMap[status].label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 p-4 lg:hidden">
                            {comparisonData.lineDiffRows.map((row) => (
                              <MobileDiffCard key={row.key} row={row} />
                            ))}
                          </div>

                          <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[920px] border-collapse text-right">
                              <thead className="border-b border-slate-200 bg-white">
                                <tr className="text-[11px] font-black tracking-wide text-slate-500">
                                  <th className="px-5 py-4">الحالة</th>
                                  <th className="px-5 py-4">الصنف</th>
                                  <th className="px-5 py-4 text-center">النسخة السابقة</th>
                                  <th className="px-5 py-4 text-center">السند الحالي</th>
                                  <th className="px-5 py-4 text-center">القسم</th>
                                  <th className="px-5 py-4 text-center">الوحدة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {comparisonData.lineDiffRows.map((row) => {
                                  const tone = diffToneMap[row.status];
                                  return (
                                    <tr key={row.key} className={`${tone.container} transition-colors`}>
                                      <td className="px-5 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${tone.badge}`}>
                                          {tone.label}
                                        </span>
                                      </td>
                                      <td className="px-5 py-4">
                                        <p className={`text-sm font-black leading-6 ${tone.text}`}>{row.label}</p>
                                        <p className="mt-1 text-[11px] font-bold text-slate-500">
                                          الشركة: {row.currentLine?.company || row.previousLine?.company || '—'}
                                        </p>
                                      </td>
                                      <td className="px-5 py-4 text-center">
                                        <div className="inline-flex min-w-[96px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                          <span className="text-base font-black tabular-nums text-slate-700">
                                            {row.previousLine ? row.previousLine.qty : '—'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-4 text-center">
                                        <div className={`inline-flex min-w-[96px] items-center justify-center rounded-2xl border px-3 py-2 ${row.status === 'unchanged' ? 'border-slate-200 bg-slate-50' : 'border-white/60 bg-white/90'}`}>
                                          <span className="text-base font-black tabular-nums text-[#0F2747]">
                                            {row.currentLine ? row.currentLine.qty : '—'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-4 text-center">
                                        <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-700">
                                          {row.currentLine?.cat || row.previousLine?.cat || '—'}
                                        </span>
                                      </td>
                                      <td className="px-5 py-4 text-center text-sm font-black text-slate-600">
                                        {row.currentLine?.unit || row.previousLine?.unit || '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                        <History size={42} className="mx-auto text-slate-300" strokeWidth={1.4} />
                        <p className="mt-4 text-sm font-black text-[#0F2747]">لا توجد نسخة سابقة للمقارنة</p>
                        <p className="mt-2 text-xs font-bold text-slate-500">سيظهر هنا عرض المقارنة بمجرد توفر سجل محفوظ لهذا السند.</p>
                      </div>
                    )}
                  </SectionCard>
                )}

                <SectionCard
                  title="قائمة الأصناف الحالية"
                  subtitle="عرض أكثر وضوحًا للبنود الحالية مع الحفاظ على إجراءات الحذف عند السماح بذلك"
                  icon={<Activity size={18} />}
                  sectionKey="items"
                  openSections={openSections}
                  toggleSection={toggleSection}
                  defaultBadge={
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                      {lines.length} صنف
                    </span>
                  }
                >
                  <div className="mt-4 space-y-3 lg:hidden">
                    {lines.map((line, idx) => (
                      <MobileCurrentItemCard
                        key={line.id || idx}
                        line={line}
                        idx={idx}
                        isCompleted={isCompleted}
                        handleDeleteTransaction={handleDeleteTransaction}
                        loading={loading}
                      />
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm mt-4 lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-collapse text-right">
                        <thead className="border-b border-slate-200 bg-slate-100/80">
                          <tr className="text-[11px] font-black tracking-wide text-slate-500">
                            <th className="w-16 border-l border-slate-200 px-5 py-4 text-center">م</th>
                            <th className="px-5 py-4">وصف الصنف</th>
                            <th className="w-40 border-x border-slate-200 px-5 py-4 text-center">الكمية</th>
                            <th className="w-40 px-5 py-4 text-center">القسم</th>
                            {!isCompleted && <th className="w-24 border-r border-slate-200 px-5 py-4 text-center">إجراء</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lines.map((line, idx) => (
                            <tr key={line.id || idx} className="group transition-colors hover:bg-slate-50">
                              <td className="px-5 py-4 text-center text-[12px] font-black text-slate-400">{idx + 1}</td>
                              <td className="px-5 py-4">
                                <p className="mb-1 text-[15px] font-black leading-6 text-[#0F2747] transition-colors group-hover:text-teal-600">
                                  {sanitizeItemLabel(line.item)}
                                </p>
                                <span className="text-[11px] font-bold tracking-wide text-slate-500">
                                  الشركة: {line.company === '-' || !line.company ? '—' : line.company}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <div className="inline-flex min-w-[100px] items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <span className="text-lg font-black tabular-nums text-[#0F2747]">{line.qty}</span>
                                  <span className="text-[11px] font-bold text-slate-500">{line.unit}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-700">
                                  {line.cat || '—'}
                                </span>
                              </td>
                              {!isCompleted && (
                                <td className="px-5 py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(line.id)}
                                    disabled={loading}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={`حذف ${sanitizeItemLabel(line.item)}`}
                                  >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            {showVoucherHistory && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-[#f8fafb] shadow-inner xl:w-[420px] xl:border-r xl:border-t-0"
              >
                <div className="border-b border-slate-200 bg-white/90 p-6 sm:p-7">
                  <h4 className="flex items-center gap-3 text-sm font-black text-[#0F2747]">
                    <History size={18} className="text-indigo-600" />
                    سجل النسخ المرجعية
                  </h4>
                  <p className="mt-2 text-[11px] font-bold leading-6 text-slate-500">
                    اختر النسخة التي تريد مراجعتها، وسيتم تحديث المقارنة في الجزء الرئيسي مباشرة.
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                  {historyEntries.length > 0 ? (
                    historyEntries.map((entry, idx) => {
                      const oldLines = entry.lines || [];
                      const selected = idx === selectedHistoryIndex;
                      const entryDiffRows = compareVoucherLines(oldLines, lines);
                      const addedCount = entryDiffRows.filter((row) => row.status === 'added').length;
                      const removedCount = entryDiffRows.filter((row) => row.status === 'removed').length;
                      const changedCount = entryDiffRows.filter((row) => row.status === 'changed').length;

                      return (
                        <button
                          key={`${entry.at || idx}-${idx}`}
                          type="button"
                          onClick={() => setSelectedHistoryIndex(idx)}
                          className={`w-full rounded-[24px] border p-5 text-right shadow-sm transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${selected ? 'border-indigo-300 bg-white shadow-md ring-1 ring-indigo-200' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[12px] font-black tabular-nums text-[#0F2747]">
                              {formatDateTimeLabel(entry.at)}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black ${selected ? 'bg-indigo-600 text-white' : 'border border-indigo-100 bg-indigo-50 text-indigo-600'}`}>
                              النسخة {historyEntries.length - idx}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[10px] font-black text-slate-400">أصناف</p>
                              <p className="mt-1 text-sm font-black text-[#0F2747]">{oldLines.length}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                              <p className="text-[10px] font-black text-emerald-600">إضافات</p>
                              <p className="mt-1 text-sm font-black text-emerald-700">{addedCount}</p>
                            </div>
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2">
                              <p className="text-[10px] font-black text-rose-600">محذوفات</p>
                              <p className="mt-1 text-sm font-black text-rose-700">{removedCount}</p>
                            </div>
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                              <p className="text-[10px] font-black text-amber-600">تعديلات</p>
                              <p className="mt-1 text-sm font-black text-amber-700">{changedCount}</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3">
                            <p className="text-[10px] font-black tracking-wide text-slate-400">ملاحظة النسخة</p>
                            <p className="mt-2 line-clamp-3 text-[12px] font-bold leading-6 text-slate-600">
                              {cleanNote(entry.notes || entry.note)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                      <History size={64} strokeWidth={1} className="mb-4" />
                      <p className="text-sm font-black font-tajawal">لا يوجد سجل محفوظ</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
