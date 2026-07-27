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
import { X } from 'lucide-react';
import {
  fetchAppState,
  loginUser,
  updateTableStatus,
  createOrder,
  addShiftNote,
  updateInventoryStock,
  generateAndPayBill,
  createStaffUser,
  resetAppState
} from './lib/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'landing' | 'waiter' | 'kitchen' | 'manager'>('landing');
  const [showDemoSandbox, setShowDemoSandbox] = useState(false);
  const [sandboxActionLoading, setSandboxActionLoading] = useState<string | null>(null);

  // --- DEMO SANDBOX ACTIONS ---
  const handleSimulateSeating = async () => {
    setSandboxActionLoading('seating');
    try {
      const availableTable = tables.find((t) => t.status === 'Empty' || t.status === 'Reserved');
      if (availableTable) {
        await updateTableStatus(availableTable.id, 'Occupied', currentUser?.id || 'u-wait-1');
      } else {
        alert('All tables are occupied! Reset sandbox or clear/pay tables to free space.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateTableCall = async () => {
    setSandboxActionLoading('call');
    try {
      const occupiedTable = tables.find((t) => t.status === 'Occupied');
      if (occupiedTable) {
        await updateTableStatus(occupiedTable.id, 'Needs Cleaning', currentUser?.id);
      } else {
        alert('No occupied tables available. Seat a table first to trigger a cleaning call!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateOrder = async () => {
    setSandboxActionLoading('order');
    try {
      const occupiedTable = tables.find((t) => t.status === 'Occupied');
      if (occupiedTable) {
        const burger = menuItems.find((m) => m.name.includes('Burger')) || menuItems[0];
        const drink = menuItems.find((m) => m.category === 'Beverages') || menuItems[menuItems.length - 1];
        
        await createOrder({
          tableId: occupiedTable.id,
          tableNumber: occupiedTable.tableNumber,
          waiterId: currentUser?.id || 'u-wait-1',
          waiterName: currentUser?.name || 'Marco Silva',
          guestCount: 2,
          customerName: 'Demo Guest',
          kitchenNotes: 'Simulator Generated: Prioritize preparation.',
          items: [
            { menuItemId: burger.id, menuItemName: burger.name, quantity: 1, unitPrice: burger.price, notes: 'Medium rare' },
            { menuItemId: drink.id, menuItemName: drink.name, quantity: 2, unitPrice: drink.price }
          ]
        });
      } else {
        alert('No occupied tables to place orders for. Seat a table first!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateKitchenNote = async () => {
    setSandboxActionLoading('note');
    try {
      await addShiftNote(
        currentUser?.name || 'Chef Gordon',
        'kitchen',
        `Live Simulation Event: Urgent check on raw ingredients. ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        'urgent'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateLowStock = async () => {
    setSandboxActionLoading('stock');
    try {
      const oil = inventory.find((i) => i.ingredientName.includes('Truffle')) || inventory[0];
      if (oil) {
        await updateInventoryStock(oil.id, oil.lowStockThreshold - 0.5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulatePayment = async () => {
    setSandboxActionLoading('payment');
    try {
      const activeOrder = orders.find((o) => o.status === 'preparing' || o.status === 'ready' || o.status === 'pending');
      if (activeOrder) {
        await generateAndPayBill(activeOrder.id, 0, 'card');
      } else {
        alert('No active table order is currently preparing or ready to pay!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulatePendingStaff = async () => {
    setSandboxActionLoading('staff');
    try {
      const randomId = Math.floor(100 + Math.random() * 900);
      await createStaffUser({
        name: `Candidate #${randomId}`,
        email: `candidate${randomId}@kitchensync.com`,
        role: 'unassigned',
        phone: '+1 (555) 000-1111',
        assignedTables: [9]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateDinnerRush = async () => {
    setSandboxActionLoading('dinner_rush');
    try {
      const emptyTables = tables.filter((t) => t.status === 'Empty' || t.status === 'Reserved').slice(0, 3);
      if (emptyTables.length === 0) {
        alert('All tables are currently active or occupied. Please reset the sandbox first!');
        return;
      }

      const burger = menuItems.find((m) => m.name.includes('Burger')) || menuItems[0];
      const fries = menuItems.find((m) => m.name.includes('Fries')) || menuItems[1];
      const drink = menuItems.find((m) => m.category === 'Beverages') || menuItems[menuItems.length - 1];

      for (let i = 0; i < emptyTables.length; i++) {
        const table = emptyTables[i];
        await updateTableStatus(table.id, 'Occupied', currentUser?.id || 'u-wait-1');
        
        await createOrder({
          tableId: table.id,
          tableNumber: table.tableNumber,
          waiterId: currentUser?.id || 'u-wait-1',
          waiterName: currentUser?.name || 'Marco Silva',
          guestCount: 2 + i,
          customerName: `Dinner Party #${table.tableNumber}`,
          kitchenNotes: `Dinner rush simulated order for Table ${table.tableNumber}.`,
          items: [
            { menuItemId: burger.id, menuItemName: burger.name, quantity: i + 1, unitPrice: burger.price, notes: i === 0 ? 'Medium rare' : '' },
            { menuItemId: fries.id, menuItemName: fries.name, quantity: 1, unitPrice: fries.price },
            { menuItemId: drink.id, menuItemName: drink.name, quantity: i + 1, unitPrice: drink.price }
          ]
        });
      }

      const truffleOil = inventory.find((i) => i.ingredientName.includes('Truffle')) || inventory[0];
      if (truffleOil) {
        await updateInventoryStock(truffleOil.id, truffleOil.lowStockThreshold - 0.5);
      }

      alert('Dinner rush simulation complete! Multiple tables seated, orders submitted, and stock alerts triggered.');
    } catch (e) {
      console.error(e);
      alert('Failed to simulate dinner rush');
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateAllergyIncident = async () => {
    setSandboxActionLoading('allergy_incident');
    try {
      let table = tables.find((t) => t.status === 'Occupied');
      if (!table) {
        table = tables.find((t) => t.status === 'Empty' || t.status === 'Reserved');
        if (table) {
          await updateTableStatus(table.id, 'Occupied', currentUser?.id || 'u-wait-1');
        } else {
          alert('No tables available to simulate allergy incident. Reset the sandbox or clear tables first!');
          return;
        }
      }

      const fries = menuItems.find((m) => m.name.includes('Fries')) || menuItems[0];
      const salmon = menuItems.find((m) => m.category === 'Mains' && m.name.includes('Salmon')) || menuItems[menuItems.length - 1];

      await createOrder({
        tableId: table.id,
        tableNumber: table.tableNumber,
        waiterId: currentUser?.id || 'u-wait-1',
        waiterName: currentUser?.name || 'Marco Silva',
        guestCount: 2,
        customerName: 'Allergy Incident Table',
        kitchenNotes: '⚠️ SEVERE PEANUT & GLUTEN ALLERGY. Crucial: Clean grill/fryer before preparing this ticket.',
        items: [
          { menuItemId: fries.id, menuItemName: fries.name, quantity: 1, unitPrice: fries.price, notes: 'ALLERGY TICKET - GLUTEN FREE' },
          { menuItemId: salmon.id, menuItemName: salmon.name, quantity: 1, unitPrice: salmon.price, notes: 'No dressing, separate prep area' }
        ]
      });

      await addShiftNote(
        currentUser?.name || 'Chef Gordon',
        'kitchen',
        `ALLERGY ALERT: Table ${table.tableNumber} has severe peanut/gluten allergies. Double check prep lines immediately.`,
        'urgent'
      );

      alert(`Allergy incident simulated at Table ${table.tableNumber}. Order created with warnings and urgent kitchen note posted.`);
    } catch (e) {
      console.error(e);
      alert('Failed to simulate allergy incident');
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleSimulateStaffingCrisis = async () => {
    setSandboxActionLoading('staffing_crisis');
    try {
      const randomId1 = Math.floor(100 + Math.random() * 400);
      const randomId2 = Math.floor(500 + Math.random() * 400);

      await createStaffUser({
        name: `Candidate #${randomId1} (Chef)`,
        email: `chef_candidate${randomId1}@kitchensync.com`,
        role: 'unassigned',
        phone: '+1 (555) 111-2222',
        assignedTables: []
      });

      await createStaffUser({
        name: `Candidate #${randomId2} (Server)`,
        email: `server_candidate${randomId2}@kitchensync.com`,
        role: 'unassigned',
        phone: '+1 (555) 222-3333',
        assignedTables: []
      });

      const salmon = inventory.find((i) => i.ingredientName.includes('Salmon')) || inventory[0];
      const mozzarella = inventory.find((i) => i.ingredientName.includes('Mozzarella')) || inventory[1];

      if (salmon) {
        await updateInventoryStock(salmon.id, salmon.lowStockThreshold - 1);
      }
      if (mozzarella) {
        await updateInventoryStock(mozzarella.id, mozzarella.lowStockThreshold - 0.5);
      }

      await addShiftNote(
        currentUser?.name || 'Elena Rostova',
        'manager',
        'STAFFING CRISIS: Waiter shift shortages for evening service. 2 servers called in sick. Queue times may increase.',
        'urgent'
      );

      alert('Staffing crisis simulated! Pending applications added, multiple ingredients dropped to low stock, and manager shift note posted.');
    } catch (e) {
      console.error(e);
      alert('Failed to simulate staffing crisis');
    } finally {
      setSandboxActionLoading(null);
    }
  };

  const handleResetSandbox = async () => {
    if (!confirm('Are you sure you want to reset all active tables, orders, stock alerts, and bills to baseline defaults?')) return;
    setSandboxActionLoading('reset');
    try {
      await resetAppState();
      const data = await fetchAppState();
      setUsers(data.users || []);
      setMenuItems(data.menuItems || []);
      setTables(data.tables || []);
      setOrders(data.orders || []);
      setInventory(data.inventory || []);
      setNotifications(data.notifications || []);
      setBills(data.bills || []);
      setShifts(data.shifts || []);
      setShiftNotes(data.shiftNotes || []);
      alert('Sandbox reset successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to reset sandbox');
    } finally {
      setSandboxActionLoading(null);
    }
  };

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
    if (!currentUser || currentUser.role !== role) {
      const defaultUser = users.find((u) => u.role === role);
      if (defaultUser) {
        setCurrentUser(defaultUser);
      }
    }
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
        savedAccounts={users}
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
        allUsers={users}
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

      {/* Floating Demo Sandbox Toggle Button */}
      <button
        onClick={() => setShowDemoSandbox(!showDemoSandbox)}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-50 p-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-4 ring-white dark:ring-gray-900 shadow-orange-500/20 cursor-pointer"
        title="Open Interactive Demo Sandbox"
      >
        <span className="text-lg">⚡</span>
        <span className="text-xs uppercase tracking-wider font-sans font-black hidden md:inline">Demo Sandbox</span>
      </button>

      {/* Demo Sandbox Slider Drawer */}
      {showDemoSandbox && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col justify-between h-full text-gray-900 dark:text-gray-100 overflow-hidden animate-slideLeft">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⚡</span> KitchenSync Sandbox
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Trigger mock actions to test dashboards & mobile viewports</p>
              </div>
              <button
                onClick={() => setShowDemoSandbox(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              
              {/* Group 0: Scenario Presets */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">🔥 Multi-Role Scenario Presets</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateDinnerRush}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 dark:from-rose-950/20 dark:to-orange-950/20 dark:hover:from-rose-950/30 dark:hover:to-orange-950/30 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold space-y-1 transition-all shadow-xs cursor-pointer"
                  >
                    <p className="text-rose-900 dark:text-rose-200 font-bold flex items-center gap-1.5">
                      <span>⚡</span> Dinner Rush Chaos
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">Seats 3 tables with complex food orders & triggers a Truffle Oil low-stock alert.</p>
                  </button>

                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateAllergyIncident}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-amber-50 to-red-50 hover:from-amber-100 hover:to-red-100 dark:from-amber-950/20 dark:to-red-950/20 dark:hover:from-amber-950/30 dark:hover:to-red-950/30 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold space-y-1 transition-all shadow-xs cursor-pointer"
                  >
                    <p className="text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1.5">
                      <span>⚠️</span> Severe Allergy Incident
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">Places an order with prominent allergen warnings & posts an urgent kitchen shift note.</p>
                  </button>

                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateStaffingCrisis}
                    className="p-3 text-left rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 dark:from-purple-950/20 dark:to-indigo-950/20 dark:hover:from-purple-950/30 dark:hover:to-indigo-950/30 border border-purple-200 dark:border-purple-900/60 text-xs font-semibold space-y-1 transition-all shadow-xs cursor-pointer"
                  >
                    <p className="text-purple-900 dark:text-purple-200 font-bold flex items-center gap-1.5">
                      <span>🚨</span> Staffing Crisis & Stock Decay
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">Generates pending staff applications, drains Salmon/Mozzarella stock, and alerts shift.</p>
                  </button>
                </div>
              </div>

              {/* Group 1: Waitstaff */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-600">1. Waitstaff Simulation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateSeating}
                    className="p-3 text-left rounded-xl bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/40 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <p className="text-gray-900 dark:text-white font-bold">Seat Random Table</p>
                    <p className="text-[9px] text-gray-500 font-normal">Sets a table to 'Occupied'</p>
                  </button>

                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateTableCall}
                    className="p-3 text-left rounded-xl bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/40 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <p className="text-gray-900 dark:text-white font-bold">Simulate Cleaning Call</p>
                    <p className="text-[9px] text-gray-500 font-normal">Table set to 'Needs Cleaning'</p>
                  </button>
                </div>
              </div>

              {/* Group 2: Kitchen */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-purple-600">2. Kitchen Display (KDS) Simulation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateOrder}
                    className="p-3 text-left rounded-xl bg-gray-50 hover:bg-purple-50 dark:bg-gray-800/40 dark:hover:bg-purple-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <p className="text-gray-900 dark:text-white font-bold">Submit Mock Order</p>
                    <p className="text-[9px] text-gray-500 font-normal">Sends random items to KDS</p>
                  </button>

                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulateKitchenNote}
                    className="p-3 text-left rounded-xl bg-gray-50 hover:bg-purple-50 dark:bg-gray-800/40 dark:hover:bg-purple-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <p className="text-gray-900 dark:text-white font-bold">Post Urgent Note</p>
                    <p className="text-[9px] text-gray-500 font-normal">Sends urgent chef note to KDS</p>
                  </button>
                </div>
              </div>

              {/* Group 3: Manager */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-600">3. Manager Command Simulation</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={Boolean(sandboxActionLoading)}
                      onClick={handleSimulateLowStock}
                      className="p-3 text-left rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/40 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <p className="text-gray-900 dark:text-white font-bold">Trigger Stock Alert</p>
                      <p className="text-[9px] text-gray-500 font-normal">Wipes Truffle Oil stock level</p>
                    </button>

                    <button
                      disabled={Boolean(sandboxActionLoading)}
                      onClick={handleSimulatePayment}
                      className="p-3 text-left rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/40 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <p className="text-gray-900 dark:text-white font-bold">Add Demo Bill Sale</p>
                      <p className="text-[9px] text-gray-500 font-normal">Paid order spikes revenue charts</p>
                    </button>
                  </div>

                  <button
                    disabled={Boolean(sandboxActionLoading)}
                    onClick={handleSimulatePendingStaff}
                    className="p-3 text-left rounded-xl bg-gray-50 hover:bg-emerald-50 dark:bg-gray-800/40 dark:hover:bg-emerald-950/20 border border-gray-200 dark:border-gray-800 text-xs font-semibold space-y-1 transition-colors disabled:opacity-50 w-full cursor-pointer"
                  >
                    <p className="text-gray-900 dark:text-white font-bold">Add Pending Staff Application</p>
                    <p className="text-[9px] text-gray-500 font-normal">Creates a staff sign-up awaiting approval badge</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Footer Button */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <button
                disabled={Boolean(sandboxActionLoading)}
                onClick={handleResetSandbox}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span>🔄</span>
                <span>{sandboxActionLoading === 'reset' ? 'Resetting Store...' : 'Reset Sandbox to Clean Defaults'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
