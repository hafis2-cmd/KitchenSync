/**
 * KitchenSync API & SSE Demonstration Client
 * 
 * This example shows how to:
 * 1. Establish a Server-Sent Events (SSE) stream connection to listen for real-time updates.
 * 2. Query REST API endpoints (Fetch state, submit a mock order, and trigger AI operational forecasting).
 * 
 * Usage:
 *   node examples/api_demo.js
 */

import http from 'http';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper for HTTP POST requests using native fetch (supported in Node.js 18+)
async function postRequest(path, payload) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ POST ${path} failed:`, error.message);
    throw error;
  }
}

// Helper for HTTP GET requests
async function getRequest(path) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ GET ${path} failed:`, error.message);
    throw error;
  }
}

// 1. Establish SSE Connection
function startRealtimeStream() {
  console.log('\n📡 Establishing connection to real-time events stream...');
  
  const req = http.get(`${BASE_URL}/api/events/stream`, (res) => {
    console.log('✅ Connected to KitchenSync real-time event stream!\n');
    
    res.on('data', (chunk) => {
      const payloadString = chunk.toString().trim();
      if (!payloadString) return;

      // Parse SSE lines. Standard format: "data: { ...JSON... }\n\n"
      const lines = payloadString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataContent = line.slice(6); // Remove "data: " prefix
            const eventObj = JSON.parse(dataContent);
            console.log(`\n🔔 [REAL-TIME EVENT DETECTED] Type: "${eventObj.type}"`);
            
            // Log specific event contexts
            if (eventObj.type === 'order_placed') {
              console.log(`   👉 New Order Submitted! Order ID: ${eventObj.payload.id}, Table: ${eventObj.payload.tableNumber}, Total: $${eventObj.payload.totalAmount}`);
            } else if (eventObj.type === 'inventory_updated') {
              console.log(`   👉 Stock Level Alert! Ingredient: "${eventObj.payload.ingredientName}", Current stock: ${eventObj.payload.stockQty}`);
            } else if (eventObj.type === 'shift_note_added') {
              console.log(`   👉 Shift Note Posted by ${eventObj.payload.authorName}: "${eventObj.payload.note}"`);
            }
          } catch (e) {
            // Ignore parse errors from connect/keep-alive pings
          }
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ SSE Connection Error:', err.message);
    console.log('Ensure the server is running by executing: npm run dev');
  });
}

// 2. Perform Scenario Simulation REST calls
async function runDemos() {
  try {
    console.log('📋 --- KitchenSync API Demo ---');

    // Step A: Fetch Active Restaurant State
    console.log('\nStep A: Fetching current restaurant state...');
    const state = await getRequest('/api/store/state');
    console.log(`👉 Users registered: ${state.users.length}`);
    console.log(`👉 Tables tracking: ${state.tables.length}`);
    console.log(`👉 Active orders: ${state.orders.length}`);

    // Step B: Submit a new order
    console.log('\nStep B: Submitting a new custom order...');
    // We select table 6 (an empty table)
    const tableToSeat = state.tables.find(t => t.tableNumber === 6) || state.tables[0];
    const orderResponse = await postRequest('/api/orders', {
      tableId: tableToSeat.id,
      tableNumber: tableToSeat.tableNumber,
      waiterId: 'u-wait-1',
      waiterName: 'Marco Silva',
      guestCount: 2,
      customerName: 'API Demo Client',
      kitchenNotes: 'Order submitted programmatically via examples/api_demo.js',
      items: [
        {
          menuItemId: 'm-3', // Wagyu Beef Burger
          menuItemName: 'Wagyu Beef Burger',
          quantity: 1,
          unitPrice: 26,
          notes: 'Well done'
        },
        {
          menuItemId: 'm-10', // Sparkling Elderflower Soda
          menuItemName: 'Sparkling Elderflower Soda',
          quantity: 2,
          unitPrice: 8
        }
      ]
    });
    console.log(`✅ Order successfully submitted! Order ID: ${orderResponse.order.id}`);

    // Step C: Trigger AI Operational Insights
    console.log('\nStep C: Fetching AI operational forecasting insights...');
    console.log('(Note: If no GEMINI_API_KEY is configured, this will return baseline fallbacks).');
    const aiResponse = await postRequest('/api/ai/insights', {});
    if (aiResponse.success) {
      console.log(`✅ Insights successfully generated! (Fallback mode: ${aiResponse.isFallback})`);
      console.log(`👉 Executive Summary:\n   "${aiResponse.insights.operationalSummary}"`);
      console.log('\n👉 Top Inventory Depletion Risks:');
      aiResponse.insights.inventoryRisk.forEach((risk) => {
        console.log(`   - ${risk.ingredientName}: Estimated depletion in ${risk.hoursLeft} hours (${risk.riskLevel} risk).`);
      });
    }

    console.log('\n🎉 API Operations checks completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo run aborted due to error.');
  }
}

// Run the script
startRealtimeStream();

// Stagger the REST calls slightly to allow the SSE channel to open first
setTimeout(runDemos, 1500);
