import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'login' | 'badge';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopTip, setShowDesktopTip] = useState(false);

  // If already running in standalone PWA window, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopTip(true);
    }
  };

  // Render according to variant
  let buttonContent = null;

  if (variant === 'sidebar') {
    buttonContent = (
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border border-sky-500/30 bg-gradient-to-r from-sky-500/15 to-emerald-500/15 text-sky-400 hover:text-white hover:border-sky-400 hover:from-sky-500/25 hover:to-emerald-500/25 shadow-sm ${className}`}
        title="Install QMS on Home Screen / Desktop"
      >
        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
          <Download className="w-4 h-4 animate-bounce" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-100">Install QMS App</span>
          <span className="text-[10px] text-slate-400 font-normal">Offline & Instant Launch</span>
        </div>
      </button>
    );
  } else if (variant === 'login') {
    buttonContent = (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide border border-sky-500/30 bg-slate-900/80 text-sky-300 hover:text-white hover:border-sky-400 hover:bg-slate-800 transition shadow-sm ${className}`}
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Install QMS on Mobile / PC</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">PWA</span>
      </button>
    );
  } else if (variant === 'badge') {
    buttonContent = (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  } else {
    // header variant
    buttonContent = (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-white hover:border-sky-400 shadow-sm ${className}`}
        title="Install QMS on Home Screen or Desktop"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  return (
    <>
      {buttonContent}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install QMS on iOS</h3>
                <p className="text-xs text-slate-400">Northern Fashions Ltd.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Install this application directly on your iPhone or iPad home screen for fast fullscreen access without an App Store download:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-200">Step 1: Tap Share</span>
                  <p className="text-slate-400 mt-0.5">Tap the Share icon at the bottom of Safari toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-200">Step 2: Add to Home Screen</span>
                  <p className="text-slate-400 mt-0.5">Scroll down in the action sheet and select "Add to Home Screen".</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-200">Step 3: Confirm</span>
                  <p className="text-slate-400 mt-0.5">Tap "Add" in the top right corner. The QMS icon will appear on your Home Screen.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 transition shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Fallback Prompt Modal */}
      {showDesktopTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowDesktopTip(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install QMS Application</h3>
                <p className="text-xs text-slate-400">Desktop & Browser Installation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              To install QMS on your computer or Android device:
            </p>

            <div className="space-y-3 mb-6 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Click the <strong>Install</strong> icon on the right side of your browser address bar (URL bar).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Or open your browser menu (⋮ / ⋯) and click <strong>"Install QMS - Quality Management System..."</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopTip(false)}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-sky-600 hover:bg-sky-500 transition shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
