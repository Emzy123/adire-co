/**
 * Adire & Co - Paystack Payment Service
 * The browser sends ONLY customer details and cart items [{id, quantity}].
 * The server computes the authoritative price and returns the authorization_url.
 */

import { CustomerInfo } from '../types';

export interface PaystackInitResponse {
  status: boolean;
  authorization_url?: string;
  reference?: string;
  message?: string;
}

export interface InitializePaymentParams {
  customer: CustomerInfo;
  items: Array<{ id: string; quantity: number }>;
}

/**
 * Calls serverless /api/initialize to validate items against server catalog,
 * compute authoritative price in kobo, store pending order, and return Paystack authorization_url.
 */
export const initializePaystackApi = async (
  params: InitializePaymentParams
): Promise<PaystackInitResponse | null> => {
  try {
    const res = await fetch('/api/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          fullName: params.customer.fullName,
          email: params.customer.email,
          phone: params.customer.phone,
          address: params.customer.address,
          note: params.customer.note,
        },
        items: params.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      return {
        status: false,
        message: data.message || 'Payment initialization was rejected by server.',
      };
    }

    return {
      status: true,
      authorization_url: data.authorization_url,
      reference: data.reference,
    };
  } catch (e: any) {
    console.error('API initialize endpoint unreachable:', e);
    return {
      status: false,
      message: 'Could not connect to the payment server. Please order on WhatsApp.',
    };
  }
};
