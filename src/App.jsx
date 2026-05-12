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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DataProvider } from './contexts/DataContext';
import { Toaster } from 'sonner';
import { Package, Truck, ArrowUpRight, RotateCcw, Download, Upload, User, FileStack, BookOpen, ClipboardList, Activity, Settings as SettingsIcon, BarChart3, Tags, History, TrendingUp, Banknote, ShieldOff } from 'lucide-react';

const viewConfig = {
  'dashboard': { component: Dashboard },
  'items': { component: Items },
  'stock-in': { component: InboundItems, title: 'المخزون', icon: TrendingUp },
  'stock-out': { component: StockOut, title: 'الفواتير', icon: FileStack },
  'returns': { component: Returns, title: 'مرتجع', icon: RotateCcw },
  'voucher-outward': { component: VoucherOutward, title: 'سند إخراج', icon: Upload },
  'reps': { component: Reps, title: 'المناديب', icon: User },
  'receipt-vouchers': { component: ReceiptVouchers, title: 'سندات قبض', icon: Banknote },
  'inventory': { component: StockInventory, title: 'المخزون الحالي', icon: ClipboardList },
  'inbound-records': { component: InboundRecords, title: 'أذونات الواردات', icon: History },
  'stock-card': { component: StockCard, title: 'الرصيد التراكمي', icon: History },
  'price-list': { component: PriceList, title: 'الأسعار', icon: Tags },
  'settings': { component: Settings },
};

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4" dir="rtl">
      <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 mb-6">
        <ShieldOff size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 font-tajawal">هذه الصفحة تحتاج إلى صلاحيات</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md font-readex">
        عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذا القسم. يرجى التواصل مع المدير العام (أحمد إسلام) لطلب الصلاحية.
      </p>
    </div>
  );
}

function AuthenticatedApp() {
  const { currentUser, canAccess } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  return (
    <DataProvider currentUser={currentUser}>
      <AuthenticatedAppContent 
        activeView={activeView} 
        setActiveView={setActiveView} 
        canAccess={canAccess} 
      />
    </DataProvider>
  );
}

function AuthenticatedAppContent({ activeView, setActiveView, canAccess }) {
  const renderView = () => {
    // Permission Check
    if (!canAccess(activeView)) {
      return <AccessDenied />;
    }

    const config = viewConfig[activeView];
    if (!config) return <Dashboard />;
    if (config.component) {
      const Component = config.component;
      return (
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-full w-full gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <span className="font-bold text-slate-400">جاري تحميل الصفحة...</span>
          </div>
        }>
          <Component setActiveView={setActiveView} activeView={activeView} />
        </Suspense>
      );
    }
    return <Placeholder title={config.title} icon={config.icon} />;
  };

  return (
    <MainLayout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </MainLayout>
  );
}

import { AudioProvider } from './contexts/AudioContext';
import { RealtimeManagerProvider } from './contexts/RealtimeManagerContext';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AudioProvider>
          <AuthProvider>
            <RealtimeManagerProvider>
              <AuthenticatedApp />
              <Toaster position="top-center" richColors theme="light" />
            </RealtimeManagerProvider>
          </AuthProvider>
        </AudioProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
