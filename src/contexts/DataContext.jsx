import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDataStore, useComputedData } from '../store/useDataStore';

const DataContext = createContext(null);

export function DataProvider({ children, currentUser }) {
  const store = useDataStore();
  const computed = useComputedData();

  useEffect(() => {
    if (!currentUser) return; // Wait until logged in
    
    store.fetchInitialData();
    store.initRealtime();
    return () => {
      // Don't cleanup realtime globally if we want it to persist, 
      // but if DataProvider unmounts (logout), we can clean it up:
      store.cleanupRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const value = useMemo(() => ({
    items: store.items,
    setItems: store.setItems,
    dbTransactionsList: store.dbTransactionsList,
    setDbTransactionsList: store.setDbTransactionsList,
    repsList: store.repsList,
    setRepsList: store.setRepsList,
    receiptVouchers: store.receiptVouchers,
    setReceiptVouchers: store.setReceiptVouchers,
    repExpenses: store.repExpenses,
    setRepExpenses: store.setRepExpenses,
    fetchInitialData: store.fetchInitialData,

    voucherTransactionsMemo: computed.voucherTransactionsMemo,
    functionalVoucherGroups: computed.functionalVoucherGroups,
    pendingVouchers: computed.pendingVouchers,
    completedVouchers: computed.completedVouchers,
    cancelledVouchers: computed.cancelledVouchers,
    morningBriefData: computed.morningBriefData,
  }), [store, computed]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
