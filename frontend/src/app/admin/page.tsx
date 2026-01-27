// frontend/src/app/admin/page.tsx

// Added product link here but not working

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/lib/admin';
import { productService } from '@/lib/products';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Users, 
  Shield, 
  Pin, 
  Trash2, 
  TrendingUp,
  Loader2,
  Share2,
  Check
} from 'lucide-react';
import Image from 'next/image';

interface DashboardStats {
  total_products: number;
  total_users: number;
  total_admins: number;
  pinned_products: number;
  products_today: number;
}

interface Product {
  id: string;
  product_name: string;
  brand_name?: string;
  price: number;
  is_pinned: boolean;
  images: { image_url: string }[];
  user_id: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      loadDashboard();
    }
  }, [authLoading, isAdmin]);

  async function loadDashboard() {
    try {
      const [statsData, productsData] = await Promise.all([
        adminService.getStats(),
        productService.getProducts({ page: 1, page_size: 50 })
      ]);
      
      setStats(statsData);
      setProducts(productsData.products);
    } catch (err: any) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handlePinProduct(productId: string, isPinned: boolean) {
    setActionLoading(productId);
    setError('');
    
    try {
      if (isPinned) {
        await adminService.unpinProduct(productId);
        toast({
          title: "Product unpinned",
          description: "Product removed from featured section.",
        });
      } else {
        await adminService.pinProduct(productId);
        toast({
          title: "Product pinned!",
          description: "Product added to featured section.",
        });
      }
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to update pin status',
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    setActionLoading(productId);
    setError('');
    
    try {
      await adminService.deleteProduct(productId);
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully.",
      });
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err.response?.data?.detail || 'Failed to delete product',
      });
    } finally {
      setActionLoading(null);
    }
  }
  // Something new

  function handleCopyLink(productId: string) {
    const productUrl = `${window.location.origin}/products/${productId}`;
    
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopiedId(productId);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
      
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again.",
      });
    });
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage products, users, and platform settings
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_products}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_admins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pinned Products</CardTitle>
                <Pin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pinned_products}/5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products_today}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={product.images[0]?.image_url || '/placeholder.jpg'}
                      alt={product.product_name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {product.product_name}
                      </h3>
                      {product.is_pinned && (
                        <Badge variant="secondary" className="bg-yellow-100">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    {product.brand_name && (
                      <p className="text-sm text-muted-foreground">
                        {product.brand_name}
                      </p>
                    )}
                    <p className="text-sm font-medium text-primary">
                      ₦{product.price.toLocaleString()}
                    </p>
                  </div>





                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(product.id)}
                    >
                      {copiedId === product.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant={product.is_pinned ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handlePinProduct(product.id, product.is_pinned)}
                      disabled={
                        actionLoading === product.id ||
                        (!product.is_pinned && stats?.pinned_products === 5)
                      }
                    >
                      {actionLoading === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-1" />
                          {product.is_pinned ? 'Unpin' : 'Pin'}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={actionLoading === product.id}
                    >
                      {actionLoading === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No products found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



// // frontend/src/app/admin/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/hooks/useAuth';
// import { adminService } from '@/lib/admin';
// import { productService } from '@/lib/products';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { 
//   Package, 
//   Users, 
//   Shield, 
//   Pin, 
//   Trash2, 
//   TrendingUp,
//   Loader2 
// } from 'lucide-react';
// import Image from 'next/image';

// interface DashboardStats {
//   total_products: number;
//   total_users: number;
//   total_admins: number;
//   pinned_products: number;
//   products_today: number;
// }

// interface Product {
//   id: string;
//   product_name: string;
//   brand_name?: string;
//   price: number;
//   is_pinned: boolean;
//   images: { image_url: string }[];
//   user_id: string;
// }

// export default function AdminDashboard() {
//   const router = useRouter();
//   const { user, isAdmin, loading: authLoading } = useAuth();
  
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [actionLoading, setActionLoading] = useState<string | null>(null);

//   useEffect(() => {
//     if (!authLoading && !isAdmin) {
//       router.push('/');
//     } else if (isAdmin) {
//       loadDashboard();
//     }
//   }, [authLoading, isAdmin]);

//   async function loadDashboard() {
//     try {
//       const [statsData, productsData] = await Promise.all([
//         adminService.getStats(),
//         productService.getProducts({ page: 1, page_size: 50 })
//       ]);
      
//       setStats(statsData);
//       setProducts(productsData.products);
//     } catch (err: any) {
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handlePinProduct(productId: string, isPinned: boolean) {
//     setActionLoading(productId);
//     setError('');
    
//     try {
//       if (isPinned) {
//         await adminService.unpinProduct(productId);
//       } else {
//         await adminService.pinProduct(productId);
//       }
//       await loadDashboard();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Action failed');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   async function handleDeleteProduct(productId: string) {
//     if (!confirm('Are you sure you want to delete this product?')) {
//       return;
//     }
    
//     setActionLoading(productId);
//     setError('');
    
//     try {
//       await adminService.deleteProduct(productId);
//       await loadDashboard();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to delete product');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   if (authLoading || loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   if (!isAdmin) {
//     return null;
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold">Admin Dashboard</h1>
//           <p className="text-muted-foreground mt-2">
//             Manage products, users, and platform settings
//           </p>
//         </div>

//         {error && (
//           <Alert variant="destructive">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {/* Stats Cards */}
//         {stats && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium">Total Products</CardTitle>
//                 <Package className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.total_products}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//                 <Users className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.total_users}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium">Admins</CardTitle>
//                 <Shield className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.total_admins}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium">Pinned Products</CardTitle>
//                 <Pin className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.pinned_products}/5</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium">Today's Products</CardTitle>
//                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.products_today}</div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* Products Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>All Products</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {products.map((product) => (
//                 <div
//                   key={product.id}
//                   className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
//                 >
//                   <div className="relative w-20 h-20 flex-shrink-0">
//                     <Image
//                       src={product.images[0]?.image_url || '/placeholder.jpg'}
//                       alt={product.product_name}
//                       fill
//                       className="object-cover rounded"
//                     />
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2">
//                       <h3 className="font-semibold truncate">
//                         {product.product_name}
//                       </h3>
//                       {product.is_pinned && (
//                         <Badge variant="secondary" className="bg-yellow-100">
//                           Pinned
//                         </Badge>
//                       )}
//                     </div>
//                     {product.brand_name && (
//                       <p className="text-sm text-muted-foreground">
//                         {product.brand_name}
//                       </p>
//                     )}
//                     <p className="text-sm font-medium text-primary">
//                       ₦{product.price.toLocaleString()}
//                     </p>
//                   </div>

//                   <div className="flex gap-2">
//                     <Button
//                       variant={product.is_pinned ? 'outline' : 'default'}
//                       size="sm"
//                       onClick={() => handlePinProduct(product.id, product.is_pinned)}
//                       disabled={
//                         actionLoading === product.id ||
//                         (!product.is_pinned && stats?.pinned_products === 5)
//                       }
//                     >
//                       {actionLoading === product.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       ) : (
//                         <>
//                           <Pin className="h-4 w-4 mr-1" />
//                           {product.is_pinned ? 'Unpin' : 'Pin'}
//                         </>
//                       )}
//                     </Button>

//                     <Button
//                       variant="destructive"
//                       size="sm"
//                       onClick={() => handleDeleteProduct(product.id)}
//                       disabled={actionLoading === product.id}
//                     >
//                       {actionLoading === product.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       ) : (
//                         <Trash2 className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ))}

//               {products.length === 0 && (
//                 <p className="text-center text-muted-foreground py-8">
//                   No products found
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }