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
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useIsMobile } from '@/components/ui/use-mobile';

interface AdminSidebarProps {
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export default function AdminSidebar({ 
  onLogout, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileMenuOpen = false,
  onToggleMobileMenu 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

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
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    // Close mobile menu after navigation
    if (isMobile && onToggleMobileMenu) {
      onToggleMobileMenu();
    }
  };

  // Mobile Bottom Navbar
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar with Menu Button */}
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex items-center justify-between shadow-lg z-50">
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-xs text-slate-400">CV Jaya Lestari Morut</p>
          </div>
          <Button
            onClick={onToggleMobileMenu}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-slate-700"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Slide-out Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 top-16"
              onClick={onToggleMobileMenu}
            />
            
            {/* Side Menu */}
            <div className="fixed top-16 right-0 bottom-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl z-50 overflow-y-auto">
              <nav className="py-4">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        w-full px-4 py-3 flex items-center gap-3 
                        transition-all duration-200
                        ${
                          isActive 
                            ? 'bg-blue-600 text-white border-l-4 border-blue-400' 
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent'
                        }
                      `}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.description}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
              
              {/* Logout Button */}
              <div className="p-4 border-t border-slate-700">
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-2">Logout</span>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Desktop Sidebar
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
      {/* Header with Collapse Button */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-xs text-slate-400">CV. Jaya Lestari Morut</p>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <Database className="h-6 w-6" />
          </div>
        )}
        
        {/* Collapse/Expand Button */}
        {onToggleCollapse && (
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-slate-700 h-8 w-8 ml-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
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
