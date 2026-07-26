import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Sparkles,
  Save,
  Check,
  UserCheck,
  ChefHat,
  LayoutDashboard,
  Calendar
} from 'lucide-react';
import { User } from '../types';
import { updateUserProfile } from '../lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  userToEdit?: User | null;
  onUpdateSuccess: (updatedUser: User) => void;
}

// Preset avatars for staff
const PRESET_AVATARS = [
  { id: 'av-1', label: 'Chef / Kitchen', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200' },
  { id: 'av-2', label: 'Waitstaff / Server', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 'av-3', label: 'Manager / Lead', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { id: 'av-4', label: 'Staff / Sommelier', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
  { id: 'av-5', label: 'Executive Host', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 'av-6', label: 'Kitchen Crew', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userToEdit,
  onUpdateSuccess,
}) => {
  const targetUser = userToEdit || currentUser;

  const [name, setName] = useState(targetUser?.name || '');
  const [email, setEmail] = useState(targetUser?.email || '');
  const [phone, setPhone] = useState(targetUser?.phone || '');
  const [avatar, setAvatar] = useState(targetUser?.avatar || PRESET_AVATARS[0].url);
  const [role, setRole] = useState(targetUser?.role || 'waiter');
  const [status, setStatus] = useState(targetUser?.status || 'active');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  // Security & Password Change
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setAvatar(targetUser.avatar || PRESET_AVATARS[0].url);
      setRole(targetUser.role || 'waiter');
      setStatus(targetUser.status || 'active');
    }
    setError('');
    setSuccessMsg('');
    setChangePassword(false);
    setNewPassword('');
    setConfirmPassword('');
  }, [targetUser, isOpen]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && /[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score === 2) return { score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (changePassword) {
      if (!newPassword || newPassword.length < 4) {
        setError('New password must be at least 4 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (!targetUser) throw new Error('No target user selected');
      const updated = await updateUserProfile(targetUser.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
        newPassword: changePassword ? newPassword : undefined,
        role: currentUser?.role === 'manager' ? role : undefined,
        status: currentUser?.role === 'manager' ? status : undefined,
      });

      setSuccessMsg('Profile details successfully saved to database!');
      onUpdateSuccess(updated);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all text-gray-900 dark:text-gray-100 my-auto">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-6 text-white relative">
          <button
            id="profile-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md bg-gray-800"
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-blue-500 text-white shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{targetUser?.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 border border-white/30 tracking-wider">
                  {targetUser?.role || 'Unassigned'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5 font-medium">{targetUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Notifications / Banners */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn font-bold">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Avatar Selection Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Profile Avatar / Photo
              </label>
              <button
                id="profile-avatar-toggle"
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showCustomAvatarInput ? 'Choose preset avatar' : 'Use image URL'}
              </button>
            </div>

            {showCustomAvatarInput ? (
              <div className="relative">
                <Camera className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="profile-avatar-url-input"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/your-photo.jpg"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      avatar === av.url
                        ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    {avatar === av.url && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="profile-edit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Work Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="profile-edit-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kitchensync.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="profile-edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Manager Controls: Role & Status */}
            {currentUser?.role === 'manager' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Job Role (Manager Control)
                  </label>
                  <select
                    id="profile-edit-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="waiter">🍽️ Waitstaff (Floor & Tables)</option>
                    <option value="kitchen">🍳 Kitchen Chef (Display & Prep)</option>
                    <option value="manager">👑 Restaurant Manager</option>
                    <option value="unassigned">⏳ Unassigned / Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Staff Status (Manager Control)
                  </label>
                  <select
                    id="profile-edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">🟢 Active Duty</option>
                    <option value="on-break">🟡 On Break</option>
                    <option value="off-duty">⚪ Off Duty</option>
                    <option value="pending_approval">🔴 Pending Manager Approval</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Password Update Toggle Section */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Security & Password</span>
              </div>
              <button
                id="profile-password-toggle"
                type="button"
                onClick={() => setChangePassword(!changePassword)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {changePassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {changePassword && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="profile-new-password"
                      type={showPasswordText ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button
                      id="profile-new-password-toggle"
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">Strength:</span>
                        <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="profile-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-3">
                        {newPassword === confirmPassword ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Role Read-only Badge */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Assigned Role:</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white uppercase tracking-wider">
              {currentUser.role?.toUpperCase() || 'UNASSIGNED'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="profile-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              id="profile-submit-btn"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Details...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
