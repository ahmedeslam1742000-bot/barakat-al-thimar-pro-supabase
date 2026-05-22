import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Warehouse,
  FileText,
  FileStack,
  Archive,
  Settings,
  LogOut,
  X,
  ChevronDown,
  Circle,
  ClipboardList,
  Users,
  BarChart3,
  Tags,
  ChevronLeft,
  Box,
  TrendingUp,
  History,
  Banknote
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from '@tanstack/react-router';

const menuGroups = [
  {
    id: 'dashboard',
    label: 'لوحة القيادة',
    icon: LayoutDashboard,
    isStatic: true,
    view: 'dashboard'
  },
  {
    id: 'warehouse',
    label: 'المخزن',
    icon: Warehouse,
    subItems: [
      { id: 'items', label: 'الأصناف', view: 'items' },
      { id: 'stock-in', label: 'المخزون', view: 'stock-in' },
      { id: 'stock-out', label: 'الفواتير', view: 'stock-out' },
      { id: 'returns', label: 'مرتجع', view: 'returns' },
    ]
  },
  {
    id: 'receipt-vouchers',
    label: 'سندات تحصيل',
    icon: Banknote,
    isStatic: true,
    view: 'receipt-vouchers'
  },
  {
    id: 'voucher-outward',
    label: 'سند إخراج',
    icon: FileText,
    isStatic: true,
    view: 'voucher-outward'
  },

  // Standalone: الأسعار (Price List)
  {
    id: 'price-list',
    label: 'الأسعار',
    icon: Tags,
    isStatic: true,
    view: 'price-list'
  },
  // Unified Admin Dropdown: إدارة المستودع
  {
    id: 'warehouse-management',
    label: 'إدارة المستودع',
    icon: Archive,
    subItems: [
      { id: 'sales-analytics', label: 'تحليل المبيعات', view: 'sales-analytics' },
      { id: 'inbound-records', label: 'أذونات الواردات', view: 'inbound-records' },
      { id: 'stock-card', label: 'الرصيد التراكمي', view: 'stock-card' },
      { id: 'inventory-check', label: 'جرد المستودع', view: 'inventory' },
      { id: 'reps', label: 'إدارة المناديب', view: 'reps' },
    ]
  }
];

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { logout, isAdmin, canAccess } = useAuth();
  const [openGroup, setOpenGroup] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const getPath = (view) => view === 'dashboard' ? '/' : `/${view}`;

  const toggleGroup = (groupId) => {
    setOpenGroup(openGroup === groupId ? null : groupId);
  };

  const handleStaticClick = (view) => {
    navigate({ to: getPath(view) });
    setOpenGroup(null);
  };

  const handleSubItemClick = (view) => {
    navigate({ to: getPath(view) });
  };

  const isGroupActive = (group) => {
    if (group.isStatic) return activePath === getPath(group.view);
    return group.subItems.some(sub => activePath === getPath(sub.view));
  };

  return (
    <AnimatePresence mode="wait">
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="print:hidden fixed inset-y-0 right-0 z-50 h-full w-64 bg-white dark:bg-[#111C44] shadow-none border-l border-slate-100/50 dark:border-slate-800/50 flex flex-col font-readex transition-all duration-300"
        >
          {/* Brand Area */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100/50 dark:border-slate-800/50 shrink-0 bg-transparent">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-primary dark:text-emerald-400"
              >
                <Warehouse size={22} className="drop-shadow-sm" strokeWidth={2.5} />
              </motion.div>
              <div className="flex flex-col text-right mt-1">
                <span className="font-tajawal font-black text-lg text-primary dark:text-white tracking-tight leading-none uppercase">بركة الثمار</span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar" dir="rtl">
            {menuGroups.filter(g => g.isStatic ? canAccess(g.view) : g.subItems.some(s => canAccess(s.view))).map((group) => {
              const Icon = group.icon;
              const isActive = isGroupActive(group);
              const isOpen = openGroup === group.id;
              
              // Filter subItems based on access
              const allowedSubItems = group.subItems ? group.subItems.filter(s => canAccess(s.view)) : [];

              return (
                <div key={group.id} className="flex flex-col rounded-xl overflow-hidden mb-0.5 transition-all duration-300">
                  <button
                    onClick={() => group.isStatic ? handleStaticClick(group.view) : toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group/btn relative font-semibold text-xs tracking-tight border
                      ${isActive
                        ? 'bg-gradient-to-l from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-emerald-600 dark:hover:text-emerald-400 border-transparent'}
                    `}
                  >
                    {/* Active Indicator Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-full shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                      ></motion.div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg transition-all duration-300 shadow-sm ${isActive ? 'bg-emerald-500/20 dark:bg-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900 group-hover/btn:bg-emerald-500/10 dark:group-hover/btn:bg-emerald-500/10'}`}>
                        <Icon size={16} className={`drop-shadow-sm ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400'} transition-colors duration-300`} />
                      </div>
                      <span className={`font-tajawal text-xs text-right ${isActive ? 'font-black' : 'font-bold'}`}>{group.label}</span>
                    </div>

                    {!group.isStatic && (
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
                      />
                    )}
                  </button>

                  {!group.isStatic && (
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col py-1.5 pr-8 space-y-1 relative border-r border-slate-100 dark:border-slate-900 mr-5">
                            {allowedSubItems.map((sub) => {
                              const isSubActive = activePath === getPath(sub.view);
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSubItemClick(sub.view)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-[11px] font-bold tracking-tight relative
                                    ${isSubActive
                                      ? 'bg-gradient-to-l from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 shadow-sm'
                                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-emerald-600 dark:hover:text-emerald-400'}
                                  `}
                                >
                                  <span className="text-right flex-1 font-tajawal">{sub.label}</span>
                                  {isSubActive && (
                                    <motion.div 
                                      layoutId={`subActiveDot-${group.id}`}
                                      className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ml-1 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100/85 dark:border-slate-900/50 shrink-0 space-y-1.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
            {isAdmin && (
              <button
                onClick={() => navigate({ to: '/settings' })}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 font-bold text-xs border ${
                  activePath === '/settings'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 border-transparent'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-emerald-600 dark:hover:text-emerald-400 border-transparent'
                }`}
              >
                <div className={`p-1 rounded-md transition-colors ${activePath === '/settings' ? 'bg-white/10' : 'bg-slate-100/50 dark:bg-slate-900/50'}`}>
                  <Settings size={14} />
                </div>
                <span className="font-tajawal">الإعدادات</span>
              </button>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 group"
            >
              <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
                <LogOut size={14} />
              </div>
              <span className="font-tajawal">تسجيل الخروج</span>
            </button>

            <div className="mt-3 pt-3 border-t border-slate-100/80 dark:border-slate-900/50 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-tajawal">
                  متصل الآن
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">الإصدار 2.4.0</span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
