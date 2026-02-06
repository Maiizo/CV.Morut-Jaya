'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from './AdminDashboard';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push('/login');
          return;
        }

        // Check if user has admin role
        if (data.user.role !== 'admin') {
          // Redirect non-admin users to user dashboard
          router.push('/user');
          return;
        }

        setUser(data.user);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayoutWrapper>
      <AdminDashboard userName={user.username || 'Administrator'} />
    </AdminLayoutWrapper>
  );
}
