// frontend/src/components/FeaturedProducts.tsx
'use client';

import { useEffect, useState } from 'react';
import { Product, productService } from '@/lib/products';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [products.length]);

  async function loadFeaturedProducts() {
    try {
      const data = await productService.getFeaturedProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setLoading(false);
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
      
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="relative">
          <div className="flex transition-transform duration-500 ease-in-out"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {products.map((product) => (
              <div key={product.id} className="min-w-full px-4">
                <div className="max-w-4xl mx-auto">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {products.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
              aria-label="Previous product"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
              aria-label="Next product"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}