import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { globalStore, RestaurantStore } from './src/server/store.js';
import { supabase, isSupabaseConfigured } from './src/server/supabase.js';

// Persistence helpers for Supabase Write-Through cache
async function persistUser(user: any) {
  if (!isSupabaseConfigured || !supabase || !user) return;
  try {
    await supabase.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password || null,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      status: user.status,
      assigned_tables: user.assignedTables || [],
      requested_role: user.requestedRole || user.role,
      joined_at: user.joinedAt || new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to persist user to Supabase:', e);
  }
}

async function persistTable(table: any) {
  if (!isSupabaseConfigured || !supabase || !table) return;
  try {
    await supabase.from('restaurant_tables').upsert({
      id: table.id,
      table_number: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      assigned_waiter_id: table.assignedWaiterId || null,
      assigned_waiter_name: table.assignedWaiterName || null,
      current_order_id: table.currentOrderId || null,
      occupied_since: table.occupiedSince || null,
      reservation_name: table.reservationName || null,
      reservation_time: table.reservationTime || null,
      custom_status_note: table.customStatusNote || null,
      position_x: table.positionX,
      position_y: table.positionY,
      shape: table.shape
    });
  } catch (e) {
    console.error('Failed to persist table to Supabase:', e);
  }
}

async function persistOrder(order: any) {
  if (!isSupabaseConfigured || !supabase || !order) return;
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      table_id: order.tableId || null,
      table_number: order.tableNumber,
      waiter_id: order.waiterId,
      waiter_name: order.waiterName,
      status: order.status,
      customer_name: order.customerName || null,
      guest_count: order.guestCount,
      created_at: order.createdAt || new Date().toISOString(),
      preparing_started_at: order.preparingStartedAt || null,
      total_amount: order.totalAmount,
      kitchen_notes: order.kitchenNotes || null,
      items: order.items || []
    });
  } catch (e) {
    console.error('Failed to persist order to Supabase:', e);
  }
}

async function persistMenuItem(item: any) {
  if (!isSupabaseConfigured || !supabase || !item) return;
  try {
    await supabase.from('menu_items').upsert({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || '',
      is_available: item.isAvailable,
      ingredients: item.ingredients || [],
      prep_time_minutes: item.prepTimeMinutes,
      image_url: item.imageUrl || null
    });
  } catch (e) {
    console.error('Failed to persist menu item to Supabase:', e);
  }
}

