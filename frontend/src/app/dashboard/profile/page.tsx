'use client';

import { useAuthContext } from '@/components/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthContext();

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email Address</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium">{user.email}</p>
                {user.is_email_verified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Account Type</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={
                  user.role === 'super_admin' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  user.role === 'admin' ? 'bg-blue-500' :
                  'bg-gray-500'
                }>
                  {user.role === 'super_admin' ? 'Super Admin' :
                   user.role === 'admin' ? 'Admin' :
                   'User'}
                </Badge>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm mt-1">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Status</span>
            <Badge variant="outline" className="bg-green-50">Active</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member Since</span>
            <span>Member since joining</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}