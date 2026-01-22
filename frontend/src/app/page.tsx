// frontend/src/app/page.tsx


import { FeaturedProducts } from '@/components/FeaturedProducts';
import { ProductGrid } from '@/components/ProductGrid';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Discover Amazing Products
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Buy and sell with confidence in our trusted marketplace
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/products/new">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg">
                  Start Selling
                </button>
              </a>
              <a href="#products">
                <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all">
                  Browse Products
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-16">
        <FeaturedProducts />
      </section>

      {/* All Products Section */}
      <section id="products" className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">All Products</h2>
            <p className="text-muted-foreground mt-2">Browse our latest listings</p>
          </div>
        </div>
        <ProductGrid />
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Products Listed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



// frontend/src/app/page.tsx


// import { FeaturedProducts } from '@/components/FeaturedProducts';
// import { ProductGrid } from '@/components/ProductGrid';

// export default function HomePage() {
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="space-y-12">
//         <section>
//           <FeaturedProducts />
//         </section>

//         <section>
//           <h2 className="text-3xl font-bold mb-6">All Products</h2>
//           <ProductGrid />
//         </section>
//       </div>
//     </div>
//   );
// }