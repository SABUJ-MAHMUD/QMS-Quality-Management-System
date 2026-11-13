import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X, CheckCircle, WifiOff } from 'lucide-react';

export const PWAUpdateToast: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('QMS PWA Service Worker Registered:', swUrl);
      if (registration) {
        // Automatic periodic update check every 30 minutes
        const intervalId = setInterval(() => {
          registration.update().catch((err) => console.warn('Periodic SW update check failed:', err));
        }, 30 * 60 * 1000);

        // Check for updates whenever user returns to the tab
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch((err) => console.warn('Visibility SW update check failed:', err));
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    },
    onRegisterError(error) {
      console.warn('QMS Service Worker Registration Warning:', error);
    },
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-dismiss transient Offline Ready notification after 4 seconds
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      // Clear old caches if supported to ensure absolutely fresh assets
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(
          cacheKeys.map((k) => {
            // Keep current workbox precache or purge old obsolete versions
            return window.caches.delete(k);
          })
        );
      }
    } catch (e) {
      console.warn('Cache clearing notice:', e);
    }
    // Triggers skipWaiting() and reloads the window
    await updateServiceWorker(true);
  };

  const closeRefreshToast = () => {
    setNeedRefresh(false);
  };

  const closeOfflineReadyToast = () => {
    setOfflineReady(false);
  };

  return (
    <>
      {/* 1. New Version Available Update Notification Toast */}
      {needRefresh && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-md w-[calc(100vw-3rem)] animate-bounce-in">
          <div className="rounded-2xl border border-sky-400/50 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-white ring-1 ring-sky-500/20">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    System Update
                  </span>
                  <span className="text-[11px] text-slate-400">QMS v2.8.5</span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-slate-100">
                  A new version of QMS is available!
                </h4>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                  Northern Fashions Ltd. system update is ready with latest inspection and analytics improvements.
                </p>

                <div className="mt-3.5 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleUpdateNow}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 transition-all shadow-md hover:shadow-sky-500/25 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeRefreshToast}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    Later
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRefreshToast}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Offline Ready Notification (Transient) */}
      {offlineReady && (
        <div className="fixed bottom-6 left-6 z-30 max-w-sm animate-fade-in">
          <div className="rounded-xl border border-emerald-500/40 bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-white flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">Offline Ready</span>
              <span className="text-slate-300">QMS is cached for instant offline operation.</span>
            </div>
            <button
              onClick={closeOfflineReadyToast}
              className="ml-auto p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Live Offline Status Warning Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[110] bg-amber-500/95 text-slate-950 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. QMS is operating from local offline cache. Changes will sync when reconnected.</span>
        </div>
      )}
    </>
  );
};
