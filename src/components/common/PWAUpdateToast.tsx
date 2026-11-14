import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X, CheckCircle, WifiOff } from 'lucide-react';

declare global {
  interface Window {
    __QMS_FORCE_UPDATE_PROMPT__?: () => void;
  }
}

const CURRENT_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';

export const PWAUpdateToast: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [versionMismatchDetected, setVersionMismatchDetected] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0);
  const [remoteVersion, setRemoteVersion] = useState<string>('');
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const checkingRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {});
        const intervalId = setInterval(() => {
          registration.update().catch((err) => console.warn('Periodic SW update check failed:', err));
        }, 5 * 60 * 1000);

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
      void swUrl;
    },
    onRegisterError(error) {
      console.warn('QMS Service Worker Registration Warning:', error);
    },
  });

  const sessionStartRef = useRef<number>(Date.now());

  const clearCachesAndReload = useCallback(async (targetVersion?: string) => {
    try {
      if (targetVersion && typeof sessionStorage !== 'undefined') {
        const alreadyReloaded = sessionStorage.getItem('qms_reloaded_for_version');
        if (alreadyReloaded === targetVersion) {
          return false;
        }
        sessionStorage.setItem('qms_reloaded_for_version', targetVersion);
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((k) => window.caches.delete(k)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => {})));
      }
    } catch (e) {
      console.warn('Cache clearing notice:', e);
    }
    window.location.reload();
    return true;
  }, []);

  // Poll /version.json (always bypassing cache) so shared links & logged-out users receive instant updates
  const checkServerVersion = useCallback(async () => {
    if (checkingRef.current || typeof window === 'undefined' || !navigator.onLine) return;
    checkingRef.current = true;
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (
        data?.version &&
        typeof data.version === 'string' &&
        CURRENT_BUILD_ID !== 'dev' &&
        data.version !== CURRENT_BUILD_ID
      ) {
        setRemoteVersion(data.version);
        // If user just opened a stale cached link (< 10s since page load), auto-refresh seamlessly once
        const elapsedSinceBoot = Date.now() - sessionStartRef.current;
        const alreadyAttempted =
          typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem('qms_reloaded_for_version') === data.version;

        if (elapsedSinceBoot < 10000 && !alreadyAttempted) {
          await clearCachesAndReload(data.version);
          return;
        }
        setVersionMismatchDetected(true);
      }
    } catch {
      // Ignore transient network errors
    } finally {
      checkingRef.current = false;
    }
  }, [clearCachesAndReload]);

  useEffect(() => {
    // Immediate check on startup so stale cached tabs update right away
    checkServerVersion();

    const interval = setInterval(() => {
      checkServerVersion();
    }, 45 * 1000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
      }
    };

    const onControllerChange = () => {
      if (CURRENT_BUILD_ID !== 'dev' && Date.now() - sessionStartRef.current < 15000) {
        clearCachesAndReload(`sw-${Date.now()}`);
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }

    // Expose hook for automated testing / manual verification
    window.__QMS_FORCE_UPDATE_PROMPT__ = () => {
      setSnoozedUntil(0);
      setVersionMismatchDetected(true);
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      }
    };
  }, [checkServerVersion, clearCachesAndReload]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkServerVersion();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerVersion]);

  // Auto-dismiss transient Offline Ready notification after 4 seconds
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      if (needRefresh) {
        await updateServiceWorker(true);
      }
    } catch {
      // fall through to cache clear + reload
    }
    await clearCachesAndReload(remoteVersion || undefined);
  };

  const closeRefreshToast = () => {
    setNeedRefresh(false);
    setVersionMismatchDetected(false);
    setSnoozedUntil(Date.now() + 5 * 60 * 1000); // Remind again in 5 min if still outdated
  };

  const closeOfflineReadyToast = () => {
    setOfflineReady(false);
  };

  const showUpdatePopup = (needRefresh || versionMismatchDetected) && Date.now() >= snoozedUntil;

  return (
    <>
      {/* 1. Prominent Update Your App Popup — Active on BOTH Login screen (Logged Out) & Workspace (Logged In) */}
      {showUpdatePopup && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Update Your App"
          className="fixed bottom-6 right-6 z-[120] max-w-md w-[calc(100vw-3rem)] animate-bounce-in"
        >
          <div className="rounded-2xl border-2 border-sky-400/70 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-white ring-2 ring-sky-500/30">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Update Your App
                  </span>
                  {remoteVersion && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Build #{remoteVersion.slice(-6)}
                    </span>
                  )}
                </div>
                <h4 className="mt-1 text-sm font-black text-white">
                  Update Your App — New QMS Version Ready!
                </h4>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                  নতুন আপডেট পাওয়া গেছে! সর্বশেষ ফিচার ও সঠিক PDF অটো-ফিল পেতে এখনই <strong>Update Now</strong> চাপুন।
                </p>

                <div className="mt-3.5 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleUpdateNow}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 transition-all shadow-md hover:shadow-sky-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>{isUpdating ? 'Updating App...' : 'Update Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeRefreshToast}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Later
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRefreshToast}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0 cursor-pointer"
                aria-label="Close update notification"
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
              type="button"
              onClick={closeOfflineReadyToast}
              className="ml-auto p-1 text-slate-400 hover:text-white"
              aria-label="Dismiss offline ready alert"
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
