import React, { createContext, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useItemsQuery, 
  useTransactionsQuery, 
  useReceiptVouchersQuery, 
  useRepExpensesQuery, 
  useRepsQuery, 
  useComputedData 
} from '../hooks/useAppQueries';

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
  
  const { data: items = [], refetch: fetchItems } = useItemsQuery(!!currentUser);
  const { data: dbTransactionsList = [], refetch: fetchTrans } = useTransactionsQuery(!!currentUser);
  const { data: receiptVouchers = [], refetch: fetchReceipts } = useReceiptVouchersQuery(!!currentUser);
  const { data: repExpenses = [], refetch: fetchExpenses } = useRepExpensesQuery(!!currentUser);
  const { data: repsList = [], refetch: fetchReps } = useRepsQuery(!!currentUser);

  const computed = useComputedData(dbTransactionsList, items);

  const fetchInitialData = () => {
    fetchItems();
    fetchTrans();
    fetchReceipts();
    fetchExpenses();
    fetchReps();
  };

  // Polyfills for legacy state setters to update React Query cache directly for Optimistic UI
  const setItems = (updater) => {
    queryClient.setQueryData(['products'], typeof updater === 'function' ? updater(items) : updater);
  };
  const setDbTransactionsList = (updater) => {
    queryClient.setQueryData(['transactions'], typeof updater === 'function' ? updater(dbTransactionsList) : updater);
  };
  const setReceiptVouchers = (updater) => {
    queryClient.setQueryData(['receipt_vouchers'], typeof updater === 'function' ? updater(receiptVouchers) : updater);
  };
  const setRepExpenses = (updater) => {
    queryClient.setQueryData(['representative_expenses'], typeof updater === 'function' ? updater(repExpenses) : updater);
  };
  const setRepsList = (updater) => {
    queryClient.setQueryData(['reps'], typeof updater === 'function' ? updater(repsList) : updater);
  };

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
    items,
    dbTransactionsList,
    repsList,
    receiptVouchers,
    repExpenses,
    computed,
    // Note: Setters and fetchInitialData are stable enough or bound to queryClient, so they don't break memo much
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
