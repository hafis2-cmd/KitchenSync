export type UserRole = 'manager' | 'waiter' | 'kitchen' | 'unassigned';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  status: 'active' | 'on-break' | 'off-duty' | 'pending_approval';
  assignedTables?: number[];
  requestedRole?: UserRole;
  joinedAt?: string;
}

export type MenuCategory = 'Appetizers' | 'Mains' | 'Desserts' | 'Beverages' | 'Specials';

export interface RecipeIngredient {
  ingredientName: string;
  qtyRequired: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description: string;
  isAvailable: boolean;
  ingredients: string[];
  recipeIngredients?: RecipeIngredient[];
  prepTimeMinutes: number;
  imageUrl?: string;
}

export type TableStatus = 'Empty' | 'Occupied' | 'Needs Cleaning' | 'Reserved';

export interface RestaurantTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  currentOrderId?: string;
  occupiedSince?: string;
  reservationName?: string;
  reservationTime?: string;
  customStatusNote?: string;
  positionX?: number;
  positionY?: number;
  shape?: 'square' | 'round' | 'rectangle';
}

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: OrderItemStatus;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'billed' | 'cancelled';

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  status: OrderStatus;
  items: OrderItem[];
  customerName?: string;
  guestCount: number;
  createdAt: string;
  preparingStartedAt?: string;
  totalAmount: number;
  kitchenNotes?: string;
}

export interface InventoryItem {
  id: string;
  ingredientName: string;
  stockQty: number;
  unit: 'kg' | 'grams' | 'liters' | 'pcs' | 'bottles' | 'packs';
  lowStockThreshold: number;
  costPerUnit: number;
  lastRestocked: string;
}

export interface AppNotification {
  id: string;
  recipientRole: UserRole | 'all';
  title: string;
  message: string;
  orderId?: string;
  tableNumber?: number;
  type: 'order_ready' | 'order_placed' | 'low_stock' | 'table_cleaning' | 'ai_alert' | 'urgent';
  isRead: boolean;
  createdAt: string;
}

export interface Bill {
  id: string;
  orderId: string;
  tableNumber: number;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'split';
  createdAt: string;
}

export interface StaffShift {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  shiftStart: string;
  shiftEnd: string;
  assignedTables: number[];
  notes?: string;
  status: 'scheduled' | 'active' | 'completed';
}

export interface ShiftHandoverNote {
  id: string;
  authorName: string;
  role: UserRole;
  note: string;
  timestamp: string;
  priority: 'normal' | 'urgent';
}

export interface SchedulingSuggestion {
  title: string;
  rationale: string;
  shiftName: string;
  recommendedWaiters: number;
}

export interface DemandForecast {
  timeSlot: string;
  expectedOrders: number;
  expectedRevenue: number;
  busyLevel: 'low' | 'medium' | 'high';
}

export interface InventoryRisk {
  ingredientName: string;
  hoursLeft: number;
  estimatedDepletion: string;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface BottleneckAlert {
  orderId: string;
  tableNumber: number;
  prepTimeMinutes: number;
  warningReason: string;
}

export interface AIInsights {
  schedulingSuggestions: SchedulingSuggestion[];
  demandForecast: DemandForecast[];
  inventoryRisk: InventoryRisk[];
  bottlenecks: BottleneckAlert[];
  operationalSummary: string;
}

export interface AIShiftRecommendation {
  shiftName: string;
  timeRange: string;
  predictedVolume: string;
  recommendedWaiters: number;
  recommendedChefs: number;
  rationale: string;
}

export interface AISchedulePlan {
  summary: string;
  recommendedShifts: AIShiftRecommendation[];
  laborCostEfficiencyScore: number;
  optimizationTips: string[];
}
