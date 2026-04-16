import redis from './redis';

const CACHE_MS = Number(process.env.FEATURE_FLAGS_CACHE_MS || 5000);

let cache: { ts: number; flags: Record<string, any> } | null = null;

function readEnvFlags(): Record<string, any> {
  const envRaw = process.env.FEATURE_FLAGS || process.env.FEATURES || process.env.FEATURE_FLAGS_JSON || '';
  if (!envRaw) return {};
  try {
    return JSON.parse(envRaw);
  } catch (e) {
    return {};
  }
}

export async function getFeatureFlags(): Promise<Record<string, any>> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.flags;
  const r = redis as any;
  const rawClient = r && typeof r.raw === 'function' ? r.raw() : null;
  if (!rawClient) {
    const envFlags = readEnvFlags();
    cache = { ts: Date.now(), flags: envFlags };
    return envFlags;
  }

  try {
    const raw = await r.get('features');
    if (!raw) {
      const envFlags = readEnvFlags();
      cache = { ts: Date.now(), flags: envFlags };
      return envFlags;
    }
    try {
      const parsed = JSON.parse(raw);
      cache = { ts: Date.now(), flags: parsed };
      return parsed;
    } catch (e) {
      const envFlags = readEnvFlags();
      cache = { ts: Date.now(), flags: envFlags };
      return envFlags;
    }
  } catch (err) {
    const envFlags = readEnvFlags();
    cache = { ts: Date.now(), flags: envFlags };
    return envFlags;
  }
}

export async function isFeatureEnabled(flag: string, defaultVal = false): Promise<boolean> {
  const r = redis as any;
  const rawClient = r && typeof r.raw === 'function' ? r.raw() : null;
  // Per-flag env override
  const envPer = process.env[`FEATURE_${flag.toUpperCase()}`];
  if (envPer != null) {
    if (envPer === '1' || envPer === 'true' || envPer === 'True') return true;
    if (envPer === '0' || envPer === 'false' || envPer === 'False') return false;
  }

  if (!rawClient) {
    const flags = await getFeatureFlags();
    const v = flags ? flags[flag] : undefined;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true';
    return defaultVal;
  }

  try {
    // Prefer per-flag key if present in Redis
    const per = await r.get(`features:${flag}`);
    if (per != null) {
      if (per === '1' || per === 'true' || per === 'True') return true;
      if (per === '0' || per === 'false' || per === 'False') return false;
      try {
        return Boolean(JSON.parse(per));
      } catch (_) {
        return Boolean(per);
      }
    }

    const flags = await getFeatureFlags();
    const v = flags ? flags[flag] : undefined;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true';
    return defaultVal;
  } catch (err) {
    return defaultVal;
  }
}

export async function setFeatureFlags(obj: Record<string, any>, ttlMs?: number) {
  const r = redis as any;
  const rawClient = r && typeof r.raw === 'function' ? r.raw() : null;
  if (!rawClient) return false;
  try {
    await r.set('features', JSON.stringify(obj));
    if (ttlMs && ttlMs > 0) {
      await r.pexpire('features', ttlMs);
    }
    cache = { ts: Date.now(), flags: obj };
    return true;
  } catch (_) {
    return false;
  }
}

export default { getFeatureFlags, isFeatureEnabled, setFeatureFlags };
