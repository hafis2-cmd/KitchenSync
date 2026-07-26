import { User, UserRole } from '../types';

/**
 * Strict Role Capabilities & Access Control Policy
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  manager: 3,
  kitchen: 2,
  waiter: 1,
  unassigned: 0,
};

export const ROLE_LABELS: Record<UserRole, { label: string; icon: string; badgeColor: string }> = {
  manager: {
    label: 'Restaurant Manager',
    icon: '👑',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
  },
  waiter: {
    label: 'Waitstaff',
    icon: '🍽️',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
  },
  kitchen: {
    label: 'Kitchen Chef',
    icon: '🍳',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
  },
  unassigned: {
    label: 'Pending Role Assignment',
    icon: '⏳',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
  },
};

/**
 * Checks if a user has permission to access a specific system module tab.
 */
export function canUserAccessTab(
  user: User | null,
  targetTab: 'landing' | 'waiter' | 'kitchen' | 'manager'
): boolean {
  if (targetTab === 'landing') return true;
  if (!user) return false;

  // Pending approval accounts cannot access staff tabs until manager assigns role
  if (user.status === 'pending_approval' || user.role === 'unassigned') {
    return false;
  }

  // Restaurant Managers have administrative access to all views
  if (user.role === 'manager') return true;

  // Waitstaff view: Accessible by waiter
  if (targetTab === 'waiter') {
    return user.role === 'waiter';
  }

  // Kitchen Display: Accessible by kitchen chef
  if (targetTab === 'kitchen') {
    return user.role === 'kitchen';
  }

  // Manager Dashboard: Strictly restricted to manager
  return false;
}

/**
 * Validates Manager Master PIN for privilege elevation
 */
export const MANAGER_PIN = '1234';

export function verifyManagerPin(pin: string): boolean {
  return pin.trim() === MANAGER_PIN;
}
