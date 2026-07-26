import {
  User,
  MenuItem,
  RestaurantTable,
  Order,
  InventoryItem,
  AppNotification,
  Bill,
  StaffShift,
  ShiftHandoverNote
} from '../types.js';

export class RestaurantStore {
  users: User[] = [
    {
      id: 'u-mgr-1',
      name: 'Alex Rivera',
      email: 'manager@kitchensync.com',
      password: 'password123',
      role: 'manager',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: 'active',
      assignedTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      id: 'u-wait-1',
      name: 'Marco Silva',
      email: 'waiter@kitchensync.com',
      password: 'password123',
      role: 'waiter',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      status: 'active',
      assignedTables: [1, 2, 3, 4]
    },
    {
      id: 'u-wait-2',
      name: 'Elena Rostova',
      email: 'elena@kitchensync.com',
      password: 'password123',
      role: 'waiter',
      phone: '+1 (555) 456-7890',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      status: 'active',
      assignedTables: [5, 6, 7, 8]
    },
    {
      id: 'u-kit-1',
      name: 'Chef Gordon',
      email: 'kitchen@kitchensync.com',
      password: 'password123',
      role: 'kitchen',
      phone: '+1 (555) 567-8901',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200',
      status: 'active',
      assignedTables: []
    }
  ];

  menuItems: MenuItem[] = [
    {
      id: 'm-1',
      name: 'Truffle Parmesan Fries',
      price: 14,
      category: 'Appetizers',
      description: 'Hand-cut russet potatoes, white truffle oil, grated Parmigiano-Reggiano, fresh herbs.',
      isAvailable: true,
      ingredients: ['French Fries', 'Truffle Oil', 'Parmesan Cheese'],
      recipeIngredients: [
        { ingredientName: 'French Fries', qtyRequired: 1, unit: 'kg' },
        { ingredientName: 'Truffle Oil', qtyRequired: 1, unit: 'liters' },
        { ingredientName: 'Parmesan Cheese', qtyRequired: 1, unit: 'kg' }
      ],
      prepTimeMinutes: 10,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-2',
      name: 'Crispy Calamari Rings',
      price: 18,
      category: 'Appetizers',
      description: 'Wild-caught squid, light tempura batter, roasted garlic aioli and lemon zest.',
      isAvailable: true,
      ingredients: ['Calamari', 'Garlic Aioli', 'Lemon'],
      recipeIngredients: [
        { ingredientName: 'Calamari', qtyRequired: 1, unit: 'kg' },
        { ingredientName: 'Garlic Aioli', qtyRequired: 1, unit: 'kg' }
      ],
      prepTimeMinutes: 12,
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-3',
      name: 'Wagyu Beef Burger',
      price: 26,
      category: 'Mains',
      description: '8oz American Wagyu patty, aged cheddar, caramelized onions, brioche bun.',
      isAvailable: true,
      ingredients: ['Wagyu Beef Patties', 'Brioche Buns', 'Aged Cheddar'],
      recipeIngredients: [
        { ingredientName: 'Wagyu Beef Patties', qtyRequired: 1, unit: 'pcs' },
        { ingredientName: 'Brioche Buns', qtyRequired: 1, unit: 'pcs' },
        { ingredientName: 'Aged Cheddar', qtyRequired: 1, unit: 'pcs' }
      ],
      prepTimeMinutes: 18,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-4',
      name: 'Wood-Fired Margherita Pizza',
      price: 21,
      category: 'Mains',
      description: 'San Marzano tomato sauce, fresh mozzarella di bufala, torn basil, extra virgin olive oil.',
      isAvailable: true,
      ingredients: ['Fresh Mozzarella', 'Fresh Basil', 'Pizza Dough'],
      recipeIngredients: [
        { ingredientName: 'Fresh Mozzarella', qtyRequired: 1, unit: 'kg' },
        { ingredientName: 'Fresh Basil', qtyRequired: 1, unit: 'pcs' },
        { ingredientName: 'Pizza Dough', qtyRequired: 1, unit: 'pcs' }
      ],
      prepTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-5',
      name: 'Pan-Seared Atlantic Salmon',
      price: 32,
      category: 'Mains',
      description: 'Wild Atlantic salmon fillet, lemon-butter reduction, asparagus risotto.',
      isAvailable: true,
      ingredients: ['Salmon Fillets', 'Heavy Cream', 'Asparagus'],
      recipeIngredients: [
        { ingredientName: 'Salmon Fillets', qtyRequired: 1, unit: 'pcs' },
        { ingredientName: 'Fresh Mozzarella', qtyRequired: 0.2, unit: 'kg' }
      ],
      prepTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-6',
      name: 'Creamy Wild Mushroom Fettuccine',
      price: 24,
      category: 'Mains',
      description: 'House-made fettuccine pasta, chanterelle & cremini mushrooms, garlic cream, truffle butter.',
      isAvailable: true,
      ingredients: ['Fettuccine Pasta', 'Heavy Cream', 'Truffle Oil'],
      recipeIngredients: [
        { ingredientName: 'Fettuccine Pasta', qtyRequired: 1, unit: 'kg' },
        { ingredientName: 'Truffle Oil', qtyRequired: 0.1, unit: 'liters' }
      ],
      prepTimeMinutes: 16,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281824?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-7',
      name: 'Classic Tiramisu',
      price: 12,
      category: 'Desserts',
      description: 'Espresso-soaked ladyfingers, mascarpone cream, cocoa powder dust.',
      isAvailable: true,
      ingredients: ['Espresso Beans', 'Heavy Cream', 'Ladyfingers'],
      recipeIngredients: [
        { ingredientName: 'Espresso Beans', qtyRequired: 0.2, unit: 'kg' }
      ],
      prepTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-8',
      name: 'Molten Chocolate Lava Cake',
      price: 14,
      category: 'Desserts',
      description: 'Warm Valrhona chocolate cake with molten center, Madagascar vanilla bean ice cream.',
      isAvailable: true,
      ingredients: ['Heavy Cream', 'Valrhona Chocolate'],
      recipeIngredients: [
        { ingredientName: 'Espresso Beans', qtyRequired: 0.1, unit: 'kg' }
      ],
      prepTimeMinutes: 14,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-9',
      name: 'Signature Mint Mojito',
      price: 13,
      category: 'Beverages',
      description: 'White rum, fresh lime juice, crushed mint leaves, cane sugar syrup, club soda.',
      isAvailable: true,
      ingredients: ['Fresh Mint', 'Lime Juice', 'Club Soda'],
      recipeIngredients: [
        { ingredientName: 'Fresh Basil', qtyRequired: 0.05, unit: 'kg' }
      ],
      prepTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'm-10',
      name: 'Sparkling Elderflower Soda',
      price: 8,
      category: 'Beverages',
      description: 'Artisanal elderflower syrup, sparkling mineral water, fresh mint & cucumber ribbon.',
      isAvailable: true,
      ingredients: ['Elderflower Syrup', 'Club Soda', 'Fresh Mint'],
      recipeIngredients: [
        { ingredientName: 'Fresh Basil', qtyRequired: 0.02, unit: 'kg' }
      ],
      prepTimeMinutes: 4,
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=400'
    }
  ];

