"use client";

import React from 'react';
import UserDashboard from './UserDashboard';
import { useRouter } from 'next/navigation';

export default function UserPage() {
  const router = useRouter();

  return (
    <UserDashboard
      userName="Pekerja"
      onLogout={() => router.push('/')}
    />
  );
}
