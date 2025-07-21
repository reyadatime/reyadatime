'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, DollarSign } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCountry } from '@/context/CountryContext';


export default function DashboardPage() {
  const { language } = useLanguage();
  const { currentCountry } = useCountry();

  // Mock data - replace with actual data from your API
  const stats = [
    { title: { en: 'Total Bookings', ar: 'الحجوزات' }, value: '1234', icon: Calendar },
    { title: { en: 'Active Facilities', ar: 'المرافق' }, value: '5', icon: Users },
    { title: { en: 'Upcoming Bookings', ar: 'الحجوزات القادمة' }, value: '42', icon: Clock },
    { title: { en: 'Revenue (This Month)', ar: 'الإيرادات (هذا الشهر)' }, value: '$12345', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{language === 'en' ? 'Dashboard' : 'اللوحة التحكم'}</h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Welcome back! Here\'s what\'s happening with your facilities.' : 'مرحبا! هنا ما يحدث مع مراكزك.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title[language as keyof typeof stat.title]}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Recent Bookings' : 'الحجوزات الأخيرة'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{language === 'en' ? 'Football Field' : 'كرة القدم'}</p>
                    <p className="text-sm text-muted-foreground">{language === 'en' ? 'Today, 2:00 PM - 3:00 PM' : 'اليوم، 2:00 مساءً - 3:00 مساءً'}</p>
                  </div>
                  <span className="text-sm font-medium">{language === 'en' ? '$50' : '50$'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Quick Actions' : 'إجراءات سريعة'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors">
              {language === 'en' ? 'Add New Facility' : 'إضافة مبنى جديد'}
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors">
              {language === 'en' ? 'View All Bookings' : 'عرض جميع الحجوزات'}
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors">
              {language === 'en' ? 'Update Business Hours' : 'تحديث ساعات العمل'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
