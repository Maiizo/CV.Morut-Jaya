"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Database, 
  ListChecks, 
  FileText, 
  LogOut,
  ChevronLeft
} from 'lucide-react';

interface AdminSidebarProps {
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({ onLogout, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/admin',
      description: 'Ringkasan & Aktivitas'
    },
    {
      label: 'Master Data',
      icon: <Database className="h-5 w-5" />,
      path: '/admin/master-data',
      description: 'Kelola Data Master'
    },
    {
      label: 'Ringkasan Harian',
      icon: <FileText className="h-5 w-5" />,
      path: '/admin/ringkasan-harian',
      description: 'Laporan Harian'
    },
    {
      label: 'Manage Dropdowns',
      icon: <ListChecks className="h-5 w-5" />,
      path: '/admin/manage-dropdowns',
      description: 'Kelola Dropdown'
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div 
      className={`
        ${isCollapsed ? 'w-20' : 'w-64'} 
        bg-gradient-to-b from-slate-800 to-slate-900 
        text-white 
        transition-all duration-300 
        flex flex-col 
        h-screen 
        fixed 
        left-0 
        top-0 
        shadow-xl
        z-50
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-xs text-slate-400">CV Morut Jaya</p>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <Database className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full px-4 py-3 flex items-center gap-3 
                transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.description}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-slate-700">
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            className={`
              w-full 
              text-red-400 
              hover:text-red-300 
              hover:bg-red-900/20
              ${isCollapsed ? 'px-2' : ''}
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        )}
      </div>
    </div>
  );
}
