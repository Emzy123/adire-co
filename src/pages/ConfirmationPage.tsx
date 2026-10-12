import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { formatNaira, STORE_WHATSAPP_LINK } from '../utils/formatters';
import {
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  ShoppingBag,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ConfirmationPageProps {
  order: Order | null;
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  order: propOrder,
  onNavigateToHome,
  onNavigateToShop,
}) => {
  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'checking' | 'verified' | 'fallback'
  >('checking');

  // Resolve order from props, localStorage, or URL parameters
  const [order, setOrder] = useState<Order | null>(() => {
    if (propOrder) return propOrder;
    try {
      const saved = localStorage.getItem('adire_co_last_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        const urlParams = new URLSearchParams(window.location.search);
        const queryRef = urlParams.get('reference') || urlParams.get('trxref');
        if (queryRef) {
          parsed.reference = queryRef;
          parsed.status = 'paid';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    if (propOrder) {
      setOrder(propOrder);
    }
  }, [propOrder]);

  useEffect(() => {
    if (!order) {
      setVerificationStatus('fallback');
      return;
    }

    if (order.paymentMethod !== 'paystack') {
      setVerificationStatus('fallback');
      return;
    }

    let isMounted = true;

    // Call optional serverless verification endpoint if it exists
    const verifyReference = async () => {
      try {
        const response = await fetch(`/api/verify?reference=${encodeURIComponent(order.reference)}`);
        if (!response.ok) {
          throw new Error('Verification endpoint unavailable');
        }
        const result = await response.json();
        if (isMounted) {
          if (result.status && result.data?.status === 'success') {
            setVerificationStatus('verified');
          } else {
            setVerificationStatus('fallback');
          }
        }
      } catch (e) {
        if (isMounted) {
          // If serverless endpoint doesn't exist, fallback gracefully per requirements
          setVerificationStatus('fallback');
        }
      }
    };

    verifyReference();

    return () => {
      isMounted = false;
    };
  }, [order]);

  const copyReference = () => {
    if (order?.reference) {
      navigator.clipboard.writeText(order.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No recent order found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Browse our hand-dyed collection and place an order to see confirmation details.
          </p>
          <button
            type="button"
            onClick={onNavigateToShop}
            className="px-6 py-3 rounded-xl bg-[#1F3A93] text-white text-sm font-bold hover:bg-[#162B6E] transition-colors"
          >
            Explore Collection
          </button>
        </div>
      </div>
    );
  }

  const whatsAppFollowUpMessage = encodeURIComponent(
    `Hello Adire & Co! I just placed an order (Ref: ${order.reference}) for ${order.customer.fullName}. Total: ${formatNaira(
      order.total
    )}. Looking forward to confirmation and dispatch!`
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 animate-fade-in">
      {/* Thank You Banner */}
      <div className="text-center space-y-3 bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>E se gan! Thank you for supporting Nigerian craftsmanship</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Your Order is Placed!
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          We have received your order details and are preparing your hand-dyed adire pieces at our Lagos atelier.
        </p>

        {/* Payment Verification / Reference Box */}
        <div className="pt-4 max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Order Reference</span>
              <button
                type="button"
                onClick={copyReference}
                className="flex items-center gap-1 text-[#1F3A93] hover:text-[#162B6E] font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p className="font-mono text-base font-extrabold text-[#1F3A93] tracking-wide select-all">
              {order.reference}
            </p>

            {/* Status note */}
            <div className="pt-2 border-t border-slate-200 text-xs">
              {order.paymentMethod === 'paystack' ? (
                verificationStatus === 'verified' ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified via Paystack</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Payment received - we'll confirm shortly.</span>
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Order shared via WhatsApp. Awaiting dispatch confirmation.</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
          Order Summary
        </h2>

        {/* Customer & Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
          <div>
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Customer Details
            </p>
            <p className="text-sm font-semibold text-slate-900">{order.customer.fullName}</p>
            <p>{order.customer.phone}</p>
            {order.customer.email && <p>{order.customer.email}</p>}
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Delivery Address</span>
            </p>
            <p className="leading-relaxed">{order.customer.address}</p>
            {order.customer.note && (
              <p className="mt-1 text-slate-500 italic">Note: "{order.customer.note}"</p>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Items Ordered ({order.items.length})
          </p>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.product.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {item.product.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Qty: {item.quantity} &times; {formatNaira(item.product.price)}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#1F3A93]">
                  {formatNaira(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">{formatNaira(order.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Lagos Flat Delivery Fee</span>
            <span className="font-semibold text-slate-800">{formatNaira(order.deliveryFee)}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base font-bold text-slate-900">
            <span>Total Paid / Payable</span>
            <span className="text-xl font-extrabold text-[#1F3A93]">
              {formatNaira(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={`${STORE_WHATSAPP_LINK}?text=${whatsAppFollowUpMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all text-center"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Message Store on WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={onNavigateToHome}
          className="flex-1 py-4 px-6 rounded-2xl bg-[#1F3A93] hover:bg-[#162B6E] text-white font-bold text-sm shadow-lg shadow-[#1F3A93]/20 flex items-center justify-center gap-2 transition-all text-center"
        >
          <span>Return to Homepage</span>
        </button>
      </div>
    </div>
  );
};
