import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

export const LoginPortalView: React.FC = () => {
  const { login, theme, toggleTheme } = useApp();

  const [email, setEmail] = useState('admin@nflbd.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSigningIn(true);
    setTimeout(() => {
      login('dashboard');
      setIsSigningIn(false);
    }, 300);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07182e] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Background Graphic Elements: Clean Textile Photo with Fade Overlay & Color Ribbons (No Ghost Text or Artifacts) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Pure Garment & Sewing Factory Image without any text/logos */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 bg-cover bg-center opacity-20 mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop')`,
            backgroundPosition: 'center',
          }}
        />

        {/* Deep Navy Gradient Overlay to ensure single-layer crisp contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07182e] via-[#07182e]/95 to-[#07182e]/50" />

        {/* Top Right Decorative Ribbons (Lime Green & Royal Blue from screenshot) */}
        <svg
          className="absolute top-0 right-0 w-96 h-96 opacity-90 transform translate-x-12 -translate-y-12"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path
            d="M 50 0 C 150 150 250 150 400 350 L 400 0 Z"
            fill="url(#greenGradientTop)"
            opacity="0.85"
          />
          <path
            d="M 120 0 C 200 120 280 160 400 300 L 400 0 Z"
            fill="url(#blueGradientTop)"
            opacity="0.6"
          />
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

        {/* Bottom Flowing Wave Ribbon Curves (Lime Green & Royal Blue) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-32 md:h-44"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M 0 140 C 350 40 700 200 1100 80 C 1250 30 1380 70 1440 100 L 1440 180 L 0 180 Z"
            fill="#061224"
            opacity="0.95"
          />
          <path
            d="M 0 155 C 380 70 750 190 1150 70 C 1300 20 1400 40 1440 50"
            stroke="#84cc16"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 0 165 C 360 85 720 205 1120 85 C 1270 35 1370 55 1440 65"
            stroke="#1d4ed8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top Header: Strictly NORTHERN FASHIONS LTD. on the left */}
      <header className="relative z-10 px-6 sm:px-12 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Northern Fashions Ltd Monogram Logo */}
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center p-1.5 shadow-md shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <path
                d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z"
                fill="#84cc16"
              />
              <path
                d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z"
                fill="#94a3b8"
              />
              <path
                d="M 16 24 C 20 20 24 16 26 14"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase leading-none">
              NORTHERN FASHIONS LTD.
            </h1>
            <p className="text-[11px] font-medium text-slate-300 mt-1">
              Quality Management System
            </p>
            {/* Lime Green Accent Line */}
            <div className="h-1 w-9 bg-lime-500 rounded-full mt-1.5" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Day / Night Mode Switch */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Day (Light)' : 'Night (Dark)'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Night Mode</span>
              </>
            )}
          </button>

          {/* Enter Workspace Button */}
          <button
            onClick={() => handleSubmit()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold backdrop-blur-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            Enter Workspace
          </button>
        </div>
      </header>

      {/* Main Single-Layer Center Area: Clean Headline on Left + White Sign-In Card on Right */}
      <main className="relative z-10 px-6 sm:px-12 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 max-w-7xl mx-auto w-full">
        {/* LEFT COLUMN: Clean QMS Title and Quality Intelligence Focus */}
        <div className="flex-1 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-lime-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
            <span>Digital Quality Intelligence System</span>
          </div>

          <div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              QMS
            </h2>
            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-lime-400 leading-tight mt-1">
              Quality Management System
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg mt-4 leading-relaxed">
              Automated PDF inspection report data extraction, Observed Quality Level (OQL) calculations, defect classification, and CAPA compliance for Northern Fashions Ltd.
            </p>
          </div>

          {/* Clean Quality Pillars (Single-Layer, no confusing double layer) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-lime-400 font-bold text-xs flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>OQL Compliance</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formula: (Defects ÷ Inspected) &times; 100 with 4.5% target
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-sky-400 font-bold text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Auto OCR Intake</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automatic NOF job serial detection &amp; slash quantity extraction
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RCA &amp; CAPA</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Root cause analysis &amp; post-audit effectiveness tracking
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING WHITE SIGN-IN CARD */}
        <div className="w-full max-w-[420px] shrink-0">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-7 sm:p-9 border border-slate-100 relative">
            {/* Logo on Card Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                  <path
                    d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z"
                    fill="#15803d"
                  />
                  <path
                    d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z"
                    fill="#475569"
                  />
                  <path
                    d="M 16 24 C 20 20 24 16 26 14"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase">
                NORTHERN FASHIONS LTD.
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Quality Management System (QMS)
              </p>

              <h4 className="text-sm font-bold text-[#1e3a8a] mt-4">
                Sign In to Your Workspace
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authorized QMS personnel only
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WORK EMAIL OR EMPLOYEE ID
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@nflbd.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PASSWORD
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium">Remember me</span>
                </label>

                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact NFL QMS Lead at qms-support@nflbd.com for password reset.');
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3 rounded-xl bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white font-bold text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4 disabled:opacity-75"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Authenticating...' : 'Sign In to QMS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Encrypted Session Footer */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium mt-4 pt-3 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>End-to-End Encrypted Quality Management Session</span>
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
