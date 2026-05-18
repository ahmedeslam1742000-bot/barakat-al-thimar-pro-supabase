import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';

export const DEFAULT_SETTINGS = {
  // ─── 1. Default Values
  orgEmoji:        '🌿',
  orgName:         'مؤسسة بركة الثمار',
  orgSubtitle:     'للتجارة والتوزيع الغذائي',
  orgContact:      '',
  defaultUnit:     'كرتونة',
  defaultBrand:    '',

  // ─── 2. System Freeze
  systemFrozen:    false,

  // ─── 3. Template Customizer
  voucherCustomAccent: '',       // '' = use per-kind default (#10b981 / #3b82f6)
  voucherFontSize:     'medium', // 'small' | 'medium' | 'large'

  // ─── 4. Smart Alerts
  lowStockThreshold: 50,

  // ─── 5. Print columns (from previous settings)
  voucherShowCompany:   true,
  voucherShowNotes:     true,

  // ─── 6. UI Toggles
  uiShowSignatureBox:   true,
  uiShowVoucherCode:    true,
  uiShowUnit:           true,

  // ─── 7. Export filename format
  filenameFormat: 'code_date', // 'code_date' | 'name_date' | 'date_code'

  // ─── 8. Meta (Performance + Backup)
  lastCleanupDate: null,
  lastBackupDate:  null,

  // ─── 9. Custom Dictionary (Overrides)
  labels: {
    voucherIn: 'سند إدخال',
    voucherOut: 'سند إخراج',
    stockIn: 'وارد',
    stockOut: 'صادر',
    returns: 'مرتجع',
  },
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("error fetching settings:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ─── Memoized to prevent re-renders in all consuming components ──────
  const updateSettings = useCallback(async (patch) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...patch };
      api.post('/settings', { settings: newSettings });
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await api.post('/settings', { settings: DEFAULT_SETTINGS });
  }, []);

  // ─── Memoize context value so Provider doesn't re-render consumers ───
  const contextValue = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside <SettingsProvider>');
  return ctx;
}
