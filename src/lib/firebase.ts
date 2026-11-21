import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  enableNetwork,
  disableNetwork,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  DEFAULT_LONG_POLLING_TIMEOUT_SECONDS,
  isNavigatorOnline,
  isOfflineFirestoreError,
} from '../utils/firebaseConnection';

const app = initializeApp(firebaseConfig);

// Force reliable short-lived long-polling so proxies, iframes, firewalls, and older Chrome browsers
// never hang for 10+ seconds on buffered HTTP/2 WebChannel streams, while using safe memoryLocalCache
// (app state is cached locally in localStorage without IndexedDB multi-tab target conflicts).
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: {
        timeoutSeconds: DEFAULT_LONG_POLLING_TIMEOUT_SECONDS,
      },
      localCache: memoryLocalCache(),
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

let networkSyncInitialized = false;
let networkDisabledForOffline = false;

export function initFirestoreNetworkSync(): void {
  if (networkSyncInitialized || typeof window === 'undefined') return;
  networkSyncInitialized = true;

  if (!isNavigatorOnline()) {
    networkDisabledForOffline = true;
    void disableNetwork(db).catch(() => {});
  }

  window.addEventListener('offline', () => {
    networkDisabledForOffline = true;
    void disableNetwork(db).catch(() => {});
  });

  window.addEventListener('online', () => {
    if (networkDisabledForOffline) {
      networkDisabledForOffline = false;
      void enableNetwork(db).catch(() => {});
    }
  });
}

initFirestoreNetworkSync();

export async function ensureFirestoreOnline(): Promise<void> {
  if (!isNavigatorOnline() || !networkDisabledForOffline) return;
  networkDisabledForOffline = false;
  try {
    await enableNetwork(db);
  } catch {
    // ignore transient enableNetwork issues
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  if (!isNavigatorOnline()) {
    return false;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    await ensureFirestoreOnline();
    await Promise.race([
      getDocFromServer(doc(db, 'reports', '_healthcheck_')),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Connection healthcheck timed out')), 10000);
      }),
    ]);
    return true;
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      console.warn(
        'Firebase connection check warning:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
    return true;
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}

