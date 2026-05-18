import React, { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Placeholder from './components/Placeholder';
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
            <AppContent />
            <Toaster position="top-center" richColors theme="light" />
          </AuthProvider>
        </AudioProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
