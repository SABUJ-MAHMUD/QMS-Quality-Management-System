import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeHostId,
  isNoticeVersion,
  isFreshNotice,
  evaluateServerVersion,
  evaluateFirestoreRelease,
  extractEntryScriptSrc,
} from './appRelease';

test('sanitizeHostId normalizes domain hostnames into valid Firestore doc IDs', () => {
  assert.equal(
    sanitizeHostId('qms-quality-management-system.netlify.app'),
    'qms-quality-management-system_netlify_app'
  );
  assert.equal(sanitizeHostId('localhost'), 'localhost');
  assert.equal(sanitizeHostId(''), 'default_host');
});

test('evaluateServerVersion detects any build ID change from live /version.json', () => {
  assert.equal(
    evaluateServerVersion({ currentBuildId: '1794935635993', remoteVersion: '1794940000000' }),
    'update-available'
  );
  assert.equal(
    evaluateServerVersion({ currentBuildId: '1794935635993', remoteVersion: '1794935635993' }),
    'verified-current'
  );
  assert.equal(
    evaluateServerVersion({ currentBuildId: 'dev', remoteVersion: '1794940000000' }),
    'ignore'
  );
});

test('evaluateFirestoreRelease handles normal deploys, clock skew, and admin notices', () => {
  // Normal newer release
  assert.equal(
    evaluateFirestoreRelease({
      currentBuildId: '100',
      currentBuiltAt: '2026-11-17T10:00:00.000Z',
      releaseVersion: '200',
      releaseBuiltAt: '2026-11-19T08:00:00.000Z',
    }),
    'trigger-now'
  );

  // Matching current build never triggers
  assert.equal(
    evaluateFirestoreRelease({
      currentBuildId: '200',
      currentBuiltAt: '2026-11-19T08:00:00.000Z',
      releaseVersion: '200',
      releaseBuiltAt: '2026-11-19T08:00:00.000Z',
    }),
    'ignore'
  );

  // Clock-skewed build (Netlify UTC behind container date) triggers server verification instead of silently dropping
  assert.equal(
    evaluateFirestoreRelease({
      currentBuildId: '100',
      currentBuiltAt: '2026-11-19T10:00:00.000Z',
      releaseVersion: '200',
      releaseBuiltAt: '2026-04-01T10:00:00.000Z',
    }),
    'verify-server'
  );

  // Fresh admin notice triggers immediately even on dev/same build if not acknowledged
  const now = Date.parse('2026-11-19T08:30:00.000Z');
  assert.equal(isNoticeVersion('notice-1794940000'), true);
  assert.equal(
    evaluateFirestoreRelease({
      currentBuildId: '200',
      releaseVersion: 'notice-1794940000',
      releaseBuiltAt: '2026-11-19T08:25:00.000Z',
      acknowledgedNotices: [],
      nowMs: now,
    }),
    'trigger-now'
  );

  // Acknowledged admin notice does not loop after reload
  assert.equal(
    evaluateFirestoreRelease({
      currentBuildId: '200',
      releaseVersion: 'notice-1794940000',
      releaseBuiltAt: '2026-11-19T08:25:00.000Z',
      acknowledgedNotices: ['notice-1794940000'],
      nowMs: now,
    }),
    'ignore'
  );

  // Expired admin notice (> 24h old) is ignored for new users
  assert.equal(
    isFreshNotice('2026-11-17T08:00:00.000Z', now),
    false
  );
});

test('extractEntryScriptSrc extracts Vite entry bundle hash from index.html fallback across root and GitHub Pages base paths', () => {
  const rootHtml = `<!doctype html><html><body><script type="module" crossorigin src="/assets/index-BUCSjnwK.js"></script></body></html>`;
  const ghPagesHtml = `<!doctype html><html><body><script type="module" crossorigin src="/QMS-Quality-Management-System/assets/index-Dis94-nz.js"></script></body></html>`;
  assert.equal(extractEntryScriptSrc(rootHtml), '/assets/index-BUCSjnwK.js');
  assert.equal(extractEntryScriptSrc(ghPagesHtml), '/QMS-Quality-Management-System/assets/index-Dis94-nz.js');
  assert.equal(extractEntryScriptSrc('<html><body>empty</body></html>'), null);
});
