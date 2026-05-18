import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getCsrfCookie } from '../lib/api';
import { useSettings } from './SettingsContext';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  async function login(email, password) {
    await getCsrfCookie();
    const { data } = await api.post('/login', {
      email,
      password,
    });

    sessionStorage.setItem('auth_token', 'active');
    setCurrentUser(normalizeUser(data.user));

    return data;
  }

  async function signup() {
    throw new Error('إنشاء الحسابات يتم حاليا من لوحة الإدارة.');
  }

  async function logout() {
    try {
      await api.post('/logout');
    } finally {
      sessionStorage.removeItem('auth_token');
      setCurrentUser(null);
    }
    window.location.href = '/';
  }

  useEffect(() => {
    let mounted = true;

    api.get('/user')
      .then(({ data }) => {
        if (!mounted) return;
        sessionStorage.setItem('auth_token', 'active');
        setCurrentUser(normalizeUser(data.user));
      })
      .catch(() => {
        if (!mounted) return;
        sessionStorage.removeItem('auth_token');
        setCurrentUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function normalizeUser(user) {
    const roles = user?.roles?.map((role) => role.name) || [];
    const directPermissions = user?.permissions?.map((permission) => permission.name) || [];
    const rolePermissions = user?.roles?.flatMap((role) => role.permissions?.map((permission) => permission.name) || []) || [];
    const permissions = [...new Set([...directPermissions, ...rolePermissions])];

    return {
      ...user,
      role: roles[0] || 'User',
      roles,
      permissions,
      username: user?.name || '',
      fullName: user?.name || '',
    };
  }

  const canAccess = (pageId) => {
    if (!currentUser) return false;
    if (currentUser.roles?.includes('مدير') || currentUser.role === 'Admin') return true;

    const pagePermissions = {
      dashboard: 'dashboard.view',
      items: 'products.view',
      'stock-in': 'vouchers.view',
      'stock-out': 'vouchers.view',
      returns: 'vouchers.view',
      'voucher-outward': 'vouchers.view',
      reps: 'users.manage',
      'receipt-vouchers': 'receipt-vouchers.view',
      inventory: 'products.view',
      'inbound-records': 'vouchers.view',
      'stock-card': 'vouchers.view',
      'price-list': 'products.view',
      'sales-analytics': 'dashboard.view',
      settings: 'users.manage',
    };

    const requiredPermission = pagePermissions[pageId];
    return requiredPermission ? currentUser.permissions?.includes(requiredPermission) : false;
  };

  const value = {
    currentUser,
    isAdmin: currentUser?.role === 'Admin' || currentUser?.email === 'ahmed_eslam288@yahoo.com',
    isViewer: currentUser?.role === 'Viewer' || settings?.systemFrozen,
    isStorekeeper: currentUser?.role === 'Storekeeper',
    login,
    signup,
    logout,
    canAccess,
    api,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
