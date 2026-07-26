-- KitchenSync Supabase Schema Migration Script
-- Copy and paste this script into your Supabase SQL Editor to initialize all tables.

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS shift_notes CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'unassigned',
    phone TEXT,
    avatar TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval',
    assigned_tables INT[] DEFAULT '{}',
    requested_role TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Menu Items Table
CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    ingredients TEXT[] DEFAULT '{}',
    prep_time_minutes INT NOT NULL DEFAULT 15,
    image_url TEXT
);

-- 3. Restaurant Tables Table
CREATE TABLE restaurant_tables (
    id TEXT PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Empty',
    assigned_waiter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_waiter_name TEXT,
    current_order_id TEXT,
    occupied_since TIMESTAMPTZ,
    reservation_name TEXT,
    reservation_time TEXT,
    custom_status_note TEXT,
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    shape TEXT NOT NULL DEFAULT 'square'
);

-- 4. Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    table_id TEXT REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    table_number INT NOT NULL,
    waiter_id TEXT NOT NULL,
    waiter_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    customer_name TEXT,
    guest_count INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    preparing_started_at TIMESTAMPTZ,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    kitchen_notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 5. Inventory Table
CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    ingredient_name TEXT UNIQUE NOT NULL,
    stock_qty NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_stock_threshold NUMERIC NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    last_restocked TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bills Table
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    table_number INT NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'paid',
    payment_method TEXT NOT NULL DEFAULT 'card',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Shift Notes Table
CREATE TABLE shift_notes (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    role TEXT NOT NULL,
    note TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    priority TEXT NOT NULL DEFAULT 'normal'
);

-- 8. Shifts Table
CREATE TABLE shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    shift_start TEXT NOT NULL,
    shift_end TEXT NOT NULL,
    assigned_tables INT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'scheduled'
);

-- Enable Row Level Security (RLS) policies if needed, or allow read/write access for now.
-- In Supabase, the default behavior for new tables is that RLS is disabled unless enabled.
-- We will leave RLS disabled for simplicity to allow the service role/anon key access.