async function persistInventoryItem(item: any) {
  if (!isSupabaseConfigured || !supabase || !item) return;
  try {
    await supabase.from('inventory').upsert({
      id: item.id,
      ingredient_name: item.ingredientName,
      stock_qty: item.stockQty,
      unit: item.unit,
      low_stock_threshold: item.lowStockThreshold,
      cost_per_unit: item.costPerUnit || 0,
      last_restocked: item.lastRestocked || new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to persist inventory item to Supabase:', e);
  }
}

async function persistBill(bill: any) {
  if (!isSupabaseConfigured || !supabase || !bill) return;
  try {
    await supabase.from('bills').upsert({
      id: bill.id,
      order_id: bill.orderId,
      table_number: bill.tableNumber,
      subtotal: bill.subtotal,
      tax: bill.tax,
      discount: bill.discount,
      total_amount: bill.totalAmount,
      payment_status: bill.paymentStatus || 'paid',
      payment_method: bill.paymentMethod || 'card',
      created_at: bill.createdAt || new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to persist bill to Supabase:', e);
  }
}

async function persistShiftNote(note: any) {
  if (!isSupabaseConfigured || !supabase || !note) return;
  try {
    await supabase.from('shift_notes').upsert({
      id: note.id,
      author_name: note.authorName,
      role: note.role,
      note: note.note,
      timestamp: note.timestamp || new Date().toISOString(),
      priority: note.priority || 'normal'
    });
  } catch (e) {
    console.error('Failed to persist shift note to Supabase:', e);
  }
}

async function persistShift(shift: any) {
  if (!isSupabaseConfigured || !supabase || !shift) return;
  try {
    await supabase.from('shifts').upsert({
      id: shift.id,
      user_id: shift.userId || null,
      user_name: shift.userName,
      role: shift.role,
      shift_start: shift.shiftStart,
      shift_end: shift.shiftEnd,
      assigned_tables: shift.assignedTables || [],
      status: shift.status || 'scheduled'
    });
  } catch (e) {
    console.error('Failed to persist shift to Supabase:', e);
  }
}

async function loadStateFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  console.log('Syncing in-memory store state with Supabase...');
  try {
    // 1. Users
    const { data: users, error: usersErr } = await supabase.from('users').select('*');
    if (usersErr) throw usersErr;
    if (users && users.length > 0) {
      globalStore.users = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password || 'password123',
        role: u.role,
        phone: u.phone || '',
        avatar: u.avatar || '',
        status: u.status,
        assignedTables: u.assigned_tables || [],
        requestedRole: u.requested_role,
        joinedAt: u.joined_at
      }));
    }

    // 2. Menu Items
    const { data: menuItems, error: menuErr } = await supabase.from('menu_items').select('*');
    if (menuErr) throw menuErr;
    if (menuItems && menuItems.length > 0) {
      globalStore.menuItems = menuItems.map(m => ({
        id: m.id,
        name: m.name,
        price: Number(m.price),
        category: m.category,
        description: m.description || '',
        isAvailable: m.is_available,
        ingredients: m.ingredients || [],
        prepTimeMinutes: m.prep_time_minutes,
        imageUrl: m.image_url || undefined
      }));
    }

    // 3. Tables
    const { data: tables, error: tablesErr } = await supabase.from('restaurant_tables').select('*');
    if (tablesErr) throw tablesErr;
    if (tables && tables.length > 0) {
      globalStore.tables = tables.map(t => ({
        id: t.id,
        tableNumber: t.table_number,
        capacity: t.capacity,
        status: t.status,
        assignedWaiterId: t.assigned_waiter_id || undefined,
        assignedWaiterName: t.assigned_waiter_name || undefined,
        currentOrderId: t.current_order_id || undefined,
        occupiedSince: t.occupied_since || undefined,
        reservationName: t.reservation_name || undefined,
        reservationTime: t.reservation_time || undefined,
        customStatusNote: t.custom_status_note || undefined,
        positionX: t.position_x,
        positionY: t.position_y,
        shape: t.shape
      }));
    }

    // 4. Orders
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('*');
    if (ordersErr) throw ordersErr;
    if (orders && orders.length > 0) {
      globalStore.orders = orders.map(o => ({
        id: o.id,
        tableId: o.table_id || '',
        tableNumber: o.table_number,
        waiterId: o.waiter_id,
        waiterName: o.waiter_name,
        status: o.status,
        customerName: o.customer_name || undefined,
        guestCount: o.guest_count,
        createdAt: o.created_at,
        preparingStartedAt: o.preparing_started_at || undefined,
        totalAmount: Number(o.total_amount),
        kitchenNotes: o.kitchen_notes || '',
        items: o.items || []
      }));
    }

    // 5. Inventory
    const { data: inventory, error: invErr } = await supabase.from('inventory').select('*');
    if (invErr) throw invErr;
    if (inventory && inventory.length > 0) {
      globalStore.inventory = inventory.map(i => ({
        id: i.id,
        ingredientName: i.ingredient_name,
        stockQty: Number(i.stock_qty),
        unit: i.unit,
        lowStockThreshold: Number(i.low_stock_threshold),
        costPerUnit: Number(i.cost_per_unit),
        lastRestocked: i.last_restocked
      }));
    }

    // 6. Bills
    const { data: bills, error: billsErr } = await supabase.from('bills').select('*');
    if (billsErr) throw billsErr;
    if (bills && bills.length > 0) {
      globalStore.bills = bills.map(b => ({
        id: b.id,
        orderId: b.order_id,
        tableNumber: b.table_number,
        subtotal: Number(b.subtotal),
        tax: Number(b.tax),
        discount: Number(b.discount),
        totalAmount: Number(b.total_amount),
        paymentStatus: b.payment_status,
        paymentMethod: b.payment_method,
        createdAt: b.created_at
      }));
    }

    // 7. Shift Notes
    const { data: shiftNotes, error: notesErr } = await supabase.from('shift_notes').select('*');
    if (notesErr) throw notesErr;
    if (shiftNotes && shiftNotes.length > 0) {
      globalStore.shiftNotes = shiftNotes.map(n => ({
        id: n.id,
        authorName: n.author_name,
        role: n.role,
        note: n.note,
        timestamp: n.timestamp,
        priority: n.priority
      }));
    }

    // 8. Shifts
    const { data: shifts, error: shiftsErr } = await supabase.from('shifts').select('*');
    if (shiftsErr) throw shiftsErr;
    if (shifts && shifts.length > 0) {
      globalStore.shifts = shifts.map(s => ({
        id: s.id,
        userId: s.user_id || '',
        userName: s.user_name,
        role: s.role,
        shiftStart: s.shift_start,
        shiftEnd: s.shift_end,
        assignedTables: s.assigned_tables || [],
        status: s.status
      }));
    }

    console.log('✅ State successfully synchronized with Supabase!');
  } catch (err) {
    console.error('❌ Failed to synchronize state with Supabase:', err);
  }
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// SSE Clients Registry for Realtime Sync
const sseClients: Response[] = [];

function broadcastStateUpdate(eventType = 'state_change', payload?: any) {
  // Write-Through Persistence to Supabase
  if (isSupabaseConfigured && supabase) {
    if (eventType.startsWith('user_') || eventType === 'staff_created') {
      persistUser(payload);
    } else if (eventType.startsWith('menu_')) {
      persistMenuItem(payload);
    } else if (eventType.startsWith('table_')) {
      persistTable(payload);
    } else if (eventType.startsWith('order_')) {
      persistOrder(payload);
    } else if (eventType === 'orders_bulk_cleared') {
      const readyOrders = globalStore.orders.filter((o) => o.status === 'served');
      readyOrders.forEach(persistOrder);
    } else if (eventType.startsWith('inventory_')) {
      persistInventoryItem(payload);
    } else if (eventType.startsWith('bill_')) {
      persistBill(payload);
    } else if (eventType.startsWith('shift_note_')) {
      persistShiftNote(payload);
    } else if (eventType.startsWith('shift_')) {
      persistShift(payload);
    }
  }

  const data = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
    store: {
      users: globalStore.users,
      menuItems: globalStore.menuItems,
      tables: globalStore.tables,
      orders: globalStore.orders,
      inventory: globalStore.inventory,
      notifications: globalStore.notifications,
      bills: globalStore.bills,
      shiftNotes: globalStore.shiftNotes,
      shifts: globalStore.shifts,
    },
  });

  sseClients.forEach((client) => {
    client.write(`data: ${data}\n\n`);
  });
}

