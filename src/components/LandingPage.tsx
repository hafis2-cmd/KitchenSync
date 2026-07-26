import React from 'react';
import { UtensilsCrossed, ChefHat, LayoutDashboard, UserCheck, Zap, ShieldCheck, Sparkles, Clock, ArrowRight, CheckCircle2, RefreshCcw } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6">
              Floor, Kitchen & Manager <br className="hidden sm:block" />
              <span className="text-blue-600">
                Synced in Real Time.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto font-sans">
              KitchenSync unifies waitstaff, kitchen displays, and management into a single real-time workflow. Eliminate order miscommunications and accelerate table turnover effortlessly.
            </p>

            {/* Role Demo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <button
                id="landing-hero-launch-waiter-btn"
                onClick={() => onSelectRole('waiter')}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Launch Waitstaff View
              </button>

              <button
                id="landing-hero-launch-kitchen-btn"
                onClick={() => onSelectRole('kitchen')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4 text-purple-600" />
                Launch Kitchen KDS
              </button>

              <button
                id="landing-hero-launch-manager-btn"
                onClick={() => onSelectRole('manager')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                Open Manager Hub
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 border-t border-gray-100">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center shadow-sm">
                <p className="text-2xl font-black text-blue-600 font-mono">3.5 min</p>
                <p className="text-xs text-gray-600 font-medium mt-1">Faster Order Delivery</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center shadow-sm">
                <p className="text-2xl font-black text-emerald-600 font-mono">100%</p>
                <p className="text-xs text-gray-600 font-medium mt-1">Real-Time Sync</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center shadow-sm">
                <p className="text-2xl font-black text-purple-600 font-mono">0</p>
                <p className="text-xs text-gray-600 font-medium mt-1">Lost Paper Tickets</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Feature Breakdowns */}
      <section className="py-16 md:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Built specifically for 3 internal roles</h2>
            <p className="text-gray-600 text-sm mt-2">Every staff member gets a customized, distraction-free view tailored to their physical environment on the floor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Waitstaff Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-6">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Waitstaff Tablet Hub</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Interactive floor plan with table statuses (Empty, Occupied, Needs Cleaning, Reserved). Quick order builder with item notes, voice-to-order entry, itemized billing, and real-time "Order Ready" notifications.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Visual table occupation timers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Voice-to-text order creation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Instant payment & table clearing</span>
                  </li>
                </ul>
              </div>

              <button
                id="landing-card-launch-waiter-btn"
                onClick={() => onSelectRole('waiter')}
                className="mt-8 w-full py-3 rounded-xl bg-gray-100 group-hover:bg-blue-600 group-hover:text-white font-bold text-xs text-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Try Waiter View</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Kitchen KDS Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-purple-500 hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-6">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Kitchen Display System</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  High-contrast kitchen display with color-coded urgency timers per order. Item-level prep checkoffs, special allergen alerts, and shift handover note posting.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Color-coded prep timers (Green/Yellow/Red)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>1-Tap item & order status updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Special dietary / kitchen notes highlight</span>
                  </li>
                </ul>
              </div>

              <button
                id="landing-card-launch-kitchen-btn"
                onClick={() => onSelectRole('kitchen')}
                className="mt-8 w-full py-3 rounded-xl bg-gray-100 group-hover:bg-purple-600 group-hover:text-white font-bold text-xs text-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Try Kitchen KDS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Manager Hub Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Manager Operations Hub</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Full control center: digital menu item toggles (instant availability reflect), ingredient stock level tracking, revenue analytics, and Gemini AI operations predictions.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live 86'd item availability toggle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Inventory stock & low threshold alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Gemini AI staff scheduling & demand forecast</span>
                  </li>
                </ul>
              </div>

              <button
                id="landing-card-launch-manager-btn"
                onClick={() => onSelectRole('manager')}
                className="mt-8 w-full py-3 rounded-xl bg-gray-100 group-hover:bg-emerald-600 group-hover:text-white font-bold text-xs text-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Try Manager Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="py-12 border-t border-gray-200 bg-white text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-900 font-mono">KitchenSync SaaS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
