import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatNaira, STORE_WHATSAPP_LINK } from '../utils/formatters';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  CheckCircle,
  Truck,
  MessageCircle,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onBackToShop: () => void;
  onNavigateToCheckout: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBackToShop,
  onNavigateToCheckout,
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onNavigateToCheckout();
  };

  const whatsAppInquiryLink = `${STORE_WHATSAPP_LINK}?text=${encodeURIComponent(
    `Hello Adire & Co! I'm interested in the "${product.name}" (${formatNaira(
      product.price
    )}). Is it currently available for Lagos delivery?`
  )}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1F3A93] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Collection</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-sm">
        {/* Large Product Image */}
        <div className="lg:col-span-6">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner group">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.featured && (
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Piece</span>
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs text-[#1F3A93] text-xs font-semibold px-3 py-1 rounded-full border border-white/80">
              {product.category}
            </div>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-[#1F3A93] bg-[#1F3A93]/10 px-2.5 py-0.5 rounded-md">
                {product.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; Hand-Dyed in Nigeria</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#1F3A93]">
                {formatNaira(product.price)}
              </span>
              <span className="text-xs text-slate-400 font-medium">VAT inclusive</span>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                About this piece
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Care details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Authentic Craftsmanship:</strong> 100% breathable Nigerian cotton dyed with organic indigo.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Care Recommendation:</strong> Hand wash gently with cold water. Line dry in shade to preserve indigo radiance.</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Flat Lagos Dispatch:</strong> ₦2,500 delivery fee covers all Lagos Island & Mainland locations.</span>
              </div>
            </div>
          </div>

          {/* Quantity Stepper & Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:text-[#1F3A93] flex items-center justify-center font-bold shadow-2xs transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:text-[#1F3A93] flex items-center justify-center font-bold shadow-2xs transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Line total: <strong>{formatNaira(product.price * quantity)}</strong>
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1F3A93] hover:bg-[#162B6E] text-white font-bold text-sm shadow-md shadow-[#1F3A93]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add {quantity} to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Buy Now (Checkout)</span>
              </button>
            </div>

            {/* WhatsApp Question Button */}
            <a
              href={whatsAppInquiryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Have a question about this piece? Chat with us on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
