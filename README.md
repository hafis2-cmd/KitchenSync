Team sayujstaji : 
> **Team Members**:
> - Sayuj Staji
> - Ajishna Jaison
> - Hafis Mohammed K
> - Rahul Prakash

---

# 🍽️ KitchenSync

> **Unified Enterprise Restaurant Operations Coordination Hub**  
> A real-time, multi-role restaurant management platform that synchronizes waitstaff ordering, Kitchen Display Systems (KDS), digital menu management, and manager command operations with integrated Google Gemini AI intelligence and live Server-Sent Events (SSE).

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://c-dusky.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

---

## 🚀 Newly Added Features (Phase 2 Upgrade)

### 🔐 1. Multi-Role Authentication & Session Persistence
- **Tabbed Auth Portal (`AuthModal.tsx`)**: Unified Log In, Sign Up, and Demo Accounts switcher.
- **Role Selection & Strength Meter**: Password strength scoring, password confirmation, and forgot password recovery.
- **Role Access Control (`authPermissions.ts`)**: Strict capability checks and Manager PIN elevation (`1234`).
- **Session Persistence**: Automatic session restoration on browser reload backed by `localStorage`.

### 📄 2. Branded PDF Receipt Export & Split Billing
- **PDF Receipt Engine (`WaiterDashboard.tsx`)**: Integrated `jsPDF` and `jspdf-autotable` to generate downloadable itemized receipts (`Receipt_Table_X.pdf`).
- **Calculations**: Itemized unit prices, subtotal, 10% tax, discount adjustments, and payment method indicators (`Card`, `Cash`, `UPI`).

### 🍳 3. KDS Station Routing & Countdown Timers
- **Prep Station Filtering (`KitchenDisplay.tsx`)**: Filter tickets by line stations (`Grill & Mains`, `Pantry & Starters`, `Pastry & Desserts`, `Bar & Beverages`).
- **Visual Urgency Timers**: Live color-coded countdown indicators:
  - 🟢 **On Track** (`< 8 mins`)
  - 🟡 **Attention Needed** (`8 - 15 mins`)
  - 🔴 **Urgent / Overdue** (`> 15 mins`)

### ⚡ 4. 1-Click AI Inventory Restock Advisor
- **Gemini AI Restock Banner (`ManagerDashboard.tsx`)**: Detects low stock levels (`Truffle Oil`, `Mozzarella`, `Salmon`).
- **Automated Purchase Orders**: **⚡ 1-Click AI Restock All Low Stock** button to issue automated supplier reorders in a single tap.

### 📱 5. Interactive Customer QR Self-Order Simulator
- **Guest Self-Order Mode (`TableQRModal.tsx`)**: Digital customer ordering simulator enabling guests to:
  - Select table number & guest count.
  - Browse digital menu items & adjust quantities.
  - Add special dietary/allergen notes.
  - Submit orders directly to the KDS queue, automatically updating table status to `Occupied`.

### 🍽️ 6. Manager Add New Dish Control
- **Live Dish Creation (`ManagerDashboard.tsx`)**: Managers can add new menu items with price, category, preparation time, description, ingredients, and custom image URLs.
- **Live Multi-Role Sync**: Newly created dishes immediately sync across all Waitstaff POS screens, KDS prep stations, and Customer QR Ordering views via SSE streams.

### 📱 7. Perfect Mobile View & iOS Ergonomics
- **Touch Ergonomics**: `min-h-[44px]` tap targets on all inputs, select boxes, and submit buttons.
- **iOS Safari Auto-Zoom Fix**: `text-base sm:text-xs` sizing prevents canvas shifts during mobile keyboard focus.
- **Viewport-Safe Containers**: `max-h-[90vh] overflow-y-auto` modals and non-overlapping toast alert layers (`z-40` vs `z-50`).

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React (Icons), Recharts (Analytics), jsPDF & jspdf-autotable (PDF Engine), Canvas-Confetti.
* **Backend**: Node.js, Express.js, TypeScript, Server-Sent Events (SSE) for 100ms real-time multi-client synchronization.
* **Database & Auth**: Supabase (PostgreSQL & Auth) with in-memory global state fallback for zero-downtime offline operation.
* **AI Integration**: `@google/genai` (Gemini 2.5 Flash / 1.5 Pro) for inventory depletion risk auditing and voice order dictation parsing.

---

## 📂 Directory Structure

```
kitchensyn/
├── dist/                   # Production build outputs
├── examples/               # Role-specific programmatic walkthrough clients
│   ├── waitstaff_demo.js   # Seats table & places orders
│   ├── kitchen_demo.js     # Starts prep, marks items ready, posts notes
│   ├── manager_demo.js     # Payments, inventory decay, AI insights runs
│   └── api_requests.http   # VS Code REST client playbook
├── src/                    # React SPA Frontend
│   ├── components/         # Views and UI modals
│   │   ├── kitchen/        # KDS Display tickets & prep station filters
│   │   ├── manager/        # AI Scheduler, Analytics, Floor planner, Dish creator
│   │   └── waiter/         # Seating charts, voice ordering, PDF billing
│   ├── lib/                # Auth controls, API client endpoints
│   ├── types/              # TypeScript interface definitions
│   └── App.tsx             # Root Layout, Suspense Lazy Loading, and SSE listener
├── server.ts               # Express Server & SSE Event Registry
├── vercel.json             # Vercel SPA routing redirects configuration
└── supabase_schema.sql     # Postgres SQL definitions for database caching
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18+) installed.

### 2. Installation
```bash
git clone https://github.com/hafis2-cmd/KitchenSync.git
cd kitchensyn
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Gemini API Access (Optional - Falls back to mock data if omitted)
GEMINI_API_KEY="your-gemini-api-key-here"

# Supabase Storage Credentials (Optional - Runs in-memory if omitted)
SUPABASE_URL="your-supabase-project-url"
SUPABASE_KEY="your-supabase-service-role-key"
```

### 4. Run the Dev Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Production Deployment

- **Frontend (Vercel)**: Deployed at **[c-dusky.vercel.app](https://c-dusky.vercel.app)**
- **Backend API (Render)**: Express web service serving SSE event streams.
- **GitHub Repository**: **[https://github.com/hafis2-cmd/KitchenSync.git](https://github.com/hafis2-cmd/KitchenSync.git)**