-- Pre-populate Initial Mock Data
-- 1. Users
INSERT INTO users (id, name, email, password, role, phone, avatar, status, assigned_tables, requested_role) VALUES
('u-mgr-1', 'Alex Rivera', 'manager@kitchensync.com', 'password123', 'manager', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'active', '{1,2,3,4,5,6,7,8,9,10}', 'manager'),
('u-wait-1', 'Marco Silva', 'waiter@kitchensync.com', 'password123', 'waiter', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', 'active', '{1,2,3,4}', 'waiter'),
('u-wait-2', 'Elena Rostova', 'elena@kitchensync.com', 'password123', 'waiter', '+1 (555) 456-7890', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', 'active', '{5,6,7,8}', 'waiter'),
('u-kit-1', 'Chef Gordon', 'kitchen@kitchensync.com', 'password123', 'kitchen', '+1 (555) 567-8901', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200', 'active', '{}', 'kitchen');

-- 2. Menu Items
INSERT INTO menu_items (id, name, price, category, description, is_available, ingredients, prep_time_minutes, image_url) VALUES
('m-1', 'Truffle Parmesan Fries', 14, 'Appetizers', 'Hand-cut russet potatoes, white truffle oil, grated Parmigiano-Reggiano, fresh herbs.', true, '{"French Fries", "Truffle Oil", "Parmesan Cheese"}', 10, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400'),
('m-2', 'Crispy Calamari Rings', 18, 'Appetizers', 'Wild-caught squid, light tempura batter, roasted garlic aioli and lemon zest.', true, '{"Calamari", "Garlic Aioli", "Lemon"}', 12, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=400'),
('m-3', 'Wagyu Beef Burger', 26, 'Mains', '8oz American Wagyu patty, aged cheddar, caramelized onions, brioche bun.', true, '{"Wagyu Beef Patties", "Brioche Buns", "Aged Cheddar"}', 18, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'),
('m-4', 'Wood-Fired Margherita Pizza', 21, 'Mains', 'San Marzano tomato sauce, fresh mozzarella di bufala, torn basil, extra virgin olive oil.', true, '{"Fresh Mozzarella", "Fresh Basil", "Pizza Dough"}', 15, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80&w=400'),
('m-5', 'Pan-Seared Atlantic Salmon', 32, 'Mains', 'Wild Atlantic salmon fillet, lemon-butter reduction, asparagus risotto.', true, '{"Salmon Fillets", "Heavy Cream", "Asparagus"}', 20, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=400'),
('m-6', 'Creamy Wild Mushroom Fettuccine', 24, 'Mains', 'House-made fettuccine pasta, chanterelle & cremini mushrooms, garlic cream, truffle butter.', true, '{"Fettuccine Pasta", "Heavy Cream", "Truffle Oil"}', 16, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281824?auto=format&fit=crop&q=80&w=400'),
('m-7', 'Classic Tiramisu', 12, 'Desserts', 'Espresso-soaked ladyfingers, mascarpone cream, cocoa powder dust.', true, '{"Espresso Beans", "Heavy Cream", "Ladyfingers"}', 5, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400'),
('m-8', 'Molten Chocolate Lava Cake', 14, 'Desserts', 'Warm Valrhona chocolate cake with molten center, Madagascar vanilla bean ice cream.', true, '{"Heavy Cream", "Valrhona Chocolate"}', 14, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400'),
('m-9', 'Signature Mint Mojito', 13, 'Beverages', 'White rum, fresh lime juice, crushed mint leaves, cane sugar syrup, club soda.', true, '{"Fresh Mint", "Lime Juice", "Club Soda"}', 5, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400'),
('m-10', 'Sparkling Elderflower Soda', 8, 'Beverages', 'Artisanal elderflower syrup, sparkling mineral water, fresh mint & cucumber ribbon.', true, '{"Elderflower Syrup", "Club Soda", "Fresh Mint"}', 4, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=400');

-- 3. Restaurant Tables
INSERT INTO restaurant_tables (id, table_number, capacity, status, assigned_waiter_id, assigned_waiter_name, current_order_id, occupied_since, reservation_name, reservation_time, custom_status_note, position_x, position_y, shape) VALUES
('t-1', 1, 2, 'Occupied', 'u-wait-1', 'Marco Silva', 'ord-101', NOW() - INTERVAL '55 minutes', NULL, NULL, 'Birthday Celebration 🎉', 80, 80, 'round'),
('t-2', 2, 4, 'Occupied', 'u-wait-1', 'Marco Silva', 'ord-102', NOW() - INTERVAL '15 minutes', NULL, NULL, NULL, 280, 80, 'square'),
('t-3', 3, 4, 'Needs Cleaning', 'u-wait-1', 'Marco Silva', NULL, NULL, NULL, NULL, NULL, 480, 80, 'square'),
('t-4', 4, 6, 'Reserved', 'u-wait-1', 'Marco Silva', NULL, NULL, 'Johnson Party (6)', '19:30', NULL, 680, 80, 'rectangle'),
('t-5', 5, 2, 'Occupied', 'u-wait-2', 'Elena Rostova', 'ord-103', NOW() - INTERVAL '48 minutes', NULL, NULL, 'Gluten & Nut Allergy ⚠️', 80, 260, 'round'),
('t-6', 6, 4, 'Empty', 'u-wait-2', 'Elena Rostova', NULL, NULL, NULL, NULL, NULL, 280, 260, 'square'),
('t-7', 7, 8, 'Empty', 'u-wait-2', 'Elena Rostova', NULL, NULL, NULL, NULL, NULL, 500, 260, 'rectangle'),
('t-8', 8, 2, 'Reserved', 'u-wait-2', 'Elena Rostova', NULL, NULL, 'Dr. Emily Vance', '20:00', NULL, 720, 260, 'round'),
('t-9', 9, 4, 'Empty', 'u-wait-1', 'Marco Silva', NULL, NULL, NULL, NULL, NULL, 180, 440, 'square'),
('t-10', 10, 6, 'Empty', 'u-wait-2', 'Elena Rostova', NULL, NULL, NULL, NULL, NULL, 440, 440, 'rectangle');

-- 4. Orders
INSERT INTO orders (id, table_id, table_number, waiter_id, waiter_name, status, customer_name, guest_count, created_at, preparing_started_at, total_amount, kitchen_notes, items) VALUES
('ord-101', 't-1', 1, 'u-wait-1', 'Marco Silva', 'preparing', 'Sarah Jenkins', 2, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '18 minutes', 52, 'Allergy alert: No dairy in appetizer if possible.', '[
  {"id": "oi-1", "menuItemId": "m-1", "menuItemName": "Truffle Parmesan Fries", "quantity": 1, "unitPrice": 14, "notes": "Extra crispy", "itemStatus": "ready", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-2", "menuItemId": "m-3", "menuItemName": "Wagyu Beef Burger", "quantity": 1, "unitPrice": 26, "notes": "Medium rare", "itemStatus": "preparing", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-3", "menuItemId": "m-9", "menuItemName": "Signature Mint Mojito", "quantity": 1, "unitPrice": 12, "notes": "Less ice", "itemStatus": "served", "updatedAt": "2026-07-26T12:00:00Z"}
]'::jsonb),
('ord-102', 't-2', 2, 'u-wait-1', 'Marco Silva', 'pending', 'David Lee', 4, NOW() - INTERVAL '10 minutes', NULL, 112, 'VIP guest table, prioritize entrée delivery.', '[
  {"id": "oi-4", "menuItemId": "m-2", "menuItemName": "Crispy Calamari Rings", "quantity": 2, "unitPrice": 18, "notes": "Extra lemon slices", "itemStatus": "pending", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-5", "menuItemId": "m-4", "menuItemName": "Wood-Fired Margherita Pizza", "quantity": 1, "unitPrice": 21, "notes": "Add chili flakes", "itemStatus": "pending", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-6", "menuItemId": "m-5", "menuItemName": "Pan-Seared Atlantic Salmon", "quantity": 1, "unitPrice": 32, "notes": "Sauce on side", "itemStatus": "pending", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-7", "menuItemId": "m-10", "menuItemName": "Sparkling Elderflower Soda", "quantity": 3, "unitPrice": 8, "notes": "", "itemStatus": "ready", "updatedAt": "2026-07-26T12:00:00Z"}
]'::jsonb),
('ord-103', 't-5', 5, 'u-wait-2', 'Elena Rostova', 'ready', 'Claire Miller', 2, NOW() - INTERVAL '35 minutes', NULL, 62, 'Table requested bill right after main course.', '[
  {"id": "oi-8", "menuItemId": "m-6", "menuItemName": "Creamy Wild Mushroom Fettuccine", "quantity": 2, "unitPrice": 24, "notes": "Extra parmesan", "itemStatus": "ready", "updatedAt": "2026-07-26T12:00:00Z"},
  {"id": "oi-9", "menuItemId": "m-7", "menuItemName": "Classic Tiramisu", "quantity": 1, "unitPrice": 14, "notes": "2 spoons", "itemStatus": "ready", "updatedAt": "2026-07-26T12:00:00Z"}
]'::jsonb);

-- 5. Inventory
INSERT INTO inventory (id, ingredient_name, stock_qty, unit, low_stock_threshold, cost_per_unit, last_restocked) VALUES
('inv-1', 'Wagyu Beef Patties', 18, 'pcs', 10, 8.5, NOW() - INTERVAL '48 hours'),
('inv-2', 'Truffle Oil', 1.2, 'liters', 2.0, 45.0, NOW() - INTERVAL '72 hours'),
('inv-3', 'Fresh Mozzarella', 8, 'kg', 5, 12.0, NOW() - INTERVAL '24 hours'),
('inv-4', 'Salmon Fillets', 12, 'pcs', 8, 14.0, NOW() - INTERVAL '12 hours'),
('inv-5', 'Fresh Basil', 0.5, 'kg', 0.8, 15.0, NOW() - INTERVAL '36 hours'),
('inv-6', 'Fettuccine Pasta', 15, 'kg', 5, 4.0, NOW() - INTERVAL '96 hours'),
('inv-7', 'Espresso Beans', 6, 'kg', 3, 22.0, NOW() - INTERVAL '120 hours'),
('inv-8', 'French Fries', 25, 'kg', 10, 2.5, NOW() - INTERVAL '24 hours');

-- 6. Bills
INSERT INTO bills (id, order_id, table_number, subtotal, tax, discount, total_amount, payment_status, payment_method, created_at) VALUES
('bill-99', 'ord-099', 4, 140, 14, 10, 144, 'paid', 'card', NOW() - INTERVAL '120 minutes');

-- 7. Shift Notes
INSERT INTO shift_notes (id, author_name, role, note, timestamp, priority) VALUES
('note-1', 'Chef Gordon', 'kitchen', 'Prepped 30 Wagyu patties for dinner service. Need extra basil delivery by 6 PM.', NOW() - INTERVAL '3 hours', 'normal'),
('note-2', 'Alex Rivera', 'manager', 'Concert at city arena tonight. Expect heavy table turnover between 7:00 PM and 9:30 PM.', NOW() - INTERVAL '1 hour', 'urgent');

-- 8. Shifts
INSERT INTO shifts (id, user_id, user_name, role, shift_start, shift_end, assigned_tables, status) VALUES
('sh-1', 'u-wait-1', 'Marco Silva', 'waiter', '16:00', '23:00', '{1,2,3,4}', 'active'),
('sh-2', 'u-wait-2', 'Elena Rostova', 'waiter', '17:00', '23:30', '{5,6,7,8}', 'active'),
('sh-3', 'u-kit-1', 'Chef Gordon', 'kitchen', '15:00', '23:00', '{}', 'active');
