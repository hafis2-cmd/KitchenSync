import React, { useState } from 'react';
import {
  Users,
  Utensils,
  Plus,
  Minus,
  Check,
  Clock,
  Mic,
  MicOff,
  Search,
  DollarSign,
  AlertCircle,
  Receipt,
  Sparkles,
  UserCheck,
  Sparkle,
  Trash2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Filter,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RestaurantTable, MenuItem, Order, Bill, User, TableStatus, MenuCategory } from '../../types';
import { createOrder, updateTableStatus, updateOrderItemStatus, generateAndPayBill } from '../../lib/api';
import { TableQRModal } from '../TableQRModal';
import { TableNoteModal } from '../TableNoteModal';
import { VoiceOrderModal } from '../VoiceOrderModal';

interface WaiterDashboardProps {
  currentUser: User | null;
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  orders: Order[];
  bills: Bill[];
}

export const WaiterDashboard: React.FC<WaiterDashboardProps> = ({
  currentUser,
  tables = [],
  menuItems = [],
  orders = [],
  bills = [],
}) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [tableFilter, setTableFilter] = useState<string>('All');

  // Order Creation State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [cartItems, setCartItems] = useState<{ menuItem: MenuItem; quantity: number; notes: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Voice Recognition State
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Custom Table Note State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteSelectedTable, setNoteSelectedTable] = useState<RestaurantTable | null>(null);

  // Billing Modal State
  const [showBillModal, setShowBillModal] = useState(false);
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // QR Code Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSelectedTable, setQrSelectedTable] = useState<RestaurantTable | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'upi' | 'split'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (tableFilter === 'All') return true;
    if (tableFilter === 'Available' || tableFilter === 'Empty') {
      return t.status === 'Empty';
    }
    return t.status === tableFilter;
  });

  // Calculate seated elapsed minutes
  const getElapsedMinutes = (isoString?: string) => {
    if (!isoString) return 0;
    const diff = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  // Handle Voice Dictated Items
  const handleVoiceAddItems = (items: { menuItem: MenuItem; quantity: number; notes: string }[]) => {
    setCartItems((prev) => {
      let updated = [...prev];
      items.forEach((item) => {
        const existingIdx = updated.findIndex((i) => i.menuItem.id === item.menuItem.id);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
            notes: item.notes || updated[existingIdx].notes,
          };
        } else {
          updated.push({
            menuItem: item.menuItem,
            quantity: item.quantity,
            notes: item.notes,
          });
        }
      });
      return updated;
    });

    if (!showOrderModal) {
      if (!selectedTable && tables.length > 0) {
        setSelectedTable(tables[0]);
      }
      setShowOrderModal(true);
    }
  };

  // Add item to order cart
  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) => (i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.menuItem.id === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as any;
    });
  };

  const handleUpdateNotes = (menuItemId: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, notes } : i))
    );
  };

  // Submit Order to Kitchen
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        tableId: selectedTable.id,
        tableNumber: selectedTable.tableNumber,
        waiterId: currentUser?.id || 'u-wait-1',
        waiterName: currentUser?.name || 'Marco Silva',
        guestCount,
        customerName: customerName || `Table ${selectedTable.tableNumber} Guest`,
        kitchenNotes,
        items: cartItems.map((c) => ({
          menuItemId: c.menuItem.id,
          menuItemName: c.menuItem.name,
          quantity: c.quantity,
          unitPrice: c.menuItem.price,
          notes: c.notes,
        })),
      });

      setShowOrderModal(false);
      setCartItems([]);
      setKitchenNotes('');
      setCustomerName('');
    } catch (err) {
      alert('Failed to send order to kitchen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Status change
  const handleMarkClean = async (table: RestaurantTable) => {
    await updateTableStatus(table.id, 'Empty', currentUser?.id);
  };

  // Open Billing Modal
  const handleOpenBilling = (order: Order) => {
    setBillingOrder(order);
    setDiscountAmount(0);
    setShowBillModal(true);
  };

  // Process Bill Payment
  const handleProcessPayment = async () => {
    if (!billingOrder) return;
    setIsSubmitting(true);
    try {
      await generateAndPayBill(billingOrder.id, discountAmount, paymentMethod);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setShowBillModal(false);
      setBillingOrder(null);
      setSelectedTable(null);
    } catch (err) {
      alert('Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter menu
  const availableCategories = ['All', 'Appetizers', 'Mains', 'Desserts', 'Beverages'];
  const filteredMenu = menuItems.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Waitstaff Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Waitstaff Floor Station</h1>
              <p className="text-xs text-gray-500">
                Assigned Server: <span className="text-blue-600 font-bold">{currentUser?.name || 'Marco Silva'}</span> • Active Tables Managed
              </p>
            </div>
          </div>

          {/* Table View Status Filters & QR Generator Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="waiter-voice-order-btn"
              onClick={() => setShowVoiceModal(true)}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Dictate menu orders using microphone"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Voice-to-Order</span>
            </button>

            <button
              id="waiter-qr-codes-btn"
              onClick={() => {
                setQrSelectedTable(tables[0] || null);
                setShowQRModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Generate & Print Table Menu QR Codes"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Table QR Codes</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto bg-gray-100 p-1.5 rounded-lg border border-gray-200">
              <Filter className="w-3.5 h-3.5 text-gray-400 ml-1 shrink-0" />
              {['All', 'Available', 'Occupied', 'Needs Cleaning', 'Reserved'].map((st) => (
                <button
                  id={`waiter-filter-table-${st.replace(/\s+/g, '-').toLowerCase()}`}
                  key={st}
                  onClick={() => setTableFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    tableFilter === st || (st === 'Available' && tableFilter === 'Empty')
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floor Plan Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const currentOrder = orders.find((o) => o.id === table.currentOrderId || (o.tableNumber === table.tableNumber && o.status !== 'billed'));
            const elapsed = getElapsedMinutes(table.occupiedSince);

            let statusBg = 'bg-white border-gray-200';
            let badgeBg = 'bg-gray-100 text-gray-700 border-gray-300';

            if (table.status === 'Occupied') {
              statusBg = 'bg-blue-50/20 border-blue-500 shadow-sm';
              badgeBg = 'bg-blue-100 text-blue-700 border-blue-300';
            } else if (table.status === 'Needs Cleaning') {
              statusBg = 'bg-orange-50/30 border-orange-400 shadow-sm';
              badgeBg = 'bg-orange-100 text-orange-700 border-orange-300';
            } else if (table.status === 'Reserved') {
              statusBg = 'bg-purple-50/20 border-purple-300';
              badgeBg = 'bg-purple-100 text-purple-700 border-purple-300';
            } else if (table.status === 'Empty') {
              statusBg = 'bg-white border-gray-200 hover:border-blue-400';
              badgeBg = 'bg-green-100 text-green-700 border-green-200';
            }

            return (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${statusBg}`}
              >
                <div>
                  {/* Table Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-gray-900">
                        Table #{table.tableNumber}
                      </span>
                      <button
                        id={`waiter-table-qr-btn-${table.tableNumber}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrSelectedTable(table);
                          setShowQRModal(true);
                        }}
                        className="p-1 rounded bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors shrink-0"
                        title={`View Table #${table.tableNumber} QR Code`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    <p className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>Cap: {table.capacity} guests</span>
                    </p>

                    {table.status === 'Occupied' && (
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        elapsed >= 45
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <Clock className={`w-3.5 h-3.5 ${elapsed >= 45 ? 'text-rose-600' : 'text-blue-600'}`} />
                        <span>Seated {elapsed}m ago</span>
                        {elapsed >= 45 && (
                          <span className="ml-auto text-[8px] font-black uppercase tracking-tight bg-rose-600 text-white px-1 py-0.2 rounded shadow-2xs">
                            Turnover Alert (&gt;45m)
                          </span>
                        )}
                      </div>
                    )}

                    {table.status === 'Reserved' && (
                      <p className="text-[11px] text-purple-700 truncate font-medium">
                        {table.reservationName} ({table.reservationTime})
                      </p>
                    )}
                  </div>

                  {/* Custom Table Status Note Badge */}
                  {table.customStatusNote ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteSelectedTable(table);
                        setShowNoteModal(true);
                      }}
                      className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium flex items-center justify-between gap-1.5 cursor-pointer hover:bg-amber-100 transition-colors shadow-2xs"
                    >
                      <span className="truncate flex items-center gap-1 font-semibold">
                        <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                        {table.customStatusNote}
                      </span>
                      <span className="text-[9px] font-bold text-amber-700 underline shrink-0">Edit</span>
                    </div>
                  ) : (
                    <button
                      id={`waiter-table-note-btn-${table.tableNumber}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteSelectedTable(table);
                        setShowNoteModal(true);
                      }}
                      className="mb-3 text-[10px] text-gray-400 hover:text-amber-600 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> + Custom Note
                    </button>
                  )}

                  {/* Active Order Summary Pill */}
                  {currentOrder && (
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-gray-700 font-bold">#{currentOrder.id}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${
                          currentOrder.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {currentOrder.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{currentOrder.items.length} items • ${currentOrder.totalAmount}</p>
                    </div>
                  )}
                </div>

                {/* Quick Action Button */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {table.status === 'Empty' && (
                    <button
                      id={`waiter-table-order-btn-${table.tableNumber}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setShowOrderModal(true);
                      }}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Order
                    </button>
                  )}

                  {table.status === 'Occupied' && (
                    <button
                      id={`waiter-table-order-btn-${table.tableNumber}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setShowOrderModal(true);
                      }}
                      className="w-full py-2 rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-800 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      View / Add Items
                    </button>
                  )}

                  {table.status === 'Needs Cleaning' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkClean(table);
                      }}
                      className="w-full py-2 rounded-lg bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 border border-orange-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Cleaned
                    </button>
                  )}

                  {table.status === 'Reserved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setShowOrderModal(true);
                      }}
                      className="w-full py-2 rounded-lg bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      Seat Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Table Floating Details Drawer / Modal */}
        {selectedTable && !showOrderModal && !showBillModal && (
          <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-6 shadow-xl text-gray-900 space-y-6">
              <button
                onClick={() => setSelectedTable(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xl">
                  #{selectedTable.tableNumber}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Table #{selectedTable.tableNumber} Details</h2>
                  <p className="text-xs text-gray-500">Capacity: {selectedTable.capacity} Seats • Status: <span className="text-blue-600 font-semibold">{selectedTable.status}</span></p>
                </div>
              </div>

              {/* Active Order on this table */}
              {(() => {
                const currentOrder = orders.find((o) => o.tableNumber === selectedTable.tableNumber && o.status !== 'billed');

                if (!currentOrder) {
                  return (
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-3">
                      <p className="text-xs text-gray-500">No active order for Table #{selectedTable.tableNumber}.</p>
                      <button
                        onClick={() => setShowOrderModal(true)}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 shadow-sm"
                      >
                        Create New Order
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                        <div>
                          <p className="text-xs font-mono font-bold text-blue-600">Order #{currentOrder.id}</p>
                          <p className="text-[11px] text-gray-500">{currentOrder.customerName} ({currentOrder.guestCount} guests)</p>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                          {currentOrder.status}
                        </span>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(currentOrder.items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-gray-200">
                            <div>
                              <p className="font-semibold text-gray-900">{item.quantity}x {item.menuItemName}</p>
                              {item.notes && <p className="text-[10px] text-blue-600 font-medium">Note: {item.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                item.itemStatus === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {item.itemStatus}
                              </span>
                              {item.itemStatus === 'ready' && (
                                <button
                                  onClick={async () => {
                                    await updateOrderItemStatus(currentOrder.id, item.id, 'served');
                                  }}
                                  className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-medium text-[10px]"
                                >
                                  Serve
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs font-bold text-gray-800">
                        <span>Total Due:</span>
                        <span className="text-blue-600 font-mono text-sm">${currentOrder.totalAmount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowOrderModal(true)}
                        className="flex-1 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs border border-gray-200"
                      >
                        + Add More Items
                      </button>

                      <button
                        onClick={() => handleOpenBilling(currentOrder)}
                        className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Receipt className="w-4 h-4" /> Generate & Pay Bill
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Order Creation Modal */}
        {showOrderModal && selectedTable && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              {/* Left Menu Selection Column */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Select Dishes for Table #{selectedTable.tableNumber}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVoiceModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Dictate items with microphone"
                    >
                      <Mic className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>Dictate</span>
                    </button>
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="waiter-order-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search menu items..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {availableCategories.map((cat) => (
                      <button
                        id={`waiter-order-category-${cat.toLowerCase()}`}
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === cat ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Item Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] md:max-h-[60vh] overflow-y-auto pr-1">
                  {filteredMenu.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.isAvailable
                          ? 'bg-white border-gray-200 hover:border-blue-500 cursor-pointer shadow-sm'
                          : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-blue-600 font-mono font-semibold">${item.price}</p>
                          {!item.isAvailable && <span className="text-[9px] font-bold text-rose-600">86'd (Unavailable)</span>}
                        </div>
                      </div>

                      <button
                        id={`waiter-menu-item-add-${item.id}`}
                        disabled={!item.isAvailable}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Order Summary & Voice Column */}
              <div className="w-full md:w-96 p-5 sm:p-6 bg-gray-50 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Order Summary</h3>
                      <p className="text-[11px] text-gray-500">Table #{selectedTable.tableNumber}</p>
                    </div>
                    <button
                      id="waiter-order-close-btn"
                      onClick={() => setShowOrderModal(false)}
                      className="hidden md:block p-1 rounded-lg text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Customer & Guest Count */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-600 font-semibold mb-1">Guest Count</label>
                      <input
                        id="waiter-order-guest-count"
                        type="number"
                        min={1}
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-600 font-semibold mb-1">Customer Name</label>
                      <input
                        id="waiter-order-customer-name"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Cart Item List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {cartItems.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No items selected yet. Tap menu items to add.</p>
                    ) : (
                      cartItems.map((cartItem) => (
                        <div key={cartItem.menuItem.id} className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 truncate max-w-[140px]">{cartItem.menuItem.name}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateQuantity(cartItem.menuItem.id, -1)}
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-blue-600 font-bold">{cartItem.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(cartItem.menuItem.id, 1)}
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Add item note (e.g. No onions)"
                            value={cartItem.notes}
                            onChange={(e) => handleUpdateNotes(cartItem.menuItem.id, e.target.value)}
                            className="w-full px-2 py-1 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-700 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Voice-to-Order Feature */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Voice Order Dictation
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowVoiceModal(true)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Mic className="w-3 h-3 text-indigo-600 animate-pulse" />
                        <span>Dictate Items</span>
                      </button>
                    </div>

                    <textarea
                      id="waiter-order-kitchen-notes"
                      value={kitchenNotes}
                      onChange={(e) => setKitchenNotes(e.target.value)}
                      placeholder="Special kitchen notes or spoken instructions..."
                      rows={2}
                      className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submit Bar */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-sm text-gray-900">
                    <span>Total Amount:</span>
                    <span className="font-mono text-blue-600 text-base">${cartTotal}</span>
                  </div>

                  <button
                    id="waiter-order-submit-btn"
                    disabled={cartItems.length === 0 || isSubmitting}
                    onClick={handleSubmitOrder}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs transition-all shadow-sm"
                  >
                    {isSubmitting ? 'Sending to Kitchen...' : 'Send Order to Kitchen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Itemized Billing Modal */}
        {showBillModal && billingOrder && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl text-gray-900 space-y-6">
              <button
                id="waiter-bill-close-btn"
                onClick={() => setShowBillModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Receipt className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Itemized Bill & Receipt</h2>
                <p className="text-xs text-gray-500">Order #{billingOrder.id} • Table #{billingOrder.tableNumber}</p>
              </div>

              {/* Itemized List */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 max-h-40 overflow-y-auto text-xs">
                {(billingOrder.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-gray-200/80 last:border-none">
                    <span className="text-gray-800">{item.quantity}x {item.menuItemName}</span>
                    <span className="font-mono text-gray-900 font-semibold">${item.unitPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Discount Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apply Discount ($)</label>
                <div className="flex gap-2">
                  {[0, 5, 10, 15].map((disc) => (
                    <button
                      id={`waiter-bill-discount-${disc}`}
                      key={disc}
                      type="button"
                      onClick={() => setDiscountAmount(disc)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        discountAmount === disc ? 'bg-green-50 text-green-700 border-green-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ${disc} Off
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="waiter-payment-method-card"
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'card' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Card
                  </button>

                  <button
                    id="waiter-payment-method-cash"
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'cash' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Cash
                  </button>

                  <button
                    id="waiter-payment-method-upi"
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'upi' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> UPI / Tap
                  </button>
                </div>
              </div>

              {/* Calculation Summary */}
              {(() => {
                const sub = billingOrder.totalAmount;
                const tax = Math.round(sub * 0.1 * 100) / 100;
                const grandTotal = Math.max(0, sub + tax - discountAmount);

                return (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-mono">${sub}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (10%)</span>
                      <span className="font-mono">${tax}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Discount</span>
                        <span className="font-mono">-${discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-sm pt-2 border-t border-gray-200">
                      <span>Grand Total</span>
                      <span className="font-mono text-green-600">${grandTotal}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                id="waiter-payment-submit-btn"
                disabled={isSubmitting}
                onClick={handleProcessPayment}
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Processing Payment...' : 'Mark Paid & Free Table'}
              </button>
            </div>
          </div>
        )}

        {/* Table QR Code Generator Modal */}
        <TableQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          selectedTable={qrSelectedTable}
          tables={tables}
        />

        {/* Custom Table Status Note Modal */}
        <TableNoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setNoteSelectedTable(null);
          }}
          table={noteSelectedTable}
          onNoteUpdated={(tableId, newNote) => {
            const tbl = tables.find((t) => t.id === tableId);
            if (tbl) tbl.customStatusNote = newNote;
          }}
        />

        {/* Voice-to-Order Dictation Modal */}
        <VoiceOrderModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          menuItems={menuItems}
          onAddItemsToOrder={handleVoiceAddItems}
          tableNumber={selectedTable?.tableNumber}
        />
      </div>
    </div>
  );
};
