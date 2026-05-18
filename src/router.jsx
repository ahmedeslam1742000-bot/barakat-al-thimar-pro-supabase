import React, { lazy, Suspense } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import MainLayout from './components/MainLayout';
import { useAuth } from './contexts/AuthContext';
import { ShieldOff } from 'lucide-react';
import Login from './components/Login';

// Lazy loaded components
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

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 opacity-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <span className="font-bold text-slate-400">جاري تحميل الصفحة...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}

const rootRoute = createRootRoute({
  component: () => {
    const { currentUser } = useAuth();
    if (!currentUser) return <Login />;
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  },
});

const withPermission = (id, Component) => {
  return function ProtectedRoute(props) {
    const { canAccess } = useAuth();
    if (!canAccess(id)) return <AccessDenied />;
    return (
      <SuspenseWrapper>
        <Component {...props} />
      </SuspenseWrapper>
    );
  };
};

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: withPermission('dashboard', Dashboard),
});

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  component: withPermission('items', Items),
});

const stockInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock-in',
  component: withPermission('stock-in', InboundItems),
});

const stockOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock-out',
  component: withPermission('stock-out', StockOut),
});

const returnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/returns',
  component: withPermission('returns', Returns),
});

const voucherOutwardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/voucher-outward',
  component: withPermission('voucher-outward', VoucherOutward),
});

const repsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reps',
  component: withPermission('reps', Reps),
});

const receiptVouchersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receipt-vouchers',
  component: withPermission('receipt-vouchers', ReceiptVouchers),
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: withPermission('inventory', StockInventory),
});

const inboundRecordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inbound-records',
  component: withPermission('inbound-records', InboundRecords),
});

const stockCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock-card',
  component: withPermission('stock-card', StockCard),
});

const priceListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/price-list',
  component: withPermission('price-list', PriceList),
});

const salesAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales-analytics',
  component: withPermission('sales-analytics', SalesAnalytics),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: withPermission('settings', Settings),
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  itemsRoute,
  stockInRoute,
  stockOutRoute,
  returnsRoute,
  voucherOutwardRoute,
  repsRoute,
  receiptVouchersRoute,
  inventoryRoute,
  inboundRecordsRoute,
  stockCardRoute,
  priceListRoute,
  salesAnalyticsRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });
