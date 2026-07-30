import React, { useState } from 'react';
import {
  QrCode,
  Printer,
  Copy,
  Check,
  ExternalLink,
  X,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Send,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { RestaurantTable, MenuItem } from '../types';
import { createOrder, updateTableStatus } from '../lib/api';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: RestaurantTable | null;
  tables: RestaurantTable[];
  menuItems?: MenuItem[];
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tables = [],
  menuItems = [],
}) => {
  const [activeTableNumber, setActiveTableNumber] = useState<number>(
    selectedTable?.tableNumber || tables[0]?.tableNumber || 1
  );
  const [viewMode, setViewMode] = useState<'qr' | 'simulator'>('qr');
  const [copied, setCopied] = useState(false);

  // Self-Order Simulator State
  const [guestName, setGuestName] = useState('QR Guest');
  const [guestCount, setGuestCount] = useState(2);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.tableNumber === activeTableNumber) || {
    id: `table-${activeTableNumber}`,
    tableNumber: activeTableNumber,
    capacity: 4,
    status: 'Available',
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kitchensync.app';
  const menuUrl = `${originUrl}/?table=${activeTableNumber}#menu`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    menuUrl
  )}&color=1e293b&bgcolor=ffffff`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleSelfOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemIds = Object.keys(cart);
    if (itemIds.length === 0) return;

    setSubmittingOrder(true);
    try {
      const orderItems = itemIds.map((id) => {
        const item = menuItems.find((m) => m.id === id);
        return {
          menuItemId: id,
          menuItemName: item?.name || 'Menu Item',
          quantity: cart[id],
          unitPrice: item?.price || 12,
        };
      });

      // 1. Update table to occupied
      await updateTableStatus(currentTable.id, 'Occupied', 'u-customer-qr');

      // 2. Create kitchen order ticket
      await createOrder({
        tableId: currentTable.id,
        tableNumber: currentTable.tableNumber,
        waiterId: 'u-customer-qr',
        waiterName: '📱 QR Self-Order',
        guestCount,
        customerName: guestName || `Table ${currentTable.tableNumber} Guest`,
        kitchenNotes: kitchenNotes ? `[QR Self-Order]: ${kitchenNotes}` : '[QR Self-Order]',
        items: orderItems,
      });

      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setCart({});
        setKitchenNotes('');
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Failed to submit QR self-order:', e);
    } finally {
      setSubmittingOrder(null as any);
    }
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.keys(cart).reduce((sum, id) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item?.price || 0) * cart[id];
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-gray-900 dark:text-gray-100 relative space-y-4 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Table QR & Digital Ordering</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Generate QR code or test guest self-ordering simulator</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl text-xs font-bold print:hidden">
          <button
            type="button"
            onClick={() => setViewMode('qr')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'qr'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Printable QR Stand
          </button>
          <button
            type="button"
            onClick={() => setViewMode('simulator')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'simulator'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            Guest Self-Order Mode
          </button>
        </div>

        {/* Table Selector Pills */}
        <div className="print:hidden space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Active Table:</label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTableNumber(t.tableNumber)}
                className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  activeTableNumber === t.tableNumber
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Table #{t.tableNumber}
              </button>
            ))}
          </div>
        </div>

        {/* MODE 1: PRINTABLE QR STAND */}
        {viewMode === 'qr' && (
          <>
            <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800/60 dark:to-gray-900 border-2 border-dashed border-blue-300 dark:border-blue-800/60 rounded-2xl p-5 text-center space-y-3 print:border-2 print:border-solid print:border-gray-900 print:bg-white print:text-black">
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white print:text-black">
                  KitchenSync Bistro
                </span>
              </div>

              <div>
                <span className="inline-block px-4 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase tracking-wider shadow-xs">
                  Table #{currentTable.tableNumber}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 mt-1">Seating Capacity: {currentTable.capacity} Guests</p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl inline-block border border-gray-200 shadow-md print:shadow-none print:border-gray-400">
                <img
                  src={qrCodeImageUrl}
                  alt={`Table ${currentTable.tableNumber} Digital Menu QR`}
                  className="w-40 h-40 mx-auto object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 print:text-black flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Scan with Smartphone Camera
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 print:text-gray-600">
                  Browse full digital menu, customize items & alert your server instantly
                </p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 print:hidden">
              <button
                onClick={handleCopyUrl}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Menu URL!' : 'Copy Direct Link'}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview
                </a>

                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print QR Stand
                </button>
              </div>
            </div>
          </>
        )}

        {/* MODE 2: CUSTOMER SELF-ORDER SIMULATOR */}
        {viewMode === 'simulator' && (
          <div>
            {orderSuccess ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-200">Self-Order Submitted!</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your order has been routed directly to Table #{currentTable.tableNumber} in the Kitchen Display System (KDS).
                </p>
              </div>
            ) : (
              <form onSubmit={handleSelfOrderSubmit} className="space-y-3.5">
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between font-medium">
                  <span>Customer Ordering for:</span>
                  <span className="font-bold uppercase bg-blue-600 text-white px-2.5 py-0.5 rounded-md">Table #{currentTable.tableNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Alex"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* Digital Menu Items Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Digital Menu Items:
                  </label>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                    {(menuItems && menuItems.length > 0 ? menuItems : [
                      { id: 'm-1', name: 'Wagyu Beef Burger', price: 24, category: 'Mains' },
                      { id: 'm-2', name: 'Truffle Parmesan Fries', price: 12, category: 'Appetizers' },
                      { id: 'm-3', name: 'Artisan Craft Soda', price: 6, category: 'Beverages' },
                    ] as MenuItem[]).map((item) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id} className="p-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg">
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-[10px] text-gray-500">${item.price.toFixed(2)} • {item.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCartQuantity(item.id, -1)}
                              disabled={qty === 0}
                              className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleCartQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Special Preparation Instructions</label>
                  <input
                    type="text"
                    value={kitchenNotes}
                    onChange={(e) => setKitchenNotes(e.target.value)}
                    placeholder="e.g. Medium rare burger, no ice for soda"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[11px] text-gray-500">Total ({cartItemCount} items):</p>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">${cartTotal.toFixed(2)}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={cartItemCount === 0 || submittingOrder}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-40 transition-all"
                  >
                    {submittingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Sending to Kitchen...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Customer Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
