// frontend/src/app/(auth)/verify-email/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
    }
  }, [token]);

  async function verifyEmail(token: string) {
    try {
      await authService.verifyEmail(token);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <CardTitle>Verifying your email...</CardTitle>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>
                The verification link is invalid or has expired
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status !== 'loading' && (
          <CardContent>
            <Button
              onClick={() => router.push(status === 'success' ? '/login' : '/')}
              className="w-full"
            >
              {status === 'success' ? 'Go to login' : 'Go to home'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}