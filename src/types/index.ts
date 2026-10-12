export type Category = 'All' | 'Fabrics' | 'Men' | 'Women' | 'Accessories';

export interface Product {
  id: string;
  name: string;
  category: 'Fabrics' | 'Men' | 'Women' | 'Accessories';
  price: number;
  description: string;
  featured: boolean;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
}

export interface Order {
  reference: string;
  paymentMethod: 'paystack' | 'whatsapp';
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customer: CustomerInfo;
  createdAt: string;
  status: 'paid' | 'pending' | 'verified';
}
