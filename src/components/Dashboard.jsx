import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, TrendingUp, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowDownLeft,
  Plus, X, FileText, RotateCcw, Search, Trash2, Bell, Clock, CheckCircle2, AlertOctagon,
  Timer, History, ChevronDown, Layers, FileCheck, FileInput, Download, Upload, FileOutput, Pencil, Image, Loader2, Eye, CheckCircle, Save, List, Printer, User, Box, Calendar, RefreshCw,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import { formatDate } from '../lib/dateUtils';

import { supabase } from '../lib/supabaseClient';

// Utility Imports
import { normalizeArabic, checkNearDuplicates } from '../lib/arabicTextUtils';
import { useDebounce } from '../hooks/useDebounce';
import InvoiceTemplate from './InvoiceTemplate';
import StatsCards from './StatsCards';
import StockInwardModal from './StockInwardModal';
import { useInvoiceModal } from '../hooks/useInvoiceModal';
import { useReturnModal } from '../hooks/useReturnModal';
import { useVoucherDetail } from '../hooks/useVoucherDetail';
import { useItemModal } from '../hooks/useItemModal';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { useTransactionAnalytics } from '../hooks/useTransactionAnalytics';
import { TransactionDetailModal } from './TransactionDetailModal';
import { MorningBriefModal } from './MorningBriefModal';
import { VoucherDetailModal } from './VoucherDetailModal';
import { VoucherConfirmationModal } from './VoucherConfirmationModal';
import { MovementsColumn } from './dashboard/MovementsColumn';
import { AlertsColumn } from './dashboard/AlertsColumn';
import { VoucherStatusColumn } from './dashboard/VoucherStatusColumn';



const salesData = [
  { name: 'يناير', sales: 0 }, { name: 'فبراير', sales: 0 },
  { name: 'مارس', sales: 0 }, { name: 'أبريل', sales: 0 },
  { name: 'مايو', sales: 0 }, { name: 'يونيو', sales: 0 },
  { name: 'يوليو', sales: 0 },
];

const FUNCTIONAL_INBOUND_TYPE = 'سند إدخال';
const FUNCTIONAL_OUTBOUND_TYPE = 'سند إخراج';
const FUNCTIONAL_VOUCHER_TYPES = [FUNCTIONAL_INBOUND_TYPE, FUNCTIONAL_OUTBOUND_TYPE];

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistanceSimple = (str1, str2) => {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[str2.length][str1.length];
};


const voucherCardTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1], layout: { duration: 0.2 } };

