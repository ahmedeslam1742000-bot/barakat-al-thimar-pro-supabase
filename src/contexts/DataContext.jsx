import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useItemsQuery, 
  useTransactionsQuery, 
  useReceiptVouchersQuery, 
  useRepExpensesQuery, 
  useRepsQuery, 
  useComputedData 
} from '../hooks/useAppQueries';
import { useSettings } from './SettingsContext';

export const DataContext = createContext(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children, currentUser }) {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const lowStockThreshold = settings?.lowStockThreshold ?? 50;
  
  const { data: items = [], refetch: fetchItems } = useItemsQuery(!!currentUser);
  const { data: dbTransactionsList = [], refetch: fetchTrans } = useTransactionsQuery(!!currentUser);
  const { data: receiptVouchers = [], refetch: fetchReceipts } = useReceiptVouchersQuery(!!currentUser);
  const { data: repExpenses = [], refetch: fetchExpenses } = useRepExpensesQuery(!!currentUser);
  const { data: repsList = [], refetch: fetchReps } = useRepsQuery(!!currentUser);

  const computed = useComputedData(dbTransactionsList, items, lowStockThreshold);

  const fetchInitialData = useCallback(() => {
    fetchItems();
    fetchTrans();
    fetchReceipts();
    fetchExpenses();
    fetchReps();
  }, [fetchItems, fetchTrans, fetchReceipts, fetchExpenses, fetchReps]);

  // Polyfills for legacy state setters to update React Query cache directly for Optimistic UI
  const setItems = useCallback((updater) => {
    queryClient.setQueryData(['products'], (old) => 
      typeof updater === 'function' ? updater(old) : updater
    );
  }, [queryClient]);

  const setDbTransactionsList = useCallback((updater) => {
    queryClient.setQueryData(['transactions'], (old) => 
      typeof updater === 'function' ? updater(old) : updater
    );
  }, [queryClient]);

  const setReceiptVouchers = useCallback((updater) => {
    queryClient.setQueryData(['receipt_vouchers'], (old) => 
      typeof updater === 'function' ? updater(old) : updater
    );
  }, [queryClient]);

  const setRepExpenses = useCallback((updater) => {
    queryClient.setQueryData(['representative_expenses'], (old) => 
      typeof updater === 'function' ? updater(old) : updater
    );
  }, [queryClient]);

  const setRepsList = useCallback((updater) => {
    queryClient.setQueryData(['reps'], (old) => 
      typeof updater === 'function' ? updater(old) : updater
    );
  }, [queryClient]);

  const value = useMemo(() => ({
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    receiptVouchers, setReceiptVouchers,
    repExpenses, setRepExpenses,
    fetchInitialData,

    voucherTransactionsMemo: computed.voucherTransactionsMemo,
    functionalVoucherGroups: computed.functionalVoucherGroups,
    pendingVouchers: computed.pendingVouchers,
    completedVouchers: computed.completedVouchers,
    cancelledVouchers: computed.cancelledVouchers,
    morningBriefData: computed.morningBriefData,
  }), [
    items, setItems,
    dbTransactionsList, setDbTransactionsList,
    repsList, setRepsList,
    receiptVouchers, setReceiptVouchers,
    repExpenses, setRepExpenses,
    fetchInitialData,
    computed,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
