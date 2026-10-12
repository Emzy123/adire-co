/**
 * Adire & Co - Server-Side Product Catalog & Pricing (Single Source of Truth)
 * The server never trusts prices, subtotals, or delivery fees sent from the browser.
 */

export interface ServerProduct {
  id: string;
  name: string;
  price: number; // in Nigerian Naira (₦)
}

export const PRODUCTS: Record<string, ServerProduct> = {
  '1': {
    id: '1',
    name: 'Classic Indigo Adire Fabric (2 yards)',
    price: 12500,
  },
  '2': {
    id: '2',
    name: 'Eleko Pattern Adire Fabric (2 yards)',
    price: 15000,
  },
  '3': {
    id: '3',
    name: 'Adire Short-Sleeve Shirt',
    price: 18500,
  },
  '4': {
    id: '4',
    name: "Men's Adire Kaftan",
    price: 32000,
  },
  '5': {
    id: '5',
    name: 'Adire Wrap Dress',
    price: 28000,
  },
  '6': {
    id: '6',
    name: 'Adire Two-Piece Set',
    price: 35000,
  },
  '7': {
    id: '7',
    name: 'Adire Silk Scarf',
    price: 8500,
  },
  '8': {
    id: '8',
    name: 'Adire Canvas Tote Bag',
    price: 9500,
  },
};

export const LAGOS_DELIVERY_FEE_NAIRA = 2500;

export interface CartItemInput {
  id: string;
  quantity: number;
}

export interface ComputedOrderPrice {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
  subtotalNaira: number;
  deliveryFeeNaira: number;
  totalNaira: number;
  totalKobo: number;
}

/**
 * Validates cart items, verifies IDs exist, validates quantities (1-20 integer),
 * looks up prices from the server catalog, adds the ₦2,500 Lagos delivery fee,
 * and computes authoritative total in Naira and kobo.
 */
export function computeOrderTotal(items: CartItemInput[]): ComputedOrderPrice {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let subtotal = 0;
  const validatedItems: ComputedOrderPrice['items'] = [];

  for (const item of items) {
    const id = String(item?.id || '').trim();
    const product = PRODUCTS[id];
    if (!product) {
      throw new Error(`Product with ID "${id}" does not exist in the store catalog`);
    }

    const qty = Number(item?.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new Error(
        `Quantity for "${product.name}" must be a whole number between 1 and 20 (received ${item?.quantity})`
      );
    }

    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    validatedItems.push({
      id: product.id,
      name: product.name,
      quantity: qty,
      price: product.price,
      lineTotal,
    });
  }

  const deliveryFee = LAGOS_DELIVERY_FEE_NAIRA;
  const totalNaira = subtotal + deliveryFee;
  const totalKobo = totalNaira * 100;

  return {
    items: validatedItems,
    subtotalNaira: subtotal,
    deliveryFeeNaira: deliveryFee,
    totalNaira,
    totalKobo,
  };
}
