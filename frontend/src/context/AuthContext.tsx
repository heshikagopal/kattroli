import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { authApi, demoApi, notificationsApi } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  login: (email: string, pass: string, remember_me?: boolean) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string, dept?: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string; reset_token?: string; reset_url?: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ message: string }>;
  refreshUser: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  runScenarioA: () => Promise<any>;
  runScenarioB: () => Promise<any>;
  runScenarioC: () => Promise<any>;
  runScenarioD: () => Promise<any>;
  runScenarioE: () => Promise<any>;
  runScenarioValidation: () => Promise<any>;
  runDemoQuizScenario: () => Promise<any>;
  runDemoCareerSwitchScenario: () => Promise<any>;
  resetDemoScenario: () => Promise<void>;
  notification: { type: 'success' | 'info' | 'warning' | 'error'; message: string } | null;
  showNotification: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const clearNotification = () => setNotification(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (_) {}
  };

  const markNotificationRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (_) {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const refreshUser = async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      await fetchNotifications();
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string, remember_me: boolean = true) => {
    await authApi.login(email, pass, remember_me);
    await refreshUser();
    showNotification('success', 'Welcome back!');
  };

  const register = async (email: string, pass: string, name: string, role?: string, dept?: string) => {
    await authApi.register(email, pass, name, role, dept);
    await refreshUser();
    showNotification('success', 'Account created successfully!');
  };

  const forgotPassword = async (email: string) => {
    const res = await authApi.forgotPassword(email);
    showNotification('info', res.message);
    return res;
  };

  const resetPassword = async (token: string, newPass: string) => {
    const res = await authApi.resetPassword(token, newPass);
    showNotification('success', res.message);
    return res;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setActiveTab('auth');
    showNotification('info', 'Logged out successfully');
  };

  const switchRole = async (role: string) => {
    try {
      const updatedUser = await authApi.switchRole(role);
      setUser(updatedUser);
      showNotification('success', `Switched active role to: ${role}`);
      if (role.includes('admin')) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
    } catch (e: any) {
      showNotification('error', `Role switch failed: ${e.message}`);
    }
  };

  const loginAsDemo = async () => {
    try {
      await authApi.login('alex@skillpilot.ai', 'password123');
      await refreshUser();
      setActiveTab('dashboard');
      showNotification('success', 'Demo account loaded: Alex Rivera (Student, Stanford Engineering)');
    } catch (e: any) {
      showNotification('error', `Failed demo login: ${e.message}`);
    }
  };

  const runScenarioA = async () => {
    try {
      showNotification('info', 'Assessment Agent & Path Planner running Low Score (<60%) Adaptation...');
      const res = await demoApi.runScenarioA();
      await refreshUser();
      showNotification('warning', 'Roadmap adapted to v2! Inserted JavaScript Refresher and delayed React.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario A failed: ${e.message}`);
    }
  };

  const runScenarioB = async () => {
    try {
      showNotification('info', 'Progress Evaluator verifying consecutive >90% Python mastery...');
      const res = await demoApi.runScenarioB();
      await refreshUser();
      showNotification('success', 'Mastery confirmed! Roadmap compressed and prerequisites validated.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario B failed: ${e.message}`);
    }
  };

  const runScenarioC = async () => {
    try {
      showNotification('info', 'Analyzing repeated struggle on Asynchronous Event Loops...');
      const res = await demoApi.runScenarioC();
      await refreshUser();
      showNotification('warning', 'Topic decomposed into 3 micro-modules; AI Mentor alert dispatched.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario C failed: ${e.message}`);
    }
  };

  const runScenarioD = async () => {
    try {
      showNotification('info', 'Career Matcher calculating transferable skills for Data Scientist...');
      const res = await demoApi.runScenarioD();
      await refreshUser();
      showNotification('success', 'Switched to Data Scientist! Reused Python and SQL foundations.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario D failed: ${e.message}`);
    }
  };

  const runScenarioE = async () => {
    try {
      showNotification('info', 'Simulating 7-day inactivity gap...');
      const res = await demoApi.runScenarioE();
      await refreshUser();
      showNotification('info', 'Inactivity detected: dispatched manageable 5-hr study schedule reminder.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario E failed: ${e.message}`);
    }
  };

  const runScenarioValidation = async () => {
    try {
      showNotification('info', 'Injecting skill calibration discrepancy (Self 4.0 vs Test 2.0)...');
      const res = await demoApi.runScenarioValidation();
      await refreshUser();
      showNotification('warning', 'Calibration discrepancy detected! Validation status flagged.');
      return res;
    } catch (e: any) {
      showNotification('error', `Scenario validation failed: ${e.message}`);
    }
  };

  const resetDemoScenario = async () => {
    try {
      await demoApi.reset();
      await refreshUser();
      setActiveTab('dashboard');
      showNotification('success', 'Platform reset to initial clean baseline state (Roadmap v1 active).');
    } catch (e: any) {
      showNotification('error', `Reset failed: ${e.message}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeTab,
        setActiveTab,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        loginAsDemo,
        switchRole,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        runScenarioA,
        runScenarioB,
        runScenarioC,
        runScenarioD,
        runScenarioE,
        runScenarioValidation,
        runDemoQuizScenario: runScenarioA,
        runDemoCareerSwitchScenario: runScenarioD,
        resetDemoScenario,
        notification,
        showNotification,
        clearNotification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
