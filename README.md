# 🍽️ KitchenSync

> **Unified Restaurant Operations Coordination Hub**  
> A real-time, multi-role restaurant management platform that synchronizes waitstaff ordering, Kitchen Display Systems (KDS), and manager command operations with integrated Google Gemini AI intelligence.

---

## 🚀 Key Features

KitchenSync provides custom tailored workspaces for three core restaurant roles:

### 1. 📋 Waitstaff Dashboard
* **Floor Plan Layout**: Visual restaurant seating layout showing real-time table statuses (`Empty`, `Occupied`, `Needs Cleaning`, `Reserved`).
* **Digital Menu & Ordering**: Easy-to-use categorised menu selection with quantities and special preparation notes.
* **🎙️ AI Voice Ordering**: Integrated Web Speech voice recognition module that parses verbal commands (e.g., *"Add one Wagyu Burger and two sodas"*) directly into the customer cart.
* **Ready-to-Serve Notifications**: Visual and audio chime warnings when the kitchen finishes preparing a table's order.

### 2. 🍳 Kitchen Display System (KDS)
* **Ticket Prep Queue**: Incoming tickets sorted by order time with countdown timers.
* **Station Breakdown**: Orders are organized by preparation station (Grill, Fryer, Pizza, Drinks) with individual check-offs.
* **Urgent Alerts**: Floating high-priority banners for allergen warnings or manager shift announcements.

### 3. 📊 Manager Command Center
* **Operational Analytics**: Live revenue charts, average ticket completion speeds, and guest volume tracking.
* **Inventory Control**: Live tracking of ingredient levels with automated low-stock warnings when levels fall below thresholds.
* **✨ Gemini AI Insights**: Leverage the Google GenAI SDK to generate detailed inventory risks, kitchen bottlenecks, and executive operational suggestions.
* **📅 AI Staff Scheduler**: Generate optimized employee shift plans automatically based on sales performance and guest turnover patterns.
* **Floor Plan Editor**: Built-in drag-and-drop coordinate floor editor to modify tables, capacities, and shapes on the fly.

### ⚡ Developer Sandbox
An interactive, collapsible simulation sidebar that allows developers to trigger multi-role conditions instantly:
* **Dinner Rush Chaos**: Seats multiple empty tables, places complex food tickets, and triggers Truffle Oil stock depletion.
* **Allergy Incident**: Places orders with peanut/gluten warnings and broadcasts urgent alerts to KDS screens.
* **Staffing Crisis**: Submits mock waiter candidates, triggers Mozzarella/Salmon low-stock alerts, and posts handover alerts.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite 6, Tailwind CSS, Lucide React (Icons), Recharts (Analytics).
* **Backend**: Express.js (Node), tsx (TypeScript Execution), Server-Sent Events (SSE) for 100ms real-time multi-client synchronization.
* **Database/Cache**: In-memory store with optional Supabase write-through caching.
* **AI Integration**: `@google/genai` (Gemini 3.6 Flash / 3.5 Flash).

---

## 📂 Directory Structure

```
kitchensyn/
├── dist/                   # Production build outputs
├── examples/               # Role-specific programmatic walkthrough clients
│   ├── api_demo.js         # Basic REST & SSE event subscriber
│   ├── waitstaff_demo.js   # Seats table & places orders
│   ├── kitchen_demo.js     # Starts prep, marks items ready, posts notes
│   ├── manager_demo.js     # Payments, inventory decay, AI insights runs
│   └── api_requests.http   # VS Code REST client HTTP requests playbook
├── public/                 # Static assets
├── src/                    # React SPA Frontend
│   ├── components/         # Views and UI modals
│   │   ├── kitchen/        # KDS Display tickets & components
│   │   ├── manager/        # AI Scheduler, Analytics, Floor planner
│   │   └── waiter/         # Seating charts, voice ordering, menus
│   ├── lib/                # Auth controls, API client endpoints
│   ├── types/              # TypeScript interface definitions
│   └── App.tsx             # Root Layout, Sandbox UI, and SSE listener
├── server.ts               # Express Server & SSE Event Registry
├── vercel.json             # Vercel SPA routing redirects configuration
└── supabase_schema.sql     # Postgres SQL definitions for database caching
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18+) or [Bun](https://bun.sh) installed.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/hafis2-cmd/KitchenSync.git
cd kitchensyn
npm install
```

### 3. Environment Configuration
Create a `.env.local` or `.env` file in the root directory:
```env
# Gemini API Access (Optional - Falls back to mock data if omitted)
GEMINI_API_KEY="your-gemini-api-key-here"

# Supabase Storage Credentials (Optional - Runs in-memory if omitted)
SUPABASE_URL="your-supabase-project-url"
SUPABASE_KEY="your-supabase-service-role-key"
```

### 4. Run the Dev Server
Start the Express API server and Vite dev frontend:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 💻 Programmatic Section Demos

For automated testing or developer integration, you can run any of the simulation clients located in the `examples/` directory while the server is active:

```bash
# Simulates waitstaff seating and ordering
node examples/waitstaff_demo.js

# Simulates cooking prep, ticking off items, and KDS note announcements
node examples/kitchen_demo.js

# Simulates billing checkout, inventory alert triggers, and AI insight evaluations
node examples/manager_demo.js
```

---

## 🌐 Production Deployment

The project is structured to easily split-deploy across static hosts (like Vercel) and web service runners (like Render):

* **Frontend (Vercel)**:
  - Deploys as a static SPA.
  - Automatically redirects API requests to the Render backend API using the `VITE_API_URL` environment variable, falling back automatically to `https://kitchensync-xxnc.onrender.com`.
  - Routing handles rewrites locally through the `vercel.json` configuration.
* **Backend (Render)**:
  - Deploys as an Express Web Service.
  - Build command: `npm run build`
  - Start command: `npm run start` (runs the bundled `dist/server.cjs` file which serves the assets and hosts real-time SSE streams).
