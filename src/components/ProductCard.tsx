import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/formatters';
import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { addToCart } = useCart();

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Image container */}
      <div
        className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onSelectProduct(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center text-xs font-semibold text-[#1F3A93] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs border border-white/80">
            {product.category}
          </span>
          {product.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Featured</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-base font-bold text-slate-800 group-hover:text-[#1F3A93] transition-colors cursor-pointer line-clamp-1"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Price
            </span>
            <span className="text-base font-extrabold text-[#1F3A93]">
              {formatNaira(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#1F3A93] hover:border-[#1F3A93]/40 hover:bg-[#1F3A93]/5 transition-all text-xs font-medium"
              title="View details"
              aria-label={`View details for ${product.name}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              className="px-3.5 py-2.5 rounded-xl bg-[#1F3A93] hover:bg-[#162B6E] text-white text-xs font-bold transition-all shadow-md shadow-[#1F3A93]/20 flex items-center gap-1.5 active:scale-95"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
