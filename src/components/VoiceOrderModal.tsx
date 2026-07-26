import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Check, Plus, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { MenuItem } from '../types';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddItemsToOrder: (items: { menuItem: MenuItem; quantity: number; notes: string }[]) => void;
  tableNumber?: number;
}

interface ParsedVoiceItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({
  isOpen,
  onClose,
  menuItems = [],
  onAddItemsToOrder,
  tableNumber,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedVoiceItem[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setTranscript('');
      setParsedItems([]);
      setSpeechError(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. You can still type spoken commands manually below.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      const trimmed = currentTranscript.trim();
      setTranscript(trimmed);
      parseTranscript(trimmed);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access denied. Please allow microphone permissions in your browser.');
      } else if (event.error === 'no-speech') {
        // Keep listening or allow retry
      } else {
        setSpeechError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Auto start listening on open
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Parsing Engine: Convert spoken text into menu items and quantities
  const parseTranscript = (text: string) => {
    if (!text) {
      setParsedItems([]);
      return;
    }

    const lower = text.toLowerCase();
    const results: ParsedVoiceItem[] = [];

    // Helper number word mapping
    const numberWords: Record<string, number> = {
      one: 1,
      a: 1,
      an: 1,
      single: 1,
      two: 2,
      to: 2,
      too: 2,
      three: 3,
      four: 4,
      for: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    // Check each menu item against transcript
    menuItems.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      // Split item name into keywords (e.g. "wagyu truffle burger" -> ["wagyu", "truffle", "burger"])
      const keywords = itemNameLower.split(' ').filter((w) => w.length > 2);

      let matched = false;

      // Exact phrase match or match of 2+ keywords
      if (lower.includes(itemNameLower)) {
        matched = true;
      } else if (keywords.length > 1) {
        const matchesCount = keywords.filter((kw) => lower.includes(kw)).length;
        if (matchesCount >= Math.min(2, keywords.length)) {
          matched = true;
        }
      } else if (keywords.length === 1 && lower.includes(keywords[0])) {
        matched = true;
      }

      if (matched) {
        // Try to extract quantity near matched item
        let quantity = 1;

        // Search for numbers before or after the match keyword
        const regexNum = new RegExp(`(\\d+|one|a|two|to|three|four|for|five|six|seven|eight|nine|ten)\\s+(?:orders?\\s+of\\s+)?(?:${keywords.join('|')}|${itemNameLower.replace(/[^a-z]/g, '')})`, 'i');
        const matchNum = lower.match(regexNum);

        if (matchNum && matchNum[1]) {
          const val = matchNum[1].toLowerCase();
          if (/^\d+$/.test(val)) {
            quantity = parseInt(val, 10);
          } else if (numberWords[val] !== undefined) {
            quantity = numberWords[val];
          }
        }

        // Check for common modifier notes
        let notes = '';
        if (lower.includes('extra hot') || lower.includes('spicy')) notes = 'Extra Hot';
        if (lower.includes('no onion') || lower.includes('no onions')) notes = notes ? `${notes}, No Onions` : 'No Onions';
        if (lower.includes('no ice') || lower.includes('less ice')) notes = notes ? `${notes}, Less Ice` : 'Less Ice';
        if (lower.includes('gluten free')) notes = notes ? `${notes}, Gluten Free` : 'Gluten Free';
        if (lower.includes('well done')) notes = notes ? `${notes}, Well Done` : 'Well Done';

        results.push({
          menuItem: item,
          quantity: Math.max(1, quantity),
          notes,
        });
      }
    });

    setParsedItems(results);
  };

  const handleManualTranscriptChange = (text: string) => {
    setTranscript(text);
    parseTranscript(text);
  };

  const handleConfirm = () => {
    if (parsedItems.length > 0) {
      onAddItemsToOrder(parsedItems);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Voice-to-Order AI Dictation {tableNumber ? `(Table #${tableNumber})` : ''}
              </h3>
              <p className="text-xs text-blue-100">
                Dictate menu items directly via microphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Microphone Animation Visualizer */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700 scale-105'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    Listening... Speak clearly into microphone
                  </>
                ) : (
                  'Microphone Paused. Click button to start recording.'
                )}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Try: <span className="italic text-blue-600 dark:text-blue-400 font-medium">"2 Wagyu Truffle Burgers, 1 Tiramisu, 1 Coke Zero extra hot"</span>
              </p>
            </div>
          </div>

          {speechError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Spoken Transcript Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                Live Speech Transcript
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setParsedItems([]);
                  }}
                  className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => handleManualTranscriptChange(e.target.value)}
              placeholder="Spoken words will appear here in real-time..."
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Parsed Items Preview List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Detected Menu Items ({parsedItems.length})
              </h4>
              {parsedItems.length > 0 && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Total: ${parsedItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)}
                </span>
              )}
            </div>

            {parsedItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                No menu items recognized yet. Dictate item names like "Margherita Pizza" or "Espresso".
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={`${item.menuItem.id}-${idx}`}
                    className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                          {item.quantity}x
                        </span>
                        {item.menuItem.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        ${item.menuItem.price} each • {item.menuItem.category}
                      </p>
                      {item.notes && (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                          Note: {item.notes}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...parsedItems];
                          updated[idx].quantity = Math.max(1, updated[idx].quantity - 1);
                          setParsedItems(updated);
                        }}
                        className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...parsedItems];
                          updated[idx].quantity += 1;
                          setParsedItems(updated);
                        }}
                        className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedItems(parsedItems.filter((_, i) => i !== idx));
                        }}
                        className="p-1 rounded text-gray-400 hover:text-red-600 ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedItems.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
              parsedItems.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white scale-100'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Confirm & Add {parsedItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items to Order
          </button>
        </div>
      </div>
    </div>
  );
};
