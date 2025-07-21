'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCountry } from '@/context/CountryContext';

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const { currentCountry } = useCountry();
  // Mock data - replace with actual data from your API
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
  ];

  const facilityStats = [
    { name: { en: 'Football Field', ar: 'ملعب كرة القدم' }, value: 65 },
    { name: { en: 'Tennis Court', ar: 'ملعب التنس' }, value: 25 },
    { name: { en: 'Basketball Court', ar: 'ملعب كرة السلة' }, value: 10 },
  ];

  const kpis = [
    { name: { en: 'Total Revenue', ar: 'إجمالي الإيرادات' }, value: '$24,780', change: '+12.5%', changeType: 'positive' },
    { name: { en: 'Total Bookings', ar: 'إجمالي الحجوزات' }, value: '1,245', change: '+8.2%', changeType: 'positive' },
    { name: { en: 'Occupancy Rate', ar: 'نسبة الاستضافة' }, value: '78%', change: '+5.1%', changeType: 'positive' },
    { name: { en: 'Cancellation Rate', ar: 'نسبة الإلغاء' }, value: '12%', change: '-2.3%', changeType: 'negative' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{language === 'en' ? 'Analytics' : 'تحليلات'}</h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Track your facility\'s performance and gain insights' : 'تتبع أداء مراكزك وتحصل على معلومات.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.name[language as keyof typeof kpi.name]}
              </CardTitle>
              <div className={`text-xs font-medium ${
                kpi.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
              }`}>
                {kpi.change}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Revenue Overview' : 'نظرة عامة على الإيرادات'}</CardTitle>
            <CardDescription>{language === 'en' ? 'Monthly revenue for the last 7 months' : 'إيرادات شهرية لمدة 7 أشهر'}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <LineChart className="mx-auto h-12 w-12 mb-2" />
              <p>{language === 'en' ? 'Revenue chart will be displayed here' : ' سيتم عرض الرسم البياني هنا'}</p>
              <p className="text-xs text-muted-foreground">
                (Mock data: {revenueData.map(d => `${d.name}: $${d.value}`).join(', ')})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Booking Distribution' : 'توزيع الحجوزات'}</CardTitle>
            <CardDescription>{language === 'en' ? 'Bookings by facility' : 'الحجوزات حسب المبنى'}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <PieChart className="mx-auto h-12 w-12 mb-2" />
              <p>{language === 'en' ? 'Pie chart will be displayed here' : ' سيتم عرض الرسم البياني هنا'}</p>
              <p className="text-xs text-muted-foreground">
                (Mock data: {facilityStats.map(d => `${d.name}: ${d.value}%`).join(', ')})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'en' ? 'Recent Activity' : 'النشاطات الأخيرة'}</CardTitle>
          <CardDescription>{language === 'en' ? 'Latest actions and events' : 'أحدث الأنشطة والفعاليات'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                  <BarChart className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'en' ? 'New booking for Football Field 1' : 'جديد الحجز لملعب كرة القدم 1'}</p>
                  <p className="text-sm text-muted-foreground"> 
                    {i} hour{i !== 1 ? 's' : ''} {language === 'en' ? 'ago' : 'منذ'} • Ahmed M. booked for 2 hours
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {language === 'en' ? '$' : 'ر'}{(i * 50) + 100}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
