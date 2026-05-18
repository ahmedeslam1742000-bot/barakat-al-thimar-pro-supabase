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
import { useDataStore, useComputedData } from '../store/useDataStore';
import DashboardStats from './dashboard/DashboardStats';
import { TransactionDetailModal } from './TransactionDetailModal';
import { MorningBriefModal } from './MorningBriefModal';
import { VoucherDetailModal } from './VoucherDetailModal';
import { VoucherConfirmationModal } from './VoucherConfirmationModal';
import { MovementsColumn } from './dashboard/MovementsColumn';
import { AlertsColumn } from './dashboard/AlertsColumn';
import { VoucherStatusColumn } from './dashboard/VoucherStatusColumn';

// New Sub-components
import ItemRegistrationModal from './dashboard/ItemRegistrationModal';
import InvoiceModal from './dashboard/InvoiceModal';
import ReturnModal from './dashboard/ReturnModal';
import DashboardConfirmationDialogs from './dashboard/DashboardConfirmationDialogs';



// (تم تنظيف المكونات والبيانات الوهمية غير المستخدمة هنا)

const FUNCTIONAL_INBOUND_TYPE = 'سند إدخال';
const FUNCTIONAL_OUTBOUND_TYPE = 'سند إخراج';

export default function Dashboard({}) {
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [invoiceTimestamps, setInvoiceTimestamps] = useState({});
  // const [locations, setLocations] = useState(['مستودع الرياض', 'مستودع جدة', 'المركز الرئيسي', 'مورد خارجي']); // معطلة مؤقتاً لاستخدامها مستقبلاً عند تعدد المخازن
  const [stockSearchActiveIndex, setStockSearchActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [selectedBatchTransactions, setSelectedBatchTransactions] = useState([]);

  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const { playSuccess, playWarning } = useAudio();

  const {
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    fetchInitialData,
  } = useDataStore();

  const {
    voucherTransactionsMemo,
    functionalVoucherGroups,
    pendingVouchers,
    completedVouchers,
    cancelledVouchers,
    morningBriefData,
  } = useComputedData();

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
    setInvoiceTimestamps,
    setStockSearchActiveIndex,
  });

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

  const {
    showVoucherHistory, setShowVoucherHistory,
    voucherTransactions, setVoucherTransactions,
    isVoucherModalOpen, setIsVoucherModalOpen,
    selectedVoucher, setSelectedVoucher,
    activeVoucherId, setActiveVoucherId,
    isVoucherDetailOpen, setIsVoucherDetailOpen,
    detailVoucher, setDetailVoucher,
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
    
    invoiceTimestamps,
    setInvoiceTimestamps,
    setSourceVoucher,
    setInvoiceForm,
    setCurrentInvoiceItem,
    setIsVoucherInvoice,
    setIsSalesModalOpen,
  });

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
  const [movementTypeFilter, setMovementTypeFilter] = useState('الكل');
  const [isMorningBriefOpen, setIsMorningBriefOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.key === 'Escape') {
        if (isItemModalOpen) setIsItemModalOpen(false);
        if (isStockInModalOpen) setIsStockInModalOpen(false);
        if (isTransactionDetailOpen) setIsTransactionDetailOpen(false);
        if (isVoucherDetailOpen) { setIsVoucherDetailOpen(false); setShowVoucherHistory(false); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isItemModalOpen, isStockInModalOpen, isTransactionDetailOpen, isVoucherDetailOpen]);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 18 } }
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full w-full flex flex-col gap-6 font-readex bg-transparent text-[#0F2747] dark:text-white overflow-hidden box-border">
      
      {/* ─── PHASE 1: STATS & HEADER ─── */}
      <DashboardStats
        itemsCount={items.length}
        onAddItem={() => setIsItemModalOpen(true)}
        onAddStock={() => setIsStockInModalOpen(true)}
        onAddInvoice={openInvoiceModal}
        onAddReturn={openReturnModal}
        onOpenMorningBrief={() => setIsMorningBriefOpen(true)}
        
      />

      {/* ─── PHASE 2: MOVEMENT COLUMNS ─── */}
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

      <ItemRegistrationModal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        sessionItems={sessionItems}
        showExitConfirm={showExitConfirm}
        setShowExitConfirm={setShowExitConfirm}
        performModalReset={performModalReset}
        showSaveConfirm={showSaveConfirm}
        setShowSaveConfirm={setShowSaveConfirm}
        confirmRegisterBatchSave={confirmRegisterBatchSave}
        itemForm={itemForm}
        setItemForm={setItemForm}
        handleNameInput={handleNameInput}
        handleCompanyInput={handleCompanyInput}
        handleModalKeyDown={handleModalKeyDown}
        nameSuggestions={nameSuggestions}
        setNameSuggestions={setNameSuggestions}
        activeNameIdx={activeNameIdx}
        companySuggestions={companySuggestions}
        setCompanySuggestions={setCompanySuggestions}
        activeCompIdx={activeCompIdx}
        itemNameInputRef={itemNameInputRef}
        companyInputRef={companyInputRef}
        newCategoryInputRef={newCategoryInputRef}
        isAddingCategory={isAddingCategory}
        setIsAddingCategory={setIsAddingCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        categories={categories}
        isCustomUnit={isCustomUnit}
        setIsCustomUnit={setIsCustomUnit}
        unitInputRef={unitInputRef}
        units={units}
        addToSession={addToSession}
        editingSessionId={editingSessionId}
        setEditingSessionId={setEditingSessionId}
        removeSessionItem={removeSessionItem}
        loading={loading}
      />

      <InvoiceModal
        isOpen={isSalesModalOpen}
        onClose={handleCloseInvoiceModal}
        onSubmit={handleAddInvoice}
        isVoucherInvoice={isVoucherInvoice}
        invoiceForm={invoiceForm}
        setInvoiceForm={setInvoiceForm}
        currentInvoiceItem={currentInvoiceItem}
        setCurrentInvoiceItem={setCurrentInvoiceItem}
        invoiceErrors={invoiceErrors}
        setInvoiceErrors={setInvoiceErrors}
        repsList={repsList}
        items={items}
        invoiceSearchInputRef={invoiceSearchInputRef}
        invoiceSearchActiveIndex={invoiceSearchActiveIndex}
        setInvoiceSearchActiveIndex={setInvoiceSearchActiveIndex}
        handleAddInvoiceItemToTable={handleAddInvoiceItemToTable}
        handleEditInvoiceItem={handleEditInvoiceItem}
        loading={loading}
      />

      <ReturnModal
        isOpen={isReturnsModalOpen}
        onClose={handleCloseReturnModal}
        onSubmit={handleAddReturn}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        returnItems={returnItems}
        setReturnItems={setReturnItems}
        returnErrors={returnErrors}
        setReturnErrors={setReturnErrors}
        items={items}
        returnSearchInputRef={returnSearchInputRef}
        returnSearchActiveIndex={returnSearchActiveIndex}
        setReturnSearchActiveIndex={setReturnSearchActiveIndex}
        handleAddReturnItemToTable={handleAddReturnItemToTable}
        handleEditReturnItem={handleEditReturnItem}
        triggerNewItemRegistration={triggerNewItemRegistration}
        loading={loading}
      />

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


      {/* Hidden Invoice Template for Capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        {invoiceDataForCapture && <InvoiceTemplate data={invoiceDataForCapture} />}
      </div>

      <DashboardConfirmationDialogs
        showInvoiceExitConfirm={showInvoiceExitConfirm}
        setShowInvoiceExitConfirm={setShowInvoiceExitConfirm}
        performInvoiceReset={performInvoiceReset}
        showReturnExitConfirm={showReturnExitConfirm}
        setShowReturnExitConfirm={setShowReturnExitConfirm}
        performReturnReset={performReturnReset}
        showInvoiceSaveConfirm={showInvoiceSaveConfirm}
        setShowInvoiceSaveConfirm={setShowInvoiceSaveConfirm}
        performInvoiceSave={performInvoiceSave}
        showReturnSaveConfirm={showReturnSaveConfirm}
        setShowReturnSaveConfirm={setShowReturnSaveConfirm}
        performReturnSave={performReturnSave}
        invoiceForm={invoiceForm}
        returnForm={returnForm}
        loading={loading}
      />
    </div>
  );
}
