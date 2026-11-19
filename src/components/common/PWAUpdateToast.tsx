import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X, CheckCircle, WifiOff } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';

declare global {
  interface Window {
    __QMS_FORCE_UPDATE_PROMPT__?: () => void;
    __QMS_PENDING_UPDATE_VERSION__?: string;
  }
}

const CURRENT_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const CURRENT_BUILT_AT = typeof __APP_BUILT_AT__ !== 'undefined' ? __APP_BUILT_AT__ : '';

export const PWAUpdateToast: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [versionMismatchDetected, setVersionMismatchDetected] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string>('');
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const checkingRef = useRef(false);
  const notifiedVersionRef = useRef<string>('');
  const publishedRef = useRef<boolean>(false);
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        }, 30 * 1000);

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch((err) => console.warn('Visibility SW update check failed:', err));
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        void intervalId;
      }
      void swUrl;
    },
    onRegisterError(error) {
      console.warn('OQL Service Worker Registration Warning:', error);
    },
  });

  const broadcastUpdateToBell = useCallback((versionLabel: string) => {
    const key = versionLabel || 'sw-update';
    if (typeof window !== 'undefined') {
      window.__QMS_PENDING_UPDATE_VERSION__ = key;
    }
    if (notifiedVersionRef.current === key || typeof window === 'undefined') return;
    notifiedVersionRef.current = key;
    window.dispatchEvent(
      new CustomEvent('qms:app-update-available', { detail: { version: versionLabel } })
    );
  }, []);

  const clearCachesAndReload = useCallback(async (targetVersion?: string) => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('qms_reloaded_for_version');
        sessionStorage.removeItem('__qms_boot_retried__');
      }
    } catch {
      // ignore
    }
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((k) => window.caches.delete(k).catch(() => false)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }
    } catch (e) {
      console.warn('Cache clearing notice:', e);
    }

    if (typeof window !== 'undefined') {
      const bust = encodeURIComponent(targetVersion || Date.now().toString());
      const url = new URL(window.location.href);
      url.searchParams.set('_v', bust);
      window.location.replace(url.toString());
    }
  }, []);

  const triggerUpdatePrompt = useCallback(
    (newVersion: string) => {
      setRemoteVersion((prev) => newVersion || prev);
      setVersionMismatchDetected(true);
      broadcastUpdateToBell(newVersion);
    },
    [broadcastUpdateToBell]
  );

  // Poll /version.json (always bypassing cache) and publish/broadcast newer releases via Firestore
  const checkServerVersion = useCallback(async () => {
    if (checkingRef.current || typeof window === 'undefined' || !navigator.onLine) return;
    checkingRef.current = true;
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const data = await res.json();
      if (!data?.version || typeof data.version !== 'string') return;

      const hostId = window.location.hostname || 'localhost';

      if (CURRENT_BUILD_ID !== 'dev' && data.version !== CURRENT_BUILD_ID) {
        // Always surface update popup + bell notification so every user sees it right away
        triggerUpdatePrompt(data.version);
      } else if (
        CURRENT_BUILD_ID !== 'dev' &&
        data.version === CURRENT_BUILD_ID &&
        CURRENT_BUILT_AT &&
        !publishedRef.current
      ) {
        // Verified live build -> broadcast release metadata to Firestore so all open tabs get instant push
        publishedRef.current = true;
        firestoreService.publishAppReleaseIfNewer(hostId, CURRENT_BUILD_ID, CURRENT_BUILT_AT);
      }
    } catch {
      // Ignore transient network errors
    } finally {
      checkingRef.current = false;
    }
  }, [triggerUpdatePrompt]);

  // Real-time Firestore release listener so ALL open users get instant update alerts (<1s) on deploy
  useEffect(() => {
    if (typeof window === 'undefined' || CURRENT_BUILD_ID === 'dev') return;
    const hostId = window.location.hostname || 'localhost';
    const unsubscribe = firestoreService.subscribeAppRelease(hostId, (release) => {
      if (
        release.version &&
        release.version !== CURRENT_BUILD_ID &&
        (!CURRENT_BUILT_AT || release.builtAt > CURRENT_BUILT_AT)
      ) {
        triggerUpdatePrompt(release.version);
      }
    });
    return () => unsubscribe();
  }, [triggerUpdatePrompt]);

  useEffect(() => {
    if (needRefresh) {
      triggerUpdatePrompt(remoteVersion || 'new-sw');
    }
  }, [needRefresh, remoteVersion, triggerUpdatePrompt]);

  useEffect(() => {
    checkServerVersion();

    const interval = setInterval(() => {
      checkServerVersion();
    }, 15 * 1000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
      }
    };

    const onManualCheck = () => {
      checkServerVersion();
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    window.addEventListener('qms:check-app-update', onManualCheck);

    window.__QMS_FORCE_UPDATE_PROMPT__ = () => {
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
      setIsSnoozed(false);
      triggerUpdatePrompt('new-release');
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      window.removeEventListener('qms:check-app-update', onManualCheck);
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    };
  }, [checkServerVersion, triggerUpdatePrompt]);

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

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      if (needRefresh) {
        await Promise.race([
          updateServiceWorker(true),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch {
      // fall through to unregister + cache clear + cache-busted reload
    }
    await clearCachesAndReload(remoteVersion || undefined);
  };

  const closeRefreshToast = () => {
    setIsSnoozed(true);
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    // Remind user again in 2 minutes if they are still on an outdated version
    snoozeTimerRef.current = setTimeout(() => {
      setIsSnoozed(false);
      checkServerVersion();
    }, 2 * 60 * 1000);
  };

  const closeOfflineReadyToast = () => {
    setOfflineReady(false);
  };

  const showUpdatePopup = (needRefresh || versionMismatchDetected) && !isSnoozed;

  return (
    <>
      {/* 1. Prominent Update Notification Popup — Active for ALL users (Logged In & Logged Out, Every Role) */}
      {showUpdatePopup && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="App Update Available"
          className="fixed bottom-6 right-6 z-[120] max-w-md w-[calc(100vw-3rem)]"
        >
          <div className="rounded-2xl border-2 border-sky-400/70 bg-slate-900/95 p-4 shadow-2xl text-white ring-2 ring-sky-500/30">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    New Update Ready
                  </span>
                  {remoteVersion && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Build #{remoteVersion.slice(-6)}
                    </span>
                  )}
                </div>
                <h4 className="mt-1 text-sm font-black text-white">
                  Update Your App — New OQL: Analysis Version Ready!
                </h4>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                  অ্যাপসটির নতুন ভার্সন আপডেট হয়েছে! সর্বশেষ ফিচার ও সঠিক রিপোর্ট দেখতে এখনই <strong>Update Now</strong> বাটনে ক্লিক করুন।
                </p>

                <div className="mt-3.5 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleUpdateNow}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed bottom-6 left-6 z-30 max-w-sm">
          <div className="rounded-xl border border-emerald-500/40 bg-slate-900/95 p-3.5 shadow-xl text-white flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">Offline Ready</span>
              <span className="text-slate-300">OQL: Analysis is cached for instant offline operation.</span>
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
          <span>You are currently offline. OQL: Analysis is operating from local offline cache. Changes will sync when reconnected.</span>
        </div>
      )}
    </>
  );
};
