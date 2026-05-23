import React, { useState, Suspense, lazy, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import MainLayout from './components/MainLayout';

import Login from './components/Login';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Items = lazy(() => import('./components/Items'));
const StockOut = lazy(() => import('./components/StockOut'));
const Returns = lazy(() => import('./pages/Returns'));
const VoucherOutward = lazy(() => import('./pages/VoucherOutward'));
const Reps = lazy(() => import('./pages/Reps'));
const Settings = lazy(() => import('./pages/Settings'));
const StockInventory = lazy(() => import('./pages/StockInventory'));
const InboundRecords = lazy(() => import('./pages/InboundRecords'));
const InboundItems = lazy(() => import('./pages/InboundItems'));
const StockCard = lazy(() => import('./pages/StockCard'));
const PriceList = lazy(() => import('./pages/PriceList'));
const ReceiptVouchers = lazy(() => import('./pages/ReceiptVouchers'));
const SalesAnalytics = lazy(() => import('./pages/SalesAnalytics'));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DataProvider } from './contexts/DataContext';
import { Toaster } from 'sonner';
import { Package, Truck, ArrowUpRight, RotateCcw, Download, Upload, User, FileStack, BookOpen, ClipboardList, Activity, Settings as SettingsIcon, BarChart3, Tags, History, TrendingUp, Banknote, ShieldOff } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents refetching when switching tabs
      retry: 2,
    },
  },
});

function GlobalRealtimeWatcher() {
  const qc = useQueryClient();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('global-data-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        qc.invalidateQueries({ queryKey: ['products'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        qc.invalidateQueries({ queryKey: ['transactions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipt_vouchers' }, () => {
        qc.invalidateQueries({ queryKey: ['receipt_vouchers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'representative_expenses' }, () => {
        qc.invalidateQueries({ queryKey: ['representative_expenses'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, qc]);

  return null;
}

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

function AppContent() {
  const { currentUser } = useAuth();
  
  return (
    <DataProvider currentUser={currentUser}>
      <RouterProvider router={router} />
    </DataProvider>
  );
}

import { AudioProvider } from './contexts/AudioContext';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AudioProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <AppContent />
              <GlobalRealtimeWatcher />
              <Toaster position="top-center" richColors theme="light" />
            </QueryClientProvider>
          </AuthProvider>
        </AudioProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
