import { CartItem, CustomerInfo } from '../types';

export const LAGOS_DELIVERY_FEE = 2500;
export const STORE_PHONE = '2348074710080';
export const STORE_WHATSAPP_LINK = `https://wa.me/${STORE_PHONE}`;

/**
 * Format any number into Nigerian Naira format with thousand separators
 * e.g. 12500 -> ₦12,500
 */
export const formatNaira = (amount: number): string => {
  return `₦${Number(amount || 0).toLocaleString('en-NG')}`;
};

/**
 * Build pre-filled, cleanly formatted WhatsApp message for order
 */
export const buildWhatsAppOrderMessage = (
  items: CartItem[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  customer: CustomerInfo
): string => {
  let message = `*NEW ORDER - ADIRE & CO*\n`;
  message += `_Made with love in Lagos_\n\n`;
  message += `*ORDER ITEMS:*\n`;

  items.forEach((item, index) => {
    const lineTotal = item.product.price * item.quantity;
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   Qty: ${item.quantity} × ${formatNaira(item.product.price)} = ${formatNaira(lineTotal)}\n`;
  });

  message += `\n-------------------------\n`;
  message += `*Subtotal:* ${formatNaira(subtotal)}\n`;
  message += `*Lagos Delivery Fee:* ${formatNaira(deliveryFee)}\n`;
  message += `*Total Amount:* ${formatNaira(total)}\n`;
  message += `-------------------------\n\n`;

  message += `*CUSTOMER DETAILS:*\n`;
  message += `*Name:* ${customer.fullName}\n`;
  message += `*Phone:* ${customer.phone}\n`;
  if (customer.email) {
    message += `*Email:* ${customer.email}\n`;
  }
  message += `*Delivery Address:* ${customer.address}\n`;
  if (customer.note && customer.note.trim()) {
    message += `*Order Note:* ${customer.note.trim()}\n`;
  }

  message += `\n_Please confirm availability and account details to proceed with dispatch. Thank you!_`;

  return encodeURIComponent(message);
};

export const generateOrderReference = (): string => {
  return `ORDER-${Date.now()}`;
};
