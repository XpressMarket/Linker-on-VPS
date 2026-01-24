// frontend/src/components/ProductGrid.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, productService } from '@/lib/products';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Loader2, PackageOpen } from 'lucide-react';

export function ProductGrid() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Extract search parameters
  const search = searchParams.get('search') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const sort = searchParams.get('sort') || undefined;

  useEffect(() => {
    setPage(1); // Reset to page 1 when search params change
    loadProducts(1);
  }, [search, brand, minPrice, maxPrice, sort]);

  useEffect(() => {
    loadProducts(page);
  }, [page]);

  async function loadProducts(pageNum: number) {
    try {
      setLoading(true);
      
      // Determine sort order based on sort param
      let orderBy: 'created_at' | 'price' | 'view_count' = 'created_at';
      let orderDirection: 'asc' | 'desc' = 'desc';
      
      if (sort === 'price_asc') {
        orderBy = 'price';
        orderDirection = 'asc';
      } else if (sort === 'price_desc') {
        orderBy = 'price';
        orderDirection = 'desc';
      } else if (sort === 'date_asc') {
        orderBy = 'created_at';
        orderDirection = 'asc';
      } else if (sort === 'date_desc') {
        orderBy = 'created_at';
        orderDirection = 'desc';
      } else if (sort === 'views') {
        orderBy = 'view_count';
        orderDirection = 'desc';
      }

      const data = await productService.getProducts({
        page: pageNum,
        page_size: 20,
        search,
        brand,
        min_price: minPrice,
        max_price: maxPrice,
      });
      
      // Apply sorting on client side for now
      let sortedProducts = [...data.products];
      
      if (sort) {
        sortedProducts.sort((a, b) => {
          if (orderBy === 'price') {
            return orderDirection === 'asc' ? a.price - b.price : b.price - a.price;
          } else if (orderBy === 'view_count') {
            return b.view_count - a.view_count;
          } else if (orderBy === 'created_at') {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return orderDirection === 'asc' ? dateA - dateB : dateB - dateA;
          }
          return 0;
        });
      }
      
      setProducts(sortedProducts);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && page === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground mb-6">
          {search || brand || minPrice || maxPrice
            ? 'Try adjusting your search filters'
            : 'No products available at the moment'}
        </p>
        {(search || brand || minPrice || maxPrice) && (
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <strong>{products.length}</strong> of <strong>{total}</strong> products
          {search && ` for "${search}"`}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            variant="outline"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  variant={page === pageNum ? 'default' : 'outline'}
                  disabled={loading}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  onClick={() => setPage(totalPages)}
                  variant={page === totalPages ? 'default' : 'outline'}
                  disabled={loading}
                  className="w-10"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}




// Added Product Search


// frontend/src/components/ProductGrid.tsx



// 'use client';

// import { useEffect, useState } from 'react';
// import { Product, productService } from '@/lib/products';
// import { ProductCard } from './ProductCard';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Search, Loader2 } from 'lucide-react';

// export function ProductGrid() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [search, setSearch] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     loadProducts();
//   }, [page, searchQuery]);

//   async function loadProducts() {
//     try {
//       setLoading(true);
//       const data = await productService.getProducts({
//         page,
//         page_size: 20,
//         search: searchQuery || undefined,
//       });
//       setProducts(data.products);
//       setTotalPages(data.total_pages);
//     } catch (error) {
//       console.error('Failed to load products:', error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     setSearchQuery(search);
//     setPage(1);
//   };

//   return (
//     <div className="space-y-6">
//       <form onSubmit={handleSearch} className="flex gap-2">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search products..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         <Button type="submit">Search</Button>
//       </form>

//       {loading ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {[...Array(8)].map((_, i) => (
//             <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
//           ))}
//         </div>
//       ) : products.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-muted-foreground">No products found</p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {products.map((product) => (
//               <ProductCard key={product.id} product={product} />
//             ))}
//           </div>

//           {totalPages > 1 && (
//             <div className="flex justify-center gap-2 mt-8">
//               <Button
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={page === 1}
//                 variant="outline"
//               >
//                 Previous
//               </Button>
              
//               <span className="flex items-center px-4">
//                 Page {page} of {totalPages}
//               </span>
              
//               <Button
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={page === totalPages}
//                 variant="outline"
//               >
//                 Next
//               </Button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
