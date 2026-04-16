import Redis from 'ioredis';
import logger from './logger';

const url = process.env.REDIS_URL;

type AnyRedis = Redis | null;

function timeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('redis timeout')), ms);
    promise.then((v) => {
      clearTimeout(t);
      resolve(v);
    }, (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

class CircuitRedis {
  private client: AnyRedis;
  private failures: number[] = [];
  private openUntil = 0;
  private inProbe = false;

  // Circuit configuration
  private threshold: number;
  private windowMs: number;
  private openMs: number;
  private requestTimeoutMs: number;

  constructor(client: AnyRedis) {
    this.client = client;
    this.threshold = Number(process.env.REDIS_CB_THRESHOLD || 3);
    this.windowMs = Number(process.env.REDIS_CB_WINDOW_MS || 10_000);
    this.openMs = Number(process.env.REDIS_CB_OPEN_MS || 30_000);
    this.requestTimeoutMs = Number(process.env.REDIS_REQUEST_TIMEOUT_MS || 2_000);
    if (!client) logger.info('redis', { msg: 'no redis configured' });
  }

  private now() {
    return Date.now();
  }

  private prune() {
    const cutoff = this.now() - this.windowMs;
    this.failures = this.failures.filter((ts) => ts >= cutoff);
  }

  private recordFailure() {
    this.failures.push(this.now());
    this.prune();
    if (this.failures.length >= this.threshold) {
      this.openUntil = this.now() + this.openMs;
      logger.info('redis', { msg: 'circuit opened', openUntil: this.openUntil });
    }
  }

  private recordSuccess() {
    this.failures = [];
    if (this.openUntil > 0) {
      this.openUntil = 0;
      logger.info('redis', { msg: 'circuit closed' });
    }
  }

  private isOpen() {
    return this.openUntil > this.now();
  }

  private async probe(): Promise<boolean> {
    if (!this.client) return false;
    if (this.inProbe) return false;
    this.inProbe = true;
    try {
      const r = await timeout(this.requestTimeoutMs, (this.client as Redis).ping());
      if (r === 'PONG' || r) {
        this.recordSuccess();
        return true;
      }
      this.recordFailure();
      return false;
    } catch (err: any) {
      this.recordFailure();
      return false;
    } finally {
      this.inProbe = false;
    }
  }

  private async call(method: string, args: any[]): Promise<any> {
    if (!this.client) return null;

    if (this.isOpen()) {
      // If the open window expired, try a probe
      if (this.now() >= this.openUntil) {
        const ok = await this.probe();
        if (!ok) return null;
      } else {
        return null;
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (this.client as any)[method];
      if (typeof fn !== 'function') return null;
      const res = await timeout(this.requestTimeoutMs, Promise.resolve(fn.apply(this.client, args)));
      this.recordSuccess();
      return res;
    } catch (err: any) {
      this.recordFailure();
      logger.error('redis', { msg: 'operation failed', method, err: (err as Error).message });
      return null;
    }
  }

  // Common Redis methods used by the app
  async get(key: string) {
    return this.call('get', [key]);
  }

  async set(...args: any[]) {
    return this.call('set', args);
  }

  async del(key: string) {
    return this.call('del', [key]);
  }

  async incr(key: string) {
    return this.call('incr', [key]);
  }

  async lpush(key: string, value: string) {
    return this.call('lpush', [key, value]);
  }

  async brpop(key: string, timeoutSec: number) {
    return this.call('brpop', [key, timeoutSec]);
  }

  async pexpire(key: string, ms: number) {
    return this.call('pexpire', [key, ms]);
  }

  async ping() {
    return this.call('ping', []);
  }
  
  // Sorted-set helpers used by sliding-window rate limiter
  async zadd(key: string, score: number | string, member: string) {
    return this.call('zadd', [key, score, member]);
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string) {
    return this.call('zremrangebyscore', [key, min, max]);
  }

  async zcard(key: string) {
    return this.call('zcard', [key]);
  }

  async zrange(key: string, start: number, stop: number, withScores = false) {
    const args: any[] = [key, start, stop];
    if (withScores) args.push('WITHSCORES');
    return this.call('zrange', args);
  }

  // expose raw client for advanced usages if needed
  raw() {
    return this.client;
  }
}

let instance: CircuitRedis | null = null;
if (url) {
  const client = new Redis(url);
  client.on('error', (err) => {
    logger.error('redis', { msg: 'low-level error', err: (err as Error).message });
  });
  instance = new CircuitRedis(client);
  logger.info('redis', { msg: 'initialized with circuit breaker' });
} else {
  instance = new CircuitRedis(null);
}

export default instance as any;
