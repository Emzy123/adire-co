declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export interface PaystackInitResponse {
  status: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // in kobo
  currency?: string;
  ref: string;
  metadata?: Record<string, any>;
  onSuccess: (response: { reference: string; status?: string; trans?: string; [key: string]: any }) => void;
  onCancel: () => void;
}

/**
 * Initializes a Paystack transaction via the server API endpoint
 * Returns authorization_url and access_code if PAYSTACK_SECRET_KEY is configured
 */
export const initializePaystackApi = async (params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  customer?: any;
  metadata?: any;
  items?: Array<{ id: string; quantity: number }>;
}): Promise<PaystackInitResponse | null> => {
  try {
    const res = await fetch('/api/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callbackUrl: params.callbackUrl || `${window.location.origin}/confirmation`,
        customer: params.customer,
        metadata: params.metadata,
        items: params.items,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data: PaystackInitResponse = await res.json();
    return data;
  } catch (e) {
    console.warn('API initialize endpoint unreachable, falling back to direct Inline JS', e);
    return null;
  }
};

/**
 * Ensures Paystack script is loaded in the DOM
 */
export const loadPaystackScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('paystack-inline-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Paystack v1 script, trying v2 fallback');
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://js.paystack.co/v2/inline.js';
      fallbackScript.onload = () => resolve(true);
      fallbackScript.onerror = () => resolve(false);
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  });
};

/**
 * Trigger Paystack Inline Popup or redirect
 */
export const openPaystackPopup = async (
  config: PaystackConfig
): Promise<boolean> => {
  const loaded = await loadPaystackScript();
  if (!loaded || !window.PaystackPop) {
    throw new Error('Could not load Paystack payment modal. Please check your internet connection or use WhatsApp.');
  }

  // Paystack Inline v1 setup (Standard and rock-solid)
  if (typeof window.PaystackPop.setup === 'function') {
    try {
      const handler = window.PaystackPop.setup({
        key: config.key,
        email: config.email,
        amount: config.amount,
        currency: config.currency || 'NGN',
        ref: config.ref,
        metadata: config.metadata,
        callback: (response: any) => {
          config.onSuccess({
            reference: response.reference || config.ref,
            status: response.status || 'success',
            trans: response.trans,
          });
        },
        onClose: () => {
          config.onCancel();
        },
      });
      handler.openIframe();
      return true;
    } catch (e) {
      console.warn('Paystack v1 setup call failed, trying v2', e);
    }
  }

  // Paystack Inline v2 Fallback
  if (typeof window.PaystackPop === 'function') {
    try {
      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: config.key,
        email: config.email,
        amount: config.amount,
        currency: config.currency || 'NGN',
        ref: config.ref,
        metadata: config.metadata,
        onSuccess: (transaction: any) => {
          config.onSuccess({
            reference: transaction.reference || config.ref,
            status: transaction.status || 'success',
            trans: transaction.trans,
          });
        },
        onCancel: () => {
          config.onCancel();
        },
        onClose: () => {
          config.onCancel();
        },
      });
      return true;
    } catch (e) {
      console.warn('Paystack v2 constructor call failed', e);
    }
  }

  throw new Error('Paystack modal handler is not available.');
};

/**
 * Returns the public key if configured, or null
 */
export const getPaystackPublicKey = (): string | null => {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!key || key.trim() === '') {
    return null;
  }
  return key.trim();
};
