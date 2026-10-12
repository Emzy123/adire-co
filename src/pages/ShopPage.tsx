import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';

interface ShopPageProps {
  products: Product[];
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES: Category[] = ['All', 'Fabrics', 'Men', 'Women', 'Accessories'];

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  initialCategory = 'All',
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    (initialCategory as Category) || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center sm:text-left border-b border-slate-200/70 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3A93] bg-[#1F3A93]/10 px-2.5 py-1 rounded-full mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Shop Handcrafted Indigo
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl">
          Browse authentic 2-yard fabrics, men's shirts and kaftans, owambe dresses, and accessories made right here in Lagos.
        </p>
      </div>

      {/* Controls: Search & Category Chips */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="shop-search"
              aria-label="Search adire collection"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fabrics, kaftans, dresses, totes..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F3A93] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results count counter */}
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of{' '}
              {products.length} products
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? products.length
                : products.filter((p) => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#1F3A93] text-white shadow-md shadow-[#1F3A93]/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No products found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            We couldn't find anything matching{' '}
            {searchQuery ? `"${searchQuery}"` : `in category "${selectedCategory}"`}. Try adjusting your keywords or clearing filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-5 py-2.5 rounded-xl bg-[#1F3A93] text-white text-xs font-bold hover:bg-[#162B6E] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
