import {
  User,
  MenuItem,
  RestaurantTable,
  Order,
  InventoryItem,
  AppNotification,
  Bill,
  StaffShift,
  ShiftHandoverNote,
  AIInsights,
  AISchedulePlan,
  UserRole
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

// Redirect relative api fetches to base backend host in production/cross-origin mode
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return originalFetch(API_URL + input, init);
    }
    return originalFetch(input, init);
  };
}

export interface AppState {
  users: User[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  inventory: InventoryItem[];
  notifications: AppNotification[];
  bills: Bill[];
  shiftNotes: ShiftHandoverNote[];
  shifts: StaffShift[];
}

export async function fetchAppState(): Promise<AppState> {
  const res = await fetch('/api/store/state');
  if (!res.ok) throw new Error('Failed to fetch app state');
  return res.json();
}

export async function loginUser(email: string, password?: string, role?: UserRole): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Log in failed');
  return data.user;
}

export async function signupUser(payload: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  requestedRole?: UserRole;
}): Promise<User> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Sign up failed');
  return data.user;
}

export async function updateUserProfile(
  userId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    password?: string;
    newPassword?: string;
    role?: UserRole;
    status?: string;
    assignedTables?: number[];
  }
): Promise<User> {
  const res = await fetch(`/api/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update profile details');
  return data.user;
}

export async function updateUserRole(
  id: string,
  payload: {
    role?: UserRole;
    status?: string;
    assignedTables?: number[];
    name?: string;
    phone?: string;
  },
  currentUserRole: UserRole = 'manager'
): Promise<User> {
  const res = await fetch(`/api/users/${id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentUserRole,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update user role');
  return data.user;
}

export async function createStaffUser(
  payload: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    assignedTables?: number[];
  },
  currentUserRole: UserRole = 'manager'
): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentUserRole,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create staff member');
  return data.user;
}

export async function deleteStaffUser(id: string, currentUserRole: UserRole = 'manager'): Promise<void> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': currentUserRole,
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete staff member');
}

export async function addMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await res.json();
  return data.item;
}

export async function toggleMenuItemAvailability(id: string): Promise<MenuItem> {
  const res = await fetch(`/api/menu/${id}/toggle`, {
    method: 'PUT',
  });
  const data = await res.json();
  return data.item;
}

export async function updateTableStatus(
  id: string,
  status: string,
  assignedWaiterId?: string
): Promise<RestaurantTable> {
  const res = await fetch(`/api/tables/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, assignedWaiterId }),
  });
  const data = await res.json();
  return data.table;
}

export async function createOrder(orderPayload: {
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  guestCount: number;
  customerName?: string;
  kitchenNotes?: string;
  items: { menuItemId: string; menuItemName: string; quantity: number; unitPrice: number; notes?: string }[];
}): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  const data = await res.json();
  return data.order;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  return data.order;
}

export async function clearReadyOrders(): Promise<{ clearedCount: number }> {
  const res = await fetch('/api/orders/clear-ready', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to clear ready orders');
  return data;
}

export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  itemStatus: string
): Promise<{ order: Order; item: any }> {
  const res = await fetch(`/api/orders/${orderId}/items/${itemId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemStatus }),
  });
  return res.json();
}

export async function generateAndPayBill(
  orderId: string,
  discount = 0,
  paymentMethod = 'card'
): Promise<Bill> {
  const res = await fetch('/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, discount, paymentMethod }),
  });
  const data = await res.json();
  return data.bill;
}

export async function updateInventoryStock(id: string, stockQty: number): Promise<InventoryItem> {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockQty }),
  });
  const data = await res.json();
  return data.item;
}

export async function addShiftNote(
  authorName: string,
  role: UserRole,
  note: string,
  priority: 'normal' | 'urgent' = 'normal'
): Promise<ShiftHandoverNote> {
  const res = await fetch('/api/shift-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorName, role, note, priority }),
  });
  const data = await res.json();
  return data.note;
}

export async function markNotificationsRead(role: UserRole): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

export async function fetchAIInsights(): Promise<{ isFallback: boolean; insights: AIInsights }> {
  const res = await fetch('/api/ai/insights', {
    method: 'POST',
  });
  const data = await res.json();
  return { isFallback: data.isFallback, insights: data.insights };
}

export async function fetchAIScheduler(): Promise<{ isFallback: boolean; schedule: AISchedulePlan }> {
  const res = await fetch('/api/ai/scheduler', {
    method: 'POST',
  });
  const data = await res.json();
  return { isFallback: data.isFallback, schedule: data.schedule };
}

export async function updateTableCustomNote(id: string, note: string): Promise<RestaurantTable> {
  const res = await fetch(`/api/tables/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customStatusNote: note }),
  });
  const data = await res.json();
  return data.table;
}
