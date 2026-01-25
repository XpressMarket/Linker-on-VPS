
'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { productService, Product } from '@/lib/products';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// import { useRouter } from 'next/navigation';
// const router = useRouter();

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Plus,
  PackageOpen,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function MyProductsPage() {
  const { user } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return; // ✅ guard: wait for auth
    loadProducts();
  }, [user?.id]);

  async function loadProducts() {
    try {
      setLoading(true);

      const data = await productService.getProducts({
        page: 1,
        page_size: 1000,
      });

      // Filter to only current user's products
      const userProducts = data.products.filter(
        (p: Product) => p.user_id === user?.id
      );

      setProducts(userProducts);
    } catch {
      setError('Failed to load your products');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      await productService.deleteProduct(productToDelete);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteDialog(productId: string) {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage your listings ({products.length} total)
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">
              Start selling by uploading your first product
            </p>
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={product.images[0]?.image_url || '/placeholder.jpg'}
                      alt={product.product_name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link href={`/products/${product.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                              {product.product_name}
                            </h3>
                          </Link>
                          {product.is_pinned && (
                            <Badge className="bg-yellow-500">Featured</Badge>
                          )}
                          {product.is_updated && (
                            <Badge className="bg-blue-500">Updated</Badge>
                          )}
                        </div>

                        {product.brand_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.brand_name}
                          </p>
                        )}

                        <p className="text-2xl font-bold text-primary mb-3">
                          ₦{product.price.toLocaleString()}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{product.view_count} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(product.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}







// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuthContext } from '@/components/AuthProvider';
// import { productService, Product } from '@/lib/products';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { 
//   Loader2, 
//   Edit, 
//   Trash2, 
//   Eye, 
//   Calendar,
//   Plus,
//   PackageOpen
// } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';

// export default function MyProductsPage() {
//   const router = useRouter();
//   const { user } = useAuthContext();
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [productToDelete, setProductToDelete] = useState<string | null>(null);
//   const [deleting, setDeleting] = useState(false);

//   useEffect(() => {
//     loadProducts();
//   }, [user]);

//   async function loadProducts() {
//     try {
//       const data = await productService.getProducts({
//         page: 1,
//         page_size: 1000,
//       });

//       // Filter to only current user's products
//       const userProducts = data.products.filter(p => p.user_id === user?.id);
//       setProducts(userProducts);
//     } catch (err: any) {
//       setError('Failed to load your products');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleDelete() {
//     if (!productToDelete) return;

//     setDeleting(true);
//     try {
//       await productService.deleteProduct(productToDelete);
//       setProducts(products.filter(p => p.id !== productToDelete));
//       setDeleteDialogOpen(false);
//       setProductToDelete(null);
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to delete product');
//     } finally {
//       setDeleting(false);
//     }
//   }

//   function openDeleteDialog(productId: string) {
//     setProductToDelete(productId);
//     setDeleteDialogOpen(true);
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">My Products</h1>
//           <p className="text-muted-foreground mt-2">
//             Manage your listings ({products.length} total)
//           </p>
//         </div>
//         <Link href="/products/new">
//           <Button>
//             <Plus className="h-4 w-4 mr-2" />
//             Add Product
//           </Button>
//         </Link>
//       </div>

//       {error && (
//         <Alert variant="destructive">
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Products List */}
//       {products.length === 0 ? (
//         <Card>
//           <CardContent className="py-16 text-center">
//             <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
//             <h3 className="text-xl font-semibold mb-2">No products yet</h3>
//             <p className="text-muted-foreground mb-6">
//               Start selling by uploading your first product
//             </p>
//             <Link href="/products/new">
//               <Button>
//                 <Plus className="h-4 w-4 mr-2" />
//                 Upload Product
//               </Button>
//             </Link>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {products.map((product) => (
//             <Card key={product.id}>
//               <CardContent className="p-6">
//                 <div className="flex gap-6">
//                   {/* Product Image */}
//                   <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
//                     <Image
//                       src={product.images[0]?.image_url || '/placeholder.jpg'}
//                       alt={product.product_name}
//                       fill
//                       className="object-cover"
//                       sizes="128px"
//                     />
//                   </div>

//                   {/* Product Info */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Link href={`/products/${product.id}`}>
//                             <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
//                               {product.product_name}
//                             </h3>
//                           </Link>
//                           {product.is_pinned && (
//                             <Badge className="bg-yellow-500">Featured</Badge>
//                           )}
//                           {product.is_updated && (
//                             <Badge className="bg-blue-500">Updated</Badge>
//                           )}
//                         </div>

//                         {product.brand_name && (
//                           <p className="text-sm text-muted-foreground mb-2">
//                             {product.brand_name}
//                           </p>
//                         )}

//                         <p className="text-2xl font-bold text-primary mb-3">
//                           ₦{product.price.toLocaleString()}
//                         </p>

//                         <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//                           <div className="flex items-center gap-1">
//                             <Eye className="h-4 w-4" />
//                             <span>{product.view_count} views</span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <Calendar className="h-4 w-4" />
//                             <span>
//                               {new Date(product.created_at).toLocaleDateString()}
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Actions */}
//                       <div className="flex gap-2">
//                         <Link href={`/products/${product.id}/edit`}>
//                           <Button variant="outline" size="sm">
//                             <Edit className="h-4 w-4 mr-2" />
//                             Edit
//                           </Button>
//                         </Link>

//                         <Button
//                           variant="destructive"
//                           size="sm"
//                           onClick={() => openDeleteDialog(product.id)}
//                         >
//                           <Trash2 className="h-4 w-4 mr-2" />
//                           Delete
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Product</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete this product? This action cannot be undone and all images will be permanently deleted.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={deleting}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               {deleting ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Deleting...
//                 </>
//               ) : (
//                 'Delete Product'
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }