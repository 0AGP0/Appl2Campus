/**
 * Rate limiter: in-memory (tek sunucu) veya Redis/Upstash (production, çoklu instance).
 * UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN tanımlıysa Redis kullanılır.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 dakika
const MAX_REGISTER_PER_IP = 5;
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

const MAX_LOGIN_ATTEMPTS_PER_EMAIL = 10;
const SYNC_WINDOW_MS = 5 * 60 * 1000;
const MAX_SYNC_PER_STUDENT = 1;

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

function key(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

// --- Upstash (Redis) limiters - lazy init ---
let redisRegisterLimiter: Ratelimit | null = null;
let redisLoginLimiter: Ratelimit | null = null;
let redisSyncLimiter: Ratelimit | null = null;
let redisChecked = false;

function ensureRedisLimiters(): void {
  if (redisChecked) return;
  redisChecked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  const redis = new Redis({ url, token });
  redisRegisterLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REGISTER_PER_IP, "15 m"),
    prefix: "apply2campus:register",
  });
  redisLoginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_LOGIN_ATTEMPTS_PER_EMAIL, "15 m"),
    prefix: "apply2campus:login",
  });
  redisSyncLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_SYNC_PER_STUDENT, "5 m"),
    prefix: "apply2campus:sync",
  });
}

/**
 * Register: IP başına 15 dakikada en fazla MAX_REGISTER_PER_IP istek.
 * Limit aşılırsa false döner.
 */
export async function checkRegisterRateLimit(ip: string): Promise<boolean> {
  ensureRedisLimiters();
  if (redisRegisterLimiter) {
    const { success } = await redisRegisterLimiter.limit(`ip:${ip}`);
    return success;
  }
  cleanup();
  const k = key("register", ip);
  const now = Date.now();
  let entry = store.get(k);
  if (!entry) {
    store.set(k, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(k, entry);
    return true;
  }
  if (entry.count >= MAX_REGISTER_PER_IP) return false;
  entry.count++;
  return true;
}

/**
 * Sync: öğrenci başına 5 dakikada en fazla 1 sync.
 * Redis kullanılıyorsa async checkSyncRateLimitAsync kullanın.
 */
export function checkSyncRateLimit(studentId: string): boolean {
  ensureRedisLimiters();
  if (redisSyncLimiter) {
    return true;
  }
  cleanup();
  const k = `sync:${studentId}`;
  const now = Date.now();
  const entry = store.get(k);
  if (!entry || now >= entry.resetAt) return true;
  return entry.count < MAX_SYNC_PER_STUDENT;
}

/** Sync için Redis kullanılıyorsa route'ta bunu await edin. */
export async function checkSyncRateLimitAsync(studentId: string): Promise<boolean> {
  ensureRedisLimiters();
  if (redisSyncLimiter) {
    const { success } = await redisSyncLimiter.limit(`student:${studentId}`);
    return success;
  }
  return checkSyncRateLimit(studentId);
}

export function recordSyncAttempt(studentId: string): void {
  if (redisSyncLimiter) return;
  cleanup();
  const k = `sync:${studentId}`;
  const now = Date.now();
  const entry = store.get(k);
  if (!entry || now >= entry.resetAt) {
    store.set(k, { count: 1, resetAt: now + SYNC_WINDOW_MS });
    return;
  }
  entry.count++;
  store.set(k, entry);
}

/**
 * Login: email başına 15 dakikada en fazla MAX_LOGIN_ATTEMPTS_PER_EMAIL deneme.
 * Async sürüm (Redis için); auth'ta kullanılacak.
 */
export async function checkLoginRateLimitByEmailAsync(email: string): Promise<boolean> {
  ensureRedisLimiters();
  const normalized = email.toLowerCase().trim();
  if (redisLoginLimiter) {
    const { success } = await redisLoginLimiter.limit(`email:${normalized}`);
    return success;
  }
  cleanup();
  const k = key("login", normalized);
  const now = Date.now();
  let entry = store.get(k);
  if (!entry) return true;
  if (now >= entry.resetAt) return true;
  return entry.count < MAX_LOGIN_ATTEMPTS_PER_EMAIL;
}

/** Senkron sürüm (in-memory fallback). */
export function checkLoginRateLimitByEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  ensureRedisLimiters();
  if (redisLoginLimiter) return true;
  cleanup();
  const k = key("login", normalized);
  const now = Date.now();
  let entry = store.get(k);
  if (!entry) return true;
  if (now >= entry.resetAt) return true;
  return entry.count < MAX_LOGIN_ATTEMPTS_PER_EMAIL;
}

export function incrementLoginAttempts(email: string): void {
  if (redisLoginLimiter) return;
  cleanup();
  const k = key("login", email.toLowerCase().trim());
  const now = Date.now();
  let entry = store.get(k);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  store.set(k, entry);
}

/**
 * İstek IP'sini header'lardan alır (proxy arkada ise x-forwarded-for / x-real-ip).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
