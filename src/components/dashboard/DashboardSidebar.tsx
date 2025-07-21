'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Settings, BarChart, Building2} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountry } from '@/context/CountryContext';
import { useLanguage } from '@/context/LanguageContext';
type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const { currentCountry } = useCountry();
  const { language } = useLanguage();
  
  const navItems = [
    { 
      name: { en: 'Overview', ar: 'نظرة عامة' }, 
      href: '',
      icon: <Home className="h-5 w-5" />
    },
    { 
      name: { en: 'Facilities', ar: 'المرافق' }, 
      href: 'facilities',
      icon: <Building2 className="h-5 w-5" />
    },
    { 
      name: { en: 'Bookings', ar: 'الحجوزات' }, 
      href: 'bookings',
      icon: <Calendar className="h-5 w-5" />
    },
    { 
      name: { en: 'Analytics', ar: 'تحليلات' }, 
      href: 'analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    { 
      name: { en: 'Settings', ar: 'الإعدادات' }, 
      href: 'settings',
      icon: <Settings className="h-5 w-5" />
    },
  ].map(item => ({
    ...item,
    name: item.name[language as keyof typeof item.name],
    href: `/${currentCountry?.code.toLowerCase()}/dashboard/${item.href}`
  }));

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span>Reyada Time</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href ? 'bg-muted text-primary' : ''
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