// SSE Realtime Event Endpoint
app.get('/api/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial full state
  const initialData = JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    store: {
      users: globalStore.users,
      menuItems: globalStore.menuItems,
      tables: globalStore.tables,
      orders: globalStore.orders,
      inventory: globalStore.inventory,
      notifications: globalStore.notifications,
      bills: globalStore.bills,
      shiftNotes: globalStore.shiftNotes,
      shifts: globalStore.shifts,
    },
  });
  res.write(`data: ${initialData}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// REST API Routes
app.get('/api/store/state', (req: Request, res: Response) => {
  res.json({
    users: globalStore.users,
    menuItems: globalStore.menuItems,
    tables: globalStore.tables,
    orders: globalStore.orders,
    inventory: globalStore.inventory,
    notifications: globalStore.notifications,
    bills: globalStore.bills,
    shiftNotes: globalStore.shiftNotes,
    shifts: globalStore.shifts,
  });
});

app.post('/api/store/reset', (req: Request, res: Response) => {
  try {
    const newStore = new RestaurantStore();
    globalStore.users = newStore.users;
    globalStore.menuItems = newStore.menuItems;
    globalStore.tables = newStore.tables;
    globalStore.orders = newStore.orders;
    globalStore.inventory = newStore.inventory;
    globalStore.notifications = newStore.notifications;
    globalStore.bills = newStore.bills;
    globalStore.shiftNotes = newStore.shiftNotes;
    globalStore.shifts = newStore.shifts;

    broadcastStateUpdate('store_reset');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to reset store' });
  }
});

// Authentication & Email + Password Sign-up Endpoints
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  let targetEmail = cleanEmail;
  
  if (!targetEmail && role) {
    const demoUser = globalStore.users.find(u => u.role === role);
    if (demoUser) targetEmail = demoUser.email;
  }
  
  if (!targetEmail) {
    return res.status(400).json({ success: false, error: 'Email ID is required.' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Check if user profile is already in memory
      let user = globalStore.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (!user) {
        // Fetch from Supabase users profile table
        const { data: sbUser, error: fetchErr } = await supabase.from('users').select('*').eq('email', targetEmail).single();
        if (sbUser) {
          user = {
            id: sbUser.id,
            name: sbUser.name,
            email: sbUser.email,
            password: sbUser.password || 'password123',
            role: sbUser.role,
            phone: sbUser.phone || '',
            avatar: sbUser.avatar || '',
            status: sbUser.status,
            assignedTables: sbUser.assigned_tables || [],
            requestedRole: sbUser.requested_role,
            joinedAt: sbUser.joined_at
          };
          globalStore.users.push(user);
        }
      }

      // If user profile doesn't exist at all, auto-create one
      if (!user) {
        user = {
          id: 'u-' + Math.random().toString(36).substr(2, 9),
          name: targetEmail.split('@')[0],
          email: targetEmail,
          password: 'password123',
          role: 'unassigned',
          status: 'pending_approval',
          assignedTables: [],
          requestedRole: 'waiter',
          joinedAt: new Date().toISOString()
        };
        // Save back to local store and persist to Supabase users table
        if (!globalStore.users.some(u => u.id === user.id)) {
          globalStore.users.push(user);
        }
        await persistUser(user);
      }

      return res.json({ success: true, user });
    } catch (e: any) {
      console.error('Supabase Auth error:', e);
      return res.status(500).json({ success: false, error: e.message || 'Auth server error' });
    }
  }

  // Local in-memory fallback login
  let user = globalStore.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());

  if (user) {
    if (password && user.password && user.password !== password && password !== 'password123') {
      return res.status(401).json({ success: false, error: 'Invalid account password.' });
    }
  } else {
    // Auto-create local user if they don't exist
    user = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      name: targetEmail.split('@')[0],
      email: targetEmail,
      password: password || 'password123',
      role: role || 'unassigned',
      status: role ? 'active' : 'pending_approval',
      assignedTables: [],
      requestedRole: role || 'waiter',
      joinedAt: new Date().toISOString()
    };
    globalStore.users.push(user);
    persistUser(user);
  }

  res.json({ success: true, user });
});

// Email + Password Sign-up
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { name, email, password, phone, requestedRole } = req.body;
  
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email ID is required for registration.' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Full Name is required for registration.' });
  }

  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  let existingUser = globalStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: `An account with email '${cleanEmail}' already exists. Please log in instead.`,
    });
  }

  const avatarIndex = (globalStore.users.length % 4);
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200',
  ];

  const newUser: any = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: password,
    role: requestedRole || 'unassigned',
    phone: phone || '',
    avatar: avatars[avatarIndex],
    status: 'pending_approval',
    assignedTables: [],
    requestedRole: requestedRole || 'waiter',
    joinedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
      });

      if (authErr) {
        return res.status(400).json({ success: false, error: authErr.message });
      }

      if (authData.user) {
        newUser.id = authData.user.id;
      }
    } catch (e: any) {
      console.error('Supabase Sign Up Auth Error:', e);
      return res.status(500).json({ success: false, error: e.message || 'Auth registration error' });
    }
  }

  globalStore.users.unshift(newUser);

  // Send a manager alert notification
  globalStore.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientRole: 'manager',
    title: 'New Staff Account Registered',
    message: `${newUser.name} registered via email (${newUser.email}) requesting '${newUser.requestedRole}' role.`,
    type: 'ai_alert',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  broadcastStateUpdate('user_signed_up', newUser);
  res.json({ success: true, user: newUser });
});

// User Profile Details Endpoint
app.put('/api/users/:id/profile', (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = globalStore.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }

  const { name, email, phone, avatar, password, newPassword, role, status, assignedTables } = req.body;

  if (role) {
    user.role = role;
  }

  if (status) {
    user.status = status;
  }

  if (assignedTables !== undefined) {
    user.assignedTables = assignedTables;
  }

  // Validate email uniqueness if email is changed
  if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = globalStore.users.find((u) => u.id !== userId && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `The email address '${cleanEmail}' is already registered to another staff account.`,
      });
    }
    user.email = cleanEmail;
  }

  if (name && name.trim()) {
    user.name = name.trim();
  }

  if (phone !== undefined) {
    user.phone = phone.trim();
  }

  if (avatar && avatar.trim()) {
    user.avatar = avatar.trim();
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }
    user.password = newPassword.trim();
  } else if (password && password.trim()) {
    if (password.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }
    user.password = password.trim();
  }

  // Broadcast state update to all connected sessions
  broadcastStateUpdate('user_profile_updated', user);

  res.json({ success: true, user });
});

// Manager Job Role Assignment & Staff Management
app.put('/api/users/:id/role', (req: Request, res: Response) => {
  const requesterRole = (req.headers['x-user-role'] as string) || '';
  if (requesterRole && requesterRole !== 'manager') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Restaurant Manager privileges required to assign job roles.' });
  }

  const user = globalStore.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { role, status, assignedTables, name, phone } = req.body;
  
  if (role) user.role = role;
  if (status) user.status = status;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (assignedTables) user.assignedTables = assignedTables;

  // Broadcast role update
  broadcastStateUpdate('user_role_updated', user);

  // Create notification
  globalStore.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientRole: 'all',
    title: 'Staff Role Updated',
    message: `${user.name} is now designated as ${user.role.toUpperCase()} (${user.status}).`,
    type: 'order_ready',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, user });
});

// Manager Manual Add User
app.post('/api/users', (req: Request, res: Response) => {
  const requesterRole = (req.headers['x-user-role'] as string) || '';
  if (requesterRole && requesterRole !== 'manager') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Restaurant Manager privileges required to add staff.' });
  }

  const { name, email, role, phone, assignedTables } = req.body;
  const newUser: any = {
    id: `u-${Date.now()}`,
    name: name || 'New Staff Member',
    email: email || `staff_${Date.now()}@kitchensync.com`,
    role: role || 'waiter',
    phone: phone || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    status: 'active',
    assignedTables: assignedTables || [],
    joinedAt: new Date().toISOString()
  };

  globalStore.users.push(newUser);
  broadcastStateUpdate('user_added', newUser);
  res.json({ success: true, user: newUser });
});

// Manager Delete User
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const requesterRole = (req.headers['x-user-role'] as string) || '';
  if (requesterRole && requesterRole !== 'manager') {
    return res.status(403).json({ success: false, error: 'Unauthorized: Restaurant Manager privileges required to remove staff.' });
  }

  const idx = globalStore.users.findIndex((u) => u.id === req.params.id);
  if (idx !== -1) {
    const deleted = globalStore.users.splice(idx, 1)[0];
    broadcastStateUpdate('user_deleted', deleted);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, error: 'User not found' });
});

// Digital Menu Management
app.post('/api/menu', (req: Request, res: Response) => {
  const newItem = {
    id: `m-${Date.now()}`,
    name: req.body.name,
    price: Number(req.body.price) || 10,
    category: req.body.category || 'Mains',
    description: req.body.description || '',
    isAvailable: req.body.isAvailable !== false,
    ingredients: req.body.ingredients || [],
    prepTimeMinutes: Number(req.body.prepTimeMinutes) || 15,
    imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
  };
  globalStore.menuItems.unshift(newItem);
  broadcastStateUpdate('menu_updated', newItem);
  res.json({ success: true, item: newItem });
});

app.put('/api/menu/:id/toggle', (req: Request, res: Response) => {
  const item = globalStore.menuItems.find((m) => m.id === req.params.id);
  if (item) {
    item.isAvailable = !item.isAvailable;
    broadcastStateUpdate('menu_toggled', item);
    res.json({ success: true, item });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Table Status Updates
app.put('/api/tables/:id/status', (req: Request, res: Response) => {
  const table = globalStore.tables.find((t) => t.id === req.params.id || t.tableNumber === Number(req.params.id));
  if (table) {
    if (req.body.status) table.status = req.body.status;
    if (req.body.customStatusNote !== undefined) {
      table.customStatusNote = req.body.customStatusNote;
    }
    if (req.body.positionX !== undefined) table.positionX = req.body.positionX;
    if (req.body.positionY !== undefined) table.positionY = req.body.positionY;
    if (req.body.shape !== undefined) table.shape = req.body.shape;
    if (req.body.capacity !== undefined) table.capacity = req.body.capacity;
    if (req.body.assignedWaiterId) {
      table.assignedWaiterId = req.body.assignedWaiterId;
      const waiter = globalStore.users.find((u) => u.id === req.body.assignedWaiterId);
      if (waiter) table.assignedWaiterName = waiter.name;
    }
    if (req.body.status === 'Occupied' && !table.occupiedSince) {
      table.occupiedSince = new Date().toISOString();
    } else if (req.body.status === 'Empty') {
      table.occupiedSince = undefined;
      table.currentOrderId = undefined;
      table.reservationName = undefined;
    }
    broadcastStateUpdate('table_updated', table);
    res.json({ success: true, table });
  } else {
    res.status(404).json({ error: 'Table not found' });
  }
});

// Order Management
app.post('/api/orders', (req: Request, res: Response) => {
  const { tableId, tableNumber, waiterId, waiterName, items, guestCount, customerName, kitchenNotes } = req.body;

  const totalAmount = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

  const newOrder: any = {
    id: `ord-${Math.floor(100 + Math.random() * 900)}`,
    tableId,
    tableNumber: Number(tableNumber),
    waiterId: waiterId || 'u-wait-1',
    waiterName: waiterName || 'Marco Silva',
    status: 'pending',
    customerName: customerName || `Table ${tableNumber} Guest`,
    guestCount: Number(guestCount) || 2,
    createdAt: new Date().toISOString(),
    totalAmount,
    kitchenNotes: kitchenNotes || '',
    items: items.map((it: any, idx: number) => ({
      id: `oi-${Date.now()}-${idx}`,
      menuItemId: it.menuItemId,
      menuItemName: it.menuItemName,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 10,
      notes: it.notes || '',
      itemStatus: 'pending',
      updatedAt: new Date().toISOString(),
    })),
  };

  globalStore.orders.unshift(newOrder);

  // Update table status to Occupied
  const table = globalStore.tables.find((t) => t.id === tableId || t.tableNumber === Number(tableNumber));
  if (table) {
    table.status = 'Occupied';
    table.currentOrderId = newOrder.id;
    table.occupiedSince = new Date().toISOString();
  }

  // Create notification for Kitchen
  globalStore.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientRole: 'kitchen',
    title: 'New Order Received',
    message: `Order #${newOrder.id} placed for Table ${newOrder.tableNumber} (${newOrder.items.length} items).`,
    orderId: newOrder.id,
    tableNumber: newOrder.tableNumber,
    type: 'order_placed',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  broadcastStateUpdate('order_created', newOrder);
  res.json({ success: true, order: newOrder });
});

