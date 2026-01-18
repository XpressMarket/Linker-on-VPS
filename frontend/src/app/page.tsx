
// frontend/src/app/page.tsx
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { ProductGrid } from '@/components/ProductGrid';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-12">
        <section>
          <FeaturedProducts />
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">All Products</h2>
          <ProductGrid />
        </section>
      </div>
    </div>
  );
}