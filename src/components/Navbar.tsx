import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { STORE_WHATSAPP_LINK } from '../utils/formatters';
import { ShoppingBag, Menu, X, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { totalItems, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      {/* Top micro banner */}
      <div className="bg-[#1F3A93] text-white text-[11px] font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span>🇳🇬</span>
        <span>Handcrafted in Lagos & Abeokuta &bull; Lagos Delivery: Flat ₦2,500 &bull; Same-Day Dispatch Available</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1F3A93] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md shadow-[#1F3A93]/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1F3A93] block leading-none">
                Adire & Co.
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold block mt-1">
                Lagos, Nigeria
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`text-sm font-semibold transition-colors ${
                currentPage === 'home'
                  ? 'text-[#1F3A93] border-b-2 border-[#1F3A93] pb-1'
                  : 'text-slate-600 hover:text-[#1F3A93]'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNav('shop')}
              className={`text-sm font-semibold transition-colors ${
                currentPage === 'shop'
                  ? 'text-[#1F3A93] border-b-2 border-[#1F3A93] pb-1'
                  : 'text-slate-600 hover:text-[#1F3A93]'
              }`}
            >
              Shop Collection
            </button>
            <a
              href={STORE_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Store</span>
            </a>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-[#1F3A93]/10 text-slate-700 hover:text-[#1F3A93] transition-colors flex items-center gap-2 border border-slate-200"
              aria-label={`Open shopping cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 text-[#1F3A93]" />
              <span className="hidden sm:inline text-xs font-bold text-[#1F3A93]">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1F3A93] text-white text-[11px] font-extrabold flex items-center justify-center shadow-sm animate-fade-in">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-[#1F3A93] hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${
              currentPage === 'home'
                ? 'bg-[#1F3A93]/10 text-[#1F3A93]'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNav('shop')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${
              currentPage === 'shop'
                ? 'bg-[#1F3A93]/10 text-[#1F3A93]'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Shop Collection
          </button>
          <a
            href={STORE_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chat on WhatsApp (+234 807 471 0080)</span>
          </a>
        </div>
      )}
    </header>
  );
};
