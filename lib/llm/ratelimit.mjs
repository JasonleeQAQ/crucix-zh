// Strict rate limiter: 2s between calls (safe under 40 RPM)
const MIN_INTERVAL_MS = 3000;
let lastCall = 0;
let lock = Promise.resolve();

async function waitForToken() {
  const prev = lock;
  let resolve;
  lock = new Promise(r => resolve = r);
  await prev;
  try {
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise(r => setTimeout(r, MIN_INTERVAL_MS - elapsed + 50));
    }
    lastCall = Date.now();
  } finally {
    resolve();
  }
}

export async function rateLimitedCall(fn, ...args) {
  await waitForToken();
  return fn(...args);
}
