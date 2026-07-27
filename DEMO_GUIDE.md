# KitchenSync Demonstration Guide

Welcome to **KitchenSync**, the unified operations and coordination hub for modern restaurants. This guide provides a step-by-step walkthrough to help you showcase all major capabilities of the platform, including the real-time Kitchen Display System (KDS), waiter order entry, floor layouts, AI operational forecasting, and the developer/sandbox simulation tools.

---

## 🚀 Quick Start Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Launch the Server:**
   ```bash
   npm run dev
   ```
   *The server runs locally at: **http://localhost:3000***

3. **Open Multiple Windows (Recommended for Demonstration):**
   To see real-time state synchronization via Server-Sent Events (SSE), open three separate browser windows or use responsive mobile viewport modes:
   - **Tab 1 (Waiter View)**: Navigate to http://localhost:3000, log in as a waiter (`waiter@kitchensync.com`), and open the Waiter Dashboard.
   - **Tab 2 (Kitchen KDS View)**: Navigate to http://localhost:3000, log in as kitchen staff (`kitchen@kitchensync.com`), and open the Kitchen Display.
   - **Tab 3 (Manager View)**: Navigate to http://localhost:3000, log in as manager (`manager@kitchensync.com`), and open the Manager Dashboard.

---

## 🎭 Persona Walkthroughs

### 1. Waitstaff (Waiter Dashboard)
* **Goal**: Seamless table seating, category filtering, and placing voice-activated orders.
* **Flow**:
  1. Open the **Waiter Dashboard**. You will see the active restaurant floor plan.
  2. Click on any empty table (e.g., Table 9) and click **"Seat Guests"**.
  3. Select the seated table and click **"Take Order"**.
  4. Browse menu items by clicking categories (Appetizers, Mains, Desserts, Beverages). Add a *Wagyu Beef Burger* and a *Truffle Fries* to the cart.
  5. **Voice Recognition**: Click the microphone icon (🎙️) to open the Voice Order Modal. Say a command like: *"Add one Marghertia Pizza and two Elderflower Sodas"* to watch voice parsing input these items directly into the cart.
  6. Click **"Submit Order to Kitchen"** and watch it transfer instantly.

### 2. Kitchen Staff (Kitchen Display System - KDS)
* **Goal**: Real-time ticket queue, station breakdown, and order status updates.
* **Flow**:
  1. Open the **Kitchen Display**. You will see the new ticket populate instantly with a chime.
  2. The ticket is broken down by station (e.g., Grill, Fryer, Pizza Oven, Drinks).
  3. Click **"Start Prep"** to change the order status to preparing.
  4. Once items are cooked, click individual checkmarks to mark items as *Ready*. Once all items are ready, click **"Ready for Service"**.
  5. The waiter receives an instant visual notification that the order is ready to serve.

### 3. Restaurant Manager (Manager Command Center & AI)
* **Goal**: High-level sales analytics, shift notes, floor planning, and AI insights.
* **Flow**:
  1. Open the **Manager Dashboard**.
  2. **Live Revenue Analytics**: View real-time sales performance, average ticket times, and table turn rates.
  3. **Inventory Management**: View stock quantities. If any ingredient is low, it will highlight in red with a warning badge.
  4. **AI Operations Insights**: Click the **"Generate AI Insights"** button. The server leverages Gemini to analyze orders, low inventory, and bottlenecks, returning a dynamic JSON plan of suggestions (or baseline recommendations if offline).
  5. **AI Staff Scheduler**: Click the **"AI Shift Scheduler"** tab to run Gemini-based schedule optimization based on historical guest numbers and revenue volume.

---

## ⚡ Interactive Sandbox Scenarios
Open the **Demo Sandbox Drawer** by clicking the **"⚡ Demo Sandbox"** floating action button in the bottom corner of any dashboard view. 

You can trigger three pre-packaged multi-role scenarios:

### 1. ⚡ Dinner Rush Chaos
* **What it does**: Simulates a sudden rush of customers. Seats 3 empty tables simultaneously, creates complex active orders for each, and triggers a low-stock alert for *Truffle Oil*.
* **Demonstration Value**: Showcases the KDS handling multiple incoming tickets, live table occupancy updates, and visual low-stock warning banners in the manager view all at once.

### 2. ⚠️ Severe Allergy Incident
* **What it does**: Seats a table, places a food order with prominent warning tags, and broadcasts an urgent chef note to the KDS.
* **Demonstration Value**: Demonstrates safety coordination. You will see red allergy warnings inside the kitchen ticket, and a high-priority alert banner floating on the kitchen screen warning the chefs to clean prep lines.

### 3. 🚨 Staffing Crisis & Stock Decay
* **What it does**: Simulates operational friction. Submits two pending waiter applications, drops *Atlantic Salmon* and *Mozzarella* below low stock thresholds, and posts an urgent manager shift handover note.
* **Demonstration Value**: Demonstrates manager-to-staff coordination. Showcases shift handover notifications, recruitment badges, and stock alerts.

### 🔄 Resetting the Sandbox
Click the **"Reset Sandbox to Clean Defaults"** button at the bottom of the drawer at any time. This will clear the temporary state and revert the tables, inventory levels, and order histories to default baselines.
