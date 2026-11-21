export const DEFAULT_LONG_POLLING_TIMEOUT_SECONDS = 20;

export function isNavigatorOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (typeof navigator.onLine !== 'boolean') return true;
  return navigator.onLine;
}

export function isOfflineFirestoreError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '').toLowerCase()
      : '';
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
      ? error.toLowerCase()
      : '';

  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    message.includes('the client is offline') ||
    message.includes('timed out') ||
    message.includes('could not reach cloud firestore backend') ||
    message.includes('network error') ||
    message.includes('failed to fetch')
  );
}

export function shouldPublishAppRelease(params: {
  isProd: boolean;
  hostname: string;
  buildId: string;
}): boolean {
  const { isProd, hostname, buildId } = params;
  if (!isProd) return false;
  if (!buildId || buildId === 'dev') return false;
  const normalizedHost = (hostname || '').trim().toLowerCase();
  if (!normalizedHost || normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return false;
  }
  return true;
}
