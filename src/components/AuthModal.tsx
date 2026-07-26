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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
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

  // Quick Demo Account Auto-Fill & Login
  const handleQuickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError('');
    const demoCredentials: Record<string, { email: string; pass: string }> = {
      manager: { email: 'manager@kitchensync.com', pass: 'password123' },
      waiter: { email: 'waiter@kitchensync.com', pass: 'password123' },
      kitchen: { email: 'kitchen@kitchensync.com', pass: 'password123' },
    };

    const creds = demoCredentials[role] || demoCredentials.waiter;
    setLoginEmail(creds.email);
    setLoginPassword(creds.pass);

    try {
      const user = await loginUser(creds.email, creds.pass, role);
      onLoginSuccess(user, role);
      onClose();
    } catch (err: any) {
      setError('Demo login failed. Please try again.');
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

        {/* Tab Switcher */}
        <div className="p-4 sm:p-6 pb-0">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-5">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSignUpSuccessUser(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSignUpSuccessUser(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-6 pb-6">
          {mode === 'login' ? (
            /* ================= LOG IN FORM ================= */
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Work Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. waiter@kitchensync.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <button
                      id="auth-login-forgot-btn"
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetSuccess(false);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                    />
                    <button
                      id="auth-login-password-toggle"
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="auth-login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Keep me signed in</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Default demo pass: <code className="text-blue-600 dark:text-blue-400 font-bold">password123</code></span>
                </div>

                {/* Submit Button */}
                <button
                  id="auth-login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating Account...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Log In to Workspace
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Access Bar */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> 1-Click Demo Accounts
                  </span>
                  <span className="text-[10px] text-gray-400">Instant Test</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="auth-demo-waiter-btn"
                    type="button"
                    onClick={() => handleQuickDemoLogin('waiter')}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Waitstaff</span>
                  </button>

                  <button
                    id="auth-demo-kitchen-btn"
                    type="button"
                    onClick={() => handleQuickDemoLogin('kitchen')}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <ChefHat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Kitchen</span>
                  </button>

                  <button
                    id="auth-demo-manager-btn"
                    type="button"
                    onClick={() => handleQuickDemoLogin('manager')}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Manager</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= SIGN UP FORM ================= */
            <div>
              {signUpSuccessUser ? (
                /* Success State */
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registration Successful!</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xs mx-auto">
                    Welcome aboard, <span className="font-bold text-blue-600 dark:text-blue-400">{signUpSuccessUser.name}</span>!
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 font-medium">
                    Requested Job Role: <span className="font-bold uppercase">{signUpSuccessUser.requestedRole}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1 pt-2">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-500" /> Redirecting to your workspace...
                  </p>
                </div>
              ) : (
                /* Registration Inputs */
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="auth-signup-name"
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email ID */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="auth-signup-email"
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="alex@kitchensync.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password + Strength Meter */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="auth-signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                      />
                      <button
                        id="auth-signup-password-toggle"
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {signUpPassword && (
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="auth-signup-confirm"
                        type="password"
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                      />
                      {signUpConfirmPassword && (
                        <div className="absolute right-3 top-3">
                          {signUpPassword === signUpConfirmPassword ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="auth-signup-phone"
                        type="tel"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Requested Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        id="auth-signup-role-waiter"
                        type="button"
                        onClick={() => setRequestedRole('waiter')}
                        className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                          requestedRole === 'waiter'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Waitstaff</span>
                      </button>

                      <button
                        id="auth-signup-role-kitchen"
                        type="button"
                        onClick={() => setRequestedRole('kitchen')}
                        className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                          requestedRole === 'kitchen'
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 text-purple-700 dark:text-purple-300 shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <ChefHat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Kitchen</span>
                      </button>

                      <button
                        id="auth-signup-role-manager"
                        type="button"
                        onClick={() => setRequestedRole('manager')}
                        className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                          requestedRole === 'manager'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Manager</span>
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      id="auth-signup-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                    />
                    <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
                      I agree to the KitchenSync Restaurant Staff policy and security terms.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    id="auth-signup-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account & Sign In
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
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
