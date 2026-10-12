import React from 'react';
import { STORE_WHATSAPP_LINK } from '../utils/formatters';
import { MessageCircle, Clock, MapPin, Heart, ShieldCheck, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F3A93] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md">
                A
              </div>
              <span className="font-serif text-2xl font-bold text-white tracking-tight">
                Adire & Co.
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              Handmade indigo, made for everyday. Honoring Yoruba dye traditions with modern, breathable silhouettes for office, home, and owambe.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Made with love in Lagos, Nigeria</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest font-bold text-white">Store Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-colors"
                >
                  Adire Fabrics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="hover:text-white transition-colors"
                >
                  Ready-to-Wear
                </button>
              </li>
            </ul>
          </div>

          {/* Visit & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest font-bold text-white">Contact & Hours</h4>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#4367D8] shrink-0 mt-0.5" />
                <span>Lagos, Nigeria</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#4367D8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-200">Opening Hours:</p>
                  <p className="text-xs text-slate-400">Monday to Saturday</p>
                  <p className="text-xs text-slate-400">9:00 am to 7:00 pm</p>
                </div>
              </div>
              <div className="pt-1">
                <a
                  href={STORE_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: +234 807 471 0080</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Adire & Co. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Paystack Secured & WhatsApp Verified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Proudly Nigerian</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
