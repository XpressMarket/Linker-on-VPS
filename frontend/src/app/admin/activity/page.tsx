'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { adminService } from '@/lib/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

export default function ActivityLogPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      loadLogs();
    }
  }, [authLoading, isAdmin, router]);

  async function loadLogs() {
    try {
      const data = await adminService.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    if (action.includes('delete')) return <Badge variant="destructive">{action}</Badge>;
    if (action.includes('pin')) return <Badge className="bg-yellow-500">{action}</Badge>;
    if (action.includes('assign') || action.includes('remove')) return <Badge className="bg-blue-500">{action}</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground mt-2">
            Recent admin actions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="font-medium">{log.admin_email}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.target_type && `Target: ${log.target_type}`}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}