# Adire & Co. — Online Storefront 🇳🇬

> **"Handmade indigo, made for everyday."**  
> An authentic, mobile-first e-commerce storefront for **Adire & Co.**, based in Lagos, Nigeria. Specializing in hand-dyed adire fabrics and ready-to-wear pieces (shirts, kaftans, wrap dresses, scarves, and tote bags).

---

## 🌟 Features

- **Mobile-First Experience**: Designed specifically for quick, seamless browsing and shopping on mobile devices as well as desktops.
- **Brand Palette & Nigerian Tone**: Built around rich indigo (`#1F3A93`) with warm ivory/sand neutrals and confident Nigerian copy ("Made with love in Lagos", "from office to owambe").
- **Zero-Code Product Management**: All products are stored in a single JSON file (`src/data/products.json`). The store owner can change prices, photos, and descriptions without writing code.
- **Dynamic Cart Drawer**: Slides smoothly in from the right, persists across browser sessions using `localStorage`, supports real-time quantity adjustments, and automatically calculates the flat ₦2,500 Lagos delivery fee.
- **Dual Checkout System**:
  - **Pay Online via Paystack**: Integrated with the Paystack Inline JS SDK (cards, bank transfer, USSD, Apple Pay) in kobo (`₦ x 100`).
  - **Order on WhatsApp**: Pre-formats a complete breakdown (items, quantities, prices, delivery fee, total, customer address, and notes) and opens directly in WhatsApp to `+234 807 471 0080`.
- **Payment Fallback**: If no Paystack key is configured, the Paystack button gracefully hides and displays a note prompting the customer to order on WhatsApp.
- **Serverless Verification**: Includes an optional Vercel serverless function (`/api/verify`) to verify Paystack transactions using the secret key without ever exposing it to frontend code.
- **Zero-Config Vercel Deployment**: Pre-configured with `vercel.json` for client-side SPA routing and serverless functions.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Payments**: Paystack Inline JS (`https://js.paystack.co/v2/inline.js`)

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js 18+** installed.

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd checkout

# Install dependencies
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🛍️ How to Edit Products (For Store Owners)

You do **not** need any coding knowledge to edit your store's inventory. Open [`src/data/products.json`](file:///home/purist/Desktop/projects/checkout/src/data/products.json) in any text editor.

Each product has the following structure:
```json
{
  "id": "1",
  "name": "Classic Indigo Adire Fabric (2 yards)",
  "category": "Fabrics",
  "price": 12500,
  "description": "Hand-dyed cotton in deep indigo with a traditional tie-dye pattern.",
  "featured": true,
  "image": "https://placehold.co/600x600/1F3A93/FFFFFF?text=Classic+Indigo+Fabric"
}
```

- **`id`**: Unique identifier for the item (e.g. `"1"`, `"2"`).
- **`name`**: Product title displayed on the storefront.
- **`category`**: One of `"Fabrics"`, `"Men"`, `"Women"`, or `"Accessories"`.
- **`price`**: Price in Nigerian Naira (e.g., `12500` for ₦12,500). Do **not** include commas or currency symbols.
- **`description`**: Product details, fabric composition, and styling tips.
- **`featured`**: Set to `true` to showcase the item on the homepage grid, or `false`.
- **`image`**: URL to the product image. You can host images on Cloudinary, Imgur, your website, or your own CDN.

---

## 💳 How to Add Paystack Keys

### 1. Getting Free Test Keys
1. Create a free account at [Paystack](https://dashboard.paystack.com/signup).
2. Go to **Settings > API Keys & Webhooks** (`https://dashboard.paystack.com/#/settings/developer`).
3. Under **API Configuration (Test Mode)**, copy your:
   - **Public Key** (`pk_test_...`)
   - **Secret Key** (`sk_test_...`)

### 2. Setting Up Local Environment
Create a `.env` file in the root directory (or copy `.env.example`):
```bash
cp .env.example .env
```
Inside `.env`, paste your Public Key:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here
```

> ⚠️ **Security Warning**: NEVER paste your `PAYSTACK_SECRET_KEY` into frontend files or `.env` files that get committed to Git. The secret key is only used in serverless backend functions.

### 3. Graceful Fallback
If `VITE_PAYSTACK_PUBLIC_KEY` is empty or omitted:
- The Paystack button will automatically hide.
- The checkout page will display: *"Online payment coming soon - order on WhatsApp."*
- Customers can seamlessly complete their orders via WhatsApp with all details pre-filled.

---

## ☁️ Deploying to Vercel (Zero Config)

The project includes [`vercel.json`](file:///home/purist/Desktop/projects/checkout/vercel.json) configured for client-side routing and the `/api/verify` serverless function.

### Option A: Using the Vercel Dashboard (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository. Vercel will automatically detect **Vite**.
4. In the **Environment Variables** section, add:
   - `VITE_PAYSTACK_PUBLIC_KEY` = your Paystack Public Key (`pk_live_...` or `pk_test_...`)
   - `PAYSTACK_SECRET_KEY` = your Paystack Secret Key (`sk_live_...` or `sk_test_...`)
5. Click **Deploy**. Your storefront will be live within seconds!

### Option B: Using the Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📞 Store Contact & Business Info

- **Store**: Adire & Co.
- **Location**: Lagos, Nigeria
- **WhatsApp**: [+234 807 471 0080](https://wa.me/2348074710080)
- **Opening Hours**: Monday to Saturday, 9:00 am – 7:00 pm
- **Standard Lagos Delivery**: Flat ₦2,500 across Mainland & Island