const VoucherStatusCard = React.memo(function VoucherStatusCard({
  voucher,
  isCompleted = false,
  isActive = false,
  onOpen,
}) {
  const vDate = voucher.timestamp;
  const dayName = vDate.toLocaleDateString('ar-SA', { weekday: 'long' });
  const dateStr = vDate.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' });
  const title = `${voucher.kind === 'in' ? 'سند إدخال' : 'سند إخراج'} - ${voucher.clientName}`;

  const handleOpen = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isCompleted) onOpen(voucher);
  }, [isCompleted, onOpen, voucher]);

  return (
    <motion.div
      key={voucher.id}
      layout
      initial={{ opacity: 0, height: 0, scale: 0.985 }}
      animate={{ opacity: isCompleted ? 0.82 : 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.985 }}
      transition={voucherCardTransition}
      whileHover={isCompleted ? undefined : { scale: 1.01, y: -1 }}
      whileTap={isCompleted ? undefined : { scale: 0.995 }}
      onClick={handleOpen}
      className={`overflow-hidden rounded-lg border p-2.5 group hover-stable no-select-click ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white cursor-pointer hover:shadow-sm'} ${isActive ? 'ring-2 ring-emerald-200 shadow-sm' : ''}`}
      style={{
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div className="flex items-start gap-2">
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="shrink-0 mt-0.5"
        >
          <input
            type="checkbox"
            checked={isCompleted}
            readOnly
            onClick={handleOpen}
            className={`w-4 h-4 rounded border-2 ${isCompleted ? 'border-emerald-500 accent-emerald-500 cursor-default' : 'border-slate-300 hover:border-emerald-500 cursor-pointer accent-emerald-500'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[11px] font-bold text-[#0F2747] font-tajawal leading-tight truncate">
            {title}
          </h4>
          <p className="text-[10px] text-slate-400 font-readex mt-0.5 truncate">
            {dayName} - {dateStr}
          </p>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => (
  prevProps.isCompleted === nextProps.isCompleted &&
  prevProps.isActive === nextProps.isActive &&
  prevProps.voucher.id === nextProps.voucher.id &&
  prevProps.voucher.invoiced === nextProps.voucher.invoiced &&
  prevProps.voucher.clientName === nextProps.voucher.clientName &&
  prevProps.voucher.timestamp?.getTime?.() === nextProps.voucher.timestamp?.getTime?.()
));

/* ─── Quick Access Card ─── */
function QuickAccessCard({ items }) {
  const [qaSearch, setQaSearch] = useState('');
  const threshold = 100;

  const filtered = items
    .filter(i => !qaSearch || i.name.includes(qaSearch) || i.company?.includes(qaSearch))
    .sort((a, b) => b.stockQty - a.stockQty)
    .slice(0, 5);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Pill search */}
      <div className="px-5 py-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="ابحث عن صنف..."
            className="w-full bg-[#F9FAFB] border-0 text-[11px] rounded-full pr-10 pl-4 py-2.5 outline-none font-readex placeholder:text-slate-300"
            value={qaSearch}
            onChange={e => setQaSearch(e.target.value)}
          />
        </div>
      </div>
      {/* Items list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Package size={36} strokeWidth={1.2} className="mb-3" />
            <p className="text-xs font-semibold">لا توجد أصناف</p>
          </div>
        ) : filtered.map((item) => {
          const stockPct = Math.min((item.stockQty / (threshold * 2)) * 100, 100);
          const isLow = item.stockQty < 50;
          const isMid = item.stockQty >= 50 && item.stockQty < threshold;
          const barColor = isLow ? '#EF4444' : isMid ? '#F59E0B' : '#10B981';
          return (
            <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                <Layers size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[12px] font-bold text-[#0F2747] font-tajawal truncate">{item.name}</h4>
                  <span className="text-xs font-bold tabular-nums shrink-0 mr-2" style={{ color: barColor }}>{item.stockQty}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stockPct}%`, backgroundColor: barColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ModalWrapper = ({ title, isOpen, onClose, children, onSubmit, onEnter, maxWidth = "max-w-4xl", isSubmitDisabled = false, compact = false, loading = false, submitLabel = "حفظ البيانات" }) => {
  const handleFormSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSubmit) onSubmit(e);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F2747]/60 backdrop-blur-md transition-all duration-300"
          dir="rtl" onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={`w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden`}
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black font-tajawal text-[#0F2747] dark:text-white tracking-tight">{title}</h3>
              </div>
              <button type="button" onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 rounded-2xl transition-all active:scale-90">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} noValidate className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative bg-white dark:bg-slate-900">{children}</div>
                
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl text-sm font-black text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitDisabled || loading} 
                      className="px-8 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                    >
                      {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> جاري الحفظ...</> : <><CheckCircle2 size={18} /> {submitLabel}</>}
                    </button>
                </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const InputClass = "w-full bg-slate-100/50 border border-transparent text-slate-800 text-sm rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 block px-5 py-4 outline-none transition-all duration-300 placeholder:text-slate-400";
const LabelClass = "block text-xs font-black text-slate-500 mb-2.5 mr-1 uppercase tracking-wider transition-colors duration-300";

export default function Dashboard({ setActiveView, activeView }) {
  // ⚠️ ALL STATE DECLARATIONS MUST BE AT THE TOP (React Rules of Hooks)
  // Centered confirmation prompt state (MUST BE FIRST)
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);

  // ---  RENAMED STATE VARIABLES TO FORCIBLY BYPASS VITE HMR --- //
  const [showHistory, setShowHistory] = useState(false);

  // --- Invoice Capture State & Utils ---
  const [invoiceDataForCapture, setInvoiceDataForCapture] = useState(null);

  const [locations, setLocations] = useState(['مستودع الرياض', 'مستودع جدة', 'المركز الرئيسي', 'مورد خارجي']);
  const [stockSearchActiveIndex, setStockSearchActiveIndex] = useState(-1);

  // Modals Data State
  const [loading, setLoading] = useState(false);




  
  
  
  // Handle modal close with exit guard
  
  
  // Handle add category

  

  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [selectedBatchTransactions, setSelectedBatchTransactions] = useState([]);
  const [invoiceItemSuggestions, setInvoiceItemSuggestions] = useState([]);
  const [returnItemSuggestions, setReturnItemSuggestions] = useState([]);

  // --- NEW Advanced States --- //
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const { playSuccess, playWarning } = useAudio();

  // ─── Data Layer (extracted to useDataFetcher hook) ───────────────────
  const {
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    fetchInitialData,
    voucherTransactionsMemo,
    canonicalVoucherTransactions,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    stockInCount,
    salesCount,
    returnsCount,
    damageCount,
    shiftStartTime,
    morningBriefData,
  } = useDataFetcher({ currentUser });

  // ─── Invoice Modal (extracted to useInvoiceModal hook) ───────────────

  const {
    isSalesModalOpen, setIsSalesModalOpen,
    isVoucherInvoice, setIsVoucherInvoice,
    sourceVoucher, setSourceVoucher,
    invoiceForm, setInvoiceForm,
    currentInvoiceItem, setCurrentInvoiceItem,
    invoiceErrors, setInvoiceErrors,
    invoiceSearchActiveIndex, setInvoiceSearchActiveIndex,
    showInvoiceExitConfirm, setShowInvoiceExitConfirm,
    showInvoiceSaveConfirm, setShowInvoiceSaveConfirm,
    invoiceSearchInputRef,
    openInvoiceModal,
    handleCloseInvoiceModal,
    performInvoiceReset,
    handleAddInvoiceItemToTable,
    handleEditInvoiceItem,
    handleAddInvoice,
    performInvoiceSave,
  } = useInvoiceModal({
    items,
    setLoading,
    playWarning,
    playSuccess,
    fetchInitialData,
    setInvoiceDataForCapture,
    setInvoiceTimestamps,
    setStockSearchActiveIndex,
  });

  // ─── Return Modal (extracted to useReturnModal hook) ────────────────
  const {
    isReturnsModalOpen, setIsReturnsModalOpen,
    returnForm, setReturnForm,
    returnErrors, setReturnErrors,
    returnItems, setReturnItems,
    returnSearchActiveIndex, setReturnSearchActiveIndex,
    showReturnExitConfirm, setShowReturnExitConfirm,
    showReturnSaveConfirm, setShowReturnSaveConfirm,
    returnSearchInputRef,
    openReturnModal,
    handleCloseReturnModal,
    performReturnReset,
    handleAddReturnItemToTable,
    handleEditReturnItem,
    handleAddReturn,
    performReturnSave,
  } = useReturnModal({
    items,
    setLoading,
    playWarning,
    playSuccess,
    fetchInitialData,
    setStockSearchActiveIndex,
    currentUser,
  });

  // ─── Voucher Detail (extracted to useVoucherDetail hook) ─────────────
  const {
    showVoucherHistory, setShowVoucherHistory,
    voucherTransactions, setVoucherTransactions,
    isVoucherModalOpen, setIsVoucherModalOpen,
    selectedVoucher, setSelectedVoucher,
    activeVoucherId, setActiveVoucherId,
    isVoucherDetailOpen, setIsVoucherDetailOpen,
    detailVoucher, setDetailVoucher,
    invoiceTimestamps, setInvoiceTimestamps,
    openVoucherModal,
    closeVoucherDetail,
    findItemFromVoucherLine,
    finalizeInboundVoucher,
    handleExportInvoiceToInvoice,
    handleDeleteVoucher,
    handleEditVoucher,
    handleMarkAsInvoiced,
    updateVoucherNote,
    handleDeleteTransaction,
    printVoucher,
    duplicateVoucher,
    handleConfirmVoucher,
  } = useVoucherDetail({
    items,
    setLoading,
    playWarning,
    playSuccess,
    fetchInitialData,
    setActiveView,
    // Invoice bridge from useInvoiceModal
    setSourceVoucher,
    setInvoiceForm,
    setCurrentInvoiceItem,
    setIsVoucherInvoice,
    setIsSalesModalOpen,
  });

  // ─── Item Registration Modal (extracted to useItemModal hook) ────────
  const {
    showNewItemPrompt, setShowNewItemPrompt,
    promptItemName, setPromptItemName,
    promptSource, setPromptSource,
    newItemRegistrationRef,
    isItemModalOpen, setIsItemModalOpen,
    itemForm, setItemForm,
    itemErrors, setItemErrors,
    sessionItems, setSessionItems,
    editingSessionId, setEditingSessionId,
    isCustomUnit, setIsCustomUnit,
    nameSuggestions, setNameSuggestions,
    companySuggestions, setCompanySuggestions,
    activeNameIdx, setActiveNameIdx,
    activeCompIdx, setActiveCompIdx,
    itemNameInputRef, companyInputRef, catSelectRef, unitInputRef, newCategoryInputRef,
    categories, setCategories,
    units, setUnits,
    isAddingCategory, setIsAddingCategory,
    newCategoryName, setNewCategoryName,
    newSupplierName, setNewSupplierName,
    showExitConfirm, setShowExitConfirm,
    showSaveConfirm, setShowSaveConfirm,
    handleCloseItemModal,
    performModalReset,
    handleAddCategory,
    triggerNewItemRegistration,
    handlePromptYes,
    handlePromptNo,
    handleNameInput,
    handleCompanyInput,
    handleModalKeyDown,
    addToSession,
    handleRegisterBatchSave,
    confirmRegisterBatchSave,
    removeSessionItem,
  } = useItemModal({
    items,
    setLoading,
    playSuccess,
    fetchInitialData,
    setCurrentInvoiceItem,
    invoiceSearchInputRef,
    returnForm,
    setReturnForm,
    returnSearchInputRef,
  });


  const [alertCatFilter, setAlertCatFilter] = useState('الكل');
  const [alertUrgencyFilter, setAlertUrgencyFilter] = useState('الكل');
  const [alertSearch, setAlertSearch] = useState('');

  const [txFilter, setTxFilter] = useState('الكل');
  const [movementTypeFilter, setMovementTypeFilter] = useState('الكل');
  const [isMorningBriefOpen, setIsMorningBriefOpen] = useState(false);

  // Voucher Status Tracking State
  
  // Global Keyboard Shortcuts for Modals
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.key === 'Escape') {
        if (isItemModalOpen) setIsItemModalOpen(false);
        if (isStockInModalOpen) setIsStockInModalOpen(false);
        if (isTransactionDetailOpen) setIsTransactionDetailOpen(false);
        if (isVoucherDetailOpen) setIsVoucherDetailOpen(false); setShowVoucherHistory(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isItemModalOpen, isStockInModalOpen, isTransactionDetailOpen, isVoucherDetailOpen]);

  
  // Keyboard shortcuts for confirmation modals
  useEffect(() => {
    const handleConfirmKeys = (e) => {
      if (showInvoiceExitConfirm) {
        if (e.key === 'Enter') { e.preventDefault(); performInvoiceReset(); }
        if (e.key === 'Escape') { e.preventDefault(); setShowInvoiceExitConfirm(false); }
      } else if (showReturnExitConfirm) {
        if (e.key === 'Enter') { e.preventDefault(); performReturnReset(); }
        if (e.key === 'Escape') { e.preventDefault(); setShowReturnExitConfirm(false); }
      } else if (showInvoiceSaveConfirm) {
        if (e.key === 'Enter' && !loading) { e.preventDefault(); performInvoiceSave(); }
        if (e.key === 'Escape') { e.preventDefault(); setShowInvoiceSaveConfirm(false); }
      } else if (showReturnSaveConfirm) {
        if (e.key === 'Enter' && !loading) { e.preventDefault(); performReturnSave(); }
        if (e.key === 'Escape') { e.preventDefault(); setShowReturnSaveConfirm(false); }
      }
    };
    window.addEventListener('keydown', handleConfirmKeys);
    return () => window.removeEventListener('keydown', handleConfirmKeys);
  }, [showInvoiceExitConfirm, showReturnExitConfirm, showInvoiceSaveConfirm, showReturnSaveConfirm, loading]);

  // Keyboard shortcuts for Voucher Detail modal
  useEffect(() => {
    const handleVoucherDetailKeys = (event) => {
      if (!isVoucherDetailOpen) return;
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        setIsVoucherDetailOpen(false); setShowVoucherHistory(false);
      }
    };
    window.addEventListener('keydown', handleVoucherDetailKeys);
    return () => window.removeEventListener('keydown', handleVoucherDetailKeys);
  }, [isVoucherDetailOpen]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  // Card entry animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 200, damping: 18 } 
    }
  };



  
  // --- Global Modals ESC Support ---
  useEffect(() => {
    const handleGlobalEsc = (event) => {
      if (event.key === 'Escape') {
        if (isTransactionDetailOpen) setIsTransactionDetailOpen(false);
        if (isVoucherDetailOpen) setIsVoucherDetailOpen(false); setShowVoucherHistory(false);
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [isTransactionDetailOpen, isVoucherDetailOpen]);

  
  // Exit guard
  // --- 5. MORNING BRIEF PROCESSING --- //


  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.name === 'لا توجد بيانات') return null;

      return (
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-xl transition-all duration-300 min-w-[200px]" dir="rtl">
          <p className="font-bold font-tajawal text-text-primary-light dark:text-text-primary-dark text-sm mb-3 border-b border-border-light dark:border-border-dark pb-2 truncate">{data.name}</p>
          <div className="space-y-2">
             <div className="flex justify-between items-center text-xs">
               <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">الشركة:</span>
               <span className="text-text-primary-light dark:text-text-primary-dark font-semibold">{data.company}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
               <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">الكمية المباعة:</span>
               <span className="text-status-success font-bold">{data.sales}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
               <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">تاريخ الحركة:</span>
               <span className="text-text-primary-light dark:text-text-primary-dark font-bold">{data.date}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };


  // --- Transactions Processing --- //

  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col gap-5 font-readex bg-transparent text-text-primary-light dark:text-text-primary-dark overflow-hidden box-border transition-colors duration-300">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F2747] font-tajawal leading-tight">لوحة القيادة</h1>
          <p className="text-[13px] text-slate-400 font-readex mt-1">نظرة عامة على المخزون والحركات</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-readex">
          <Clock size={14} />
          <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <StatsCards
        itemsCount={items.length}
        stockInCount={stockInCount}
        salesCount={salesCount}
        returnsCount={returnsCount}
        damageCount={damageCount}
        onAddItem={() => setIsItemModalOpen(true)}
        onAddStock={() => setIsStockInModalOpen(true)}
        onAddInvoice={openInvoiceModal}
        onAddReturn={openReturnModal}
      />

      {/* ── Bottom 3-Card Row ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 overflow-hidden">
        <MovementsColumn
          dbTransactionsList={dbTransactionsList}
          movementTypeFilter={movementTypeFilter}
          setMovementTypeFilter={setMovementTypeFilter}
          onTransactionClick={(tx) => {
            const rawBatch = tx.voucherGroupId 
              ? dbTransactionsList.filter(t => t.voucherGroupId === tx.voucherGroupId) 
              : tx.batchId 
                ? dbTransactionsList.filter(t => t.batchId === tx.batchId) 
                : [tx];
            setSelectedBatchTransactions(rawBatch.filter(t => t.is_summary !== true));
            setIsTransactionDetailOpen(true);
          }}
          cardVariants={cardVariants}
          FUNCTIONAL_INBOUND_TYPE={FUNCTIONAL_INBOUND_TYPE}
          FUNCTIONAL_OUTBOUND_TYPE={FUNCTIONAL_OUTBOUND_TYPE}
        />

        <AlertsColumn
          items={items}
          alertCatFilter={alertCatFilter}
          setAlertCatFilter={setAlertCatFilter}
          alertSearch={alertSearch}
          alertUrgencyFilter={alertUrgencyFilter}
          cardVariants={cardVariants}
        />

        <VoucherStatusColumn
          pendingVouchers={pendingVouchers}
          completedVouchers={completedVouchers}
          cancelledVouchers={cancelledVouchers}
          invoiceTimestamps={invoiceTimestamps}
          onVoucherClick={(v) => {
            setDetailVoucher(v);
            setIsVoucherDetailOpen(true);
          }}
          onMarkAsInvoiced={handleMarkAsInvoiced}
          cardVariants={cardVariants}
        />
      </div>



      {/* MODALS */}
      <VoucherDetailModal
        isOpen={isVoucherDetailOpen}
        onClose={() => { setIsVoucherDetailOpen(false); setShowVoucherHistory(false); }}
        voucher={detailVoucher}
        showVoucherHistory={showVoucherHistory}
        setShowVoucherHistory={setShowVoucherHistory}
        updateVoucherNote={updateVoucherNote}
        handleDeleteTransaction={handleDeleteTransaction}
        printVoucher={printVoucher}
        duplicateVoucher={duplicateVoucher}
        loading={loading}
        handleMarkAsInvoiced={handleMarkAsInvoiced}
        setIsVoucherModalOpen={setIsVoucherModalOpen}
        setSelectedVoucher={setSelectedVoucher}
      />

      <VoucherConfirmationModal
        isOpen={isVoucherModalOpen}
        onClose={() => { setIsVoucherModalOpen(false); setSelectedVoucher(null); }}
        voucher={selectedVoucher}
        onConfirm={handleConfirmVoucher}
        loading={loading}
      />

      <MorningBriefModal
        isOpen={isMorningBriefOpen}
        onClose={() => setIsMorningBriefOpen(false)}
        data={morningBriefData}
      />
      <TransactionDetailModal
        isOpen={isTransactionDetailOpen}
        onClose={() => setIsTransactionDetailOpen(false)}
        transactions={selectedBatchTransactions}
        items={items}
        FUNCTIONAL_INBOUND_TYPE={FUNCTIONAL_INBOUND_TYPE}
        FUNCTIONAL_OUTBOUND_TYPE={FUNCTIONAL_OUTBOUND_TYPE}
      />


      {/* ═══ HYBRID BATCH REGISTRATION MODAL ═══ */}
      <AnimatePresence>
        {isItemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0F2747]/60 backdrop-blur-md"
            dir="rtl"
            onClick={handleCloseItemModal}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 flex flex-col h-[85vh] min-h-[650px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-[#1e293b] dark:text-white font-tajawal tracking-tight">تعريف أصناف جديدة</h3>
                  <p className="text-[13px] text-slate-400 font-readex mt-1 font-semibold">
                    {sessionItems.length > 0 ? `${sessionItems.length} صنف في الجلسة — اضغط "اعتماد وحفظ" لإتمام التسجيل` : 'أضف الأصناف للقائمة ثم اعتمدها دفعة واحدة'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  className="p-3 text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-500 rounded-2xl transition-all active:scale-90"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Exit Confirmation Overlay (Internal to Modal for better UX) */}
                <AnimatePresence>
                  {showExitConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[160] flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-b-[2rem]"
                      onClick={e => e.stopPropagation()}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl px-10 py-16 max-w-md w-full mx-4 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden"
                      >
                        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-6 text-rose-500">
                          <AlertTriangle size={40} />
                        </div>
                        <h4 className="text-2xl font-black font-tajawal text-slate-800 dark:text-white mb-3">تنبيه: بيانات غير محفوظة</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 leading-relaxed px-4">
                          لديك <span className="font-black text-rose-500">{sessionItems.length}</span> صنف في القائمة لم يتم حفظهم بعد. هل أنت متأكد من الخروج؟
                        </p>
                        <div className="flex flex-col gap-3.5 px-4">
                          <button
                            type="button"
                            onClick={performModalReset}
                            className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                          >
                            تأكيد الخروج وفقدان البيانات
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowExitConfirm(false)}
                            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            البقاء في القائمة
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Confirmation Overlay */}
                <AnimatePresence>
                  {showSaveConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[160] flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-b-[2rem]"
                      onClick={e => e.stopPropagation()}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl px-10 py-16 max-w-md w-full mx-4 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden"
                      >
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 text-emerald-500">
                          <CheckCircle2 size={40} />
                        </div>
                        <h4 className="text-2xl font-black font-tajawal text-slate-800 dark:text-white mb-3">تأكيد الحفظ النهائي</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 leading-relaxed px-4">
                          هل أنت متأكد من اعتماد وحفظ <span className="font-black text-emerald-500">{sessionItems.length}</span> صنف في قاعدة البيانات؟
                        </p>
                        <div className="flex flex-col gap-3.5 px-4">
                          <button
                            type="button"
                            onClick={confirmRegisterBatchSave}
                            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                          >
                            نعم، اعتماد وحفظ الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSaveConfirm(false)}
                            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            مراجعة القائمة
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Entry Form Row - Compact Single-Row Header */}
                <div className="px-8 pt-6 pb-4 shrink-0">
                  <div className="bg-[#f8fbf9] p-5 rounded-[24px] border border-[#f0f5f3] flex items-end gap-4 shadow-sm relative group/header">
                    {/* Item Name */}
                    <div className="flex-[2.5] relative">
                      <label className="block text-[11px] font-bold text-[#8ba3b5] uppercase mb-2 text-center tracking-widest">اسم الصنف الكامل *</label>
                      <input
                        ref={itemNameInputRef}
                        type="text"
                        autoFocus
                        autoComplete="off"
                        className="w-full h-[46px] rounded-[14px] px-4 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] transition-all text-center shadow-sm placeholder:text-slate-300 placeholder:font-medium text-slate-800"
                        placeholder="مثال: فراولة مركز ماريتا"
                        value={itemForm.name}
                        onChange={e => handleNameInput(e.target.value)}
                        onKeyDown={e => handleModalKeyDown(e, 'name')}
                      />
                      {nameSuggestions.length > 0 && (
                        <div className="absolute z-[100] top-full right-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                          {nameSuggestions.map((s, i) => (
                            <div key={i} onMouseDown={() => { handleNameInput(s); setNameSuggestions([]); setTimeout(() => companyInputRef.current?.focus(), 50); }} className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors text-center ${activeNameIdx === i ? 'bg-[#10b981] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`}>{s}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Company */}
                    <div className="flex-[2.5] relative">
                      <label className="block text-[11px] font-bold text-[#8ba3b5] uppercase mb-2 text-center tracking-widest">الشركة *</label>
                      <input
                        ref={companyInputRef}
                        type="text"
                        autoComplete="off"
                        className="w-full h-[46px] rounded-[14px] px-4 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] transition-all text-center shadow-sm placeholder:text-slate-300 placeholder:font-medium text-slate-800"
                        placeholder="اسم الشركة..."
                        value={itemForm.company}
                        onChange={e => handleCompanyInput(e.target.value)}
                        onKeyDown={e => handleModalKeyDown(e, 'company')}
                      />
                      {companySuggestions.length > 0 && (
                        <div className="absolute z-[100] top-full right-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                          {companySuggestions.map((s, i) => (
                            <div key={i} onMouseDown={() => { handleCompanyInput(s); setCompanySuggestions([]); }} className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors text-center ${activeCompIdx === i ? 'bg-[#10b981] text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`}>{s}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    <div className="flex-[1.8] relative">
                      <div className="flex items-center justify-between px-1 mb-2">
                        <label className="text-[11px] font-bold text-[#8ba3b5] uppercase tracking-tighter w-full text-center">القسم</label>
                        <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-[#10b981] hover:scale-110 transition-transform p-0.5 absolute left-2 top-0"><Plus size={14} strokeWidth={3} /></button>
                      </div>
                      {isAddingCategory ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center bg-white dark:bg-slate-900 border-2 border-[#10b981]/40 rounded-[14px] overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-200 h-[46px]">
                          <input
                            ref={newCategoryInputRef}
                            type="text"
                            autoFocus
                            className="flex-1 h-full px-3 text-[13px] font-bold outline-none bg-transparent text-center text-slate-800"
                            placeholder="قسم جديد..."
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                              if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryName(''); }
                            }}
                          />
                          <button type="button" onClick={handleAddCategory} className="p-2 text-[#10b981] hover:bg-emerald-50 transition-colors"><CheckCircle2 size={16} /></button>
                        </div>
                      ) : (
                        <select
                          className="w-full h-[46px] rounded-[14px] px-2 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] cursor-pointer text-center shadow-sm appearance-none text-slate-800"
                          value={itemForm.cat}
                          onChange={e => setItemForm({ ...itemForm, cat: e.target.value })}
                          onKeyDown={e => handleModalKeyDown(e, 'other')}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Unit */}
                    <div className="flex-[1.8] relative">
                      <div className="flex items-center justify-between px-1 mb-2">
                        <label className="text-[11px] font-bold text-[#8ba3b5] uppercase tracking-tighter w-full text-center">الوحدة</label>
                        <button type="button" onClick={() => setIsCustomUnit(!isCustomUnit)} className="text-[#10b981] hover:scale-110 transition-transform p-0.5 absolute left-2 top-0"><Plus size={14} strokeWidth={3} /></button>
                      </div>
                      {isCustomUnit ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center bg-white dark:bg-slate-900 border-2 border-[#10b981]/40 rounded-[14px] overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-200 h-[46px]">
                          <input
                            ref={unitInputRef}
                            type="text"
                            autoFocus
                            className="flex-1 h-full px-3 text-[13px] font-bold outline-none bg-transparent text-center text-slate-800"
                            placeholder="وحدة مخصصة..."
                            value={itemForm.unit}
                            onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); setIsCustomUnit(false); }
                              if (e.key === 'Escape') { setIsCustomUnit(false); }
                            }}
                          />
                          <button type="button" onClick={() => setIsCustomUnit(false)} className="p-2 text-[#10b981] hover:bg-emerald-50 transition-colors"><CheckCircle2 size={16} /></button>
                        </div>
                      ) : (
                        <select
                          className="w-full h-[46px] rounded-[14px] px-2 text-[13px] font-bold border-2 border-transparent bg-white outline-none focus:border-[#10b981] cursor-pointer text-center shadow-sm appearance-none text-slate-800"
                          value={itemForm.unit}
                          onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                          onKeyDown={e => handleModalKeyDown(e, 'other')}
                        >
                          {units && units.length > 0 ? units.map(u => <option key={u} value={u}>{u}</option>) : ['كرتونة','قطعة','كيلو','لتر','طرد','علبة'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Add Button */}
                    <div className="shrink-0 mb-1">
                      <button
                        type="button"
                        onClick={addToSession}
                        title={editingSessionId ? "تحديث الصنف" : "إضافة للقائمة (Enter)"}
                        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden group/btn shadow-md ${
                          editingSessionId 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-[#10b981] hover:bg-[#0ea5e9]'
                        } active:scale-95`}
                        style={!editingSessionId ? { backgroundColor: '#10b981' } : {}}
                      >
                        {editingSessionId ? (
                          <Save size={20} className="text-white relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                        ) : (
                          <Plus size={24} strokeWidth={3} className="text-white relative z-10 transition-transform duration-300 group-hover/btn:rotate-90" />
                        )}
                      </button>
                    </div>
                  </div>
                  {editingSessionId && (
                    <div className="flex justify-end mt-2 px-1">
                      <button type="button" onClick={() => { setEditingSessionId(null); setItemForm({name:'', company:'', cat: categories[0], unit: units[0]}); }} className="text-[10px] font-black text-rose-500 hover:underline">إلغاء التعديل</button>
                    </div>
                  )}
                </div>

                {/* Preview Table */}
                <div className="flex-1 overflow-hidden px-8 pb-6 flex flex-col min-h-0">
                  <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden flex flex-col min-h-0 shadow-sm">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full border-separate border-spacing-0 text-center">
                        <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="py-3 px-4 w-12 border-b border-slate-100 dark:border-slate-800">م</th>
                            <th className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 w-[35%] text-center">اسم الصنف</th>
                            <th className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 w-[25%] text-center">الشركة / المورد</th>
                            <th className="py-3 px-4 w-32 border-b border-slate-100 dark:border-slate-800 text-center">القسم</th>
                            <th className="py-3 px-4 w-28 border-b border-slate-100 dark:border-slate-800 text-center">الوحدة</th>
                            <th className="py-3 px-4 w-24 border-b border-slate-100 dark:border-slate-800 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                          {sessionItems.map((item, idx) => (
                            <tr key={item.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${editingSessionId === item.id ? 'bg-orange-50/50 dark:bg-orange-500/5' : ''}`}>
                              <td className="py-3.5 px-4 text-[11px] font-bold text-slate-400 tabular-nums text-center">{idx + 1}</td>
                              <td className="py-3.5 px-4 font-tajawal font-bold text-xs text-slate-800 dark:text-white text-center">{item.name}</td>
                              <td className="py-3.5 px-4 text-center"><span className="text-[10px] font-bold text-slate-500">{item.company}</span></td>
                              <td className="py-3.5 px-4 text-center"><span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{item.cat}</span></td>
                              <td className="py-3.5 px-4 text-[10px] font-bold text-slate-500 text-center">{item.unit}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setItemForm({name: item.name, company: item.company, cat: item.cat, unit: item.unit});
                                      setEditingSessionId(item.id);
                                      itemNameInputRef.current?.focus();
                                    }}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="تعديل"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeSessionItem(item.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="حذف"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {sessionItems.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-24 text-center">
                                <div className="flex flex-col items-center justify-center opacity-40">
                                  <div className="w-16 h-16 flex items-center justify-center mb-4">
                                    <Package size={48} className="text-slate-200" strokeWidth={1.5} />
                                  </div>
                                  <p className="text-[13px] font-black font-tajawal text-slate-300 mb-1">ابدأ بإضافة الأصناف للقائمة</p>
                                  <p className="text-[11px] font-bold text-slate-200">بيانات الصنف ستظهر هنا قبل الحفظ النهائي</p>
                                </div>
                              </td>
                            </tr>
                          )}

                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  className="px-8 py-2.5 rounded-[12px] text-sm font-bold text-[#64748b] border border-[#e2e8f0] bg-white hover:bg-slate-50 transition-all active:scale-95"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  disabled={sessionItems.length === 0 || loading}
                  onClick={handleRegisterBatchSave}
                  className="px-8 py-3 rounded-[12px] text-sm font-black text-white bg-[#86d4b4] hover:bg-[#6ec29e] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> جاري الحفظ...</>
                  ) : (
                    <><CheckCircle2 size={18} /> اعتماد وحفظ القائمة {sessionItems.length > 0 ? `(${sessionItems.length})` : ''}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StockInwardModal 
        isOpen={isStockInModalOpen} 
        onClose={() => setIsStockInModalOpen(false)}
        onExitToDashboard={() => setIsStockInModalOpen(false)}
        onSaveSuccess={() => {
          fetchInitialData();
          setIsStockInModalOpen(false);
        }}
      />

      {showNewItemPrompt && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3"><Package size={24} className="text-amber-600" /></div>
              <h4 className="text-base font-bold text-slate-800 font-tajawal mb-2">صنف غير مسجل</h4>
              <p className="text-sm text-slate-600 font-readex leading-relaxed">الصنف "<span className="font-bold text-slate-800">{promptItemName}</span>" غير مسجل. هل تود إضافته؟</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-3">
              <button type="button" onClick={handlePromptYes} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all">نعم</button>
              <button type="button" onClick={handlePromptNo} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 transition-all">لا</button>
            </div>
          </motion.div>
        </motion.div>
      )}

            <ModalWrapper title={isVoucherInvoice ? "مراجعة فاتورة صادر" : "إنشاء فاتورة صادر (نظام بريميوم)"} 
        maxWidth="max-w-6xl" 
        isOpen={isSalesModalOpen} 
        onClose={handleCloseInvoiceModal} 
        onSubmit={handleAddInvoice} 
        compact
        loading={loading}>

           {/* Header Fields - Client, Representative, and Date */}
          <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              
             {!isVoucherInvoice && (
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">المندوب المسجل <span className="text-red-500">*</span></label>
               <input
                 type="text"
                 list="reps-datalist"
                 className={`w-full h-[38px] bg-white border ${!invoiceForm.rep.trim() && invoiceErrors.rep ? 'border-red-200 ring-2 ring-red-500/5' : 'border-slate-200'} text-slate-800 text-[13px] font-black rounded-xl px-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
                 value={invoiceForm.rep}
                 
                 onChange={(e) => {
                    setInvoiceForm({...invoiceForm, rep: e.target.value});
                    if (e.target.value.trim()) setInvoiceErrors(prev => ({...prev, rep: false}));
                 }}
                 autoComplete="off" id="invoiceRepInput" placeholder="اسم مندوب المبيعات"
               />
               <datalist id="reps-datalist">
                 {repsList.map(rep => <option key={rep} value={rep} />)}
               </datalist>
             </div>
             )}

             <div className={`flex flex-col ${isVoucherInvoice ? 'md:col-span-2' : ''}`}>
                <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">تاريخ الفاتورة</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-readex text-center" 
                    value={invoiceForm.date} 
                    onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})} 
                     
                  />
                </div>
             </div>

             {!isVoucherInvoice && (
             <div className="flex flex-col md:col-span-2 mt-1">
                <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">ملاحظات إضافية (اختياري)</label>
                <textarea
                  placeholder="اكتب أي ملاحظات هنا..."
                  className="w-full h-[60px] bg-white border border-slate-200 text-slate-800 text-[12px] font-bold rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal resize-none"
                  value={invoiceForm.notes || ''}
                  onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                />
             </div>
             )}
          </div>

          {/* Item Entry Section - Redesigned Card */}
          {!isVoucherInvoice && (
            <div className={`p-2.5 rounded-[1.2rem] border mb-2 shadow-sm ${isVoucherInvoice ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-2 mr-1">
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                  <h4 className="text-[11px] font-black text-slate-700 font-tajawal">إضافة سريع للأصناف</h4>
              </div>
              <div className="flex flex-wrap items-end gap-2.5">
                  {/* Search Field */}
                  <div className="flex-1 min-w-[250px] relative group/item">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 mr-1 uppercase h-[15px] leading-[15px]">البحث عن صنف</label>
                    <div className="relative">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={invoiceSearchInputRef}
                        type="text"
                        autoComplete="off"
                        className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl pr-9 pl-3 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all font-tajawal placeholder:text-slate-300 placeholder:font-semibold"
                        placeholder="اكتب اسم الصنف هنا..."
                        value={currentInvoiceItem.name}
                        onChange={(e) => {
                          setCurrentInvoiceItem({...currentInvoiceItem, name: e.target.value, selectedItem: null, cat: '', unit: ''});
                          setInvoiceSearchActiveIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          const suggestions = items.filter(i => i.name.includes(currentInvoiceItem.name) || i.company.includes(currentInvoiceItem.name));
                          if (e.key === 'ArrowDown') { e.preventDefault(); setInvoiceSearchActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev); }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setInvoiceSearchActiveIndex(prev => prev > 0 ? prev - 1 : 0); }
                          else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (invoiceSearchActiveIndex >= 0 && suggestions[invoiceSearchActiveIndex]) {
                              const invItem = suggestions[invoiceSearchActiveIndex];
                              setCurrentInvoiceItem({ ...currentInvoiceItem, name: `${invItem.name} - ${invItem.company}`, selectedItem: invItem, cat: invItem.cat || invItem.category || '', unit: invItem.unit || 'كرتونة' });
                              setInvoiceSearchActiveIndex(-1);
                              setTimeout(() => document.getElementById('invoiceQtyInput')?.focus(), 10);
                            } else if (currentInvoiceItem.selectedItem) {
                              setTimeout(() => document.getElementById('invoiceQtyInput')?.focus(), 10);
                            }
                          }
                        }}
                      />
                    </div>
                    {currentInvoiceItem.name && !currentInvoiceItem.selectedItem && (
                      <div className="hidden group-focus-within/item:block absolute top-[110%] right-0 w-full max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1.5 backdrop-blur-xl custom-scrollbar">
                        {items.filter(i => i.name.includes(currentInvoiceItem.name) || i.company.includes(currentInvoiceItem.name)).map((invItem, idx) => (
                             <button key={invItem.id} type="button" className={`w-full text-right px-3 py-2 rounded-lg transition-all ${invoiceSearchActiveIndex === idx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`} onMouseDown={(e) => {
                               e.preventDefault();
                               setCurrentInvoiceItem({
                                 ...currentInvoiceItem,
                                 name: `${invItem.name} - ${invItem.company}`,
                                 selectedItem: invItem,
                                 cat: invItem.cat || invItem.category || '',
                                 unit: invItem.unit || 'كرتونة'
                               });
                               setInvoiceSearchActiveIndex(-1);
                               setTimeout(() => { document.getElementById('invoiceQtyInput')?.focus(); }, 10);
                             }}>
                               <div className="flex justify-between items-center w-full">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black">{invItem.name}</span>
                                    <span className="text-[9px] font-bold opacity-60">{invItem.company}</span>
                                 </div>
                                 <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">رصيد: {invItem.stockQty}</span>
                               </div>
                             </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity Field */}
                  <div className="w-[85px]">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الكمية</label>
                    <input
                      type="number"
                      id="invoiceQtyInput"
                      className="w-full h-[38px] bg-white border-2 border-indigo-400/50 focus:border-indigo-500 text-indigo-700 text-sm rounded-xl px-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-center font-black tabular-nums shadow-inner"
                      placeholder="0"
                      value={currentInvoiceItem.qty}
                      onChange={(e) => { if (e.target.value.length <= 4) setCurrentInvoiceItem({...currentInvoiceItem, qty: e.target.value}); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInvoiceItemToTable(); } }}
                    />
                  </div>

                  {/* Category & Unit - Unified Fields */}
                  <div className="w-[85px]">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">القسم</label>
                    <input type="text" className="w-full h-[38px] bg-slate-100/50 border border-slate-200/60 text-slate-600 text-[12px] font-black rounded-xl px-2 outline-none cursor-default text-center transition-all" value={currentInvoiceItem.cat || '-'} readOnly />
                  </div>

                  <div className="w-[85px]">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الوحدة</label>
                    <input type="text" className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[12px] font-black rounded-xl px-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all text-center" value={currentInvoiceItem.unit} onChange={(e) => setCurrentInvoiceItem({...currentInvoiceItem, unit: e.target.value})} placeholder="كرتونة" />
                  </div>

                  {/* Add/Update Button */}
                  <button
                    type="button"
                    className={`w-[38px] h-[38px] ${currentInvoiceItem.selectedItem ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'} text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center hover:scale-105 active:scale-95 shrink-0`}
                    onClick={handleAddInvoiceItemToTable}
                    title={currentInvoiceItem.selectedItem ? "إضافة/تحديث الصنف" : "حدد صنف أولاً"}
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
               </div>
            </div>
          )}

          {/* Middle Section (The Table - Redesigned) */}
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[45vh] shadow-sm">
            <div className="overflow-y-auto w-full overflow-x-auto flex-1 custom-scrollbar pt-2">
              <table className="w-full min-w-max text-right text-xs whitespace-nowrap">
                <thead className="bg-slate-50/30 sticky top-0 z-10 backdrop-blur-md">
                  <tr className="text-[10px] font-black text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-6 py-4 w-16 text-center">م</th>
                    <th className="px-6 py-4 min-w-[250px]">اسم الصنف</th>
                    <th className="px-6 py-4 w-32">التصنيف</th>
                    <th className="px-6 py-4 w-24 text-center">الوحدة</th>
                    <th className="px-6 py-4 w-32 text-center">الكمية</th>
                    {!isVoucherInvoice && <th className="px-6 py-4 w-20 text-center">الإجراء</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoiceForm.items.length === 0 ? (
                    <tr>
                      <td colSpan={isVoucherInvoice ? 5 : 6} className="text-center py-20">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100/50">
                            <Package size={32} className="text-slate-300" />
                          </div>
                          <p className="text-sm font-bold text-slate-400 font-tajawal">{isVoucherInvoice ? 'لا توجد أصناف منقولة من السند' : 'ابدأ بإضافة الأصناف للفاتورة من الأعلى'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoiceForm.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-all group border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4 text-[11px] font-black text-slate-300 text-center group-hover:text-indigo-400 transition-colors tabular-nums">{idx + 1}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700">{item.name && item.company ? item.name : (item.name || item.item || '-')}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black">{item.cat || 'بدون تصنيف'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{item.unit || 'كرتونة'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl ${isVoucherInvoice ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-red-50 text-red-600 border-red-100'} border font-black text-sm tabular-nums`}>
                              {isVoucherInvoice ? item.qty : `-${item.qty}`}
                           </div>
                        </td>
                        {!isVoucherInvoice && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                              <button 
                                type="button" 
                                onClick={() => handleEditInvoiceItem(idx)} 
                                className={`w-9 h-9 flex items-center justify-center ${isVoucherInvoice ? 'text-indigo-500 hover:bg-indigo-50' : 'text-blue-500 hover:bg-blue-50'} rounded-xl transition-all`}
                                title="تعديل"
                              >
                                <Pencil size={18} strokeWidth={2.5} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setInvoiceForm({...invoiceForm, items: invoiceForm.items.filter((_, i) => i !== idx)})} 
                                className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="حذف"
                              >
                                <Trash2 size={18} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      </ModalWrapper>
      


      {/* 4. Add Return (Compact Layout with Hybrid Search & Intelligent Expiry) */}
      <ModalWrapper title="تسجيل مرتجع مخزني" maxWidth="max-w-6xl" isOpen={isReturnsModalOpen} onClose={handleCloseReturnModal} onSubmit={handleAddReturn} compact loading={loading}>
          {/* Header Fields - Returnee, Representative, and Date */}
          <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">اسم المرجع / العميل <span className="text-red-500">*</span></label>
               <input
                 type="text"
                 className={`w-full bg-white border ${!returnForm.returnee.trim() ? 'border-red-200 ring-2 ring-red-500/5' : 'border-slate-200'} text-slate-800 text-[13px] font-black rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
                 value={returnForm.returnee}
                 onChange={(e) => {
                   setReturnForm({...returnForm, returnee: e.target.value});
                   if (e.target.value.trim()) setReturnErrors(prev => ({...prev, returnee: false}));
                 }}
                 placeholder="من قام بالإرجاع؟"
               />
             </div>
             
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">المندوب المستلم <span className="text-red-500">*</span></label>
               <input
                 type="text"
                 list="reps-datalist"
                 className={`w-full h-[38px] bg-white border ${!returnForm.rep.trim() && returnErrors.rep ? "border-red-200 ring-2 ring-red-500/5" : "border-slate-200"} text-slate-800 text-[13px] font-black rounded-xl px-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-tajawal`}
                 value={returnForm.rep}
                 onChange={(e) => { setReturnForm({...returnForm, rep: e.target.value}); if (e.target.value.trim()) setReturnErrors(prev => ({...prev, rep: false})); }}
                 placeholder="اسم المندوب"
               />
             </div>

             <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 mb-1 mr-1 uppercase">تاريخ الإرجاع</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-4 py-2 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-readex text-center" 
                  value={returnForm.date} 
                  onChange={(e) => setReturnForm({...returnForm, date: e.target.value})} 
                />
             </div>
          </div>

          {/* Top Section (Fixed Entry - Compact Style) */}
          <div className="bg-slate-50/50 p-2.5 rounded-[1.2rem] border border-slate-100 mb-2 shadow-sm">
             <div className="flex items-center gap-2 mb-2 mr-1">
                <div className="w-1.5 h-3 bg-amber-500 rounded-full" />
                <h4 className="text-[11px] font-black text-slate-700 font-tajawal">إضافة سريع للمرتجعات</h4>
             </div>
             <div className="flex flex-wrap items-end gap-2.5">
                {/* Search Field */}
                <div className="flex-1 min-w-[200px] relative group/ret">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 mr-1 uppercase h-[15px] leading-[15px]">البحث عن صنف</label>
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={returnSearchInputRef}
                      type="text"
                      id="returnSearchInput"
                      className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl pr-9 pl-3 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 transition-all font-tajawal placeholder:text-slate-300 placeholder:font-semibold"
                      placeholder="اكتب للبحث أو إضافة صنف جديد..."
                      value={returnForm.query}
                      onChange={(e) => {
                        setReturnForm({...returnForm, query: e.target.value, selectedItem: null, cat: '', unit: ''});
                        setReturnSearchActiveIndex(-1);
                      }}
                      onBlur={() => {
                        if (returnForm.query.trim().length >= 2 && !returnForm.selectedItem) {
                          const matchFound = items.some(i => i.name.includes(returnForm.query) || i.company.includes(returnForm.query));
                          if (!matchFound) {
                            triggerNewItemRegistration(returnForm.query.trim(), 'return');
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        const suggestions = items.filter(i => i.name.includes(returnForm.query) || i.company.includes(returnForm.query));
                        if (e.key === 'ArrowDown') { e.preventDefault(); setReturnSearchActiveIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setReturnSearchActiveIndex(prev => prev > 0 ? prev - 1 : 0); }
                        else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (returnSearchActiveIndex >= 0 && suggestions[returnSearchActiveIndex]) {
                            const invItem = suggestions[returnSearchActiveIndex];
                            const isReturnExpiryDisabled = invItem.cat === 'بلاستيك';
                            setReturnForm({...returnForm, query: `${invItem.name} - ${invItem.company}`, selectedItem: invItem, cat: invItem.cat || invItem.category || '', unit: invItem.unit || 'كرتونة', expiryDate: isReturnExpiryDisabled ? '' : '', returnStatus: returnForm.returnStatus || 'سليم' });
                            setReturnSearchActiveIndex(-1);
                            setTimeout(() => document.getElementById('returnQtyInput')?.focus(), 10);
                          } else if (suggestions.length === 0 && returnForm.query.trim().length >= 2) {
                            triggerNewItemRegistration(returnForm.query.trim(), 'return');
                          } else if (returnForm.selectedItem) {
                            setTimeout(() => document.getElementById('returnQtyInput')?.focus(), 10);
                          }
                        } else if (e.key === 'Tab') {
                          setTimeout(() => document.getElementById('returnQtyInput')?.focus(), 10);
                        }
                      }}
                    />
                  </div>
                  {returnForm.query && !returnForm.selectedItem && (
                    <div className="hidden group-focus-within/ret:block absolute top-[110%] right-0 w-full max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1.5 backdrop-blur-xl custom-scrollbar">
                      {items.filter(i => i.name.includes(returnForm.query) || i.company.includes(returnForm.query)).map((invItem, idx) => (
                           <button key={invItem.id} type="button" className={`w-full text-right px-3 py-2 rounded-lg transition-all ${returnSearchActiveIndex === idx ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-700'}`} onMouseDown={(e) => {
                             e.preventDefault();
                             const isReturnExpiryDisabled = invItem.cat === 'بلاستيك';
                             setReturnForm({...returnForm, query: `${invItem.name} - ${invItem.company}`, selectedItem: invItem, cat: invItem.cat || invItem.category || '', unit: invItem.unit || 'كرتونة', expiryDate: isReturnExpiryDisabled ? '' : '', returnStatus: returnForm.returnStatus || 'سليم' });
                             setReturnSearchActiveIndex(-1);
                             setTimeout(() => { document.getElementById('returnQtyInput')?.focus(); }, 10);
                           }}>
                             <div className="flex justify-between items-center w-full">
                               <div className="flex flex-col">
                                  <span className="text-xs font-black">{invItem.name}</span>
                                  <span className="text-[9px] font-bold opacity-60">{invItem.company}</span>
                               </div>
                               <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">رصيد: {invItem.stockQty}</span>
                             </div>
                           </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity Field */}
                <div className="w-[85px] shrink-0">
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الكمية</label>
                  <input 
                    type="number" 
                    id="returnQtyInput" 
                    className="w-full h-[38px] bg-white border-2 border-amber-400/50 focus:border-amber-500 text-amber-700 text-sm rounded-xl px-2 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all text-center font-black tabular-nums shadow-inner" 
                    placeholder="0" 
                    maxLength={4}
                    value={returnForm.qty} 
                    onChange={(e) => { if (e.target.value.length <= 4) setReturnForm({...returnForm, qty: e.target.value}); }} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddReturnItemToTable(); }
                    }} 
                  />
                </div>

                {/* Category Field */}
                <div className="w-[85px] shrink-0">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">القسم</label>
                  <input type="text" className="w-full h-[38px] bg-slate-100/50 border border-slate-200/60 text-slate-600 text-[12px] font-black rounded-xl px-2 outline-none cursor-default text-center transition-all" value={returnForm.cat || '-'} readOnly placeholder="تلقائي" />
                </div>

                {/* Unit Field */}
                <div className="w-[85px] shrink-0">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الوحدة</label>
                  {returnForm.selectedItem ? (
                    <input type="text" className="w-full h-[38px] bg-slate-100/50 border border-slate-200/60 text-slate-600 text-[12px] font-black rounded-xl px-2 outline-none cursor-default text-center transition-all font-tajawal" value={returnForm.unit || 'كرتونة'} readOnly placeholder="تلقائي" />
                  ) : (
                    <input type="text" className="w-full h-[38px] bg-white border border-slate-200 text-slate-800 text-[13px] font-black rounded-xl px-2 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 transition-all text-center font-tajawal" value={returnForm.unit || 'كرتونة'} onChange={(e) => setReturnForm({...returnForm, unit: e.target.value})} placeholder="كرتونة" />
                  )}
                </div>

                {/* Return Status Field */}
                <div className="w-[85px] shrink-0">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 text-center uppercase h-[15px] leading-[15px]">الحالة</label>
                  <select 
                    className={`w-full h-[38px] border text-[12px] font-black rounded-xl px-1 outline-none focus:ring-4 transition-all text-center ${returnForm.returnStatus === 'تالف' ? 'bg-red-50 border-red-200 text-red-600 focus:ring-red-500/10 focus:border-red-500' : 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500/10 focus:border-emerald-500'}`}
                    value={returnForm.returnStatus || 'سليم'} 
                    onChange={(e) => setReturnForm({...returnForm, returnStatus: e.target.value})}
                  >
                    <option value="سليم">سليم</option>
                    <option value="تالف">تالف</option>
                  </select>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  className="w-[38px] h-[38px] bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md shadow-amber-200 flex items-center justify-center hover:scale-105 active:scale-95 shrink-0"
                  onClick={handleAddReturnItemToTable}
                  title="إضافة للمرتجع"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
             </div>
          </div>

          {/* Middle Section (The Table - Maximized Height) */}
          <div className="card overflow-hidden flex flex-col flex-1 min-h-[45vh]">

            <div className="overflow-y-auto w-full overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full min-w-max text-right text-xs whitespace-nowrap">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-[11px] font-black text-slate-600 border-b border-slate-200">
                    <th className="px-3 py-2 font-black w-10 text-center">م</th>
                    <th className="px-3 py-2 font-black min-w-[180px]">اسم الصنف</th>
                    <th className="px-3 py-2 font-black w-24">القسم</th>
                    <th className="px-3 py-2 font-black w-20">الوحدة</th>
                    <th className="px-3 py-2 font-black w-20 text-center">الكمية</th>
                    <th className="px-3 py-2 font-black w-20 text-center">الحالة</th>
                    <th className="px-3 py-2 font-black w-14 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400 text-[10px] font-bold">
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <RotateCcw size={28} className="mb-1.5" />
                          لم يتم إضافة أصناف مرتجعة بعد
                        </div>
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, idx) => (
                      <tr key={idx} className={`transition-colors group ${item.returnStatus === 'تالف' ? 'bg-red-50/30 hover:bg-red-50' : 'bg-white hover:bg-slate-50'} border-b border-slate-50`}>
                        <td className="px-3 py-2 text-[10px] font-black text-slate-400 text-center tabular-nums">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs font-black text-slate-800">
                          {item.name || '-'}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-black">{item.cat}</span>
                        </td>
                        <td className="px-3 py-2 text-[10px] font-black text-slate-600">{item.unit}</td>
                        <td className="px-3 py-2 text-xs font-black text-emerald-600 border-r border-slate-100 text-center">+{item.qty}</td>
                        <td className="px-3 py-2 text-center text-[10px] font-black">
                          {item.returnStatus === 'تالف' ? (
                            <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">تالف (توالف)</span>
                          ) : (
                            <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">سليم (للمخزن)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              type="button" 
                              onClick={() => handleEditReturnItem(idx)} 
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                              title="تعديل"
                            >
                              <Pencil size={14} strokeWidth={2.5} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { setReturnItems(prev => prev.filter((_, i) => i !== idx)); }} 
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Footer with Confirmation */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
            {returnItems.length > 0 && (
              <button 
                type="submit" 
                disabled={!returnForm.returnee.trim()}
                className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                حفظ واعتماد {returnItems.length} صنف
              </button>
            )}
          </div>
      </ModalWrapper>

      {/* Invoice Exit Confirmation Dialog */}
      <AnimatePresence>
        {showInvoiceExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                  <AlertTriangle size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">خروج وتجاهل؟</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">الفاتورة الحالية تحتوي على أصناف أو بيانات. هل أنت متأكد من الخروج دون حفظ؟</p>
               
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={performInvoiceReset} 
                    className="w-full py-4.5 rounded-2xl bg-rose-500 text-white text-lg font-black shadow-xl shadow-rose-500/25 hover:bg-rose-600 transition-all active:scale-95 font-tajawal"
                  >
                    نعم، تجاهل البيانات
                  </button>
                  <button 
                    onClick={() => setShowInvoiceExitConfirm(false)} 
                    className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold hover:bg-slate-200 transition-all font-tajawal"
                  >
                    تراجع والعودة
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

{/* Return Exit Confirmation Dialog */}
      <AnimatePresence>
        {showReturnExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500">
                  <AlertTriangle size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">خروج وتجاهل؟</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">لديك بيانات مرتجع لم يتم حفظها. هل أنت متأكد من الخروج وفقدان هذه البيانات؟</p>
               
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={performReturnReset} 
                    className="w-full py-4.5 rounded-2xl bg-rose-500 text-white text-lg font-black shadow-xl shadow-rose-500/25 hover:bg-rose-600 transition-all active:scale-95 font-tajawal"
                  >
                    نعم، تجاهل البيانات
                  </button>
                  <button 
                    onClick={() => setShowReturnExitConfirm(false)} 
                    className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold hover:bg-slate-200 transition-all font-tajawal"
                  >
                    تراجع والعودة
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
{/* Save Confirmation Dialogs */}
      <AnimatePresence>
        {(showInvoiceSaveConfirm || showReturnSaveConfirm) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 text-center border border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
               </div>
               <h4 className="text-3xl font-black text-slate-800 mb-3 font-tajawal tracking-tight">تأكيد الحفظ</h4>
               <p className="text-sm text-slate-500 mb-12 font-readex leading-relaxed">
                  {showInvoiceSaveConfirm 
                    ? `هل أنت متأكد من حفظ الفاتورة لـ ${invoiceForm.client}؟ سيتم تحديث أرصدة المخزن فوراً.` 
                    : `هل أنت متأكد من اعتماد المرتجع من ${returnForm.returnee}؟`}
               </p>
               
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={showInvoiceSaveConfirm ? performInvoiceSave : performReturnSave} 
                    disabled={loading}
                    className="w-full py-4.5 rounded-2xl bg-emerald-600 text-white text-lg font-black shadow-xl shadow-emerald-500/25 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 font-tajawal disabled:opacity-50"
                  >
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={20} /> تأكيد وحفظ</>}
                  </button>
                  <button 
                    onClick={() => { setShowInvoiceSaveConfirm(false); setShowReturnSaveConfirm(false); }} 
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-all font-tajawal"
                  >
                    تراجع
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      

      

      


      {/* Batch Registration Modals (Item Registration) */}
      <AnimatePresence>
        {showSaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-sm w-full text-center border border-slate-100">
               <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-6" />
               <h4 className="text-2xl font-black mb-3">تأكيد الحفظ</h4>
               <p className="text-sm text-slate-500 mb-10">حفظ {sessionItems.length} صنف؟</p>
               <button onClick={confirmRegisterBatchSave} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black shadow-lg mb-3">تأكيد</button>
               <button onClick={() => setShowSaveConfirm(false)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold">تراجع</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-sm w-full text-center border border-slate-100">
               <AlertTriangle size={40} className="text-rose-500 mx-auto mb-6" />
               <h4 className="text-2xl font-black mb-3">خروج بدون حفظ؟</h4>
               <button onClick={performModalReset} className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black shadow-lg mb-3">نعم، خروج</button>
               <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-bold">تراجع</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
