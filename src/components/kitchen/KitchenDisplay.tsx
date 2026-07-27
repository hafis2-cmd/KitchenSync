import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, AlertTriangle, CheckCircle2, Flame, MessageSquarePlus, Send, Bell, Check, Sparkles, Filter, Package, X, Plus, CheckCheck, Archive } from 'lucide-react';
import { Order, OrderItem, ShiftHandoverNote, User, InventoryItem } from '../../types';
import { updateOrderStatus, updateOrderItemStatus, addShiftNote, updateInventoryStock, clearReadyOrders } from '../../lib/api';

interface KitchenDisplayProps {
  currentUser: User | null;
  orders: Order[];
  shiftNotes: ShiftHandoverNote[];
  inventory?: InventoryItem[];
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ currentUser, orders = [], shiftNotes = [], inventory = [] }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [newNoteText, setNewNoteText] = useState('');
  const [notePriority, setNotePriority] = useState<'normal' | 'urgent'>('normal');
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [dismissedToast, setDismissedToast] = useState(false);
  const [isClearingReady, setIsClearingReady] = useState(false);

  // Filter low stock items
  const lowStockItems = inventory.filter((item) => item.stockQty <= item.lowStockThreshold);

  // Reset toast dismissal if low stock count changes
  useEffect(() => {
    if (lowStockItems.length > 0) {
      setDismissedToast(false);
    }
  }, [lowStockItems.length]);

  const handleQuickRestock = async (id: string, currentQty: number) => {
    await updateInventoryStock(id, currentQty + 10);
  };

  // Live timer tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'billed' && o.status !== 'served' && o.status !== 'cancelled');

  const filteredOrders = activeOrders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  // Station Load Calculation (Items currently in 'preparing' status for each station)
  const stationCounts = {
    'Grill & Mains': { count: 0, icon: Flame, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
    'Pantry & Starters': { count: 0, icon: Package, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
    'Pastry & Desserts': { count: 0, icon: Sparkles, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
    'Bar & Beverages': { count: 0, icon: Bell, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  };

  (orders || []).forEach((o) => {
    if (o.status === 'preparing' || o.status === 'pending') {
      (o.items || []).forEach((it) => {
        if (it.itemStatus === 'preparing' || (o.status === 'preparing' && it.itemStatus === 'pending')) {
          const name = it.menuItemName.toLowerCase();
          const qty = it.quantity || 1;
          if (name.includes('wine') || name.includes('beer') || name.includes('coke') || name.includes('water') || name.includes('drink') || name.includes('cocktail') || name.includes('juice') || name.includes('espresso') || name.includes('soda') || name.includes('tea')) {
            stationCounts['Bar & Beverages'].count += qty;
          } else if (name.includes('cake') || name.includes('tiramisu') || name.includes('creme') || name.includes('pie') || name.includes('gelato') || name.includes('tart') || name.includes('panna')) {
            stationCounts['Pastry & Desserts'].count += qty;
          } else if (name.includes('soup') || name.includes('salad') || name.includes('calamari') || name.includes('wings') || name.includes('bruschetta') || name.includes('tartare') || name.includes('fries') || name.includes('bread')) {
            stationCounts['Pantry & Starters'].count += qty;
          } else {
            stationCounts['Grill & Mains'].count += qty;
          }
        }
      });
    }
  });

  const totalPreparingItems = Object.values(stationCounts).reduce((acc, curr) => acc + curr.count, 0);

  const getElapsedMinutes = (createdAt: string) => {
    const diffMs = nowTimestamp - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Status transitions
  const handleStartOrderPrep = async (orderId: string) => {
    await updateOrderStatus(orderId, 'preparing');
  };

  const handleToggleItemReady = async (orderId: string, item: OrderItem) => {
    const nextStatus = item.itemStatus === 'ready' ? 'preparing' : 'ready';
    await updateOrderItemStatus(orderId, item.id, nextStatus);
  };

  const readyOrders = orders.filter((o) => o.status === 'ready');

  const handleClearAllReadyOrders = async () => {
    if (readyOrders.length === 0 || isClearingReady) return;
    setIsClearingReady(true);
    try {
      await clearReadyOrders();
    } catch (err) {
      console.error('Failed bulk clearing ready orders:', err);
      // Fallback: update individually
      await Promise.all(readyOrders.map((o) => updateOrderStatus(o.id, 'served')));
    } finally {
      setIsClearingReady(false);
    }
  };

  const handleMarkOrderReady = async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready');
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    await addShiftNote(currentUser?.name || 'Head Chef', 'kitchen', newNoteText, notePriority);
    setNewNoteText('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-950 text-[#1A1A1A] dark:text-gray-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kitchen Display System (KDS)</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Head Chef Station • Live Tickets Queued: <span className="text-blue-600 dark:text-blue-400 font-bold">{activeOrders.length} Orders</span>
              </p>
            </div>
          </div>

          {/* Status Filters & Bulk Clear Ready Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {readyOrders.length > 0 && (
              <button
                id="kitchen-clear-ready-btn"
                onClick={handleClearAllReadyOrders}
                disabled={isClearingReady}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 shrink-0 border border-emerald-500"
                title="Archive and clear all ready orders from the display in one click"
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>{isClearingReady ? 'Clearing...' : `Clear Ready Orders (${readyOrders.length})`}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 overflow-x-auto bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              {(['all', 'pending', 'preparing', 'ready'] as const).map((st) => (
                <button
                  id={`kitchen-filter-status-${st}`}
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    filterStatus === st ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {st} {st === 'ready' && readyOrders.length > 0 && `(${readyOrders.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Kitchen Station Workload Indicator Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Kitchen Station Workload Monitor</h2>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">• Live Items Preparing Per Station</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Total Preparing: {totalPreparingItems} Items
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stationCounts).map(([stationName, data]) => {
              const IconComp = data.icon;
              const isHeavy = data.count >= 6;
              const isMedium = data.count >= 3 && data.count < 6;
              const loadPercentage = Math.min(100, Math.round((data.count / 10) * 100));

              return (
                <div
                  key={stationName}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${data.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 truncate">
                      <IconComp className="w-4 h-4 shrink-0" />
                      {stationName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-extrabold shrink-0 ${
                        isHeavy
                          ? 'bg-red-600 text-white animate-pulse'
                          : isMedium
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {data.count} prep
                    </span>
                  </div>

                  {/* Capacity Load Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isHeavy ? 'bg-red-600' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(8, loadPercentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      <span>Station Load</span>
                      <span className="font-mono font-bold">{isHeavy ? 'HEAVY' : isMedium ? 'MODERATE' : 'NORMAL'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KDS Order Tickets Grid Banner for Ready Orders */}
        {readyOrders.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900 dark:text-emerald-100 shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">{readyOrders.length} Order{readyOrders.length > 1 ? 's' : ''} Ready to be Cleared / Archived</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Click 'Clear Ready Orders' to archive all completed ready tickets from the active kitchen view in one action.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearAllReadyOrders}
              disabled={isClearingReady}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 shrink-0 border border-emerald-500"
            >
              <CheckCheck className="w-4 h-4 shrink-0" />
              <span>{isClearingReady ? 'Clearing...' : `Clear All ${readyOrders.length} Ready Orders`}</span>
            </button>
          </div>
        )}

        {/* KDS Order Tickets Grid */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-xl space-y-3 shadow-sm">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Kitchen Queue Clean!</p>
            <p className="text-xs text-gray-500">No active orders matching status filter <span className="text-blue-600 uppercase font-mono">{filterStatus}</span>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const elapsedMins = getElapsedMinutes(order.createdAt);
              const prepElapsedMins = order.preparingStartedAt
                ? getElapsedMinutes(order.preparingStartedAt)
                : (order.status === 'preparing' ? elapsedMins : 0);

              // Urgency timer coloring based on prep or total time
              let borderClass = 'border-gray-200 bg-white';
              let badgeTimer = 'bg-green-100 text-green-700 border-green-200';

              if (elapsedMins >= 15 || (order.status === 'preparing' && prepElapsedMins >= 15)) {
                borderClass = 'border-red-500 bg-red-50/20 shadow-md animate-pulse';
                badgeTimer = 'bg-red-600 text-white font-bold';
              } else if (elapsedMins >= 8 || (order.status === 'preparing' && prepElapsedMins >= 8)) {
                borderClass = 'border-orange-400 bg-orange-50/20';
                badgeTimer = 'bg-orange-100 text-orange-700 border-orange-200';
              }

              // Prep badge style
              let prepBadgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
              if (prepElapsedMins >= 15) {
                prepBadgeStyle = 'bg-red-600 text-white border-red-700 font-bold animate-pulse';
              } else if (prepElapsedMins >= 8) {
                prepBadgeStyle = 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
              }

              const allItemsReady = order.items.every((i) => i.itemStatus === 'ready' || i.itemStatus === 'served');

              return (
                <div key={order.id} className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${borderClass}`}>
                  <div>
                    {/* Header: Order ID, Table #, Timers */}
                    <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">Table #{order.tableNumber}</span>
                          <span className="text-xs font-mono text-gray-500">#{order.id}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">Server: {order.waiterName} • {order.guestCount} Guests</p>
                      </div>

                      {/* Time Elapsed Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {order.status === 'preparing' && (
                          <div
                            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 border shadow-sm ${prepBadgeStyle}`}
                            title={`In preparation for ${prepElapsedMins} minutes`}
                          >
                            <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>Prep: {prepElapsedMins}m</span>
                          </div>
                        )}

                        <div className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 border ${badgeTimer}`}>
                          <Clock className="w-3 h-3" />
                          <span>{elapsedMins}m total</span>
                        </div>
                      </div>
                    </div>

                    {/* Kitchen Special Notes Highlight */}
                    {order.kitchenNotes && (
                      <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[10px] uppercase text-amber-700">Kitchen Note / Allergen</span>
                          <p className="leading-snug">{order.kitchenNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Order Item List */}
                    <div className="space-y-2">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItemReady(order.id, item)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            item.itemStatus === 'ready'
                              ? 'bg-green-50 border-green-300 text-green-900 font-medium'
                              : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-blue-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">
                              <span className="font-mono text-blue-600 font-bold mr-1.5">{item.quantity}x</span>
                              {item.menuItemName}
                            </p>
                            {item.notes && <p className="text-[10px] text-blue-600 truncate">→ {item.notes}</p>}
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.itemStatus === 'ready' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {item.itemStatus === 'ready' ? 'READY' : 'PREP'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order-Level Action Controls */}
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStartOrderPrep(order.id)}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Flame className="w-4 h-4" /> Start Order Preparation
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleMarkOrderReady(order.id)}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          allItemsReady
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {allItemsReady ? 'Mark Order FULLY READY' : 'Mark Order Ready'}
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Order Ready • Pushed to Server
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kitchen Handover Bulletin Board */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-blue-600" />
              Kitchen Handover Bulletin & Shift Notes
            </h3>
            <span className="text-xs text-gray-500">{shiftNotes.length} notes posted</span>
          </div>

          <form onSubmit={handlePostNote} className="flex flex-col sm:flex-row gap-2">
            <input
              id="kitchen-note-input"
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Post a shift note for staff (e.g., Prepped 25 salmon fillets, clean oven at 10 PM)..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <select
              id="kitchen-note-priority"
              value={notePriority}
              onChange={(e) => setNotePriority(e.target.value as any)}
              className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-700 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              id="kitchen-note-submit-btn"
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shiftNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                  note.priority === 'urgent' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-gray-900">{note.authorName} ({note.role})</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="leading-relaxed">{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Automatic Toast Notification */}
      {lowStockItems.length > 0 && !dismissedToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-red-60 border-2 border-red-500 rounded-xl shadow-2xl p-4 bg-white text-gray-900 space-y-3 animate-bounce-once">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <span>Low Stock Alert ({lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'})</span>
            </div>
            <button
              id="kitchen-toast-close-btn"
              onClick={() => setDismissedToast(true)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <span className="font-bold text-gray-900">{item.ingredientName}</span>
                  <p className="text-[11px] text-red-700 font-mono">
                    Qty: {item.stockQty} {item.unit} (Threshold: {item.lowStockThreshold} {item.unit})
                  </p>
                </div>
                <button
                  id={`kitchen-toast-restock-${item.id}`}
                  onClick={() => handleQuickRestock(item.id, item.stockQty)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3 h-3" /> Restock 10
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
