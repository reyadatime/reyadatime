'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiSearch, FiCalendar, FiMail } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import ProfileMenu from './ProfileMenu';
import { useCountry } from '@/context/CountryContext';

export default function MobileNavbar() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const pathname = usePathname();
  const { currentCountry } = useCountry();

  const navItems = [
    {
      label: t('home'),
      href: `/${currentCountry?.code?.toLowerCase()}`,
      icon: <FiHome className="h-6 w-6" />,
    },
    {
      label: t('facilities'),
      href: `/${currentCountry?.code?.toLowerCase()}/facilities`,
      icon: <FiSearch className="h-6 w-6" />,
      requiresCountry: true
    },
    {
      label: t('bookings'),
      href: `/${currentCountry?.code?.toLowerCase()}/bookings`,
      icon: <FiCalendar className="h-6 w-6" />,
      requiresCountry: true
    },
    {
      label: t('contact'),
      href: '/contact',
      icon: <FiMail className="h-6 w-6" />,
      requiresCountry: false
    },

  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden transition-colors duration-300">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // Skip rendering if country is required but not available
          if (item.requiresCountry && !currentCountry) return null;
          
          const href = item.requiresCountry 
            ? `/${currentCountry?.code?.toLowerCase()}${item.href}` 
            : item.href;
            
          const isActive = pathname === href;
          
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center w-full h-full">
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
}
