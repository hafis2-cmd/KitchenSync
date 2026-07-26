import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  LayoutDashboard,
  LayoutGrid,
  Bell,
  Volume2,
  VolumeX,
  UserCheck,
  RefreshCw,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  User as UserIcon,
  Settings,
  UserPlus,
  Plus,
  Trash2,
  Check,
  Users
} from 'lucide-react';
import { User, AppNotification, UserRole } from '../types';
import { markNotificationsRead } from '../lib/api';
import { canUserAccessTab, ROLE_LABELS } from '../lib/authPermissions';

interface NavbarProps {
  currentUser: User | null;
  currentRole: UserRole | null;
  activeTab: 'landing' | 'waiter' | 'kitchen' | 'manager';
  setActiveTab: (tab: 'landing' | 'waiter' | 'kitchen' | 'manager') => void;
  notifications: AppNotification[];
  isLiveSynced: boolean;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode?: boolean;
  setIsDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onRefreshData?: () => Promise<void> | void;
  onOpenProfile?: () => void;
  savedAccounts?: User[];
  onSwitchAccount?: (user: User) => void;
  onRemoveSavedAccount?: (userId: string) => void;
}

const REFRESH_CYCLE = 15; // 15 seconds auto-refresh interval

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  activeTab,
  setActiveTab,
  notifications,
  isLiveSynced,
  soundEnabled,
  setSoundEnabled,
  isDarkMode = false,
  setIsDarkMode,
  onOpenAuth,
  onLogout,
  onSwitchRole,
  onRefreshData,
  onOpenProfile,
  savedAccounts = [],
  onSwitchAccount,
  onRemoveSavedAccount,
}) => {
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_CYCLE);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    setSecondsLeft(REFRESH_CYCLE);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return REFRESH_CYCLE;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRefreshData]);

  const relevantNotifs = notifications.filter(
    (n) => currentRole === 'manager' || n.recipientRole === currentRole || n.recipientRole === 'all'
  );

  const unreadCount = relevantNotifs.filter((n) => !n.isRead).length;

  const handleMarkRead = async () => {
    if (currentRole) {
      await markNotificationsRead(currentRole);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div id="navbar-brand-logo" className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => setActiveTab('landing')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30 group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">KitchenSync</span>
              <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 -mt-0.5 hidden sm:block font-medium">Unified Staff Operations Hub</p>
          </div>
        </div>

        {/* Center Segmented Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-gray-100/90 dark:bg-gray-800/90 p-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <button
            id="navbar-tab-overview"
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'landing'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            id="navbar-tab-waiter"
            onClick={() => setActiveTab('waiter')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'waiter'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Waitstaff</span>
          </button>

          <button
            id="navbar-tab-kitchen"
            onClick={() => setActiveTab('kitchen')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'kitchen'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Display</span>
          </button>

          <button
            id="navbar-tab-manager"
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'manager'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-bold'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Manager Hub</span>
          </button>
        </nav>

        {/* Right Tools & Account Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Sync Status Pill */}
          <button
            id="navbar-sync-btn"
            onClick={() => triggerRefresh()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-xs font-mono font-medium shadow-2xs"
            title="Click to force immediate API refresh"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-bold">
              {isRefreshing ? 'Syncing...' : `${secondsLeft}s`}
            </span>
          </button>

          {/* Quick Action Buttons Group */}
          <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            {/* Theme Toggle */}
            {setIsDarkMode && (
              <button
                id="navbar-theme-btn"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isDarkMode
                    ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80 shadow-2xs'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to High-Contrast Kitchen Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Audio Chime Toggle */}
            <button
              id="navbar-audio-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                soundEnabled
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80'
              }`}
              title={soundEnabled ? 'Order sound alerts enabled' : 'Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notifications Bell Drawer Button */}
            <div className="relative">
              <button
                id="navbar-notif-btn"
                onClick={() => {
                  setShowNotifDrawer(!showNotifDrawer);
                  if (unreadCount > 0) handleMarkRead();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center relative bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden text-gray-800 dark:text-gray-200">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Live Activity Stream
                    </span>
                    <button
                      onClick={() => handleMarkRead()}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      Clear badges
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {relevantNotifs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">No active alerts right now.</div>
                    ) : (
                      relevantNotifs.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs flex gap-2.5 items-start ${
                            !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                          }`}
                        >
                          {n.type === 'order_ready' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                          {n.type === 'low_stock' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                          {n.type === 'table_cleaning' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                          {n.type === 'order_placed' && <ChefHat className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">{n.title}</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Account / Role Badge */}
          {currentUser ? (
            <div className="relative">
              <button
                id="navbar-profile-toggle"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-left shadow-2xs"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-blue-500/30 dark:ring-blue-400/40"
                />
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[110px]">{currentUser.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {currentUser.role || 'Unassigned'}
                  </p>
                </div>
              </button>

              {/* Account & Role Details Dropdown */}
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-2.5 z-50 text-gray-800 dark:text-gray-100">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Authorized Role</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {currentUser.role?.toUpperCase() || 'UNASSIGNED'}
                      </span>
                    </div>

                    <button
                      id="navbar-edit-profile-btn"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full mt-2.5 py-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/80 transition-all shadow-2xs"
                    >
                      <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Edit Profile Details
                    </button>
                  </div>

                  <p className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {currentUser.role === 'manager' ? 'Switch Operational View' : 'Workspace Navigation'}
                  </p>

                  <button
                    id="navbar-switch-waiter-btn"
                    onClick={() => {
                      setActiveTab('waiter');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      activeTab === 'waiter' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5" /> Waitstaff
                    </span>
                    {!canUserAccessTab(currentUser, 'waiter') && (
                      <Lock className="w-3 h-3 text-amber-500" />
                    )}
                  </button>

                  <button
                    id="navbar-switch-kitchen-btn"
                    onClick={() => {
                      setActiveTab('kitchen');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      activeTab === 'kitchen' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ChefHat className="w-3.5 h-3.5" /> Kitchen Display
                    </span>
                    {!canUserAccessTab(currentUser, 'kitchen') && (
                      <Lock className="w-3 h-3 text-amber-500" />
                    )}
                  </button>

                  <button
                    id="navbar-switch-manager-btn"
                    onClick={() => {
                      setActiveTab('manager');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      activeTab === 'manager' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Manager Hub
                    </span>
                    {!canUserAccessTab(currentUser, 'manager') && (
                      <Lock className="w-3 h-3 text-amber-500" />
                    )}
                  </button>

                  {/* Signed-in Accounts / Switcher Section */}
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1.5 pt-1.5">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Staff Directory</span>
                      <span className="text-[9px] font-normal text-blue-600 dark:text-blue-400">1-Click Switch</span>
                    </p>

                    {savedAccounts.length > 0 && (
                      <div className="space-y-1 my-1 max-h-36 overflow-y-auto pr-0.5">
                        {savedAccounts.map((acc) => {
                          const isCurrent = currentUser?.id === acc.id || currentUser?.email?.toLowerCase() === acc.email?.toLowerCase();
                          return (
                            <div
                              key={acc.id}
                              className={`flex items-center justify-between p-1.5 rounded-xl transition-all text-xs ${
                                isCurrent
                                  ? 'bg-blue-50/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-transparent'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setShowRoleDropdown(false);
                                  if (onSwitchAccount) onSwitchAccount(acc);
                                }}
                                className="flex-1 flex items-center gap-2 text-left min-w-0"
                              >
                                <img
                                  src={acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                                  alt={acc.name}
                                  className="w-6 h-6 rounded-md object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate">{acc.name}</p>
                                  <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-semibold">{acc.role || 'waiter'}</p>
                                </div>
                                {isCurrent && (
                                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mr-1" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add / Sign in New Account Button */}
                    <button
                      id="navbar-add-account-btn"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onOpenAuth('signup');
                      }}
                      className="w-full mt-1.5 py-2 px-3 rounded-xl bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/80 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      + Add / Sign in New Account
                    </button>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 my-1.5 pt-1.5">
                    <button
                      id="navbar-signout-btn"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 divide-x divide-gray-200 dark:divide-gray-800">
        <button
          onClick={() => setActiveTab('waiter')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1 ${
            activeTab === 'waiter' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Waitstaff
        </button>
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1 ${
            activeTab === 'kitchen' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" /> Kitchen
        </button>
        <button
          onClick={() => setActiveTab('manager')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1 ${
            activeTab === 'manager' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Manager
        </button>
      </div>

    </header>
  );
};
