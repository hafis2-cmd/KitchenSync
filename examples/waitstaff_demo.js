/**
 * KitchenSync Waitstaff Section Demo Client
 * 
 * This example simulates the full Waitstaff workflow:
 * 1. Establish SSE stream connection to listen for waiter-relevant updates (ready orders, cleaning calls).
 * 2. Reset the sandbox state to clean baseline defaults.
 * 3. Seat Table 9 (set to Occupied and assign to waiter Marco Silva).
 * 4. Attach a custom VIP status note to Table 9.
 * 5. Submit a guest food order containing multiple items and custom notes.
 * 
 * Usage:
 *   node examples/waitstaff_demo.js
 */

import http from 'http';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper for HTTP POST requests
async function postRequest(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`POST ${path} failed: ${response.status}`);
  return response.json();
}

// Helper for HTTP PUT requests
async function putRequest(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`PUT ${path} failed: ${response.status}`);
  return response.json();
}

// 1. SSE Connection for Waitstaff Updates
function startWaitstaffStream() {
  console.log('📡 [Waitstaff] Connecting to real-time events stream...');
  
  const req = http.get(`${BASE_URL}/api/events/stream`, (res) => {
    console.log('✅ [Waitstaff] Connected to real-time stream!\n');
    
    res.on('data', (chunk) => {
      const payloadString = chunk.toString().trim();
      if (!payloadString) return;

      const lines = payloadString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataContent = line.slice(6);
            const eventObj = JSON.parse(dataContent);
            
            // Waitstaff relevant events
            if (eventObj.type === 'table_status_updated') {
              const t = eventObj.payload;
              console.log(`🔔 [WAITSTAFF EVENT] Table ${t.tableNumber} Status Change: -> "${t.status}" (${t.customStatusNote || 'No notes'})`);
            } else if (eventObj.type === 'order_placed') {
              const o = eventObj.payload;
              console.log(`🔔 [WAITSTAFF EVENT] Order placed for Table ${o.tableNumber}. Order ID: ${o.id}, Items: ${o.items.length}`);
            } else if (eventObj.type === 'order_ready') {
              console.log(`🔔 [WAITSTAFF EVENT] 🛎️ ORDER READY! Table ${eventObj.tableNumber} order (#${eventObj.orderId}) is READY at prep counter.`);
            } else if (eventObj.type === 'table_cleaning') {
              console.log(`🔔 [WAITSTAFF EVENT] 🧼 CLEANING CALL! Table ${eventObj.tableNumber} needs clearing.`);
            }
          } catch (e) {
            // Ignore keep-alive or malformed stream pings
          }
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ SSE Stream Error:', err.message);
  });
}

// 2. Waitstaff Workflow Steps
async function runWaitstaffWorkflow() {
  try {
    console.log('📋 === Starting Waitstaff Section Demo ===');

    // Step A: Reset State
    console.log('\nStep A: Resetting store to clean defaults...');
    await postRequest('/api/store/reset', {});
    console.log('✅ Sandbox reset successfully!');

    // Wait a brief moment for reset SSE to broadcast
    await new Promise((r) => setTimeout(r, 1000));

    // Step B: Seat Guests at Table 9
    console.log('\nStep B: Seating guests at Table 9...');
    const tableUpdate = await putRequest('/api/tables/t-9/status', {
      status: 'Occupied',
      assignedWaiterId: 'u-wait-1', // Marco Silva
    });
    console.log(`✅ Table 9 seated. Assigned Waiter: ${tableUpdate.table.assignedWaiterName}`);

    await new Promise((r) => setTimeout(r, 1000));

    // Step C: Attach a VIP Table Note
    console.log('\nStep C: Adding a custom status note to Table 9...');
    const noteUpdate = await putRequest('/api/tables/t-9/status', {
      customStatusNote: 'VIP Guest: Celebrating 10th Anniversary! 🥂',
    });
    console.log(`✅ Note added: "${noteUpdate.table.customStatusNote}"`);

    await new Promise((r) => setTimeout(r, 1000));

    // Step D: Take and Submit Order for Table 9
    console.log('\nStep D: Submitting order (Wagyu Burger & Mint Mojito) for Table 9...');
    const order = await postRequest('/api/orders', {
      tableId: 't-9',
      tableNumber: 9,
      waiterId: 'u-wait-1',
      waiterName: 'Marco Silva',
      guestCount: 2,
      customerName: 'Mr. & Mrs. Sterling',
      kitchenNotes: 'VIP table. Toasting champagne. Prepare dessert order later.',
      items: [
        {
          menuItemId: 'm-3', // Wagyu Beef Burger
          menuItemName: 'Wagyu Beef Burger',
          quantity: 2,
          unitPrice: 26,
          notes: 'One medium rare, one medium-well',
        },
        {
          menuItemId: 'm-9', // Signature Mint Mojito
          menuItemName: 'Signature Mint Mojito',
          quantity: 2,
          unitPrice: 13,
          notes: 'Extra mint, light rum',
        },
      ],
    });
    console.log(`✅ Order placed! Order ID: ${order.order.id}, Status: "${order.order.status}"`);

    console.log('\n🎉 Waitstaff Section Demo completed! Table is occupied and KDS ticket has been created.');
  } catch (err) {
    console.error('❌ Waitstaff demo error:', err.message);
  }
}

// Execute
startWaitstaffStream();
setTimeout(runWaitstaffWorkflow, 1500);
