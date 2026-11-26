import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  BROWSER_COMPAT_POLYFILL_IIFE,
  ensureBrowserCompatPolyfills,
} from '../src/utils/browserCompat';

test('BROWSER_COMPAT_POLYFILL_IIFE prevents ReferenceError: Iterator is not defined in older browsers', () => {
  // Simulate an older browser context lacking ES2025 Iterator, Promise.try, URL.parse, Uint8Array base64/hex
  const sandbox: any = {
    Object,
    Array,
    String,
    Number,
    Math,
    Date,
    RegExp,
    Map,
    Set,
    WeakMap,
    Symbol,
    TypeError,
    Uint8Array: class MockUint8Array extends Uint8Array {},
    ArrayBuffer,
    URL: class MockURL extends URL {},
    Promise: class MockPromise<T> extends Promise<T> {},
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s: string) => Buffer.from(s, 'binary').toString('base64'),
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window = sandbox;

  // Strip ES2025/ES2024 methods from mocks
  delete sandbox.Iterator;
  delete sandbox.Promise.try;
  delete sandbox.Promise.withResolvers;
  delete sandbox.URL.parse;
  delete sandbox.URL.canParse;
  delete sandbox.structuredClone;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(BROWSER_COMPAT_POLYFILL_IIFE, ctx);

  // Exact pdfjs-dist v6 top-level check that crashed older browsers
  const joined = vm.runInContext(
    `
    if (typeof Iterator.prototype.join !== "function") {
      Iterator.prototype.join = function (sep) { return [...this].join(sep); };
    }
    function* gen() { yield "A"; yield "B"; yield "C"; }
    Iterator.prototype.join.call(gen(), "-");
  `,
    ctx
  );
  assert.equal(joined, 'A-B-C');

  // Verify Promise.try & Promise.withResolvers
  const hasPromiseTry = vm.runInContext(`typeof Promise.try === 'function'`, ctx);
  const hasWithResolvers = vm.runInContext(`typeof Promise.withResolvers === 'function'`, ctx);
  assert.equal(hasPromiseTry, true);
  assert.equal(hasWithResolvers, true);

  // Verify URL.parse & URL.canParse
  const parsedHref = vm.runInContext(
    `URL.parse('/assets/app.js', 'https://sabuj-mahmud.github.io/QMS-Quality-Management-System/').href`,
    ctx
  );
  assert.equal(parsedHref, 'https://sabuj-mahmud.github.io/assets/app.js');
  assert.equal(vm.runInContext(`URL.parse('not a valid url')`, ctx), null);
  assert.equal(vm.runInContext(`URL.canParse('https://example.com')`, ctx), true);

  // Verify Uint8Array base64 / hex & structuredClone
  const b64RoundTrip = vm.runInContext(
    `Uint8Array.fromBase64(new Uint8Array([72, 105, 33]).toBase64()).toHex()`,
    ctx
  );
  assert.equal(b64RoundTrip, '486921');

  const clonedEqual = vm.runInContext(
    `(() => {
      var orig = { a: 1, nested: { b: [2, 3] } };
      var copy = structuredClone(orig);
      copy.nested.b.push(4);
      return orig.nested.b.length === 2 && copy.nested.b.length === 3;
    })()`,
    ctx
  );
  assert.equal(clonedEqual, true);
});

test('ensureBrowserCompatPolyfills installs missing Iterator, Promise, and URL helpers on target', () => {
  const target: any = {
    Promise: class P<T> extends Promise<T> {},
    URL: class U extends URL {},
  };
  delete target.Promise.try;
  delete target.Promise.withResolvers;
  delete target.URL.parse;
  delete target.URL.canParse;

  ensureBrowserCompatPolyfills(target);

  assert.equal(typeof target.Iterator, 'function');
  assert.equal(typeof target.Iterator.prototype.join, 'function');
  assert.equal(typeof target.Iterator.from, 'function');
  assert.equal(typeof target.Promise.try, 'function');
  assert.equal(typeof target.Promise.withResolvers, 'function');
  assert.equal(typeof target.URL.parse, 'function');
  assert.equal(typeof target.URL.canParse, 'function');
  assert.equal(target.Iterator.prototype.join.call(['X', 'Y'], '|'), 'X|Y');
});
