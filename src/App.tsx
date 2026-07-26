import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { WaiterDashboard } from './components/waiter/WaiterDashboard';
import { KitchenDisplay } from './components/kitchen/KitchenDisplay';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { UnauthorizedAccess } from './components/UnauthorizedAccess';
import { PendingApprovalView } from './components/PendingApprovalView';
import { canUserAccessTab } from './lib/authPermissions';
import {
  User,
  UserRole,
  MenuItem,
  RestaurantTable,
  Order,
  InventoryItem,
  AppNotification,
  Bill,
  StaffShift,
  ShiftHandoverNote
} from './types';
import { fetchAppState, loginUser } from './lib/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'landing' | 'waiter' | 'kitchen' | 'manager'>('landing');

  // Saved accounts for 1-click account switching
  const [savedAccounts, setSavedAccounts] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('kitchensync_saved_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kitchensync_saved_accounts', JSON.stringify(savedAccounts));
    } catch (e) {
      console.error(e);
    }
  }, [savedAccounts]);

  // Application Realtime State Store
  const [users, setUsers] = useState<User[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [shiftNotes, setShiftNotes] = useState<ShiftHandoverNote[]>([]);

  // UI & SSE State
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenAuthModal = (mode: 'login' | 'signup' | any = 'login') => {
    const validMode = typeof mode === 'string' && mode === 'signup' ? 'signup' : 'login';
    setAuthModalInitialMode(validMode);
    setShowAuthModal(true);
  };

  const handleProfileUpdateSuccess = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Hotkeys Modal with Shift+? or Ctrl+/
      if ((e.key === '?' && e.shiftKey) || (e.key === '/' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Hotkey combinations
      if (e.ctrlKey || e.altKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'n') {
          e.preventDefault();
          setActiveTab('waiter');
        } else if (key === 'k') {
          e.preventDefault();
          setActiveTab('kitchen');
        } else if (key === 'w') {
          e.preventDefault();
          setActiveTab('waiter');
        } else if (key === 'm') {
          e.preventDefault();
          setActiveTab('manager');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // High-Contrast Dark Mode class toggle for kitchen visibility
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Audio Chime Synthesizer
  const playAlertChime = (type: 'order_placed' | 'order_ready') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'order_ready' ? 587.33 : 440, audioCtx.currentTime); // D5 or A4
      osc.frequency.exponentialRampToValueAtTime(type === 'order_ready' ? 880 : 659.25, audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  };

  // Initial State Fetch & SSE EventSource Subscription
  useEffect(() => {
    // Initial REST State Load & Login
    Promise.all([
      fetchAppState()
        .then((data) => {
          setUsers(data.users || []);
          setMenuItems(data.menuItems || []);
          setTables(data.tables || []);
          setOrders(data.orders || []);
          setInventory(data.inventory || []);
          setNotifications(data.notifications || []);
          setBills(data.bills || []);
          setShifts(data.shifts || []);
          setShiftNotes(data.shiftNotes || []);
        }),
      loginUser('waiter@kitchensync.com', 'waiter')
        .then((user) => {
          setCurrentUser(user);
          setCurrentRole('waiter');
        })
        .catch((e) => console.warn('Demo login failed:', e))
    ])
      .catch((err) => console.error('Failed initial REST load or login:', err))
      .finally(() => {
        // Aesthetic delay for smooth transition
        setTimeout(() => setIsLoading(false), 800);
      });

    // SSE EventSource for Real-Time Multi-Client Sync
    const API_URL = import.meta.env.VITE_API_URL || '';
    const eventSource = new EventSource(`${API_URL}/api/events/stream`);

    eventSource.onopen = () => {
      setIsLiveSynced(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.store) {
          if (data.store.users) setUsers(data.store.users);
          if (data.store.menuItems) setMenuItems(data.store.menuItems);
          if (data.store.tables) setTables(data.store.tables);
          if (data.store.orders) setOrders(data.store.orders);
          if (data.store.inventory) setInventory(data.store.inventory);
          if (data.store.notifications) setNotifications(data.store.notifications);
          if (data.store.bills) setBills(data.store.bills);
          if (data.store.shifts) setShifts(data.store.shifts);
          if (data.store.shiftNotes) setShiftNotes(data.store.shiftNotes);
        }

        if (data.type === 'order_created') {
          playAlertChime('order_placed');
        } else if (data.type === 'order_status_updated' && data.payload?.status === 'ready') {
          playAlertChime('order_ready');
        }
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsLiveSynced(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLoginSuccess = (user: User, role: UserRole) => {
    setCurrentUser(user);
    setCurrentRole(role);
    setSavedAccounts((prev) => {
      const exists = prev.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        return prev.map((u) => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase() ? user : u));
      }
      return [user, ...prev];
    });
    if (role === 'waiter') setActiveTab('waiter');
    else if (role === 'kitchen') setActiveTab('kitchen');
    else if (role === 'manager') setActiveTab('manager');
  };

  const handleSwitchAccount = (user: User) => {
    setCurrentUser(user);
    const targetRole = user.role && user.role !== 'unassigned' ? user.role : 'waiter';
    setCurrentRole(targetRole);
    if (targetRole === 'waiter') setActiveTab('waiter');
    else if (targetRole === 'kitchen') setActiveTab('kitchen');
    else if (targetRole === 'manager') setActiveTab('manager');
  };

  const handleRemoveSavedAccount = (userId: string) => {
    setSavedAccounts((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      const remaining = savedAccounts.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        handleSwitchAccount(remaining[0]);
      } else {
        handleLogout();
      }
    }
  };

  const handleSelectRoleFromLanding = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'waiter') setActiveTab('waiter');
    else if (role === 'kitchen') setActiveTab('kitchen');
    else if (role === 'manager') setActiveTab('manager');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    setActiveTab('landing');
  };

  const handleSwitchRole = (role: UserRole) => {
    // Strictly restrict role switching: non-managers cannot arbitrarily self-promote
    if (currentUser?.role === 'manager' || role === currentUser?.role) {
      setCurrentRole(role);
    }
  };

  const handleElevateToManager = () => {
    if (currentUser) {
      const updated = { ...currentUser, role: 'manager' as UserRole, status: 'active' as const };
      setCurrentUser(updated);
      setCurrentRole('manager');
    }
  };

  const handleReturnToAllowedView = () => {
    if (currentUser?.role === 'waiter') setActiveTab('waiter');
    else if (currentUser?.role === 'kitchen') setActiveTab('kitchen');
    else if (currentUser?.role === 'manager') setActiveTab('manager');
    else setActiveTab('landing');
  };

  const handleRefreshData = async () => {
    try {
      const data = await fetchAppState();
      if (data) {
        if (data.users) {
          setUsers(data.users);
          // Refresh active user object if status/role changed on server
          if (currentUser) {
            const freshUser = data.users.find((u) => u.id === currentUser.id);
            if (freshUser) {
              setCurrentUser(freshUser);
              if (freshUser.role && freshUser.role !== 'unassigned') {
                setCurrentRole(freshUser.role);
              }
            }
          }
        }
        if (data.menuItems) setMenuItems(data.menuItems);
        if (data.tables) setTables(data.tables);
        if (data.orders) setOrders(data.orders);
        if (data.inventory) setInventory(data.inventory);
        if (data.notifications) setNotifications(data.notifications);
        if (data.bills) setBills(data.bills);
        if (data.shifts) setShifts(data.shifts);
        if (data.shiftNotes) setShiftNotes(data.shiftNotes);
      }
    } catch (err) {
      console.error('Failed auto refresh:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="flex flex-col items-center z-10 text-center">
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full border-4 border-t-blue-500 border-r-blue-400/20 border-b-blue-400/20 border-l-blue-400/20 animate-spin" />
            <div className="absolute w-28 h-28 rounded-full border-2 border-t-purple-500/40 border-r-transparent border-b-purple-500/10 border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/5">
              <span className="text-3xl">🍳</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display mb-1 animate-pulse">
            KitchenSync
          </h1>
          <p className="text-xs tracking-[0.25em] text-blue-400 uppercase font-medium">
            AI Operations Hub
          </p>
          <div className="w-48 h-1 bg-gray-900 rounded-full mt-8 overflow-hidden border border-gray-800 relative">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-loading" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-[#F8F9FA] text-[#1A1A1A]'} flex flex-col font-sans selection:bg-blue-500 selection:text-white`}>
      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        isLiveSynced={isLiveSynced}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenAuth={handleOpenAuthModal}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onRefreshData={handleRefreshData}
        onOpenProfile={() => {
          setSelectedUserToEdit(null);
          setShowProfileModal(true);
        }}
        savedAccounts={savedAccounts}
        onSwitchAccount={handleSwitchAccount}
        onRemoveSavedAccount={handleRemoveSavedAccount}
      />

      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onSelectRole={handleSelectRoleFromLanding}
            onOpenAuth={() => handleOpenAuthModal('login')}
          />
        )}

        {activeTab === 'waiter' && (
          !canUserAccessTab(currentUser, 'waiter') ? (
            currentUser?.status === 'pending_approval' || currentUser?.role === 'unassigned' ? (
              <PendingApprovalView
                currentUser={currentUser}
                onRefreshUser={handleRefreshData}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            ) : (
              <UnauthorizedAccess
                targetTab="waiter"
                currentUser={currentUser}
                onReturnToAllowedView={handleReturnToAllowedView}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            )
          ) : (
            <WaiterDashboard
              currentUser={currentUser}
              tables={tables}
              menuItems={menuItems}
              orders={orders}
              bills={bills}
            />
          )
        )}

        {activeTab === 'kitchen' && (
          !canUserAccessTab(currentUser, 'kitchen') ? (
            currentUser?.status === 'pending_approval' || currentUser?.role === 'unassigned' ? (
              <PendingApprovalView
                currentUser={currentUser}
                onRefreshUser={handleRefreshData}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            ) : (
              <UnauthorizedAccess
                targetTab="kitchen"
                currentUser={currentUser}
                onReturnToAllowedView={handleReturnToAllowedView}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            )
          ) : (
            <KitchenDisplay
              currentUser={currentUser}
              orders={orders}
              shiftNotes={shiftNotes}
              inventory={inventory}
            />
          )
        )}

        {activeTab === 'manager' && (
          !canUserAccessTab(currentUser, 'manager') ? (
            currentUser?.status === 'pending_approval' || currentUser?.role === 'unassigned' ? (
              <PendingApprovalView
                currentUser={currentUser}
                onRefreshUser={handleRefreshData}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            ) : (
              <UnauthorizedAccess
                targetTab="manager"
                currentUser={currentUser}
                onReturnToAllowedView={handleReturnToAllowedView}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onElevateToManager={handleElevateToManager}
              />
            )
          ) : (
            <ManagerDashboard
              currentUser={currentUser}
              users={users}
              menuItems={menuItems}
              tables={tables}
              orders={orders}
              inventory={inventory}
              bills={bills}
              shifts={shifts}
              shiftNotes={shiftNotes}
              onEditUserProfile={(user) => {
                setSelectedUserToEdit(user);
                setShowProfileModal(true);
              }}
            />
          )
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalInitialMode}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {currentUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserToEdit(null);
          }}
          currentUser={currentUser}
          userToEdit={selectedUserToEdit}
          onUpdateSuccess={handleProfileUpdateSuccess}
        />
      )}

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
