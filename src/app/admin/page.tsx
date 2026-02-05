"use client";

import React from 'react';
import AdminDashboard from './AdminDashboard';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

export default function AdminPage() {
  return (
    <AdminLayoutWrapper>
      <AdminDashboard
        userName="Administrator"
      />
    </AdminLayoutWrapper>
  );
}
