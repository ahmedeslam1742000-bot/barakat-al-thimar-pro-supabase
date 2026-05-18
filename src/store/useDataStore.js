import { create } from 'zustand';

/**
 * useUIStore (formerly useDataStore)
 * Zustand store responsible ONLY for global UI State.
 * Server state (data) has been migrated to TanStack Query.
 */
export const useUIStore = create((set) => ({
  // Example UI states:
  isSidebarOpen: true,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

  activeModal: null, // 'invoice', 'return', 'item', etc.
  setActiveModal: (modalId) => set({ activeModal: modalId }),
}));
