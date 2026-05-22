import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  Bell,
  Sun,
  Moon,
  AlertOctagon,
  Volume2,
  VolumeX,
  Search,
  Clock,
  ChevronDown,
  Warehouse,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import { normalizeArabic } from '../lib/arabicTextUtils';
import { useNavigate } from '@tanstack/react-router';

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useAudio();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const [criticalItems, setCriticalItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const alertsRef = useRef(null);
  const profileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Removed unused currentTime interval to prevent unnecessary re-renders

  // Fetch critical items for the bell notification
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company, cat, unit, stock_qty, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
        return;
      }

      const threshold = settings?.lowStockThreshold ?? 50;
      setCriticalItems(data.filter(i => i.stock_qty < threshold));
      setAllItems(data);
    };

    fetchItems();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          setAllItems(prev => {
            let updated;
            if (payload.eventType === 'INSERT') {
              updated = [payload.new, ...prev];
            } else if (payload.eventType === 'DELETE') {
              updated = prev.filter(i => i.id !== payload.old.id);
            } else {
              updated = prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i);
            }
            const newThreshold = settings?.lowStockThreshold ?? 50;
            setCriticalItems(updated.filter(i => i.stock_qty < newThreshold));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings?.lowStockThreshold]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setIsAlertsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-screen print:h-auto overflow-hidden bg-[#F4F7FE] dark:bg-[#0B1437] text-slate-800 flex font-readex transition-colors duration-300" dir="rtl">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out print:mr-0 print:block print:overflow-visible ${isSidebarOpen ? 'lg:mr-56' : 'mr-0'}`}
      >
        {/* Top Navbar - Transparent & Modern */}
        <header className="print:hidden w-full h-16 shrink-0 z-40 flex items-center justify-between px-6 lg:px-8 transition-all duration-300 pt-2">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-500 hover:text-primary dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          
          {/* Middle: Spacer */}
          <div className="flex-1"></div>
          
          <div className="flex items-center bg-white dark:bg-[#111C44] rounded-full p-2 shadow-sm border border-slate-100 dark:border-slate-800 gap-1 lg:gap-2">
            {/* Quick Actions Group */}
            <div className="flex items-center gap-1">
              {/* Audio Toggle */}
              <button 
                onClick={toggleMute}
                className="p-2 text-slate-400 hover:text-primary dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all group"
                title="كتم الصوت"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-primary dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all"
                title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={alertsRef}>
              <button 
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={`p-2 rounded-full transition-all relative ${isAlertsOpen ? 'bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <Bell size={18} />
                {criticalItems.length > 0 && (
                  <span className="absolute top-1 left-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-white text-[8px] font-black items-center justify-center border border-white dark:border-slate-950"></span>
                  </span>
                )}
              </button>

              {/* Alerts Dropdown */}
              <AnimatePresence>
                {isAlertsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-3 w-80 bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-850 shadow-2xl rounded-2xl overflow-hidden z-50 backdrop-blur-xl"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                      <span className="font-tajawal font-black text-sm text-slate-800 dark:text-white">التنبيهات</span>
                      <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] px-2.5 py-1 rounded-full font-black border border-rose-100 dark:border-rose-900/50 shadow-sm">
                        {criticalItems.length} تنبيه حرج
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {criticalItems.length > 0 ? (
                        criticalItems.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-start gap-3 group/alert">
                            <div className="mt-0.5 p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl group-hover/alert:bg-rose-100 dark:group-hover/alert:bg-rose-900/50 transition-colors">
                              <AlertOctagon size={16} className="text-rose-500 dark:text-rose-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-800 dark:text-white group-hover/alert:text-rose-600 dark:group-hover/alert:text-rose-400 transition-colors">{item.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                المخزون الحالي: <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 rounded">{item.stock_qty} {item.unit}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell size={24} className="text-slate-200 dark:text-slate-800" />
                          </div>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">لا توجد تنبيهات حالية</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all border border-transparent ${isProfileOpen ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#11047A] dark:bg-emerald-500 flex items-center justify-center text-white text-[14px] font-black shadow-sm transition-all">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-850 shadow-2xl rounded-xl overflow-hidden z-50 backdrop-blur-xl"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">المستخدم الحالي</p>
                      <p className="text-xs font-black truncate text-[#2B3674] dark:text-emerald-400">{currentUser?.email}</p>
                    </div>
                    <div className="p-1">
                      <button 
                        onClick={() => { navigate({ to: '/settings' }); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-350 font-bold hover:bg-slate-50 dark:hover:bg-slate-950/50 rounded-lg transition-colors"
                      >
                        <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-tajawal">إعدادات الحساب</span>
                      </button>
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        <span className="font-tajawal">تسجيل الخروج</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── System Freeze Banner ── */}
        {settings?.systemFrozen && (
          <div className="print:hidden shrink-0 flex items-center gap-3 px-6 py-2.5 bg-rose-600 text-white text-xs font-black z-30 shadow-lg shadow-rose-600/20">
            <AlertOctagon size={16} className="animate-pulse" />
            <span className="flex-1 font-tajawal">النظام مجمَّد — جميع عمليات الإدخال معطّلة حتى يتم إلغاء التجميد من صفحة الإعدادات</span>
            <button type="button" onClick={() => navigate({ to: '/settings' })} className="shrink-0 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors border border-white/20 font-tajawal">الإعدادات</button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-transparent p-4 sm:p-6 lg:px-8 lg:pb-8 print:p-0 overflow-hidden print:overflow-visible print:block">
          <div className="w-full flex-1 flex flex-col min-h-0 print:block">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
