/**
 * Adire & Co - Server-Side Order Persistence Store
 * Supports Upstash Redis / Vercel KV with reliable local dev fallback.
 */

import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

export interface StoredOrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
}

export interface StoredOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface StoredOrder {
  reference: string;
  items: StoredOrderItem[];
  subtotalNaira: number;
  deliveryFeeNaira: number;
  totalNaira: number;
  totalKobo: number;
  customer: StoredOrderCustomer;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

// In-memory / filesystem fallback cache for local dev / environments without Upstash credentials
const memoryStore = new Map<string, StoredOrder>();
const FALLBACK_FILE = path.join('/tmp', 'adire_orders.json');

function loadFallbackFile(): Map<string, StoredOrder> {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      const map = new Map<string, StoredOrder>();
      for (const [key, val] of Object.entries(data)) {
        map.set(key, val as StoredOrder);
      }
      return map;
    }
  } catch (err) {
    console.warn('[orderStore] Could not read fallback file, using memory map', err);
  }
  return memoryStore;
}

function saveFallbackFile(map: Map<string, StoredOrder>) {
  try {
    const obj: Record<string, StoredOrder> = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[orderStore] Could not write fallback file', err);
  }
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (err) {
      console.warn('[orderStore] Failed to initialize Upstash Redis, falling back to local store', err);
      return null;
    }
  }
  return null;
}

/**
 * Saves an order to the persistent store.
 */
export async function saveOrder(order: StoredOrder): Promise<void> {
  const redis = getRedisClient();
  const key = `order:${order.reference}`;

  if (redis) {
    try {
      // Retain orders in Redis for 30 days
      await redis.set(key, JSON.stringify(order), { ex: 30 * 24 * 60 * 60 });
      return;
    } catch (err) {
      console.warn('[orderStore] Upstash Redis set failed, falling back to local file', err);
    }
  }

  // Local fallback
  const store = loadFallbackFile();
  store.set(order.reference, order);
  memoryStore.set(order.reference, order);
  saveFallbackFile(store);
}

/**
 * Retrieves an order by its unique server-generated reference.
 */
export async function getOrder(reference: string): Promise<StoredOrder | null> {
  if (!reference) return null;

  const redis = getRedisClient();
  const key = `order:${reference}`;

  if (redis) {
    try {
      const data = await redis.get<string | StoredOrder>(key);
      if (data) {
        if (typeof data === 'string') {
          return JSON.parse(data) as StoredOrder;
        }
        return data as StoredOrder;
      }
    } catch (err) {
      console.warn('[orderStore] Upstash Redis get failed, checking local store', err);
    }
  }

  // Local fallback
  const store = loadFallbackFile();
  return store.get(reference) || memoryStore.get(reference) || null;
}

/**
 * Updates an order status (e.g. from 'pending' to 'paid').
 */
export async function updateOrderStatus(
  reference: string,
  status: 'pending' | 'paid' | 'failed',
  paidAt?: string
): Promise<StoredOrder | null> {
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
}
