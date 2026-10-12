import React from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, openCart } = useCart();

  if (!toast) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto animate-fade-in shadow-2xl rounded-2xl bg-white border border-[#1F3A93]/20 p-4 flex items-center justify-between gap-3 text-slate-800"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1F3A93]/10 text-[#1F3A93] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#1F3A93]" />
        </div>
        <div>
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openCart()}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1F3A93] text-white hover:bg-[#162B6E] transition-colors"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>View Cart</span>
      </button>
    </aside>
  );
};
