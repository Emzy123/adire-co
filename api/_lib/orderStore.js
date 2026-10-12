/**
 * Adire & Co - Server-Side Order Persistence Store
 * Supports Upstash Redis / Vercel KV with robust in-memory fallback.
 * Catches all errors internally so no failure can crash the serverless function.
 */

import { Redis } from '@upstash/redis';

// Global memory cache for current process lifecycle
const memoryStore = new Map();

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && typeof url === 'string' && url.trim().length > 0 &&
      token && typeof token === 'string' && token.trim().length > 0) {
    try {
      return new Redis({ url: url.trim(), token: token.trim() });
    } catch (err) {
      console.warn('[orderStore] Could not initialize Upstash Redis:', err?.message || err);
      return null;
    }
  }
  return null;
}

/**
 * Saves an order to the persistent store.
 * @param {object} order
 */
export async function saveOrder(order) {
  if (!order || !order.reference) return;

  // Always keep in memory cache
  memoryStore.set(order.reference, order);

  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `order:${order.reference}`;
      // Retain orders in Redis for 30 days
      await redis.set(key, JSON.stringify(order), { ex: 30 * 24 * 60 * 60 });
    } catch (err) {
      console.warn('[orderStore] Upstash Redis set failed:', err?.message || err);
    }
  }
}

/**
 * Retrieves an order by its unique server-generated reference.
 * @param {string} reference
 * @returns {Promise<object|null>}
 */
export async function getOrder(reference) {
  if (!reference || typeof reference !== 'string') return null;

  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `order:${reference}`;
      const data = await redis.get(key);
      if (data) {
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
        return data;
      }
    } catch (err) {
      console.warn('[orderStore] Upstash Redis get failed:', err?.message || err);
    }
  }

  // Memory fallback
  return memoryStore.get(reference) || null;
}

/**
 * Updates an order status (e.g. from 'pending' to 'paid').
 * @param {string} reference
 * @param {'pending'|'paid'|'failed'} status
 * @param {string} [paidAt]
 * @returns {Promise<object|null>}
 */
export async function updateOrderStatus(reference, status, paidAt) {
  try {
    const order = await getOrder(reference);
    if (!order) return null;

    order.status = status;
    if (paidAt) {
      order.paidAt = paidAt;
    } else if (status === 'paid' && !order.paidAt) {
      order.paidAt = new Date().toISOString();
    }

    await saveOrder(order);
    return order;
  } catch (err) {
    console.warn('[orderStore] updateOrderStatus error:', err?.message || err);
    return null;
  }
}
