'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            // Redirect based on role
            if (data.user.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/user');
            }
            return;
          }
        }
        // Not authenticated, show welcome screen
        setIsChecking(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-2 border-gray-300 rounded-xl p-8 bg-white shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-sky-600 to-emerald-600 p-4 rounded-full">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-center mb-2">
            Sistem Kehadiran Pekerja
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Silakan login untuk melanjutkan
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-sky-700 to-sky-600 text-white hover:from-sky-800 hover:to-sky-700 h-12 text-base shadow-md"
            >
              Login
            </Button>
            
            <Button
              onClick={() => router.push('/signup')}
              variant="outline"
              className="w-full h-12 text-base"
            >
              Buat Akun Baru
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Aplikasi pencatatan kehadiran dan tugas untuk pekerja lapangan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
