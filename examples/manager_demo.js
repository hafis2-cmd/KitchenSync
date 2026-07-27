/**
 * KitchenSync Manager Hub Section Demo Client
 * 
 * This example simulates the full Manager Dashboard workflow:
 * 1. Establish SSE stream connection to listen for manager-relevant updates (payments, alerts).
 * 2. Retrieve the active state. If no orders are ready to pay, seat Table 5 and place
 *    a mock order, then mark it ready so we have a bill to process.
 * 3. Generate a bill and process payment (transition order status to "billed" and set table to "Needs Cleaning").
 * 4. Simulate a stock level drop for Truffle Oil below threshold to trigger an inventory alert.
 * 5. Request AI operational insights (analyses sales, stock alerts, bottlenecks).
 * 6. Request AI shift scheduler recommendations based on occupancy volumes.
 * 
 * Usage:
 *   node examples/manager_demo.js
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

// 1. SSE Connection for Manager Updates
function startManagerStream() {
  console.log('📡 [Manager Hub] Connecting to real-time events stream...');
  
  const req = http.get(`${BASE_URL}/api/events/stream`, (res) => {
    console.log('✅ [Manager Hub] Connected to real-time stream!\n');
    
    res.on('data', (chunk) => {
      const payloadString = chunk.toString().trim();
      if (!payloadString) return;

      const lines = payloadString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataContent = line.slice(6);
            const eventObj = JSON.parse(dataContent);
            
            // Manager relevant events
            if (eventObj.type === 'bill_paid') {
              const b = eventObj.payload;
              console.log(`🔔 [MANAGER EVENT] 💵 BILL PAID! Table ${b.tableNumber} order billed. Subtotal: $${b.subtotal}, Tax: $${b.tax}, Total Paid: $${b.totalAmount}`);
            } else if (eventObj.type === 'inventory_updated') {
              const item = eventObj.payload;
              const isLow = item.stockQty <= item.lowStockThreshold;
              console.log(`🔔 [MANAGER EVENT] 📦 Inventory Update: "${item.ingredientName}" stock quantity is now ${item.stockQty} ${item.unit}. ${isLow ? '⚠️ [LOW STOCK WARNING]' : ''}`);
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

// 2. Manager Workflow Steps
async function runManagerWorkflow() {
  try {
    console.log('📋 === Starting Manager Hub Section Demo ===');

    // Step A: Find or Create a Billeable Order
    console.log('\nStep A: Checking for ready orders to generate a bill...');
    const state = await getRequest('/api/store/state');
    
    // Look for ready or preparing orders we can bill
    let targetOrder = state.orders.find(o => o.status === 'ready' || o.status === 'preparing' || o.status === 'pending');

    if (!targetOrder) {
      console.log('👉 No active orders. Seating Table 5 and creating a mock order to bill...');
      
      // Seat table 5
      await putRequest('/api/tables/t-5/status', {
        status: 'Occupied',
        assignedWaiterId: 'u-wait-2',
      });
      
      // Create order
      const orderRes = await postRequest('/api/orders', {
        tableId: 't-5',
        tableNumber: 5,
        waiterId: 'u-wait-2',
        waiterName: 'Elena Rostova',
        guestCount: 2,
        customerName: 'Claire Miller',
        kitchenNotes: 'Manager demo order.',
        items: [
          {
            menuItemId: 'm-6', // Mushroom Fettuccine
            menuItemName: 'Creamy Wild Mushroom Fettuccine',
            quantity: 2,
            unitPrice: 24
          }
        ]
      });
      targetOrder = orderRes.order;
      
      // Make it ready
      await putRequest(`/api/orders/${targetOrder.id}/status`, {
        status: 'ready'
      });
      console.log(`✅ Ready order established! Order ID: ${targetOrder.id}, Amount: $${targetOrder.totalAmount}`);
    } else {
      console.log(`✅ Found active order to process: Order ID: ${targetOrder.id}, Table: ${targetOrder.tableNumber}, Amount: $${targetOrder.totalAmount}`);
    }

    await new Promise((r) => setTimeout(r, 1500));

    // Step B: Generate and Pay Bill
    console.log(`\nStep B: Billing Table ${targetOrder.tableNumber} for Order #${targetOrder.id} with a $5 discount...`);
    const billResponse = await postRequest('/api/bills', {
      orderId: targetOrder.id,
      discount: 5,
      paymentMethod: 'card'
    });
    console.log(`✅ Bill created & marked paid! Total billed: $${billResponse.bill.totalAmount} (Original subtotal: $${billResponse.bill.subtotal})`);

    await new Promise((r) => setTimeout(r, 1500));

    // Step C: Trigger Low Stock Level for Truffle Oil
    console.log('\nStep C: Simulating inventory decay for Truffle Oil (inv-2) below low-stock threshold...');
    const truffleOil = state.inventory.find(i => i.ingredientName.includes('Truffle')) || { id: 'inv-2', ingredientName: 'Truffle Oil' };
    const stockUpdate = await putRequest(`/api/inventory/${truffleOil.id}`, {
      stockQty: 1.1 // Below default threshold of 2.0
    });
    console.log(`✅ Truffle Oil stock set to: ${stockUpdate.item.stockQty}L (Threshold: ${stockUpdate.item.lowStockThreshold}L)`);

    await new Promise((r) => setTimeout(r, 1500));

    // Step D: Retrieve AI Insights
    console.log('\nStep D: Querying Gemini AI Operations Command Center for insights...');
    console.log('(Note: Falling back to baseline defaults if GEMINI_API_KEY environment variable is not configured)');
    const insightsRes = await postRequest('/api/ai/insights', {});
    if (insightsRes.success) {
      console.log(`✅ AI Insights generated successfully!`);
      console.log(`👉 Executive Summary:\n   "${insightsRes.insights.operationalSummary}"`);
      console.log(`👉 Recommended Restocks:`);
      insightsRes.insights.inventoryRisk.forEach((r) => {
        console.log(`   - Restock "${r.ingredientName}" (Risk level: ${r.riskLevel})`);
      });
    }

    await new Promise((r) => setTimeout(r, 1500));

    // Step E: Run AI Shift Scheduler
    console.log('\nStep E: Querying Gemini AI Staff Scheduler for optimized shifts...');
    const schedulerRes = await postRequest('/api/ai/scheduler', {});
    if (schedulerRes.success) {
      console.log(`✅ AI Shift Schedule optimized!`);
      console.log(`👉 Labor Score: ${schedulerRes.schedule.laborCostEfficiencyScore}/100`);
      console.log(`👉 Recommended Shift Breakdown:`);
      schedulerRes.schedule.recommendedShifts.slice(0, 3).forEach((shift) => {
        console.log(`   - "${shift.shiftName}" (${shift.timeRange}): floor staff: ${shift.recommendedWaiters}, chefs: ${shift.recommendedChefs}`);
      });
    }

    console.log('\n🎉 Manager Hub Section Demo completed! Bills processed, inventory depleted, and AI insights generated.');
  } catch (err) {
    console.error('❌ Manager demo error:', err.message);
  }
}

// Execute
startManagerStream();
setTimeout(runManagerWorkflow, 1500);
