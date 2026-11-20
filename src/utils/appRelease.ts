export interface AppReleaseRecord {
  version: string;
  builtAt: string;
  host: string;
}

export const ACK_NOTICES_STORAGE_KEY = 'qms_ack_update_notices_v1';
export const NETLIFY_PRODUCTION_HOST = 'qms-quality-management-system.netlify.app';
export const MAX_NOTICE_AGE_MS = 24 * 60 * 60 * 1000;

export function sanitizeHostId(hostId: string): string {
  return (hostId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'default_host';
}

export function isNoticeVersion(version: string | undefined | null): boolean {
  return typeof version === 'string' && version.startsWith('notice-');
}

export function isFreshNotice(
  builtAt: string | undefined | null,
  nowMs: number = Date.now(),
  maxAgeMs: number = MAX_NOTICE_AGE_MS
): boolean {
  if (!builtAt) return false;
  const parsed = Date.parse(builtAt);
  if (Number.isNaN(parsed)) return false;
  const age = nowMs - parsed;
  // Allow slight positive clock skew up to 5 minutes
  return age >= -5 * 60 * 1000 && age <= maxAgeMs;
}

export function evaluateServerVersion(params: {
  currentBuildId: string;
  remoteVersion?: string | null;
}): 'update-available' | 'verified-current' | 'ignore' {
  const { currentBuildId, remoteVersion } = params;
  if (!currentBuildId || currentBuildId === 'dev') return 'ignore';
  if (!remoteVersion || typeof remoteVersion !== 'string') return 'ignore';
  if (remoteVersion !== currentBuildId) return 'update-available';
  return 'verified-current';
}

export function evaluateFirestoreRelease(params: {
  currentBuildId: string;
  currentBuiltAt?: string;
  releaseVersion?: string | null;
  releaseBuiltAt?: string | null;
  acknowledgedNotices?: string[];
  nowMs?: number;
}): 'trigger-now' | 'verify-server' | 'ignore' {
  const {
    currentBuildId,
    currentBuiltAt = '',
    releaseVersion,
    releaseBuiltAt = '',
    acknowledgedNotices = [],
    nowMs = Date.now(),
  } = params;

  if (!releaseVersion || typeof releaseVersion !== 'string') return 'ignore';

  if (isNoticeVersion(releaseVersion)) {
    if (acknowledgedNotices.includes(releaseVersion)) return 'ignore';
    return isFreshNotice(releaseBuiltAt, nowMs) ? 'trigger-now' : 'ignore';
  }

  if (!currentBuildId || currentBuildId === 'dev') return 'ignore';
  if (releaseVersion === currentBuildId) return 'ignore';

  // If timestamps don't contradict (or aren't available), trigger immediately;
  // otherwise ask HTTP /version.json check to confirm so server clock skew cannot drop real updates.
  if (!currentBuiltAt || !releaseBuiltAt || releaseBuiltAt >= currentBuiltAt) {
    return 'trigger-now';
  }
  return 'verify-server';
}

export function extractEntryScriptSrc(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<script[^>]+src=["']([^"']*\/assets\/index-[^"'?#]+\.js)["']/i);
  return match ? match[1] : null;
}

export function loadAcknowledgedNotices(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(ACK_NOTICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function acknowledgeNoticeVersion(version: string): void {
  if (!isNoticeVersion(version)) return;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = loadAcknowledgedNotices().filter((v) => v !== version);
    const updated = [version, ...existing].slice(0, 15);
    window.localStorage.setItem(ACK_NOTICES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}