  tables: RestaurantTable[] = [
    { id: 't-1', tableNumber: 1, capacity: 2, status: 'Occupied', assignedWaiterId: 'u-wait-1', assignedWaiterName: 'Marco Silva', currentOrderId: 'ord-101', occupiedSince: new Date(Date.now() - 55 * 60000).toISOString(), positionX: 80, positionY: 80, shape: 'round', customStatusNote: 'Birthday Celebration 🎉' },
    { id: 't-2', tableNumber: 2, capacity: 4, status: 'Occupied', assignedWaiterId: 'u-wait-1', assignedWaiterName: 'Marco Silva', currentOrderId: 'ord-102', occupiedSince: new Date(Date.now() - 15 * 60000).toISOString(), positionX: 280, positionY: 80, shape: 'square' },
    { id: 't-3', tableNumber: 3, capacity: 4, status: 'Needs Cleaning', assignedWaiterId: 'u-wait-1', assignedWaiterName: 'Marco Silva', positionX: 480, positionY: 80, shape: 'square' },
    { id: 't-4', tableNumber: 4, capacity: 6, status: 'Reserved', assignedWaiterId: 'u-wait-1', assignedWaiterName: 'Marco Silva', reservationName: 'Johnson Party (6)', reservationTime: '19:30', positionX: 680, positionY: 80, shape: 'rectangle' },
    { id: 't-5', tableNumber: 5, capacity: 2, status: 'Occupied', assignedWaiterId: 'u-wait-2', assignedWaiterName: 'Elena Rostova', currentOrderId: 'ord-103', occupiedSince: new Date(Date.now() - 48 * 60000).toISOString(), positionX: 80, positionY: 260, shape: 'round', customStatusNote: 'Gluten & Nut Allergy ⚠️' },
    { id: 't-6', tableNumber: 6, capacity: 4, status: 'Empty', assignedWaiterId: 'u-wait-2', assignedWaiterName: 'Elena Rostova', positionX: 280, positionY: 260, shape: 'square' },
    { id: 't-7', tableNumber: 7, capacity: 8, status: 'Empty', assignedWaiterId: 'u-wait-2', assignedWaiterName: 'Elena Rostova', positionX: 500, positionY: 260, shape: 'rectangle' },
    { id: 't-8', tableNumber: 8, capacity: 2, status: 'Reserved', assignedWaiterId: 'u-wait-2', assignedWaiterName: 'Elena Rostova', reservationName: 'Dr. Emily Vance', reservationTime: '20:00', positionX: 720, positionY: 260, shape: 'round' },
    { id: 't-9', tableNumber: 9, capacity: 4, status: 'Empty', assignedWaiterId: 'u-wait-1', assignedWaiterName: 'Marco Silva', positionX: 180, positionY: 440, shape: 'square' },
    { id: 't-10', tableNumber: 10, capacity: 6, status: 'Empty', assignedWaiterId: 'u-wait-2', assignedWaiterName: 'Elena Rostova', positionX: 440, positionY: 440, shape: 'rectangle' }
  ];

