import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  UserPlus,
  LogIn,
  KeyRound,
  UserCheck,
  ChefHat,
  LayoutDashboard,
  ArrowRight,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { UserRole, User } from '../types';
import { loginUser, signupUser } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, role: UserRole) => void;
  initialMode?: 'login' | 'signup';
  allUsers?: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  allUsers = [],
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Log In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpPhone, setSignUpPhone] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('waiter');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signUpSuccessUser, setSignUpSuccessUser] = useState<User | null>(null);

  // Reset form when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      const validMode = typeof initialMode === 'string' && initialMode === 'signup' ? 'signup' : 'login';
      setMode(validMode);
      setError('');
      setLoading(false);
      setSignUpSuccessUser(null);
      setLoginEmail('');
      setLoginPassword('');
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setSignUpPhone('');
      setShowForgotPassword(false);
      setResetSuccess(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Calculate Password Strength score (0 to 3)
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

  const strength = getPasswordStrength(signUpPassword);

  // Handle Log In Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(loginEmail.trim(), loginPassword);
      onLoginSuccess(user, user.role || 'waiter');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Log in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signUpName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!signUpEmail.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!signUpPassword) {
      setError('Password is required.');
      return;
    }
    if (signUpPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the staff terms & conditions.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await signupUser({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        phone: signUpPhone.trim(),
        requestedRole,
      });

      setSignUpSuccessUser(newUser);
      setTimeout(() => {
        onLoginSuccess(newUser, newUser.role === 'unassigned' ? 'waiter' : newUser.role);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  // Direct User Selection Bypass Login
  const handleUserSelect = async (user: User) => {
    setLoading(true);
    setError('');
    try {
      const loggedIn = await loginUser(user.email, 'password123', user.role);
      onLoginSuccess(loggedIn, loggedIn.role || 'waiter');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Reset Handler
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-all text-gray-900 dark:text-gray-100 my-auto">
        
        {/* Top Header Decorative Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            id="auth-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none">KitchenSync Auth</h2>
              <p className="text-[11px] text-blue-100 font-medium mt-0.5">Staff Portal & Floor Access</p>
            </div>
          </div>
        </div>

        {/* Error Message Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Modal Body: Directory List for instant 1-tap login */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Select User Profile
            </span>
            <span className="text-[10px] text-gray-400">1-Tap Bypass Login</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {(allUsers && allUsers.length > 0 ? allUsers : [
              {
                id: 'u-mgr-1',
                name: 'Alex Rivera',
                email: 'manager@kitchensync.com',
                role: 'manager',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                status: 'active'
              },
              {
                id: 'u-wait-1',
                name: 'Marco Silva',
                email: 'waiter@kitchensync.com',
                role: 'waiter',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                status: 'active'
              },
              {
                id: 'u-wait-2',
                name: 'Elena Rostova',
                email: 'elena@kitchensync.com',
                role: 'waiter',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
                status: 'active'
              },
              {
                id: 'u-kit-1',
                name: 'Chef Gordon',
                email: 'kitchen@kitchensync.com',
                role: 'kitchen',
                avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200',
                status: 'active'
              }
            ] as User[]).map((u) => {
              // Role label styling
              const roleStyles: Record<string, { label: string; icon: string; bg: string; text: string }> = {
                manager: { label: 'Manager', icon: '👑', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
                waiter: { label: 'Waitstaff', icon: '🍽️', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' },
                kitchen: { label: 'Kitchen Chef', icon: '🍳', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400' },
                unassigned: { label: 'Pending', icon: '⏳', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' }
              };
              const roleInfo = roleStyles[u.role] || roleStyles.unassigned;

              return (
                <button
                  key={u.id}
                  id={`auth-select-user-${u.id}`}
                  type="button"
                  disabled={loading}
                  onClick={() => handleUserSelect(u)}
                  className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-gray-800/80 hover:border-blue-300 dark:hover:border-blue-800 text-left flex items-center gap-3.5 transition-all duration-150 disabled:opacity-50"
                >
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={u.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-200/50 dark:ring-gray-700/50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${roleInfo.bg} ${roleInfo.text} shrink-0`}>
                    <span>{roleInfo.icon}</span>
                    <span>{roleInfo.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forgot Password Drawer Overlay */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-gray-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-900 dark:text-gray-100 shadow-2xl">
            <button
              id="auth-forgot-close-btn"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-200 dark:border-blue-800">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Password Recovery</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your work email address to receive password reset instructions.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  Recovery instructions sent to {resetEmail}!
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Demo PIN code: <span className="font-mono font-bold">123456</span> or default pass <span className="font-mono font-bold">password123</span>
                </p>
                <button
                  id="auth-forgot-success-close-btn"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Return to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Registered Email ID</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-forgot-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="waiter@kitchensync.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  id="auth-forgot-submit-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
