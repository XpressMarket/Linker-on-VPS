'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { adminService } from '@/lib/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldOff, Loader2 } from 'lucide-react';

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
  const { isSuperAdmin, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function handleAssignAdmin(userId: string) {
    setActionLoading(userId);
    setError('');
    
    try {
      await adminService.assignAdmin(userId);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign admin role');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveAdmin(userId: string) {
    setActionLoading(userId);
    setError('');
    
    try {
      await adminService.removeAdmin(userId);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove admin role');
    } finally {
      setActionLoading(null);
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground mt-2">
            Assign and remove admin roles
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.email}</p>
                      <Badge variant={
                        user.role === 'super_admin' ? 'default' :
                        user.role === 'admin' ? 'secondary' :
                        'outline'
                      }>
                        {user.role === 'super_admin' ? 'Super Admin' :
                         user.role === 'admin' ? 'Admin' :
                         'User'}
                      </Badge>
                      {user.is_email_verified && (
                        <Badge variant="outline" className="bg-green-50">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {user.role !== 'super_admin' && (
                    <div>
                      {user.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdmin(user.id)}
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
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssignAdmin(user.id)}
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
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No users found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}