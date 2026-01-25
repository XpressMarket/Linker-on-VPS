'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  Settings,
  Loader2
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-4 overflow-x-auto">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">
                <Package className="h-4 w-4 mr-2" />
                My Products
              </Button>
            </Link>
            
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>

            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>

            <div className="ml-auto">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}