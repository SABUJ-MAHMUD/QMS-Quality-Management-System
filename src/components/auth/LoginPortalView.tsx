import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RegisteredUser, UserRole } from '../../types';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sparkles,
  Sun,
  Moon,
  KeyRound,
  Mail,
  RotateCcw,
  Check,
  AlertCircle,
  UserPlus,
  LogIn,
} from 'lucide-react';

const STORAGE_USERS_KEY = 'NFL_QMS_REGISTERED_USERS';

// Default pre-seeded accounts including the requested Super Admin
const DEFAULT_PRE_SEEDED_USERS: RegisteredUser[] = [
  {
    id: 'usr-admin-super',
    name: 'Quality Lead Admin',
    email: 'quality.engineer.bd@gmail.com',
    role: 'Admin',
    password: 'admin',
    isVerified: true,
    createdAt: '2026-11-12',
  },
  {
    id: 'usr-demo-manager',
    name: 'Salah Uddin (QMS Manager)',
    email: 'salah.uddin@nflbd.com',
    role: 'QMS Manager',
    password: 'password123',
    isVerified: true,
    createdAt: '2026-11-12',
  },
];

export const LoginPortalView: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();

  // Mode: 'login' (Sign In) or 'register' (Create Account)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Mode: 'password' (email + password) or 'otp' (email + verification code)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Register Flow: 'form' -> 'otp'
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');

  // Login Form States (always start empty; never pre-fill or shadow admin email)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('QMS Manager');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');

  // Verification Code / OTP States
  const [sentOtp, setSentOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpBanner, setShowOtpBanner] = useState(false);
  const [activeOtpTargetEmail, setActiveOtpTargetEmail] = useState('');

  // Registered Users Registry in LocalStorage
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed: RegisteredUser[] = JSON.parse(saved);
        // Ensure quality.engineer.bd@gmail.com is always present as Admin
        const hasAdmin = parsed.some(
          (u) => u.email.toLowerCase() === 'quality.engineer.bd@gmail.com'
        );
        if (!hasAdmin) {
          const combined = [DEFAULT_PRE_SEEDED_USERS[0], ...parsed];
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(combined));
          return combined;
        }
        return parsed;
      }
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_PRE_SEEDED_USERS));
      return DEFAULT_PRE_SEEDED_USERS;
    } catch {
      return DEFAULT_PRE_SEEDED_USERS;
    }
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any = null;
    if ((showOtpBanner || regStep === 'otp' || loginMethod === 'otp') && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpBanner, regStep, loginMethod, otpTimer]);

  // Dispatch 6-digit Verification Code
  const dispatchVerificationCode = (targetEmail: string, callback?: () => void) => {
    setIsSendingOtp(true);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    setTimeout(() => {
      setSentOtp(newCode);
      setActiveOtpTargetEmail(targetEmail);
      setOtpTimer(30);
      setShowOtpBanner(true);
      setEnteredOtp('');
      setOtpError('');
      setIsSendingOtp(false);
      if (callback) callback();
    }, 350);
  };

  // 1. Submit Sign In Form (Password or OTP)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setLoginError('Please enter your registered Gmail or work email.');
      return;
    }

    // Special Auto-Handling for Super Admin
    if (trimmedEmail === 'quality.engineer.bd@gmail.com') {
      login('dashboard', {
        email: 'quality.engineer.bd@gmail.com',
        name: 'Quality Engineer (Admin)',
        role: 'Admin',
      });
      return;
    }

    // Check if user is registered in the database
    const foundUser = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!foundUser) {
      setLoginError(
        'Account not found. If this is your first time, please click "Register (New Account)" to create your account.'
      );
      return;
    }

    // Option A: Sign In with Password
    if (loginMethod === 'password') {
      if (!loginPassword.trim()) {
        setLoginError('Please enter your password.');
        return;
      }

      if (foundUser.password && foundUser.password !== loginPassword.trim()) {
        setLoginError('Incorrect password. Please try again or use verification code login.');
        return;
      }

      login('dashboard', {
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      });
    } else {
      // Option B: Sign In with Verification Code
      dispatchVerificationCode(foundUser.email, () => {
        // Ready for OTP entry
      });
    }
  };

  // 2. Verify OTP for Sign In
  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    if (enteredOtp.trim() !== sentOtp) {
      setOtpError('Invalid verification code. Please check the code provided above.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const trimmedEmail = loginEmail.trim().toLowerCase();
      const foundUser = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail);

      const effectiveRole: UserRole =
        trimmedEmail === 'quality.engineer.bd@gmail.com'
          ? 'Admin'
          : foundUser?.role || 'QMS Manager';

      login('dashboard', {
        email: trimmedEmail,
        name: foundUser?.name || 'QMS Lead',
        role: effectiveRole,
      });
      setIsVerifying(false);
    }, 300);
  };

  // 3. Initiate Registration (Sends Verification Code)
  const handleRegisterInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedEmail = regEmail.trim().toLowerCase();
    const trimmedName = regName.trim();
    const trimmedPassword = regPassword.trim();

    if (!trimmedName) {
      setRegError('Please enter your full name or inspector title.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setRegError('Please enter a valid Gmail or factory work email address.');
      return;
    }

    if (trimmedPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    if (trimmedPassword !== regConfirmPassword.trim()) {
      setRegError('Passwords do not match. Please verify both password entries.');
      return;
    }

    // Check if email already registered
    const exists = registeredUsers.some((u) => u.email.toLowerCase() === trimmedEmail);
    if (exists && trimmedEmail !== 'quality.engineer.bd@gmail.com') {
      setRegError('An account with this email is already registered. Please sign in instead.');
      return;
    }

    // Send 6-digit Verification Code
    dispatchVerificationCode(trimmedEmail, () => {
      setRegStep('otp');
    });
  };

  // 4. Verify OTP and Complete Permanent Registration
  const handleVerifyRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    if (enteredOtp.trim() !== sentOtp) {
      setOtpError('Invalid verification code. Please re-check the 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const trimmedEmail = regEmail.trim().toLowerCase();
      const isSuperAdmin = trimmedEmail === 'quality.engineer.bd@gmail.com';
      const effectiveRole: UserRole = isSuperAdmin ? 'Admin' : regRole;

      const newUser: RegisteredUser = {
        id: `usr-${Date.now()}`,
        name: regName.trim(),
        email: trimmedEmail,
        role: effectiveRole,
        password: regPassword.trim(),
        isVerified: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const updatedUsers = [...registeredUsers.filter((u) => u.email.toLowerCase() !== trimmedEmail), newUser];
      setRegisteredUsers(updatedUsers);
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
      } catch {
        // ignore
      }

      login('dashboard', {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      });
      setIsVerifying(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07182e] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 bg-cover bg-center opacity-20 mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop')`,
            backgroundPosition: 'center',
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#07182e] via-[#07182e]/95 to-[#07182e]/50" />

        <svg
          className="absolute top-0 right-0 w-96 h-96 opacity-90 transform translate-x-12 -translate-y-12"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path d="M 50 0 C 150 150 250 150 400 350 L 400 0 Z" fill="url(#greenGradientTop)" opacity="0.85" />
          <path d="M 120 0 C 200 120 280 160 400 300 L 400 0 Z" fill="url(#blueGradientTop)" opacity="0.6" />
          <defs>
            <linearGradient id="greenGradientTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="blueGradientTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
        </svg>

        <svg className="absolute bottom-0 left-0 right-0 w-full h-32 md:h-44" viewBox="0 0 1440 180" preserveAspectRatio="none" fill="none">
          <path d="M 0 140 C 350 40 700 200 1100 80 C 1250 30 1380 70 1440 100 L 1440 180 L 0 180 Z" fill="#061224" opacity="0.95" />
          <path d="M 0 155 C 380 70 750 190 1150 70 C 1300 20 1400 40 1440 50" stroke="#84cc16" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 0 165 C 360 85 720 205 1120 85 C 1270 35 1370 55 1440 65" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-6 sm:px-12 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center p-1.5 shadow-md shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <path d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z" fill="#84cc16" />
              <path d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z" fill="#94a3b8" />
              <path d="M 16 24 C 20 20 24 16 26 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase leading-none">
              NORTHERN FASHIONS LTD.
            </h1>
            <p className="text-[11px] font-medium text-slate-300 mt-1">
              QMS - Quality Management System
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
          <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 sm:px-12 py-6 gap-8 lg:gap-16 max-w-7xl mx-auto w-full">
        {/* Left Presentation Column */}
        <div className="w-full lg:w-1/2 space-y-5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-lime-400 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            BESTSELLER QMS Compliance &bull; Observed Quality Level
          </div>

          <div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
              QMS
            </h2>
            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-lime-400 leading-tight mt-1">
              Quality Management System
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg mt-4 leading-relaxed">
              Automated PDF inspection report data extraction, Observed Quality Level (OQL) calculations, 23 master defect classifications, and CAPA compliance for Northern Fashions Ltd.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-lime-400 font-bold text-xs flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>OQL Compliance</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formula: (Defects &divide; Inspected) &times; 100 with 4.5% target
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-sky-400 font-bold text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>23 Master Defect Groups</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Fabric, Cleanliness, Shading, Embroidery &amp; parallel charts
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RCA &amp; CAPA</span>
              </div>
              <p className="text-[11px] text-slate-400">
                5-Why root cause analysis and dashboard push toggle
              </p>
            </div>
          </div>
        </div>

        {/* Right Floating Authentication Card: Register & Login Suite */}
        <div className="w-full max-w-[450px] shrink-0">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative">
            {/* Header / Brand Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  <path d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z" fill="#15803d" />
                  <path d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z" fill="#475569" />
                  <path d="M 16 24 C 20 20 24 16 26 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase">
                NORTHERN FASHIONS LTD.
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Quality Management System (QMS)
              </p>
            </div>

            {/* OTP Banner Display when code is dispatched */}
            {showOtpBanner && (
              <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-sky-800">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Verification Code Sent to {activeOtpTargetEmail}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-sky-700 leading-tight">
                    6-digit verification code:
                    <strong className="font-mono text-sm tracking-widest text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-300 ml-1.5 font-black">
                      {sentOtp}
                    </strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(sentOtp)}
                    className="text-[10px] font-bold text-sky-700 hover:underline bg-sky-100/80 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW A: SIGN IN (LOGIN) FLOW — PRIMARY FIELDS AT TOP     */}
            {/* ======================================================== */}
            {authMode === 'login' && (
              <div className="mt-5 space-y-3.5 text-left">
                {loginMethod === 'password' ? (
                  /* Form: Password Login */
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label htmlFor="login-email-input" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        EMAIL OR USER ID *
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          id="login-email-input"
                          type="text"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="username"
                          placeholder="e.g. admin@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="login-password-input" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        PASSWORD *
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          id="login-password-input"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {loginError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Form: OTP Verification Code Login */
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-3">
                    <div>
                      <label htmlFor="otp-email-input" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        EMAIL OR USER ID *
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="otp-email-input"
                          type="text"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          placeholder="e.g. admin@gmail.com"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (loginEmail.trim()) dispatchVerificationCode(loginEmail.trim());
                          }}
                          disabled={isSendingOtp || !loginEmail.trim()}
                          className="shrink-0 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          Send Code
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          ENTER 6-DIGIT CODE *
                        </label>
                        {sentOtp && (
                          <button
                            type="button"
                            onClick={() => setEnteredOtp(sentOtp)}
                            className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Auto-fill
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => {
                          setEnteredOtp(e.target.value.replace(/\D/g, ''));
                          setOtpError('');
                        }}
                        autoFocus
                        placeholder="••••••"
                        className="w-full text-center text-xl font-mono font-black tracking-[0.5em] py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 placeholder:text-slate-300"
                      />
                      {otpError && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {otpError}
                        </p>
                      )}
                    </div>

                    {showOtpBanner && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={() => dispatchVerificationCode(loginEmail)}
                          disabled={otpTimer > 0}
                          className={`text-[11px] font-bold ${
                            otpTimer > 0 ? 'text-slate-400' : 'text-emerald-700 hover:underline cursor-pointer'
                          }`}
                        >
                          {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isVerifying ? 'Verifying Code...' : 'Sign In to Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW B: REGISTER (NEW ACCOUNT CREATION)                  */}
            {/* ======================================================== */}
            {authMode === 'register' && (
              <div className="mt-5 space-y-3 text-left">
                {regStep === 'form' ? (
                  <form onSubmit={handleRegisterInitiate} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        placeholder="e.g. Salah Uddin / Quality Inspector"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                        GMAIL / WORK EMAIL *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="e.g. inspector@gmail.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                          PASSWORD *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            placeholder="Password"
                            className="w-full pl-2.5 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2 text-slate-400 p-1 cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                          CONFIRM *
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                          placeholder="Repeat password"
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                        ROLE ASSIGNMENT
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Admin">Quality Admin (Full System Control)</option>
                        <option value="QMS Manager">QMS Manager (Audit &amp; CAPA Approval)</option>
                        <option value="QMS Executive">QMS Executive (Inspector / Data Entry)</option>
                        <option value="Viewer">Viewer (Read-only Reports)</option>
                      </select>
                    </div>

                    {regError && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {regError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-md shadow-sky-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isSendingOtp ? 'Generating Code...' : 'Send Verification Code (OTP)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Step 2: Verification Code Confirmation */
                  <form onSubmit={handleVerifyRegisterOtp} className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{regName}</div>
                      <div className="text-[11px] text-slate-500">{regEmail} &bull; {regRole}</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          ENTER 6-DIGIT VERIFICATION CODE *
                        </label>
                        <button
                          type="button"
                          onClick={() => setEnteredOtp(sentOtp)}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => {
                          setEnteredOtp(e.target.value.replace(/\D/g, ''));
                          setOtpError('');
                        }}
                        autoFocus
                        placeholder="••••••"
                        className="w-full text-center text-xl font-mono font-black tracking-[0.5em] py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
                      />
                      {otpError && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {otpError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => dispatchVerificationCode(regEmail)}
                        disabled={otpTimer > 0}
                        className={`text-[11px] font-bold ${
                          otpTimer > 0 ? 'text-slate-400' : 'text-sky-700 hover:underline cursor-pointer'
                        }`}
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegStep('form')}
                        className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                      >
                        &larr; Back to Details
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isVerifying ? 'Verifying...' : 'Verify Code & Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* BOTTOM CONTROLS: Sign-in Method & Sign In/Register Tabs  */}
            {/* ======================================================== */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-3">
              {authMode === 'login' && (
                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="font-bold text-slate-600">Sign-in method:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setShowOtpBanner(false);
                        setLoginError('');
                        setOtpError('');
                      }}
                      className={`font-semibold cursor-pointer ${
                        loginMethod === 'password'
                          ? 'text-emerald-700 font-black underline'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Password
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setLoginError('');
                        setOtpError('');
                        if (loginEmail.trim()) dispatchVerificationCode(loginEmail.trim());
                      }}
                      className={`font-semibold cursor-pointer ${
                        loginMethod === 'otp'
                          ? 'text-emerald-700 font-black underline'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Verification Code (OTP)
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Switcher: Sign In vs Register (New Account) */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                    setOtpError('');
                    setShowOtpBanner(false);
                  }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In (Login)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setRegStep('form');
                    setRegError('');
                    setOtpError('');
                    setShowOtpBanner(false);
                  }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register (New Account)</span>
                </button>
              </div>

              {/* Encrypted Session Footer */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Permanent Encrypted QMS Session &bull; ISO 2859-1</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Info */}
      <footer className="relative z-10 px-6 sm:px-12 pb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-slate-300">
            NORTHERN FASHIONS LTD. &bull; QMS - Quality Management System
          </span>
        </div>
        <div>
          <span>&copy; 2026 Northern Fashions Ltd. All Rights Reserved.</span>
        </div>
      </footer>
    </div>
  );
};
