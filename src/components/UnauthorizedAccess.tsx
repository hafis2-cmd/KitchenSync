import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, ArrowLeft, UserCheck, AlertTriangle, CheckCircle2, ChevronRight, UserX } from 'lucide-react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, verifyManagerPin } from '../lib/authPermissions';

interface UnauthorizedAccessProps {
  targetTab: 'waiter' | 'kitchen' | 'manager';
  currentUser: User | null;
  onReturnToAllowedView: () => void;
  onOpenAuth: () => void;
  onElevateToManager: () => void;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  targetTab,
  currentUser,
  onReturnToAllowedView,
  onOpenAuth,
  onElevateToManager,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  const targetTabTitles: Record<string, string> = {
    manager: 'Restaurant Manager Administrative Control Hub',
    kitchen: 'Kitchen Display & Station Prep Center',
    waiter: 'Waitstaff Floor & Table Order Management',
  };

  const requiredRoleLabels: Record<string, string> = {
    manager: 'Restaurant Manager',
    kitchen: 'Kitchen Chef',
    waiter: 'Waitstaff',
  };

  const currentRoleInfo = currentUser?.role ? ROLE_LABELS[currentUser.role] : null;

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
        {/* Header Alert Icon */}
        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-inner">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Strict Access Control
              </span>
              <span className="text-xs text-gray-400">403 Unauthorized</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
              {requiredRoleLabels[targetTab]} Privileges Required
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Access to {targetTabTitles[targetTab]} is restricted.
            </p>
          </div>
        </div>

        {/* Current Authenticated Profile Badge */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Current Authenticated Session
          </p>
          {currentUser ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentRoleInfo?.badgeColor}`}>
                <span>{currentRoleInfo?.icon}</span>
                <span>{currentRoleInfo?.label}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                <UserX className="w-4 h-4 text-gray-400" /> Unauthenticated Guest Session
              </span>
              <button
                onClick={() => onOpenAuth()}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Access Denial Explanation */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Strict Role Isolation Policy Active</p>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              KitchenSync enforces role segregation so staff members can only perform actions relevant to their assigned job description. To access this workspace, ask your Restaurant Manager to reassign your account role or enter the Master Manager Override PIN below.
            </p>
          </div>
        </div>

        {/* Manager PIN Override Section */}
        {showPinPrompt ? (
          <form onSubmit={handlePinSubmit} className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Enter Master Manager PIN (Default Demo PIN: 1234)
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
                Authorize
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
              Have Manager PIN? Enter Overriding PIN
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => onOpenAuth()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Switch Staff Account
          </button>

          <button
            onClick={() => onReturnToAllowedView()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to My Authorized View
          </button>
        </div>
      </div>
    </div>
  );
};
