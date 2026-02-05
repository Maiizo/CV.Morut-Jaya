"use client";

import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useRouter } from 'next/navigation';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      {/* Main Content */}
      <div 
        className={`
          flex-1 
          ${isCollapsed ? 'ml-20' : 'ml-64'} 
          transition-all duration-300 
          overflow-y-auto
        `}
      >
        {children}
      </div>
    </div>
  );
}
