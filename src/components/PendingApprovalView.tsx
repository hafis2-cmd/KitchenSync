import React, { useState } from 'react';
import { Clock, ShieldAlert, KeyRound, CheckCircle2, UserCheck, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import { User } from '../types';
import { verifyManagerPin } from '../lib/authPermissions';

interface PendingApprovalViewProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  onOpenAuth: () => void;
  onElevateToManager: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  currentUser,
  onRefreshUser,
  onOpenAuth,
  onElevateToManager,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyManagerPin(pinInput)) {
      setPinError('');
      onElevateToManager();
    } else {
      setPinError('Invalid Manager PIN. Default demo PIN is 1234.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Status Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-7 h-7 stroke-[2.2] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Pending Manager Approval
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
              Account Registration Under Review
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your KitchenSync staff profile has been submitted to management.
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Registered Account Information
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/50"
              />
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Requested Role</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">
                {currentUser?.requestedRole || 'Waitstaff'}
              </span>
            </div>
          </div>
        </div>

        {/* Explanatory Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
          <p className="font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            What happens next?
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
            The Restaurant Manager receives a notification on the Manager Dashboard to review new staff accounts. Once assigned an active job role (Waitstaff, Kitchen, or Manager), your access will unlock automatically.
          </p>
        </div>

        {/* Manager Override PIN Option */}
        {showPinPrompt ? (
          <form onSubmit={handlePinSubmit} className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Manager Instant Approval PIN (Default Demo PIN: 1234)
              </label>
              <button
                type="button"
                onClick={() => setShowPinPrompt(false)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cancel
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN Code..."
                autoFocus
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 text-sm text-gray-900 dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Approve
              </button>
            </div>

            {pinError && <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{pinError}</p>}
          </form>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowPinPrompt(true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Manager present? Enter PIN to approve immediately
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => onRefreshUser()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Approval Status
          </button>

          <button
            onClick={() => onOpenAuth()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Sign In with Approved Account
          </button>
        </div>
      </div>
    </div>
  );
};
