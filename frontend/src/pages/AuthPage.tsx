import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  KeyRound
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, loginAsDemo, forgotPassword, resetPassword, setActiveTab } = useAuth();
  
  // Modes: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  
  // Login / Register state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'employee'>('student');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot / Reset Password state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [generatedTokenNotice, setGeneratedTokenNotice] = useState<{ token: string; message: string } | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetErrors = () => {
    setError(null);
    setSuccess(null);
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      setActiveTab('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName, role);
      setActiveTab('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message);
      if (res.reset_token) {
        setGeneratedTokenNotice({
          token: res.reset_token,
          message: res.message
        });
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(resetToken, newPassword);
      setResetSuccessMessage(res.message);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-[#F6F7F9]">
      <div className="w-full max-w-lg rounded-[10px] border border-[#DDE1E7] bg-white p-7 sm:p-9 shadow-sm">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" showMeaning={true} />
          </div>
          <h2 className="text-xl font-semibold text-[#17202A] tracking-tight mt-2">
            {mode === 'login' && 'Sign in to KATTR0LI (கற்றொளி)'}
            {mode === 'register' && 'Create your KATTR0LI (கற்றொளி) account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set a new password'}
          </h2>
          <p className="text-xs text-[#5B6573] mt-1">
            {mode === 'login' && 'Access your personalized learning roadmap and multi-agent workspace'}
            {mode === 'register' && 'Start your personalized, adaptive multi-agent learning journey'}
            {mode === 'forgot' && "Enter your registered email and we'll send a password reset link"}
            {mode === 'reset' && 'Choose a strong, secure password for your account'}
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-4 rounded-[6px] bg-[#FEF2F2] border border-[#FCA5A5] p-3 text-xs text-[#B91C1C] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-[6px] bg-[#F0FDFA] border border-[#CCFBF1] p-3 text-xs text-[#0F766E] flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {resetSuccessMessage && (
          <div className="mb-4 rounded-[6px] bg-[#F0FDFA] border border-[#CCFBF1] p-3 text-xs text-[#0F766E] flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* 1-Click Demo Login Banner (Available on Login view for evaluators) */}
        {mode === 'login' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 px-4 rounded-[6px] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#CCFBF1] text-[#0F766E] text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Demo login as Alex Rivera (Full Stack Developer v1)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-[#DDE1E7]"></div>
              <span className="flex-shrink mx-3 text-[#5B6573] text-[11px] uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="flex-grow border-t border-[#DDE1E7]"></div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: LOGIN FORM                                       */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#17202A]">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setMode('forgot');
                  }}
                  className="text-xs text-[#0F766E] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-9 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[#5B6573] hover:text-[#17202A] p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-[#5B6573] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#DDE1E7] text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>Remember me on this device (30 days)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Authenticating...' : 'Sign in'}</span>
            </button>

            <div className="mt-5 text-center text-xs text-[#5B6573] pt-2 border-t border-[#DDE1E7]">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  resetErrors();
                  setMode('register');
                }}
                className="text-[#0F766E] font-medium hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: REGISTRATION FORM                                */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Full name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@example.com"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1.5">
                Select your primary profile type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-[6px] border cursor-pointer transition select-none ${
                    role === 'student'
                      ? 'border-2 border-[#0F766E] bg-[#F0FDFA]'
                      : 'border-[#DDE1E7] bg-white hover:border-[#0F766E]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-[#0F766E]' : 'text-[#5B6573]'}`} />
                    <span className="text-xs font-semibold text-[#17202A]">Student</span>
                  </div>
                  <p className="text-[11px] text-[#5B6573] mt-1">
                    College / university learner targeting entry-level tech roles
                  </p>
                </div>

                <div
                  onClick={() => setRole('employee')}
                  className={`p-3 rounded-[6px] border cursor-pointer transition select-none ${
                    role === 'employee'
                      ? 'border-2 border-[#0F766E] bg-[#F0FDFA]'
                      : 'border-[#DDE1E7] bg-white hover:border-[#0F766E]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Briefcase className={`w-4 h-4 ${role === 'employee' ? 'text-[#0F766E]' : 'text-[#5B6573]'}`} />
                    <span className="text-xs font-semibold text-[#17202A]">Employee</span>
                  </div>
                  <p className="text-[11px] text-[#5B6573] mt-1">
                    Industry professional upskilling or transitioning roles
                  </p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-9 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[#5B6573] hover:text-[#17202A] p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-9 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-[#5B6573] hover:text-[#17202A] p-0.5"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Creating account & roadmap...' : 'Create account'}</span>
            </button>

            <div className="mt-5 text-center text-xs text-[#5B6573] pt-2 border-t border-[#DDE1E7]">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  resetErrors();
                  setMode('login');
                }}
                className="text-[#0F766E] font-medium hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 3: FORGOT PASSWORD REQUEST                          */}
        {/* ======================================================== */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#17202A] mb-1">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-3 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Generating reset token...' : 'Send password reset link'}</span>
              </button>
            </form>

            {/* If reset token was generated (development fallback or direct token) */}
            {generatedTokenNotice && (
              <div className="p-3.5 rounded-[6px] border border-[#CCFBF1] bg-[#F0FDFA] text-xs space-y-2 mt-4">
                <div className="flex items-center space-x-2 text-[#0F766E] font-semibold">
                  <KeyRound className="w-4 h-4" />
                  <span>Password Reset Token Generated</span>
                </div>
                <p className="text-[11px] text-[#5B6573]">
                  Single-use token valid for 1 hour. Click below to proceed directly to resetting your password:
                </p>
                <div className="p-2 rounded bg-white border border-[#CCFBF1] font-mono text-[11px] text-[#17202A] break-all">
                  {generatedTokenNotice.token}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setMode('reset');
                  }}
                  className="w-full py-2 rounded-[6px] bg-[#0F766E] text-white font-medium text-xs hover:bg-[#115E59] transition"
                >
                  Proceed to set new password
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-[#5B6573] pt-2 border-t border-[#DDE1E7]">
              <button
                type="button"
                onClick={() => {
                  resetErrors();
                  setMode('login');
                }}
                className="text-[#0F766E] font-medium hover:underline"
              >
                ← Back to sign in
              </button>

              <button
                type="button"
                onClick={() => {
                  resetErrors();
                  setMode('reset');
                }}
                className="text-[#5B6573] hover:text-[#17202A] underline"
              >
                I already have a reset token
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 4: RESET PASSWORD WITH TOKEN                        */}
        {/* ======================================================== */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Password reset token
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your 32-character reset token"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-3 py-2 text-xs text-[#17202A] font-mono placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-9 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[#5B6573] hover:text-[#17202A] p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full rounded-[6px] border border-[#DDE1E7] bg-white pl-9 pr-9 py-2 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-[#5B6573] hover:text-[#17202A] p-0.5"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Updating password...' : 'Save new password & sign in'}</span>
            </button>

            <div className="mt-4 text-center text-xs text-[#5B6573] pt-2 border-t border-[#DDE1E7]">
              <button
                type="button"
                onClick={() => {
                  resetErrors();
                  setMode('login');
                }}
                className="text-[#0F766E] font-medium hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
