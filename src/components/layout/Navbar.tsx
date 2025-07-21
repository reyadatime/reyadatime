'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiSearch, FiCalendar, FiMenu, FiMail, FiSun, FiMoon } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { useState } from 'react';
import Image from 'next/image';
import ProfileMenu from './ProfileMenu';
import dynamic from 'next/dynamic';

// Dynamically import CountrySelector to avoid SSR issues with browser APIs
const CountrySelector = dynamic(() => import('@/components/CountrySelector'), {
  ssr: false,
});

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const { currentCountry } = useCountry();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get base path with current country code (for reference only, not used in nav items)
  const getCountryPath = (path = '') => {
    const countryCode = currentCountry?.code?.toLowerCase();
    if (!countryCode) return ''; // Return empty string if no country code
    
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${countryCode}${cleanPath}`;
  };

  const navItems = [
    {
      label: t('home'),
      href: '/', // Will be prefixed with country code if requiresCountry is true
      icon: <FiHome className="h-5 w-5" />,
      requiresCountry: true
    },
    {
      label: t('facilities'),
      href: '/facilities',
      icon: <FiSearch className="h-5 w-5" />,
      requiresCountry: true
    },
    {
      label: t('bookings'),
      href: '/bookings',
      icon: <FiCalendar className="h-5 w-5" />,
      requiresCountry: true
    },
    {
      label: t('contact'),
      href: '/contact',
      icon: <FiMail className="h-5 w-5" />,
      requiresCountry: false
    },
  ];

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    // Keep the user on the same page when changing language
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/ReydatimeLogo.png"
                alt={t('appName')}
                width={400}
                height={400}
                className="h-20 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              // Skip rendering if country is required but not available
              if (item.requiresCountry && !currentCountry) return null;
              
              const href = item.requiresCountry 
                ? `/${currentCountry?.code?.toLowerCase()}${item.href === '/' ? '' : item.href}`
                : item.href;
                
              const isActive = pathname === href;
              
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2 rtl:mr-1">{item.label}</span>
                </Link>
              );
            })}

            {/* Become a Partner Button */}
            <Link
              href={`/${currentCountry?.code?.toLowerCase()}/partner-registration`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              {t('becomePartner')}
            </Link>

            {/* Country Selector */}
            <div className="hidden md:block">
              <CountrySelector />
            </div>

            {/* Language Toggle */}
            <button
              onClick={handleLanguageChange}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Profile Menu */}
            <ProfileMenu />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Language Toggle */}
            <button
              onClick={handleLanguageChange}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <span className="text-sm">{language === 'en' ? 'ع' : 'En'}</span>
            </button>

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none"
              aria-label="Toggle menu"
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navItems.map((item) => {
            // Skip rendering if country is required but not available
            if (item.requiresCountry && !currentCountry) return null;
            
            const href = item.requiresCountry 
              ? `/${currentCountry?.code?.toLowerCase()}${item.href === '/' ? '' : item.href}`
              : item.href;
              
            const isActive = pathname === href;
            
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
