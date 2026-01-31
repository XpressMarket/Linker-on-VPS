// frontend/src/app/executive/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/lib/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Shield, 
  Pin, 
  Loader2,
  UserPlus,
  UserMinus,
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  total_products: number;
  total_users: number;
  total_admins: number;
  pinned_products: number;
  products_today: number;
}

interface PinQuota {
  admin_id: string;
  admin_email: string;
  admin_name: string | null;
  role: string;
  pins_used: number;
  pin_limit: number;
  pins_remaining: number;
}

interface ManageableUser {
  id: string;
  email: string;
  role: string;
  is_email_verified: boolean;
  created_at: string;
}

interface RoleChange {
  id: string;
  target_user_email: string;
  changed_by_email: string | null;
  old_role: string;
  new_role: string;
  reason: string | null;
  created_at: string;
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pinQuotas, setPinQuotas] = useState<PinQuota[]>([]);
  const [manageableUsers, setManageableUsers] = useState<ManageableUser[]>([]);
  const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Role assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManageableUser | null>(null);
  const [assignReason, setAssignReason] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'executive_admin' && user?.role !== 'platform_owner') {
        router.push('/');
      } else {
        loadDashboard();
      }
    }
  }, [authLoading, user]);

  async function loadDashboard() {
    try {
      const [statsData, quotasData, usersData, changesData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllPinQuotas(),
        adminService.getManageableUsers(),
        adminService.getRoleChanges(100)
      ]);
      
      setStats(statsData);
      setPinQuotas(quotasData);
      setManageableUsers(usersData);
      setRoleChanges(changesData);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignAdmin(userId: string) {
    if (!confirm('Are you sure you want to promote this user to Admin?')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.assignRole(userId, 'admin', assignReason || 'Promoted by Executive Admin');
      toast({
        title: "Admin assigned!",
        description: "User has been promoted to Admin role.",
      });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      setAssignReason('');
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to assign admin role',
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveAdmin(userId: string, userEmail: string) {
    if (!confirm(`Remove admin privileges from ${userEmail}?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.assignRole(userId, 'user', 'Demoted by Executive Admin');
      toast({
        title: "Admin removed",
        description: "User has been demoted to regular user.",
      });
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to remove admin role',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openAssignDialog(user: ManageableUser) {
    setSelectedUser(user);
    setAssignDialogOpen(true);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'executive_admin' && user?.role !== 'platform_owner') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Executive Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage admins, monitor pin quotas, and oversee platform operations
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_admins}</div>
                <p className="text-xs text-muted-foreground mt-1">Max: 8</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_products}</div>
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="quotas">Pin Quotas</TabsTrigger>
            <TabsTrigger value="history">Role History</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manageable Users</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Promote users to Admin role (max 8 admins allowed)
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manageableUsers.map((managedUser) => (
                      <TableRow key={managedUser.id}>
                        <TableCell className="font-medium">
                          {managedUser.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={managedUser.role === 'admin' ? 'default' : 'secondary'}>
                            {managedUser.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {managedUser.is_email_verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(managedUser.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {managedUser.role === 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAdmin(managedUser.id, managedUser.email)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openAssignDialog(managedUser)}
                              disabled={actionLoading || stats?.total_admins === 8}
                            >
                              {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {manageableUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No manageable users found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pin Quotas Tab */}
          <TabsContent value="quotas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Pin Quotas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor pin usage across all admins
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Pins Used</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pinQuotas.map((quota) => {
                      const usagePercent = (quota.pins_used / quota.pin_limit) * 100;
                      return (
                        <TableRow key={quota.admin_id}>
                          <TableCell className="font-medium">
                            {quota.admin_email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                quota.role === 'platform_owner'
                                  ? 'default'
                                  : quota.role === 'executive_admin'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {quota.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{quota.pins_used}</TableCell>
                          <TableCell>{quota.pin_limit}</TableCell>
                          <TableCell>
                            <Badge
                              variant={quota.pins_remaining === 0 ? 'destructive' : 'outline'}
                            >
                              {quota.pins_remaining}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    usagePercent >= 100
                                      ? 'bg-red-500'
                                      : usagePercent >= 75
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(usagePercent)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {pinQuotas.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No pin quotas found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Change History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Audit trail of all role assignments and changes
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Old Role</TableHead>
                      <TableHead>New Role</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleChanges.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell>
                          {new Date(change.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {change.target_user_email}
                        </TableCell>
                        <TableCell>
                          {change.changed_by_email || 'System'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{change.old_role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{change.new_role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {change.reason || 'No reason provided'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {roleChanges.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No role changes found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Admin Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Admin</DialogTitle>
            <DialogDescription>
              Promote {selectedUser?.email} to Admin role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Promoted for excellent contribution..."
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedUser(null);
                setAssignReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && handleAssignAdmin(selectedUser.id)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/hooks/useAuth';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import api from '@/lib/api';
// import { toast } from '@/components/ui/use-toast';

// interface User {
//   id: number;
//   email: string;
//   full_name: string;
//   role: string;
//   is_active: boolean;
// }

// export default function ExecutiveDashboard() {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [roleStats, setRoleStats] = useState<any>(null);

//   useEffect(() => {
//     if (!user) {
//       router.push('/login');
//       return;
//     }
    
//     if (user.role !== 'executive_admin' && user.role !== 'platform_owner') {
//       router.push('/dashboard');
//       return;
//     }

//     fetchData();
//   }, [user]);

//   const fetchData = async () => {
//     try {
//       // Get users
//       const usersRes = await api.get('/admin/users');
//       setUsers(usersRes.data);

//       // Get role limits
//       const rolesRes = await api.get('/admin/rbac/roles');
//       setRoleStats(rolesRes.data);
//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAssignRole = async (userId: number, newRole: string) => {
//     try {
//       await api.post('/admin/rbac/assign-role', {
//         user_id: userId,
//         new_role: newRole,
//         reason: 'Assigned from Executive Dashboard'
//       });

//       toast({
//         title: 'Success',
//         description: `Role updated to ${newRole}`
//       });

//       fetchData(); // Refresh
//     } catch (error: any) {
//       toast({
//         title: 'Error',
//         description: error.response?.data?.detail || 'Failed to assign role',
//         variant: 'destructive'
//       });
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">Executive Admin Dashboard</h1>
//         <p className="text-muted-foreground">Manage administrators and users</p>
//       </div>

//       {/* Role Stats */}
//       {roleStats && (
//         <div className="grid gap-4 md:grid-cols-2 mb-8">
//           {Object.entries(roleStats.limits).map(([role, data]: [string, any]) => (
//             <Card key={role}>
//               <CardHeader>
//                 <CardTitle className="capitalize">{role.replace('_', ' ')}</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">
//                   {data.current} / {data.max}
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   {data.max - data.current} slots available
//                 </p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* User List */}
//       <Card>
//         <CardHeader>
//           <CardTitle>All Users</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {users.map((u) => (
//               <div
//                 key={u.id}
//                 className="flex items-center justify-between p-4 border rounded-lg"
//               >
//                 <div>
//                   <p className="font-medium">{u.email}</p>
//                   <p className="text-sm text-muted-foreground">{u.full_name}</p>
//                 </div>
                
//                 <div className="flex items-center gap-4">
//                   <Badge variant={u.role === 'user' ? 'secondary' : 'default'}>
//                     {u.role}
//                   </Badge>

//                   {u.role === 'user' && (
//                     <Button
//                       size="sm"
//                       onClick={() => handleAssignRole(u.id, 'admin')}
//                     >
//                       Make Admin
//                     </Button>
//                   )}

//                   {u.role === 'admin' && (
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => handleAssignRole(u.id, 'user')}
//                     >
//                       Demote to User
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }