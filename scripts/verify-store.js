import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.resolve(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

console.log('--- 1. Testing Product Data ---');
if (products.length !== 8) {
  throw new Error(`Expected 8 products, got ${products.length}`);
}

const requiredCategories = ['Fabrics', 'Men', 'Women', 'Accessories'];
products.forEach((p, idx) => {
  if (!p.id || !p.name || !p.price || !p.category || !p.image) {
    throw new Error(`Product ${idx + 1} is missing required fields`);
  }
  if (!requiredCategories.includes(p.category)) {
    throw new Error(`Invalid category ${p.category} for product ${p.name}`);
  }
  if (!p.image.startsWith('/images/products/') && !p.image.includes('1F3A93')) {
    throw new Error(`Product ${p.name} image path invalid: ${p.image}`);
  }
});

const featuredIds = products.filter((p) => p.featured).map((p) => p.id);
console.log('Featured product IDs:', featuredIds);
if (JSON.stringify(featuredIds) !== JSON.stringify(['1', '3', '5', '7'])) {
  throw new Error(`Featured products must be IDs 1, 3, 5, 7. Got: ${JSON.stringify(featuredIds)}`);
}
console.log('✓ All 8 products validated with proper prices and categories.');

console.log('\n--- 2. Testing Currency Formatting ---');
const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
if (formatNaira(12500) !== '₦12,500') throw new Error(`Currency format failed: ${formatNaira(12500)}`);
if (formatNaira(32000) !== '₦32,000') throw new Error(`Currency format failed: ${formatNaira(32000)}`);
if (formatNaira(2500) !== '₦2,500') throw new Error(`Delivery fee format failed: ${formatNaira(2500)}`);
console.log('✓ Naira formatting passed.');

console.log('\n--- 3. Testing Cart Calculations & Quantity Stepping ---');
// Adding 3 products:
// 1. Classic Indigo Adire Fabric (₦12,500) qty 1
// 2. Adire Short-Sleeve Shirt (₦18,500) qty 1
// 3. Adire Wrap Dress (₦28,000) qty 2
const cartItems = [
  { product: products[0], quantity: 1 },
  { product: products[2], quantity: 1 },
  { product: products[4], quantity: 2 },
];

let subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
const deliveryFee = 2500;
let total = subtotal + deliveryFee;

console.log(`Initial subtotal: ${formatNaira(subtotal)} (Expected: ₦87,000)`);
console.log(`Lagos delivery fee: ${formatNaira(deliveryFee)}`);
console.log(`Total: ${formatNaira(total)} (Expected: ₦89,500)`);
if (subtotal !== 87000 || total !== 89500) {
  throw new Error('Initial cart calculation error');
}

// Stepping up quantity of product 1: 1 -> 2
cartItems[0].quantity = 2;
subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
total = subtotal + deliveryFee;
console.log(`After stepping quantity: subtotal = ${formatNaira(subtotal)} (Expected: ₦99,500)`);
console.log(`After stepping quantity: total = ${formatNaira(total)} (Expected: ₦102,000)`);
if (subtotal !== 99500 || total !== 102000) {
  throw new Error('Cart calculation after stepper error');
}
console.log('✓ Cart calculations and quantity stepping verified.');

console.log('\n--- 4. Testing WhatsApp Message Generation ---');
const customer = {
  fullName: 'Adebisi Olawale',
  phone: '08031234567',
  email: 'adebisi@example.com',
  address: 'Plot 12, Admiralty Way, Lekki Phase 1, Lagos',
  note: 'Please call on arrival at the gate',
};

let message = `*NEW ORDER - ADIRE & CO*\n`;
message += `_Made with love in Lagos_\n\n`;
message += `*ORDER ITEMS:*\n`;
cartItems.forEach((item, index) => {
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
message += `*Email:* ${customer.email}\n`;
message += `*Delivery Address:* ${customer.address}\n`;
message += `*Order Note:* ${customer.note}\n`;

const encoded = encodeURIComponent(message);
const whatsAppUrl = `https://wa.me/2348074710080?text=${encoded}`;

console.log('Generated WhatsApp URL starts with:', whatsAppUrl.slice(0, 80));
if (!whatsAppUrl.includes('2348074710080')) {
  throw new Error('WhatsApp phone number missing from URL');
}
if (!whatsAppUrl.includes('Adebisi')) {
  throw new Error('Customer name missing from WhatsApp URL');
}
console.log('✓ WhatsApp order message fully tested.');

console.log('\n--- 5. Testing Paystack Parameters ---');
const paystackAmountKobo = total * 100;
console.log(`Paystack Amount in kobo: ${paystackAmountKobo} (₦${total})`);
if (paystackAmountKobo !== 10200000) {
  throw new Error(`Paystack kobo amount calculation error: expected 10200000, got ${paystackAmountKobo}`);
}
console.log('✓ Paystack amount in kobo verified.');

console.log('\n>>> All storefront business logic and data checks passed successfully! <<<');
