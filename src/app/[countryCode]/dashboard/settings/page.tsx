'use client';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, List, Trigger, Content } from '@/components/ui/tabs';

export default function SettingsPage() {
  const { language } = useLanguage();
  // Mock user data - replace with actual data from your API
  const userData = {
    name: 'Mohammed Ali',
    email: 'mohammed@example.com',
    phone: '+974 1234 5678',
    businessName: 'Sports Hub Qatar',
    businessType: 'Sports Facility',
    businessAddress: '123 Sports Street, Doha, Qatar',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{language === 'en' ? 'Settings' : 'الإعدادات'}</h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Manage your account and facility settings' : 'إدارة حسابك وتفاصيل مكتبك'}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <List className="w-full">
          <Trigger value="profile">{language === 'en' ? 'Profile' : 'الملف الشخصي'}</Trigger>
          <Trigger value="business">{language === 'en' ? 'Business' : 'الشغف'}</Trigger>
          <Trigger value="notifications">{language === 'en' ? 'Notifications' : 'الإشعارات'}</Trigger>
          <Trigger value="billing">{language === 'en' ? 'Billing' : 'الدفع'}</Trigger>
        </List>

        <Content value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Personal Information' : 'معلومات شخصية'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Update your personal information and contact details' : 'تحديث معلوماتك الشخصية وتفاصيل الاتصال'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{language === 'en' ? 'Full Name' : 'الاسم الكامل'}</Label>
                  <Input id="name" defaultValue={userData.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</Label>
                  <Input id="email" type="email" defaultValue={userData.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{language === 'en' ? 'Phone Number' : 'رقم الهاتف'}</Label>
                  <Input id="phone" defaultValue={userData.phone} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button>{language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}</Button>
              </div>
            </CardContent>
          </Card>
        </Content>

        <Content value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Business Information' : 'معلومات الأعمال'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Update your business details and contact information' : 'تحديث معلوماتك التجارية وتفاصيل الاتصال'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{language === 'en' ? 'Business Name' : 'اسم العمل'}</Label>
                    <Input id="businessName" defaultValue={userData.businessName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">{language === 'en' ? 'Business Type' : 'نوع العمل'}</Label>
                    <Input id="businessType" defaultValue={userData.businessType} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">{language === 'en' ? 'Business Address' : 'عنوان العمل'}</Label>
                  <Input id="businessAddress" defaultValue={userData.businessAddress} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button>{language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Business Hours' : 'ساعات العمل'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Set your facility\'s operating hours' : 'تعيين ساعات عمل مكتبك'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="w-32 font-medium">{day}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <Input type="time" defaultValue="09:00" className="w-32" />
                      <span>to</span>
                      <Input type="time" defaultValue="22:00" className="w-32" />
                      <div className="flex items-center space-x-2 ml-4">
                        <input type="checkbox" id={`${day.toLowerCase()}-closed`} className="h-4 w-4" />
                        <label htmlFor={`${day.toLowerCase()}-closed`} className="text-sm">Closed</label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-6">
                <Button>{language === 'en' ? 'Update Hours' : 'تحديث ساعات العمل'}</Button>
              </div>
            </CardContent>
          </Card>
        </Content>

        <Content value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Notification Preferences' : 'الإشعارات'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'Manage how you receive notifications' : 'إدارة كيفية تلقي الإشعارات'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">{language === 'en' ? 'Email Notifications' : 'الإشعارات'}</h3>
                <div className="space-y-4">
                  {[
                    { id: 'new-booking', label: 'New booking requests' },
                    { id: 'booking-updates', label: 'Booking updates and changes' },
                    { id: 'payments', label: 'Payment receipts and invoices' },
                    { id: 'promotions', label: 'Promotions and special offers' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <label htmlFor={item.id} className="text-sm font-medium">
                        {item.label}
                      </label>
                      <input
                        id={item.id}
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">{language === 'en' ? 'SMS Notifications' : 'الإشعارات'}</h3>
                <div className="space-y-4">
                  {[
                    { id: 'sms-booking', label: 'New booking confirmations' },
                    { id: 'sms-reminders', label: 'Booking reminders' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <label htmlFor={item.id} className="text-sm font-medium">
                        {item.label}
                      </label>
                      <input
                        id={item.id}
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button>{language === 'en' ? 'Save Preferences' : 'حفظ الإعدادات'}</Button>
              </div>
            </CardContent>
          </Card>
        </Content>

        <Content value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Billing Information' : 'معلومات الدفع'}</CardTitle>
              <CardDescription>
                {language === 'en' ? 'View and manage your subscription and payment methods' : 'عرض و إدارة طلباتك وطرق الدفع'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">{language === 'en' ? 'Current Plan' : 'الخطة الحالية'}</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Premium Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Next billing date: August 20, 2025' : 'تاريخ الدفع التالي: 20 أغسطس 2025'}
                      </p>
                    </div>
                    <Button variant="outline">{language === 'en' ? 'Change Plan' : 'تغيير الخطة'}</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">{language === 'en' ? 'Payment Methods' : 'طرق الدفع'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-12 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{language === 'en' ? 'VISA' : 'فيزا'}</span>
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <Button variant="outline" className="w-full">{language === 'en' ? 'Add Payment Method' : 'إضافة طريقة دفع'}</Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">{language === 'en' ? 'Billing History' : 'تاريخ الدفع'}</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{language === 'en' ? 'Premium Plan - Monthly' : 'خطة المدفوعة - شهري'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{language === 'en' ? '$49.99' : '49.99 $'}</p>
                        <p className="text-sm text-muted-foreground">Paid</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">{language === 'en' ? 'View All Invoices' : 'عرض جميع الفواتير'}</Button>
              </div>
            </CardContent>
          </Card>
        </Content>
      </Tabs>
    </div>
  );
}
