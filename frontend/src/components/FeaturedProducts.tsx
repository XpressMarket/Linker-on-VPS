// frontend/src/components/FeaturedProducts.tsx

'use client';

import { useEffect, useState } from 'react';
import { Product, productService } from '@/lib/products';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0 && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, 5000); // Auto-scroll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [products.length, isAutoPlaying]);

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
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          <h2 className="text-3xl font-bold">Featured Products</h2>
        </div>
        <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Featured Products
        </h2>
      </div>
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {products.map((product) => (
                <div key={product.id} className="min-w-full px-4">
                  <div className="max-w-4xl mx-auto">
                    <ProductCard product={product} featured />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {products.length > 1 && (
            <>
              <Button
                onClick={prevSlide}
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Previous product"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={nextSlide}
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Next product"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-3 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-12 bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'w-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}





// frontend/src/components/FeaturedProducts.tsx




// 'use client';

// import { useEffect, useState } from 'react';
// import { Product, productService } from '@/lib/products';
// import { ProductCard } from './ProductCard';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// export function FeaturedProducts() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadFeaturedProducts();
//   }, []);

//   useEffect(() => {
//     if (products.length > 0) {
//       const interval = setInterval(() => {
//         setCurrentIndex((prev) => (prev + 1) % products.length);
//       }, 5000);

//       return () => clearInterval(interval);
//     }
//   }, [products.length]);

//   async function loadFeaturedProducts() {
//     try {
//       const data = await productService.getFeaturedProducts();
//       setProducts(data);
//     } catch (error) {
//       console.error('Failed to load featured products:', error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const nextSlide = () => {
//     setCurrentIndex((prev) => (prev + 1) % products.length);
//   };

//   const prevSlide = () => {
//     setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
//   };

//   if (loading) {
//     return (
//       <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse" />
//     );
//   }

//   if (products.length === 0) {
//     return null;
//   }

//   return (
//     <div className="relative">
//       <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
      
//       <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-8">
//         <div className="relative">
//           <div className="flex transition-transform duration-500 ease-in-out"
//                style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
//             {products.map((product) => (
//               <div key={product.id} className="min-w-full px-4">
//                 <div className="max-w-4xl mx-auto">
//                   <ProductCard product={product} />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {products.length > 1 && (
//           <>
//             <button
//               onClick={prevSlide}
//               className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
//               aria-label="Previous product"
//             >
//               <ChevronLeft className="h-6 w-6" />
//             </button>
            
//             <button
//               onClick={nextSlide}
//               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all"
//               aria-label="Next product"
//             >
//               <ChevronRight className="h-6 w-6" />
//             </button>

//             <div className="flex justify-center gap-2 mt-6">
//               {products.map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => setCurrentIndex(index)}
//                   className={`h-2 rounded-full transition-all ${
//                     index === currentIndex
//                       ? 'w-8 bg-primary'
//                       : 'w-2 bg-gray-300 hover:bg-gray-400'
//                   }`}
//                   aria-label={`Go to slide ${index + 1}`}
//                 />
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }