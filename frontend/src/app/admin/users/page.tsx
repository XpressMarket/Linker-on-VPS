
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { adminService } from '@/lib/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldOff, 
  Loader2, 
  Crown, 
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  role: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export default function ManageUsersPage() {
  const router = useRouter();
  const { user: currentUser, isSuperAdmin, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'assign' | 'remove' | 'revoke-super' | null;
    userId: string | null;
    userEmail: string;
  }>({
    open: false,
    action: null,
    userId: null,
    userEmail: ''
  });

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    } else if (isSuperAdmin) {
      loadUsers();
    }
  }, [authLoading, isSuperAdmin, router]);

  async function loadUsers() {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function openConfirmDialog(action: 'assign' | 'remove' | 'revoke-super', userId: string, userEmail: string) {
    setConfirmDialog({
      open: true,
      action,
      userId,
      userEmail
    });
  }

  function closeConfirmDialog() {
    setConfirmDialog({
      open: false,
      action: null,
      userId: null,
      userEmail: ''
    });
  }

  async function handleConfirmedAction() {
    if (!confirmDialog.userId || !confirmDialog.action) return;

    setActionLoading(confirmDialog.userId);
    setError('');
    setSuccess('');
    
    try {
      if (confirmDialog.action === 'assign') {
        await adminService.assignAdmin(confirmDialog.userId);
        setSuccess(`Admin role assigned to ${confirmDialog.userEmail}`);
      } else if (confirmDialog.action === 'remove') {
        await adminService.removeAdmin(confirmDialog.userId);
        setSuccess(`Admin role removed from ${confirmDialog.userEmail}`);
      } else if (confirmDialog.action === 'revoke-super') {
        // You'll need to add this endpoint to backend
        await adminService.removeAdmin(confirmDialog.userId);
        setSuccess(`Super Admin role revoked from ${confirmDialog.userEmail}`);
      }
      
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(null);
      closeConfirmDialog();
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-500">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <UserIcon className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case 'assign':
        return {
          title: 'Assign Admin Role',
          description: `Are you sure you want to make ${confirmDialog.userEmail} an admin? They will be able to pin/unpin and delete any products.`,
          confirmText: 'Assign Admin',
          variant: 'default' as const
        };
      case 'remove':
        return {
          title: 'Remove Admin Role',
          description: `Are you sure you want to remove admin privileges from ${confirmDialog.userEmail}? They will become a regular user.`,
          confirmText: 'Remove Admin',
          variant: 'destructive' as const
        };
      case 'revoke-super':
        return {
          title: '⚠️ Revoke Super Admin',
          description: `WARNING: You are about to revoke Super Admin privileges from ${confirmDialog.userEmail}. This action will demote them to a regular admin. Are you absolutely sure?`,
          confirmText: 'Revoke Super Admin',
          variant: 'destructive' as const
        };
      default:
        return {
          title: '',
          description: '',
          confirmText: '',
          variant: 'default' as const
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const dialogContent = getDialogContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions (Super Admin Only)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'user').length}
                </div>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'super_admin').length}
                </div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{user.email}</p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="bg-blue-100">You</Badge>
                        )}
                        {getRoleBadge(user.role)}
                        {user.is_email_verified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                        {!user.is_active && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Joined: {new Date(user.created_at).toLocaleDateString()} at {new Date(user.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {user.role === 'super_admin' && !isCurrentUser && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openConfirmDialog('revoke-super', user.id, user.email)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Revoke Super Admin
                            </>
                          )}
                        </Button>
                      )}

                      {user.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfirmDialog('remove', user.id, user.email)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Remove Admin
                            </>
                          )}
                        </Button>
                      )}

                      {user.role === 'user' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openConfirmDialog('assign', user.id, user.email)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      )}

                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2">
                          Current User
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No users found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              className={dialogContent.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}





// Enforce Roles was added in the above code


// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuthContext } from '@/components/AuthProvider';
// import { adminService } from '@/lib/admin';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { Shield, ShieldOff, Loader2 } from 'lucide-react';

// interface User {
//   id: string;
//   email: string;
//   role: string;
//   is_email_verified: boolean;
//   is_active: boolean;
//   created_at: string;
// }

// export default function ManageUsersPage() {
//   const router = useRouter();
//   const { isSuperAdmin, loading: authLoading } = useAuthContext();
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [actionLoading, setActionLoading] = useState<string | null>(null);

//   useEffect(() => {
//     if (!authLoading && !isSuperAdmin) {
//       router.push('/');
//     } else if (isSuperAdmin) {
//       loadUsers();
//     }
//   }, [authLoading, isSuperAdmin, router]);

//   async function loadUsers() {
//     try {
//       const data = await adminService.getAllUsers();
//       setUsers(data);
//     } catch (err: any) {
//       setError('Failed to load users');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleAssignAdmin(userId: string) {
//     setActionLoading(userId);
//     setError('');
    
//     try {
//       await adminService.assignAdmin(userId);
//       await loadUsers();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to assign admin role');
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   async function handleRemoveAdmin(userId: string) {
//     setActionLoading(userId);
//     setError('');
    
//     try {
//       await adminService.removeAdmin(userId);
//       await loadUsers();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to remove admin role');
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

//   if (!isSuperAdmin) {
//     return null;
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-3xl font-bold">Manage Users</h1>
//           <p className="text-muted-foreground mt-2">
//             Assign and remove admin roles
//           </p>
//         </div>

//         {error && (
//           <Alert variant="destructive">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         <Card>
//           <CardHeader>
//             <CardTitle>All Users</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {users.map((user) => (
//                 <div
//                   key={user.id}
//                   className="flex items-center justify-between p-4 border rounded-lg"
//                 >
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <p className="font-medium">{user.email}</p>
//                       <Badge variant={
//                         user.role === 'super_admin' ? 'default' :
//                         user.role === 'admin' ? 'secondary' :
//                         'outline'
//                       }>
//                         {user.role === 'super_admin' ? 'Super Admin' :
//                          user.role === 'admin' ? 'Admin' :
//                          'User'}
//                       </Badge>
//                       {user.is_email_verified && (
//                         <Badge variant="outline" className="bg-green-50">Verified</Badge>
//                       )}
//                     </div>
//                     <p className="text-sm text-muted-foreground">
//                       Joined: {new Date(user.created_at).toLocaleDateString()}
//                     </p>
//                   </div>

//                   {user.role !== 'super_admin' && (
//                     <div>
//                       {user.role === 'admin' ? (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleRemoveAdmin(user.id)}
//                           disabled={actionLoading === user.id}
//                         >
//                           {actionLoading === user.id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <>
//                               <ShieldOff className="h-4 w-4 mr-2" />
//                               Remove Admin
//                             </>
//                           )}
//                         </Button>
//                       ) : (
//                         <Button
//                           variant="default"
//                           size="sm"
//                           onClick={() => handleAssignAdmin(user.id)}
//                           disabled={actionLoading === user.id}
//                         >
//                           {actionLoading === user.id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <>
//                               <Shield className="h-4 w-4 mr-2" />
//                               Make Admin
//                             </>
//                           )}
//                         </Button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}

//               {users.length === 0 && (
//                 <p className="text-center text-muted-foreground py-8">
//                   No users found
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }