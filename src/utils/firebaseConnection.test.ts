import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LONG_POLLING_TIMEOUT_SECONDS,
  isOfflineFirestoreError,
  shouldPublishAppRelease,
} from './firebaseConnection';

test('DEFAULT_LONG_POLLING_TIMEOUT_SECONDS stays within Firestore 5-30s bounds', () => {
  assert.ok(DEFAULT_LONG_POLLING_TIMEOUT_SECONDS >= 5);
  assert.ok(DEFAULT_LONG_POLLING_TIMEOUT_SECONDS <= 30);
});

test('isOfflineFirestoreError identifies offline, timeout, and unavailable errors accurately', () => {
  assert.equal(
    isOfflineFirestoreError(new Error('Failed to get document because the client is offline.')),
    true
  );
  assert.equal(isOfflineFirestoreError(new Error('Connection healthcheck timed out')), true);
  assert.equal(
    isOfflineFirestoreError({ code: 'unavailable', message: 'Backend unavailable' }),
    true
  );
  assert.equal(
    isOfflineFirestoreError({ code: 'permission-denied', message: 'Missing permissions' }),
    false
  );
  assert.equal(isOfflineFirestoreError(null), false);
});

test('shouldPublishAppRelease skips dev/localhost and allows production hosts', () => {
  assert.equal(
    shouldPublishAppRelease({ isProd: false, hostname: 'localhost', buildId: '1795000000' }),
    false
  );
  assert.equal(
    shouldPublishAppRelease({ isProd: true, hostname: 'localhost', buildId: '1795000000' }),
    false
  );
  assert.equal(
    shouldPublishAppRelease({ isProd: true, hostname: '127.0.0.1', buildId: '1795000000' }),
    false
  );
  assert.equal(
    shouldPublishAppRelease({
      isProd: true,
      hostname: 'qms-quality-management-system.netlify.app',
      buildId: 'dev',
    }),
    false
  );
  assert.equal(
    shouldPublishAppRelease({
      isProd: true,
      hostname: 'qms-quality-management-system.netlify.app',
      buildId: '1795000000',
    }),
    true
  );
});