  orders: Order[] = [
    {
      id: 'ord-101',
      tableId: 't-1',
      tableNumber: 1,
      waiterId: 'u-wait-1',
      waiterName: 'Marco Silva',
      status: 'preparing',
      customerName: 'Sarah Jenkins',
      guestCount: 2,
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      preparingStartedAt: new Date(Date.now() - 18 * 60000).toISOString(),
      totalAmount: 52,
      kitchenNotes: 'Allergy alert: No dairy in appetizer if possible.',
      items: [
        { id: 'oi-1', menuItemId: 'm-1', menuItemName: 'Truffle Parmesan Fries', quantity: 1, unitPrice: 14, notes: 'Extra crispy', itemStatus: 'ready', updatedAt: new Date().toISOString() },
        { id: 'oi-2', menuItemId: 'm-3', menuItemName: 'Wagyu Beef Burger', quantity: 1, unitPrice: 26, notes: 'Medium rare', itemStatus: 'preparing', updatedAt: new Date().toISOString() },
        { id: 'oi-3', menuItemId: 'm-9', menuItemName: 'Signature Mint Mojito', quantity: 1, unitPrice: 12, notes: 'Less ice', itemStatus: 'served', updatedAt: new Date().toISOString() }
      ]
    },
    {
      id: 'ord-102',
      tableId: 't-2',
      tableNumber: 2,
      waiterId: 'u-wait-1',
      waiterName: 'Marco Silva',
      status: 'pending',
      customerName: 'David Lee',
      guestCount: 4,
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      totalAmount: 112,
      kitchenNotes: 'VIP guest table, prioritize entrée delivery.',
      items: [
        { id: 'oi-4', menuItemId: 'm-2', menuItemName: 'Crispy Calamari Rings', quantity: 2, unitPrice: 18, notes: 'Extra lemon slices', itemStatus: 'pending', updatedAt: new Date().toISOString() },
        { id: 'oi-5', menuItemId: 'm-4', menuItemName: 'Wood-Fired Margherita Pizza', quantity: 1, unitPrice: 21, notes: 'Add chili flakes', itemStatus: 'pending', updatedAt: new Date().toISOString() },
        { id: 'oi-6', menuItemId: 'm-5', menuItemName: 'Pan-Seared Atlantic Salmon', quantity: 1, unitPrice: 32, notes: 'Sauce on side', itemStatus: 'pending', updatedAt: new Date().toISOString() },
        { id: 'oi-7', menuItemId: 'm-10', menuItemName: 'Sparkling Elderflower Soda', quantity: 3, unitPrice: 8, notes: '', itemStatus: 'ready', updatedAt: new Date().toISOString() }
      ]
    },
    {
      id: 'ord-103',
      tableId: 't-5',
      tableNumber: 5,
      waiterId: 'u-wait-2',
      waiterName: 'Elena Rostova',
      status: 'ready',
      customerName: 'Claire Miller',
      guestCount: 2,
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      totalAmount: 62,
      kitchenNotes: 'Table requested bill right after main course.',
      items: [
        { id: 'oi-8', menuItemId: 'm-6', menuItemName: 'Creamy Wild Mushroom Fettuccine', quantity: 2, unitPrice: 24, notes: 'Extra parmesan', itemStatus: 'ready', updatedAt: new Date().toISOString() },
        { id: 'oi-9', menuItemId: 'm-7', menuItemName: 'Classic Tiramisu', quantity: 1, unitPrice: 14, notes: '2 spoons', itemStatus: 'ready', updatedAt: new Date().toISOString() }
      ]
    }
  ];

  inventory: InventoryItem[] = [
    { id: 'inv-1', ingredientName: 'Wagyu Beef Patties', stockQty: 18, unit: 'pcs', lowStockThreshold: 10, costPerUnit: 8.5, lastRestocked: new Date(Date.now() - 48 * 3600000).toISOString() },
    { id: 'inv-2', ingredientName: 'Truffle Oil', stockQty: 1.2, unit: 'liters', lowStockThreshold: 2.0, costPerUnit: 45.0, lastRestocked: new Date(Date.now() - 72 * 3600000).toISOString() },
    { id: 'inv-3', ingredientName: 'Fresh Mozzarella', stockQty: 8, unit: 'kg', lowStockThreshold: 5, costPerUnit: 12.0, lastRestocked: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: 'inv-4', ingredientName: 'Salmon Fillets', stockQty: 12, unit: 'pcs', lowStockThreshold: 8, costPerUnit: 14.0, lastRestocked: new Date(Date.now() - 12 * 3600000).toISOString() },
    { id: 'inv-5', ingredientName: 'Fresh Basil', stockQty: 0.5, unit: 'kg', lowStockThreshold: 0.8, costPerUnit: 15.0, lastRestocked: new Date(Date.now() - 36 * 3600000).toISOString() },
    { id: 'inv-6', ingredientName: 'Fettuccine Pasta', stockQty: 15, unit: 'kg', lowStockThreshold: 5, costPerUnit: 4.0, lastRestocked: new Date(Date.now() - 96 * 3600000).toISOString() },
    { id: 'inv-7', ingredientName: 'Espresso Beans', stockQty: 6, unit: 'kg', lowStockThreshold: 3, costPerUnit: 22.0, lastRestocked: new Date(Date.now() - 120 * 3600000).toISOString() },
    { id: 'inv-8', ingredientName: 'French Fries', stockQty: 25, unit: 'kg', lowStockThreshold: 10, costPerUnit: 2.5, lastRestocked: new Date(Date.now() - 24 * 3600000).toISOString() }
  ];

  notifications: AppNotification[] = [
    {
      id: 'notif-1',
      recipientRole: 'waiter',
      title: 'Order Ready',
      message: 'Order #ord-103 for Table 5 is marked READY by Kitchen.',
      orderId: 'ord-103',
      tableNumber: 5,
      type: 'order_ready',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60000).toISOString()
    },
    {
      id: 'notif-2',
      recipientRole: 'manager',
      title: 'Low Stock Alert',
      message: 'Truffle Oil is below minimum threshold (1.2L left).',
      type: 'low_stock',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: 'notif-3',
      recipientRole: 'waiter',
      title: 'Table Status Alert',
      message: 'Table 3 marked Needs Cleaning.',
      tableNumber: 3,
      type: 'table_cleaning',
      isRead: false,
      createdAt: new Date(Date.now() - 12 * 60000).toISOString()
    }
  ];

  bills: Bill[] = [
    {
      id: 'bill-99',
      orderId: 'ord-099',
      tableNumber: 4,
      subtotal: 140,
      tax: 14,
      discount: 10,
      totalAmount: 144,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString()
    }
  ];

  shiftNotes: ShiftHandoverNote[] = [
    {
      id: 'note-1',
      authorName: 'Chef Gordon',
      role: 'kitchen',
      note: 'Prepped 30 Wagyu patties for dinner service. Need extra basil delivery by 6 PM.',
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      priority: 'normal'
    },
    {
      id: 'note-2',
      authorName: 'Alex Rivera',
      role: 'manager',
      note: 'Concert at city arena tonight. Expect heavy table turnover between 7:00 PM and 9:30 PM.',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      priority: 'urgent'
    }
  ];

  shifts: StaffShift[] = [
    { id: 'sh-1', userId: 'u-wait-1', userName: 'Marco Silva', role: 'waiter', shiftStart: '16:00', shiftEnd: '23:00', assignedTables: [1, 2, 3, 4], status: 'active' },
    { id: 'sh-2', userId: 'u-wait-2', userName: 'Elena Rostova', role: 'waiter', shiftStart: '17:00', shiftEnd: '23:30', assignedTables: [5, 6, 7, 8], status: 'active' },
    { id: 'sh-3', userId: 'u-kit-1', userName: 'Chef Gordon', role: 'kitchen', shiftStart: '15:00', shiftEnd: '23:00', assignedTables: [], status: 'active' }
  ];
}

export const globalStore = new RestaurantStore();
