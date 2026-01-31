// frontend/src/app/platform-owner/page.tsx

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Shield, 
  Pin, 
  Loader2,
  UserPlus,
  UserMinus,
  History,
  TrendingUp,
  AlertCircle,
  Crown,
  Package,
  Activity
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

interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  details: any;
  created_at: string;
}

export default function PlatformOwnerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pinQuotas, setPinQuotas] = useState<PinQuota[]>([]);
  const [manageableUsers, setManageableUsers] = useState<ManageableUser[]>([]);
  const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Role assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManageableUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assignReason, setAssignReason] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'platform_owner') {
        router.push('/');
      } else {
        loadDashboard();
      }
    }
  }, [authLoading, user]);

  async function loadDashboard() {
    try {
      const [statsData, quotasData, usersData, changesData, logsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllPinQuotas(),
        adminService.getManageableUsers(),
        adminService.getRoleChanges(100),
        adminService.getActivityLogs(100)
      ]);
      
      setStats(statsData);
      setPinQuotas(quotasData);
      setManageableUsers(usersData);
      setRoleChanges(changesData);
      setActivityLogs(logsData);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignRole(userId: string, role: string) {
    setActionLoading(true);
    try {
      await adminService.assignRole(userId, role, assignReason || `Assigned ${role} by Platform Owner`);
      toast({
        title: "Role assigned!",
        description: `User has been assigned ${role} role.`,
      });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
      setAssignReason('');
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to assign role',
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDemoteUser(userId: string, userEmail: string, currentRole: string) {
    if (!confirm(`Demote ${userEmail} from ${currentRole} to user?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await adminService.assignRole(userId, 'user', 'Demoted by Platform Owner');
      toast({
        title: "User demoted",
        description: "User has been demoted to regular user.",
      });
      await loadDashboard();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to demote user',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openAssignDialog(user: ManageableUser) {
    setSelectedUser(user);
    // Set default role based on current role
    if (user.role === 'user') {
      setSelectedRole('admin');
    } else {
      setSelectedRole(user.role);
    }
    setAssignDialogOpen(true);
  }

  function getRoleCounts() {
    const counts = {
      executive_admin: 0,
      admin: 0,
      user: 0,
    };
    
    manageableUsers.forEach((u) => {
      if (u.role === 'executive_admin') counts.executive_admin++;
      else if (u.role === 'admin') counts.admin++;
      else counts.user++;
    });
    
    return counts;
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'platform_owner') {
    return null;
  }

  const roleCounts = getRoleCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Platform Owner Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Full system control and administrative oversight
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                <CardTitle className="text-sm font-medium">Executive Admins</CardTitle>
                <Crown className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCounts.executive_admin}</div>
                <p className="text-xs text-muted-foreground mt-1">Max: 4</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_admins}</div>
                <p className="text-xs text-muted-foreground mt-1">Max: 8</p>
              </CardContent>
            </Card>

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
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User & Role Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Assign roles and manage all platform users
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
                          <Badge
                            variant={
                              managedUser.role === 'executive_admin'
                                ? 'default'
                                : managedUser.role === 'admin'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              managedUser.role === 'executive_admin'
                                ? 'bg-purple-600'
                                : ''
                            }
                          >
                            {managedUser.role.replace('_', ' ')}
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
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(managedUser)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Manage Role
                              </>
                            )}
                          </Button>
                          {managedUser.role !== 'user' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDemoteUser(
                                  managedUser.id,
                                  managedUser.email,
                                  managedUser.role
                                )
                              }
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Demote
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
                  Monitor pin usage across all admins (Platform Owner: 6, Executive Admin: 4, Admin: 2)
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
                              className={
                                quota.role === 'platform_owner'
                                  ? 'bg-yellow-600'
                                  : quota.role === 'executive_admin'
                                  ? 'bg-purple-600'
                                  : ''
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
                  Complete audit trail of all role assignments and changes
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
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
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

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Recent administrative actions across the platform
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.admin_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {activityLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No activity logs found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
            <DialogDescription>
              Assign role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin" disabled={stats?.total_admins === 8}>
                    Admin {stats?.total_admins === 8 ? '(Max reached)' : ''}
                  </SelectItem>
                  <SelectItem value="executive_admin" disabled={roleCounts.executive_admin >= 4}>
                    Executive Admin {roleCounts.executive_admin >= 4 ? '(Max reached)' : ''}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Promoted for excellent platform contribution..."
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
                setSelectedRole('');
                setAssignReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && handleAssignRole(selectedUser.id, selectedRole)}
              disabled={actionLoading || !selectedRole}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}