// Update Order Status / Item Status
app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = globalStore.orders.find((o) => o.id === req.params.id);
  if (order) {
    const prevStatus = order.status;
    order.status = req.body.status;

    if (req.body.status === 'preparing' && !order.preparingStartedAt) {
      order.preparingStartedAt = new Date().toISOString();
    }

    if (req.body.status === 'ready' && prevStatus !== 'ready') {
      // Notify Waiters
      globalStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipientRole: 'waiter',
        title: 'Order Ready to Serve',
        message: `Order #${order.id} for Table ${order.tableNumber} is READY!`,
        orderId: order.id,
        tableNumber: order.tableNumber,
        type: 'order_ready',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    broadcastStateUpdate('order_status_updated', order);
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Bulk clear / archive all ready orders
app.post('/api/orders/clear-ready', (req: Request, res: Response) => {
  const readyOrders = globalStore.orders.filter((o) => o.status === 'ready');
  const count = readyOrders.length;

  readyOrders.forEach((o) => {
    o.status = 'served';
    if (o.items) {
      o.items.forEach((it) => {
        it.itemStatus = 'served';
      });
    }
  });

  if (count > 0) {
    globalStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'kitchen',
      title: 'Ready Orders Cleared',
      message: `Kitchen staff cleared ${count} ready order${count > 1 ? 's' : ''} from the display.`,
      type: 'order_ready',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  broadcastStateUpdate('orders_bulk_cleared', { clearedCount: count });
  res.json({ success: true, clearedCount: count });
});

app.put('/api/orders/:orderId/items/:itemId/status', (req: Request, res: Response) => {
  const order = globalStore.orders.find((o) => o.id === req.params.orderId);
  if (order) {
    const item = order.items.find((i) => i.id === req.params.itemId);
    if (item) {
      item.itemStatus = req.body.itemStatus;
      item.updatedAt = new Date().toISOString();

      // Check if all items in order are ready
      const allReady = order.items.every((i) => i.itemStatus === 'ready' || i.itemStatus === 'served');
      if (allReady && order.status !== 'ready' && order.status !== 'served') {
        order.status = 'ready';
        globalStore.notifications.unshift({
          id: `notif-${Date.now()}`,
          recipientRole: 'waiter',
          title: 'Order Ready',
          message: `All items in Order #${order.id} for Table ${order.tableNumber} are READY!`,
          orderId: order.id,
          tableNumber: order.tableNumber,
          type: 'order_ready',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      broadcastStateUpdate('order_item_updated', { order, item });
      res.json({ success: true, order, item });
    } else {
      res.status(404).json({ error: 'Item not found in order' });
    }
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Billing and Payment
app.post('/api/bills', (req: Request, res: Response) => {
  const { orderId, discount = 0, paymentMethod = 'card' } = req.body;
  const order = globalStore.orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const subtotal = order.totalAmount;
  const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
  const totalAmount = Math.max(0, subtotal + tax - discount);

  const bill = {
    id: `bill-${Date.now()}`,
    orderId: order.id,
    tableNumber: order.tableNumber,
    subtotal,
    tax,
    discount,
    totalAmount,
    paymentStatus: 'paid' as const,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  order.status = 'billed';
  globalStore.bills.unshift(bill);

  // Set table status to Needs Cleaning
  const table = globalStore.tables.find((t) => t.tableNumber === order.tableNumber);
  if (table) {
    table.status = 'Needs Cleaning';
    table.currentOrderId = undefined;
    table.occupiedSince = undefined;

    globalStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: 'waiter',
      title: 'Table Needs Cleaning',
      message: `Table ${table.tableNumber} has been paid and needs clearing.`,
      tableNumber: table.tableNumber,
      type: 'table_cleaning',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  broadcastStateUpdate('bill_paid', bill);
  res.json({ success: true, bill });
});

// Inventory Management
app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const item = globalStore.inventory.find((i) => i.id === req.params.id);
  if (item) {
    if (typeof req.body.stockQty === 'number') {
      item.stockQty = req.body.stockQty;
      item.lastRestocked = new Date().toISOString();
    }
    broadcastStateUpdate('inventory_updated', item);
    res.json({ success: true, item });
  } else {
    res.status(404).json({ error: 'Inventory item not found' });
  }
});

// Handover Shift Notes
app.post('/api/shift-notes', (req: Request, res: Response) => {
  const note = {
    id: `note-${Date.now()}`,
    authorName: req.body.authorName || 'Staff Member',
    role: req.body.role || 'manager',
    note: req.body.note || '',
    timestamp: new Date().toISOString(),
    priority: req.body.priority || 'normal',
  };
  globalStore.shiftNotes.unshift(note);
  broadcastStateUpdate('shift_note_added', note);
  res.json({ success: true, note });
});

// Notification Clear
app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const { role } = req.body;
  globalStore.notifications.forEach((n) => {
    if (n.recipientRole === role || n.recipientRole === 'all') {
      n.isRead = true;
    }
  });
  broadcastStateUpdate('notifications_read');
  res.json({ success: true });
});

// ==========================================
// Platinum AI Endpoints (Gemini API Integration)
// ==========================================

app.post('/api/ai/insights', async (req: Request, res: Response) => {
  const ai = getGeminiClient();

  if (!ai) {
    // Fallback response if GEMINI_API_KEY is not configured
    return res.json({
      success: true,
      isFallback: true,
      insights: {
        schedulingSuggestions: [
          { title: 'Peak Dinner Prep (7 PM - 9 PM)', rationale: 'High table density & past order spikes detected.', shiftName: 'Evening Rush', recommendedWaiters: 4 },
          { title: 'Late Night Shift (9:30 PM - 11 PM)', rationale: 'Modest drink & dessert orders expected.', shiftName: 'Night Closing', recommendedWaiters: 2 }
        ],
        demandForecast: [
          { timeSlot: '12:00 PM - 2:00 PM', expectedOrders: 28, expectedRevenue: 680, busyLevel: 'high' },
          { timeSlot: '2:00 PM - 5:00 PM', expectedOrders: 12, expectedRevenue: 240, busyLevel: 'low' },
          { timeSlot: '5:00 PM - 8:00 PM', expectedOrders: 42, expectedRevenue: 1250, busyLevel: 'high' },
          { timeSlot: '8:00 PM - 11:00 PM', expectedOrders: 22, expectedRevenue: 510, busyLevel: 'medium' }
        ],
        inventoryRisk: [
          { ingredientName: 'Truffle Oil', hoursLeft: 4, estimatedDepletion: 'Depletion around 8:30 PM', riskLevel: 'high' },
          { ingredientName: 'Fresh Basil', hoursLeft: 6, estimatedDepletion: 'Low threshold by 9:00 PM', riskLevel: 'medium' }
        ],
        bottlenecks: [
          { orderId: 'ord-101', tableNumber: 1, prepTimeMinutes: 25, warningReason: 'Wagyu Burger grill queue delay.' }
        ],
        operationalSummary: 'Kitchen prep velocity is running smoothly at 14 mins avg. High demand anticipated for Wagyu Burger and Truffle Fries. Recommend restocking Truffle Oil before the 7 PM dinner rush.'
      }
    });
  }

  try {
    const prompt = `You are KitchenSync AI, an expert restaurant operations intelligence assistant.
Analyze the following current restaurant state:
- Active Orders Count: ${globalStore.orders.length}
- Occupied Tables: ${globalStore.tables.filter((t) => t.status === 'Occupied').length} / ${globalStore.tables.length}
- Low Stock Items: ${globalStore.inventory.filter((i) => i.stockQty <= i.lowStockThreshold).map((i) => i.ingredientName).join(', ') || 'None'}
- Current Menu Items Count: ${globalStore.menuItems.length}

Generate structured JSON response with:
1. "schedulingSuggestions": array of { title, rationale, shiftName, recommendedWaiters }
2. "demandForecast": array of { timeSlot, expectedOrders, expectedRevenue, busyLevel ("low"|"medium"|"high") }
3. "inventoryRisk": array of { ingredientName, hoursLeft, estimatedDepletion, riskLevel ("high"|"medium"|"low") }
4. "bottlenecks": array of { orderId, tableNumber, prepTimeMinutes, warningReason }
5. "operationalSummary": concise 2-sentence executive summary with actionable recommendations for the manager.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedulingSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  shiftName: { type: Type.STRING },
                  recommendedWaiters: { type: Type.NUMBER },
                },
              },
            },
            demandForecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING },
                  expectedOrders: { type: Type.NUMBER },
                  expectedRevenue: { type: Type.NUMBER },
                  busyLevel: { type: Type.STRING },
                },
              },
            },
            inventoryRisk: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredientName: { type: Type.STRING },
                  hoursLeft: { type: Type.NUMBER },
                  estimatedDepletion: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                },
              },
            },
            bottlenecks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  orderId: { type: Type.STRING },
                  tableNumber: { type: Type.NUMBER },
                  prepTimeMinutes: { type: Type.NUMBER },
                  warningReason: { type: Type.STRING },
                },
              },
            },
            operationalSummary: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, isFallback: false, insights: parsed });
  } catch (err: any) {
    console.error('Gemini AI API Error:', err);
    res.status(500).json({ error: 'Failed to generate AI insights', message: err.message });
  }
});

// AI Staff Scheduler Endpoint
app.post('/api/ai/scheduler', async (req: Request, res: Response) => {
  const ai = getGeminiClient();

  // Compute actual order volumes
  const totalOrders = globalStore.orders.length;
  const totalRevenue = globalStore.orders.reduce((sum, o) => sum + o.totalAmount, 0) + globalStore.bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalGuests = globalStore.orders.reduce((sum, o) => sum + (o.guestCount || 2), 0);

  if (!ai) {
    return res.json({
      success: true,
      isFallback: true,
      schedule: {
        summary: "Based on current order volume (" + totalOrders + " orders, $" + totalRevenue.toFixed(0) + " sales), high weekend evening demand requires 5 floor staff and 3 kitchen chefs during peak dinner hours.",
        recommendedShifts: [
          {
            shiftName: "Morning Prep & Breakfast",
            timeRange: "07:00 AM - 11:30 AM",
            predictedVolume: "Moderate (15-25 guests)",
            recommendedWaiters: 2,
            recommendedChefs: 2,
            rationale: "Steady coffee and breakfast pastry service; focus on prep for lunch rush."
          },
          {
            shiftName: "Lunch Rush",
            timeRange: "11:30 AM - 03:30 PM",
            predictedVolume: "High (45-60 guests)",
            recommendedWaiters: 4,
            recommendedChefs: 3,
            rationale: "High table turnaround with business lunch crowds; requires full floor coverage."
          },
          {
            shiftName: "Afternoon Transition",
            timeRange: "03:30 PM - 06:00 PM",
            predictedVolume: "Low (10-15 guests)",
            recommendedWaiters: 2,
            recommendedChefs: 1,
            rationale: "Light beverage and dessert service; ideal for shift handovers and restocking."
          },
          {
            shiftName: "Dinner Peak Rush",
            timeRange: "06:00 PM - 10:00 PM",
            predictedVolume: "Peak (70-90 guests)",
            recommendedWaiters: 5,
            recommendedChefs: 4,
            rationale: "Maximum table occupancy and multi-course dining orders; requires full kitchen grill team."
          },
          {
            shiftName: "Late Night & Closing",
            timeRange: "10:00 PM - 12:30 AM",
            predictedVolume: "Low-Moderate (15-20 guests)",
            recommendedWaiters: 2,
            recommendedChefs: 2,
            rationale: "Cocktails and late dessert service; initial closing breakdown and inventory audits."
          }
        ],
        laborCostEfficiencyScore: 92,
        optimizationTips: [
          "Cross-train 1 waiter for beverage bar assistance during 7 PM peak.",
          "Schedule head chef shift starting at 5 PM to manage grill line volume.",
          "Stagger waiter break schedules between 3:30 PM - 5:00 PM to minimize dinner rush fatigue."
        ]
      }
    });
  }

  try {
    const prompt = `You are KitchenSync AI Staff Scheduler. Analyze restaurant operations data:
- Total Orders Processed: ${totalOrders}
- Total Revenue Today: $${totalRevenue.toFixed(2)}
- Total Guests Served: ${totalGuests}
- Total Available Menu Items: ${globalStore.menuItems.length}
- Current Active Floor Staff Users: ${globalStore.users.map(u => `${u.name} (${u.role})`).join(', ')}

Analyze order volume patterns and construct an optimal shift staffing plan.
Return a structured JSON object with:
1. "summary": Executive summary of staffing recommendations (2 sentences)
2. "recommendedShifts": Array of 4 to 5 shift objects, each having:
   - "shiftName": String (e.g. "Breakfast Prep", "Lunch Rush", "Dinner Peak")
   - "timeRange": String (e.g. "07:00 AM - 11:30 AM")
   - "predictedVolume": String (e.g. "High (50+ guests)")
   - "recommendedWaiters": Number
   - "recommendedChefs": Number
   - "rationale": String (Specific reasoning based on order volume)
3. "laborCostEfficiencyScore": Number (0-100)
4. "optimizationTips": Array of 3 actionable tips strings.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendedShifts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shiftName: { type: Type.STRING },
                  timeRange: { type: Type.STRING },
                  predictedVolume: { type: Type.STRING },
                  recommendedWaiters: { type: Type.NUMBER },
                  recommendedChefs: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                },
              },
            },
            laborCostEfficiencyScore: { type: Type.NUMBER },
            optimizationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, isFallback: false, schedule: parsed });
  } catch (err: any) {
    console.error('Gemini AI Staff Scheduler Error:', err);
    res.status(500).json({ error: 'Failed to generate AI staff schedule', message: err.message });
  }
});

// Serve Vite dev or static build
async function startServer() {
  if (isSupabaseConfigured) {
    await loadStateFromSupabase();
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KitchenSync server running on http://localhost:${PORT}`);
  });
}

startServer();
