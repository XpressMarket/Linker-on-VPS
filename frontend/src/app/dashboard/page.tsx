
'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { productService } from '@/lib/products';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Eye, 
  TrendingUp, 
  Plus,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalViews: number;
  activeProducts: number;
}

/**
 * Minimal product shape required by this dashboard.
 * This does NOT affect other parts of the app.
 */
type DashboardProduct = {
  id: string;
  user_id: string;
  view_count: number;
  is_pinned: boolean;
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalViews: 0,
    activeProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get user's products
      const data = await productService.getProducts({
        page: 1,
        page_size: 1000, // Get all user products
      });

      /**
       * Narrow the products type locally.
       * This is what fixes the implicit `any` errors.
       */
      const products = data.products as DashboardProduct[];

      // Filter to only user's products
      const userProducts = products.filter(
        (p) => p.user_id === user?.id
      );

      const totalViews = userProducts.reduce(
        (sum, p) => sum + p.view_count,
        0
      );
      
      setStats({
        totalProducts: userProducts.length,
        totalViews,
        activeProducts: userProducts.filter(p => !p.is_pinned).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your listings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeProducts} active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all your products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalProducts > 0
                ? Math.round(stats.totalViews / stats.totalProducts)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. views per product
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/products/new">
            <Button className="w-full justify-start" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Upload New Product
            </Button>
          </Link>

          <Link href="/dashboard/products">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Package className="h-5 w-5 mr-2" />
              Manage My Products
            </Button>
          </Link>

          <Link href="/dashboard/profile">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Eye className="h-5 w-5 mr-2" />
              View Profile
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tips to Get More Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Add clear, high-quality images of your products</p>
          <p>• Write detailed product descriptions</p>
          <p>• Set competitive prices</p>
          <p>• Respond quickly to buyer inquiries on WhatsApp</p>
          <p>• Keep your listings up to date</p>
        </CardContent>
      </Card>
    </div>
  );
}






// 'use client';

// import { useEffect, useState } from 'react';
// import { useAuthContext } from '@/components/AuthProvider';
// import { productService } from '@/lib/products';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { 
//   Package, 
//   Eye, 
//   TrendingUp, 
//   Plus,
//   Loader2 
// } from 'lucide-react';
// import Link from 'next/link';

// interface DashboardStats {
//   totalProducts: number;
//   totalViews: number;
//   activeProducts: number;
// }

// export default function DashboardPage() {
//   const { user } = useAuthContext();
//   const [stats, setStats] = useState<DashboardStats>({
//     totalProducts: 0,
//     totalViews: 0,
//     activeProducts: 0,
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadStats();
//   }, []);

//   async function loadStats() {
//     try {
//       // Get user's products
//       const data = await productService.getProducts({
//         page: 1,
//         page_size: 1000, // Get all user products
//       });

//       // Filter to only user's products
//       const userProducts = data.products.filter(p => p.user_id === user?.id);
//       const totalViews = userProducts.reduce((sum, p) => sum + p.view_count, 0);
      
//       setStats({
//         totalProducts: userProducts.length,
//         totalViews,
//         activeProducts: userProducts.filter(p => !p.is_pinned).length,
//       });
//     } catch (error) {
//       console.error('Failed to load stats:', error);
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-3xl font-bold">Welcome back!</h1>
//         <p className="text-muted-foreground mt-2">
//           Here's what's happening with your listings
//         </p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">Total Products</CardTitle>
//             <Package className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold">{stats.totalProducts}</div>
//             <p className="text-xs text-muted-foreground mt-1">
//               {stats.activeProducts} active listings
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">Total Views</CardTitle>
//             <Eye className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
//             <p className="text-xs text-muted-foreground mt-1">
//               Across all your products
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium">Performance</CardTitle>
//             <TrendingUp className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold">
//               {stats.totalProducts > 0 ? Math.round(stats.totalViews / stats.totalProducts) : 0}
//             </div>
//             <p className="text-xs text-muted-foreground mt-1">
//               Avg. views per product
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Quick Actions</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-3">
//           <Link href="/products/new">
//             <Button className="w-full justify-start" size="lg">
//               <Plus className="h-5 w-5 mr-2" />
//               Upload New Product
//             </Button>
//           </Link>

//           <Link href="/dashboard/products">
//             <Button variant="outline" className="w-full justify-start" size="lg">
//               <Package className="h-5 w-5 mr-2" />
//               Manage My Products
//             </Button>
//           </Link>

//           <Link href="/dashboard/profile">
//             <Button variant="outline" className="w-full justify-start" size="lg">
//               <Eye className="h-5 w-5 mr-2" />
//               View Profile
//             </Button>
//           </Link>
//         </CardContent>
//       </Card>

//       {/* Tips Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Tips to Get More Views</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-2 text-sm">
//           <p>• Add clear, high-quality images of your products</p>
//           <p>• Write detailed product descriptions</p>
//           <p>• Set competitive prices</p>
//           <p>• Respond quickly to buyer inquiries on WhatsApp</p>
//           <p>• Keep your listings up to date</p>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }