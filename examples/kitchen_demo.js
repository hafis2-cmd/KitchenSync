/**
 * KitchenSync Kitchen Display Section Demo Client
 * 
 * This example simulates the full Kitchen Display System (KDS) workflow:
 * 1. Establish SSE stream connection to listen for kitchen-relevant updates (new tickets, notes).
 * 2. Retrieve the active state. If no active pending/preparing orders are found,
 *    submit a mock ticket for Table 1 (Margherita Pizza & Truffle Fries) to work on.
 * 3. Start preparation on the order (transition status to "preparing").
 * 4. Update individual item statuses (e.g., Pizza goes to "preparing" then "ready").
 * 5. Complete preparation of the entire order (transition order status to "ready").
 * 6. Post a kitchen shift announcement note for the staff.
 * 
 * Usage:
 *   node examples/kitchen_demo.js
 */

import http from 'http';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helpers for HTTP requests
async function postRequest(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`POST ${path} failed: ${response.status}`);
  return response.json();
}

async function putRequest(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`PUT ${path} failed: ${response.status}`);
  return response.json();
}

async function getRequest(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.json();
}

// 1. SSE Connection for Kitchen Updates
function startKitchenStream() {
  console.log('📡 [Kitchen KDS] Connecting to real-time events stream...');
  
  const req = http.get(`${BASE_URL}/api/events/stream`, (res) => {
    console.log('✅ [Kitchen KDS] Connected to real-time stream!\n');
    
    res.on('data', (chunk) => {
      const payloadString = chunk.toString().trim();
      if (!payloadString) return;

      const lines = payloadString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataContent = line.slice(6);
            const eventObj = JSON.parse(dataContent);
            
            // KDS relevant events
            if (eventObj.type === 'order_placed') {
              const o = eventObj.payload;
              console.log(`🔔 [KITCHEN EVENT] 📥 NEW TICKET RECEIVED! Order #${o.id} for Table ${o.tableNumber}. Notes: "${o.kitchenNotes || 'none'}"`);
            } else if (eventObj.type === 'order_status_updated') {
              const o = eventObj.payload;
              console.log(`🔔 [KITCHEN EVENT] Order #${o.id} Status Updated -> "${o.status}"`);
            } else if (eventObj.type === 'order_item_status_updated') {
              const { order, item } = eventObj.payload;
              console.log(`   👉 Ticket #${order.id} Item update: "${item.menuItemName}" is now "${item.itemStatus}"`);
            } else if (eventObj.type === 'shift_note_added') {
              console.log(`🔔 [KITCHEN EVENT] Chef Announcement: "${eventObj.payload.note}"`);
            }
          } catch (e) {
            // Ignore keep-alives or pings
          }
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ SSE Stream Error:', err.message);
  });
}

// 2. Kitchen KDS Workflow Steps
async function runKitchenWorkflow() {
  try {
    console.log('📋 === Starting Kitchen Display Section Demo ===');

    // Step A: Check for Active Orders
    console.log('\nStep A: Checking for active pending/preparing tickets...');
    const state = await getRequest('/api/store/state');
    let targetOrder = state.orders.find(o => o.status === 'pending' || o.status === 'preparing');

    if (!targetOrder) {
      console.log('👉 No active tickets found. Placing a mock ticket to Table 1 first...');
      
      // Seat table 1
      await putRequest('/api/tables/t-1/status', {
        status: 'Occupied',
        assignedWaiterId: 'u-wait-1',
      });
      
      // Create order
      const newOrderResponse = await postRequest('/api/orders', {
        tableId: 't-1',
        tableNumber: 1,
        waiterId: 'u-wait-1',
        waiterName: 'Marco Silva',
        guestCount: 2,
        customerName: 'KDS Test Table',
        kitchenNotes: 'Test order. Prioritize preparation.',
        items: [
          {
            menuItemId: 'm-4', // Wood-Fired Margherita Pizza
            menuItemName: 'Wood-Fired Margherita Pizza',
            quantity: 1,
            unitPrice: 21,
            notes: 'Extra basil'
          },
          {
            menuItemId: 'm-1', // Truffle Parmesan Fries
            menuItemName: 'Truffle Parmesan Fries',
            quantity: 1,
            unitPrice: 14,
            notes: 'No salt'
          }
        ]
      });
      targetOrder = newOrderResponse.order;
      console.log(`✅ Mock order placed! Order ID: ${targetOrder.id}`);
    } else {
      console.log(`✅ Found active order to process: Order ID: ${targetOrder.id}, Table: ${targetOrder.tableNumber}`);
    }

    await new Promise((r) => setTimeout(r, 1500));

    // Step B: Start Prep
    console.log(`\nStep B: Kitchen starting preparation on Order #${targetOrder.id}...`);
    const statusUpdate = await putRequest(`/api/orders/${targetOrder.id}/status`, {
      status: 'preparing',
    });
    console.log(`✅ Order status: "${statusUpdate.order.status}"`);

    await new Promise((r) => setTimeout(r, 1500));

    // Step C: Update Item Statuses
    console.log('\nStep C: Updating individual ticket item statuses...');
    const pizzaItem = targetOrder.items.find(i => i.menuItemId === 'm-4') || targetOrder.items[0];
    const friesItem = targetOrder.items.find(i => i.menuItemId === 'm-1') || targetOrder.items[1] || targetOrder.items[0];

    // Pizza starts preparing
    console.log(`👉 Pizza item: setting to 'preparing'...`);
    await putRequest(`/api/orders/${targetOrder.id}/items/${pizzaItem.id}/status`, {
      itemStatus: 'preparing'
    });

    await new Promise((r) => setTimeout(r, 1500));

    // Pizza is ready
    console.log(`👉 Pizza item: setting to 'ready'...`);
    await putRequest(`/api/orders/${targetOrder.id}/items/${pizzaItem.id}/status`, {
      itemStatus: 'ready'
    });

    await new Promise((r) => setTimeout(r, 1500));

    // Fries are ready
    if (friesItem && friesItem.id !== pizzaItem.id) {
      console.log(`👉 Fries item: setting to 'ready'...`);
      await putRequest(`/api/orders/${targetOrder.id}/items/${friesItem.id}/status`, {
        itemStatus: 'ready'
      });
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step D: Mark Entire Order as Ready for Service
    console.log(`\nStep D: All items prepped. Marking Order #${targetOrder.id} as READY...`);
    const readyUpdate = await putRequest(`/api/orders/${targetOrder.id}/status`, {
      status: 'ready'
    });
    console.log(`✅ Order #${targetOrder.id} is now: "${readyUpdate.order.status}" (Waitstaff notified)`);

    await new Promise((r) => setTimeout(r, 1500));

    // Step E: Post Kitchen Announcement Note
    console.log('\nStep E: Posting a kitchen shift note handover note...');
    const note = await postRequest('/api/shift-notes', {
      authorName: 'Chef Gordon',
      role: 'kitchen',
      note: 'Wood-fired oven cleaned and re-calibrated. Pizza prep times should be back to 10 mins.',
      priority: 'normal'
    });
    console.log(`✅ Note posted! Note ID: ${note.note.id}`);

    console.log('\n🎉 Kitchen Display Section Demo completed! Ticket prepared and shift notes updated.');
  } catch (err) {
    console.error('❌ Kitchen KDS demo error:', err.message);
  }
}

// Execute
startKitchenStream();
setTimeout(runKitchenWorkflow, 1500);
