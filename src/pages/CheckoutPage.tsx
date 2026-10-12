import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CustomerInfo, Order } from '../types';
import {
  formatNaira,
  buildWhatsAppOrderMessage,
  generateOrderReference,
  STORE_WHATSAPP_LINK,
} from '../utils/formatters';
import {
  initializePaystackApi,
} from '../services/paystack';
import {
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Truck,
  MessageCircle,
  CreditCard,
  AlertCircle,
  Lock,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

interface CheckoutPageProps {
  onBackToShop: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToShop,
  onOrderCompleted,
}) => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);
  const [paystackErrorMessage, setPaystackErrorMessage] = useState<string | null>(null);
  const [directPaystackUrl, setDirectPaystackUrl] = useState<string | null>(null);

  const cleanupPaystackIframes = () => {
    document
      .querySelectorAll(
        'iframe[id^="inline-background-"], iframe[id^="inline-checkout-"], iframe[name^="paystack-"], iframe[src*="paystack"], div[id*="paystack"], div[class*="paystack"]'
      )
      .forEach((el) => el.remove());
    document.body.style.overflow = '';
    setIsProcessingPaystack(false);
    setDirectPaystackUrl(null);
  };

  React.useEffect(() => {
    cleanupPaystackIframes();
    return () => {
      cleanupPaystackIframes();
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {};

    // Full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters.';
    }

    // Phone: must be at least 10 digits
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number.';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits (e.g. 08012345678).';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address for order receipt.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // Address
    if (!formData.address.trim()) {
      newErrors.address = 'Please enter your delivery address in Lagos.';
    } else if (formData.address.trim().length < 8) {
      newErrors.address = 'Please provide a detailed address (street, area, landmark).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setPaystackErrorMessage(null);
  };

  // WhatsApp Order Handler
  const handleWhatsAppCheckout = () => {
    if (!validate()) return;

    const reference = generateOrderReference();
    const order: Order = {
      reference,
      paymentMethod: 'whatsapp',
      items: [...items],
      subtotal,
      deliveryFee,
      total,
      customer: { ...formData },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Save order in localStorage for reference
    try {
      localStorage.setItem('adire_co_last_order', JSON.stringify(order));
    } catch (e) {
      console.error(e);
    }

    // Build formatted message
    const message = buildWhatsAppOrderMessage(
      items,
      subtotal,
      deliveryFee,
      total,
      formData
    );

    const waUrl = `${STORE_WHATSAPP_LINK}?text=${message}`;

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank');

    // Clear cart and navigate to confirmation
    clearCart();
    onOrderCompleted(order);
  };

  // Paystack Checkout Handler
  const handlePaystackCheckout = async () => {
    if (!validate()) return;

    setIsProcessingPaystack(true);
    setPaystackErrorMessage(null);
    setDirectPaystackUrl(null);

    // Call server initialize endpoint with ONLY customer details and cart items [{id, quantity}]
    const initResult = await initializePaystackApi({
      customer: formData,
      items: items.map((i) => ({ id: i.product.id, quantity: i.quantity })),
    });

    if (!initResult || !initResult.status || !initResult.authorization_url) {
      setIsProcessingPaystack(false);
      setPaystackErrorMessage(
        initResult?.message ||
          'Could not initialize Paystack payment. You can place your order directly via WhatsApp below.'
      );
      return;
    }

    const { authorization_url, reference } = initResult;

    // Save order in localStorage ONLY for displaying customer receipt on return
    const order: Order = {
      reference: reference || generateOrderReference(),
      paymentMethod: 'paystack',
      items: [...items],
      subtotal,
      deliveryFee,
      total,
      customer: { ...formData },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      localStorage.setItem('adire_co_last_order', JSON.stringify(order));
    } catch (e) {
      console.error(e);
    }

    setDirectPaystackUrl(authorization_url);
    clearCart();
    window.location.href = authorization_url;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please add some handcrafted adire pieces before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="px-6 py-3 rounded-xl bg-[#1F3A93] text-white text-sm font-bold hover:bg-[#162B6E] transition-colors"
          >
            Browse Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1F3A93] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Continue Shopping</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Checkout & Delivery
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete your Lagos delivery details and choose your preferred payment option below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Customer Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>1. Delivery Information</span>
              </h2>
              <span className="text-xs text-[#1F3A93] font-semibold bg-[#1F3A93]/10 px-2.5 py-1 rounded-md">
                Lagos Delivery
              </span>
            </div>

            {paystackErrorMessage && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{paystackErrorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaystackErrorMessage(null)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Folake Adebayo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:ring-[#1F3A93] focus:border-transparent'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 0803 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                        : 'border-slate-200 bg-slate-50/50 focus:ring-[#1F3A93] focus:border-transparent'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    At least 10 digits for dispatch rider
                  </span>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="e.g. folake@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                        : 'border-slate-200 bg-slate-50/50 focus:ring-[#1F3A93] focus:border-transparent'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    For your Paystack payment receipt
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="address"
                  rows={3}
                  placeholder="Street name, house/flat number, estate/landmark, area (e.g. Lekki Phase 1, Ikeja, Yaba...)"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 ${
                    errors.address
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:ring-[#1F3A93] focus:border-transparent'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.address}</span>
                  </p>
                )}
              </div>

              {/* Order Note */}
              <div>
                <label
                  htmlFor="note"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Order Note <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="note"
                  type="text"
                  placeholder="e.g. Leave with security, sizing preference, or call on arrival"
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F3A93] focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                2. Select Payment Method
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose between secure online payment via Paystack or direct ordering via WhatsApp
              </p>
            </div>

            <div className="space-y-4">
              {/* Option A: Pay Online with Paystack */}
              <div className="p-5 rounded-2xl border-2 border-[#1F3A93]/30 bg-[#1F3A93]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1F3A93] text-white flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Pay Online with Paystack
                      </h4>
                      <p className="text-xs text-slate-500">
                        Debit Card, Bank Transfer, USSD & Apple Pay
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Instant
                  </span>
                </div>

                {/* Paystack Error Notice offering WhatsApp Ordering */}
                {paystackErrorMessage && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{paystackErrorMessage}</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          You can easily complete this order directly with our Lagos atelier team via WhatsApp.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleWhatsAppCheckout}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Order via WhatsApp instead</span>
                    </button>
                  </div>
                )}

                {/* Direct Paystack URL Fallback / Notice */}
                {directPaystackUrl && (
                  <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 space-y-2.5 animate-fade-in shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#1F3A93] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Opening Paystack Payment Page</p>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            Redirecting to Paystack's official secure checkout. If your browser didn't navigate automatically, click below to open it directly:
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={cleanupPaystackIframes}
                        className="text-blue-400 hover:text-blue-700 p-0.5"
                        title="Dismiss loader"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={directPaystackUrl}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A93] hover:bg-[#162B6E] text-white font-bold transition-all shadow-sm text-xs"
                      >
                        <span>Open Secure Paystack Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={cleanupPaystackIframes}
                        className="px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-800 hover:bg-blue-100/50 font-semibold transition-colors text-xs"
                      >
                        Cancel / Retry
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaystackCheckout}
                    disabled={isProcessingPaystack}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-[#1F3A93] hover:bg-[#162B6E] disabled:opacity-75 text-white font-bold text-sm shadow-lg shadow-[#1F3A93]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isProcessingPaystack
                        ? 'Connecting to Paystack...'
                        : `Pay ${formatNaira(total)} with Paystack`}
                    </span>
                  </button>

                  {isProcessingPaystack && (
                    <button
                      type="button"
                      onClick={cleanupPaystackIframes}
                      className="py-3.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                      title="Cancel loader"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Secured with 256-bit encryption by Paystack.
                </p>
              </div>

              {/* Option B: WhatsApp Order */}
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Order on WhatsApp
                      </h4>
                      <p className="text-xs text-slate-500">
                        Chat directly with our Lagos atelier team
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                    Direct Chat
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order to WhatsApp ({formatNaira(total)})</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Pre-fills your items, delivery address, and total for easy one-tap sending.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-4">
              <span>Order Summary</span>
              <span className="text-xs font-semibold text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Qty: {item.quantity} &times; {formatNaira(item.product.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#1F3A93]">
                    {formatNaira(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Flat Lagos Delivery</span>
                </span>
                <span className="font-semibold text-slate-800">{formatNaira(deliveryFee)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="text-lg font-extrabold text-[#1F3A93]">
                  {formatNaira(total)}
                </span>
              </div>
            </div>

            {/* Assurances */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Original Abeokuta dyes & 100% genuine cotton</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Door-to-door delivery across Lagos Mainland & Island</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
