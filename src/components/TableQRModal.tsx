import React, { useState } from 'react';
import { QrCode, Printer, Copy, Check, ExternalLink, X, UtensilsCrossed, Sparkles } from 'lucide-react';
import { RestaurantTable } from '../types';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable?: RestaurantTable | null;
  tables: RestaurantTable[];
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tables = [],
}) => {
  const [activeTableNumber, setActiveTableNumber] = useState<number>(
    selectedTable?.tableNumber || tables[0]?.tableNumber || 1
  );
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-gray-900 dark:text-gray-100 relative space-y-5 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Table QR Code Generator</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Print or display QR codes for digital customer ordering</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Selector Pills */}
        <div className="print:hidden space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Table ID:</label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTableNumber(t.tableNumber)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  activeTableNumber === t.tableNumber
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Table #{t.tableNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Table Stand Card Display */}
        <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800/60 dark:to-gray-900 border-2 border-dashed border-blue-300 dark:border-blue-800/60 rounded-2xl p-6 text-center space-y-4 print:border-2 print:border-solid print:border-gray-900 print:bg-white print:text-black">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white print:text-black">
              KitchenSync Bistro
            </span>
          </div>

          <div>
            <span className="inline-block px-4 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase tracking-wider shadow-sm">
              Table #{currentTable.tableNumber}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 mt-1">Seating Capacity: {currentTable.capacity} Guests</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl inline-block border border-gray-200 shadow-md print:shadow-none print:border-gray-400">
            <img
              src={qrCodeImageUrl}
              alt={`Table ${currentTable.tableNumber} Digital Menu QR`}
              className="w-48 h-48 mx-auto object-contain"
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

        {/* Modal Controls / Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
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
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print QR Stand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
