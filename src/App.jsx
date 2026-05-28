import React, { useState, Suspense, lazy, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import MainLayout from './components/MainLayout';
import Placeholder from './components/Placeholder';
import Login from './components/Login';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DataProvider } from './contexts/DataContext';
import { Toaster, toast } from 'sonner';
import { QueryClient, QueryClientProvider, useQueryClient, QueryCache } from '@tanstack/react-query';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Check if this is the final failure attempt
      const retryConfig = query.options.retry;
      let maxRetries = 2; // our default query client retry limit is 2
      if (retryConfig === false) {
        maxRetries = 0;
      } else if (typeof retryConfig === 'number') {
        maxRetries = retryConfig;
      }
      
      const isFinalFailure = query.state.failureCount > maxRetries;
      if (isFinalFailure) {
        toast.error(`حدث خطأ أثناء تحميل البيانات: ${error.message || 'خطأ غير معروف'}`);
      }
    }
  }),
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
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setIsOffline(false);
      return;
    }

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsOffline(false);
          // Re-sync all active queries to ensure no stale data was missed during disconnect
          qc.invalidateQueries();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setIsOffline(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, qc]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center py-1.5 px-4 text-xs font-black font-tajawal shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 select-none">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      <span>فقدنا الاتصال المباشر بالخادم. جاري محاولة إعادة الاتصال تلقائياً... قد تكون البيانات المعروضة غير محدثة حالياً.</span>
    </div>
  );
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
