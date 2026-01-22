// frontend/src/app/admin/layout.tsx

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Activity, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-4">

            {/* Dashboard */}
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            {/* Manage Users — SUPER_ADMIN only */}
            {isSuperAdmin && (
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            {/* Activity Log */}
            <Link href="/admin/activity">
              <Button variant="ghost" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Activity Log
              </Button>
            </Link>

          </div>
        </div>
      </div>

      {children}
    </div>
  );
}






// frontend/src/app/admin/layout.tsx




// 'use client';

// import { useAuth } from '@/hooks/useAuth';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Shield, Users, Activity, LayoutDashboard } from 'lucide-react';

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { isAdmin, isSuperAdmin, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !isAdmin) {
//       router.push('/');
//     }
//   }, [loading, isAdmin, router]);

//   if (loading) {
//     return null;
//   }

//   if (!isAdmin) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="bg-white border-b">
//         <div className="container mx-auto px-4">
//           <div className="flex items-center gap-4 py-4">
//             <Link href="/admin">
//               <Button variant="ghost" size="sm">
//                 <LayoutDashboard className="h-4 w-4 mr-2" />
//                 Dashboard
//               </Button>
//             </Link>
            
//             {isSuperAdmin && (
//               <Link href="/admin/users">
//                 <Button variant="ghost" size="sm">
//                   <Users className="h-4 w-4 mr-2" />
//                   Manage Users
//                 </Button>
//               </Link>
//             )}
            
//             <Link href="/admin/activity">
//               <Button variant="ghost" size="sm">
//                 <Activity className="h-4 w-4 mr-2" />
//                 Activity Log
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </div>

//       {children}
//     </div>
//   );
// }