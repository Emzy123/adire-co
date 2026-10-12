import React, { useState, useEffect } from 'react';
import productsData from './data/products.json';
import { Product, Order } from './types';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { Toast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

export const App: React.FC = () => {
  const products: Product[] = productsData as Product[];

  const [currentPage, setCurrentPage] = useState<
    'home' | 'shop' | 'product-detail' | 'checkout' | 'confirmation'
  >('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialCategory, setInitialCategory] = useState<string>('All');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Sync with browser URL history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/shop') {
        setCurrentPage('shop');
      } else if (path.startsWith('/product/')) {
        const id = path.replace('/product/', '');
        const found = products.find((p) => p.id === id);
        if (found) {
          setSelectedProduct(found);
          setCurrentPage('product-detail');
        } else {
          setCurrentPage('shop');
        }
      } else if (path === '/checkout') {
        setCurrentPage('checkout');
      } else if (path.startsWith('/confirmation')) {
        setCurrentPage('confirmation');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Initial check on load
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const navigateTo = (page: 'home' | 'shop' | 'product-detail' | 'checkout' | 'confirmation', urlPath?: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const newPath = urlPath || (page === 'home' ? '/' : `/${page}`);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  const handleNavigateToShop = (category = 'All') => {
    setInitialCategory(category);
    navigateTo('shop', '/shop');
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('product-detail', `/product/${product.id}`);
  };

  const handleOrderCompleted = (order: Order) => {
    setCompletedOrder(order);
    navigateTo('confirmation', '/confirmation');
  };

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-800">
        {/* Navigation Header */}
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => {
            if (page === 'home') navigateTo('home', '/');
            else if (page === 'shop') handleNavigateToShop('All');
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          {currentPage === 'home' && (
            <HomePage
              products={products}
              onNavigateToShop={handleNavigateToShop}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentPage === 'shop' && (
            <ShopPage
              products={products}
              initialCategory={initialCategory}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentPage === 'product-detail' && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              onBackToShop={() => navigateTo('shop', '/shop')}
              onNavigateToCheckout={() => navigateTo('checkout', '/checkout')}
            />
          )}

          {currentPage === 'checkout' && (
            <CheckoutPage
              onBackToShop={() => navigateTo('shop', '/shop')}
              onOrderCompleted={handleOrderCompleted}
            />
          )}

          {currentPage === 'confirmation' && (
            <ConfirmationPage
              order={completedOrder}
              onNavigateToHome={() => navigateTo('home', '/')}
              onNavigateToShop={() => handleNavigateToShop('All')}
            />
          )}
        </main>

        {/* Footer */}
        <Footer
          onNavigate={(page) => {
            if (page === 'home') navigateTo('home', '/');
            else if (page === 'shop') handleNavigateToShop('All');
          }}
        />

        {/* Cart Drawer */}
        <CartDrawer
          onNavigateToCheckout={() => navigateTo('checkout', '/checkout')}
          onNavigateToShop={() => handleNavigateToShop('All')}
        />

        {/* Toast Notifications */}
        <Toast />
      </div>
    </CartProvider>
  );
};

export default App;
