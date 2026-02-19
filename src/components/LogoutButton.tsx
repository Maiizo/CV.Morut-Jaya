'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export default function LogoutButton({ 
  className, 
  variant = 'outline',
  size = 'default',
  showIcon = true 
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={
        // Improve hover and spacing; if icon-only, render circular button
        `${size === 'icon' ? 'h-9 w-9 p-0 rounded-full flex items-center justify-center' : 'px-3 py-2'} transition-colors ${className || ''}`
      }
      title="Logout"
      aria-label="Logout"
    >
      {showIcon && <LogOut className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'}`} />}
      {size !== 'icon' && 'Logout'}
    </Button>
  );
}
