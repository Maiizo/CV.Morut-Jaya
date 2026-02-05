"use client";

import React from 'react';
import AdminDashboard from './AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  return (
    <AdminDashboard
      userName="Administrator"
      onLogout={() => router.push('/')}
    />
  );
}
