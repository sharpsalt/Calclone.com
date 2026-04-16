// Lightweight in-memory sliding-window counter for single-process development
const store: Map<string, number[]> = new Map();

export function recordAndCount(key: string, now: number, windowMs: number): { count: number; oldest?: number } {
  let arr = store.get(key);
  if (!arr) {
    arr = [];
    store.set(key, arr);
  }
  // push timestamp
  arr.push(now);
  const cutoff = now - windowMs;
  // remove old timestamps in-place
  let i = 0;
  while (i < arr.length && arr[i] <= cutoff) i++;
  if (i > 0) arr.splice(0, i);
  const count = arr.length;
  const oldest = arr.length > 0 ? arr[0] : undefined;
  return { count, oldest };
}

// Periodic cleanup to avoid memory leaks for long-running dev servers
setInterval(() => {
  const now = Date.now();
  for (const [key, arr] of store.entries()) {
    const cutoff = now - 1000 * 60 * 60; // 1 hour
    let i = 0;
    while (i < arr.length && arr[i] <= cutoff) i++;
    if (i > 0) arr.splice(0, i);
    if (arr.length === 0) store.delete(key);
  }
}, 60_000).unref?.();

export function getCount(key: string, now: number, windowMs: number): number {
  const arr = store.get(key) || [];
  const cutoff = now - windowMs;
  let i = 0;
  while (i < arr.length && arr[i] <= cutoff) i++;
  return arr.length - i;
}

export default { recordAndCount, getCount };
