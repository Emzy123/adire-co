import React from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { STORE_WHATSAPP_LINK } from '../utils/formatters';
import { ArrowRight, Sparkles, Shield, HeartHandshake, Truck, MessageCircle } from 'lucide-react';

interface HomePageProps {
  products: Product[];
  onNavigateToShop: (category?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onNavigateToShop,
  onSelectProduct,
}) => {
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 bg-gradient-to-b from-[#1F3A93]/5 via-[#FAF9F5] to-[#FAF9F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F3A93]/10 border border-[#1F3A93]/20 text-[#1F3A93] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#1F3A93]" />
                <span>Made with love in Lagos, Nigeria</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Handmade indigo, <br className="hidden sm:inline" />
                <span className="text-[#1F3A93] italic">made for everyday.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Authentic, hand-dyed adire fabrics and modern ready-to-wear pieces crafted by master artisans. From Friday office wear to weekend owambes, wear Nigerian heritage with effortless elegance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToShop()}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1F3A93] hover:bg-[#162B6E] text-white font-bold text-sm shadow-xl shadow-[#1F3A93]/25 flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={STORE_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-lg sm:text-xl font-extrabold text-[#1F3A93]">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Nigerian Cotton</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-extrabold text-[#1F3A93]">₦2,500</p>
                  <p className="text-xs text-slate-500 font-medium">Flat Lagos Delivery</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-extrabold text-[#1F3A93]">24-48h</p>
                  <p className="text-xs text-slate-500 font-medium">Fast Dispatch</p>
                </div>
              </div>
            </div>

            {/* Right Visual Feature */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
                {/* Decorative background shape */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#1F3A93]/20 to-amber-200/30 rounded-3xl blur-xl" />

                <div className="relative bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                  <div className="aspect-4/5 rounded-2xl overflow-hidden bg-slate-100 relative">
                    <img
                      src="/images/products/adire-wrap-dress.jpg"
                      alt="Featured Adire Piece"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
                        Bestseller
                      </span>
                      <h2 className="text-xl font-serif font-bold">Adire Wrap Dress</h2>
                      <p className="text-xs text-slate-200 mt-1">
                        Flattering wrap cut with tie waist, from office to owambe.
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-extrabold">₦28,000</span>
                        <button
                          type="button"
                          onClick={() => {
                            const dress = products.find((p) => p.name.includes('Wrap Dress'));
                            if (dress) onSelectProduct(dress);
                            else onNavigateToShop('Women');
                          }}
                          className="px-3.5 py-1.5 bg-white text-[#1F3A93] text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          View Piece
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Browse by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose from authentic yards of fabric or tailored ready-to-wear essentials
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Fabrics', label: 'Hand-Dyed Fabrics', icon: '🧵', count: '2 items' },
            { name: 'Men', label: "Men's Kaftans & Shirts", icon: '👔', count: '2 items' },
            { name: 'Women', label: "Women's Dresses & Sets", icon: '👗', count: '2 items' },
            { name: 'Accessories', label: 'Scarves & Totes', icon: '👜', count: '2 items' },
          ].map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onNavigateToShop(cat.name)}
              className="group p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-lg hover:border-[#1F3A93]/30 transition-all text-left flex flex-col justify-between"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 group-hover:text-[#1F3A93] transition-colors">
                  {cat.label}
                </h3>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{cat.count}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Featured Pieces
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Curated adire essentials dyed with natural indigo in Abeokuta
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToShop()}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1F3A93] hover:text-[#162B6E] self-start sm:self-auto"
          >
            <span>View All (8 items)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Brand Values / Artisanal Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#1F3A93] text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
              The Adire & Co. Promise
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold leading-tight">
              Rooted in Abeokuta. Styled for Modern Lagos.
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              Every yard of fabric is dyed by hand by women artisans using resist starch (eleko) and tie-and-dye (oniko). Because every pattern is drawn with love and traditional cassava paste or tied by cord, no two pieces are identical.
            </p>

            <div className="pt-4 flex flex-wrap gap-6 text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-300" />
                <span>Non-bleeding, colorfast dyes</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-300" />
                <span>Fair artisan compensation</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-300" />
                <span>Reliable Lagos door-to-door delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
