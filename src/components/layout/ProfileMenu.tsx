'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCountry } from '@/context/CountryContext';
import { useRouter, usePathname } from 'next/navigation';
import { FiUser, FiSettings, FiBell, FiLogOut, FiLogIn, FiUserPlus, FiHome, FiUsers, FiShield } from 'react-icons/fi';

export default function ProfileMenu() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { currentCountry } = useCountry();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // Navigation items with requiresCountry flag
  const navItems = [
    {
      label: t('profile'),
      path: '/profile',
      icon: <FiUser className="w-4 h-4 mr-2" />,
      requiresCountry: false
    },
    {
      label: t('settings'),
      path: '/settings',
      icon: <FiSettings className="w-4 h-4 mr-2" />,
      requiresCountry: false
    },
    {
      label: t('notifications'),
      path: '/notifications',
      icon: <FiBell className="w-4 h-4 mr-2" />,
      requiresCountry: false
    },
    {
      label: t('admin'),
      path: '/admin',
      icon: <FiShield className="w-4 h-4 mr-2" />,
      requiresCountry: false,
      adminOnly: true
    },
    {
      label: t('logout'),
      path: '/logout',
      icon: <FiLogOut className="w-4 h-4 mr-2" />,
      requiresCountry: false,
      isAction: true,
      action: () => signOut().then(() => router.push('/'))
    }
  ];
  
  // Auth navigation items
  const authNavItems = [
    {
      label: t('login'),
      path: '/auth/login',
      icon: <FiLogIn className="w-4 h-4 mr-2" />,
      requiresCountry: false
    },
    {
      label: t('signup'),
      path: '/auth/signup',
      icon: <FiUserPlus className="w-4 h-4 mr-2" />,
      requiresCountry: false
    }
  ];

  useEffect(() => {
    console.log('Profile Menu - Current user:', user);
    console.log('Profile Menu - Current profile:', profile);
    console.log('Profile Menu - User role:', profile?.role);
  }, [user, profile]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    // Redirect to home after sign out
    router.push('/');
  };
  
  // Handle navigation with proper country code handling
  const handleNavigation = (item: any) => {
    setIsOpen(false);
    
    if (item.isAction && item.action) {
      item.action();
      return;
    }
    
    // For country-agnostic routes, use the path as-is
    if (!item.requiresCountry) {
      router.push(item.path);
      return;
    }
    
    // For country-specific routes, add the country code prefix
    if (currentCountry?.code) {
      const countryPrefix = `/${currentCountry.code.toLowerCase()}`;
      const path = item.path === '/' ? '' : item.path;
      router.push(`${countryPrefix}${path}`);
    } else {
      // Fallback to the path without country code if no country is set
      router.push(item.path);
    }
  };
  
  // Check if current path is active
  const isActive = (itemPath: string, requiresCountry: boolean = false) => {
    if (requiresCountry && currentCountry?.code) {
      // For country-specific routes, check both with and without country code
      const countryPath = `/${currentCountry.code.toLowerCase()}${itemPath === '/' ? '' : itemPath}`;
      return pathname === countryPath;
    }
    // For country-agnostic routes, check exact match
    return pathname === itemPath;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label={user ? 'Open profile menu' : 'Open auth menu'}
      >
        {user && user.profile_image_url ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={user.profile_image_url}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {user ? (
            <>
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              {navItems.map((item) => {
                // Skip admin items for non-admin users
                if (item.adminOnly && !['admin', 'super_admin'].includes(user?.role || '')) {
                  return null;
                }
                
                const active = isActive(item.path, item.requiresCountry);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item)}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      active 
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } transition-colors duration-200 text-left`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {authNavItems.map((item) => {
                const active = isActive(item.path, item.requiresCountry);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item)}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      active 
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } transition-colors duration-200 text-left`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
