'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useCountry } from '@/context/CountryContext';

const supabase = createClient();

interface Facility {
  id: string;
  facility_name_en: string;
  facility_name_ar: string;
  facility_type: string;
  status: 'active' | 'inactive' | 'maintenance';
  photos: Array<{ url: string; is_main: boolean }>;
  created_at: string;
  booking_count?: number;
}

export default function FacilitiesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentCountry } = useCountry();

  useEffect(() => {
    if (user) {
      fetchFacilities();
    }
  }, [user]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('facilities')
        .select(`
          *,
          photos (url, is_main)
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get booking counts for each facility
      const facilitiesWithBookings = await Promise.all(
        (data || []).map(async (facility) => {
          const { count, error: countError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('facility_id', facility.id);

          if (countError) {
            console.error('Error fetching booking count:', countError);
            return { ...facility, booking_count: 0 };
          }

          return { ...facility, booking_count: count || 0 };
        })
      );

      setFacilities(facilitiesWithBookings);
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError(
        language === 'en' 
          ? 'Failed to load facilities. Please try again later.'
          : 'فشل تحميل المنشآت. يرجى المحاولة مرة أخرى لاحقًا.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (facilityId: string) => {
    if (!confirm(
      language === 'en' 
        ? 'Are you sure you want to delete this facility?' 
        : 'هل أنت متأكد من رغبتك في حذف هذه المنشأة؟'
    )) return;

    try {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', facilityId);

      if (error) throw error;

      // Refresh the facilities list
      await fetchFacilities();
      toast.success(
        language === 'en' 
          ? 'Facility deleted successfully' 
          : 'تم حذف المنشأة بنجاح'
      );
    } catch (err) {
      console.error('Error deleting facility:', err);
      toast.error(
        language === 'en'
          ? 'Failed to delete facility'
          : 'فشل حذف المنشأة'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        text: language === 'en' ? 'Active' : 'نشط',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      inactive: {
        text: language === 'en' ? 'Inactive' : 'غير نشط',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      },
      maintenance: {
        text: language === 'en' ? 'Maintenance' : 'صيانة',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
    };

    const { text, className } = statusConfig[status as keyof typeof statusConfig] || 
      { text: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'en' ? 'My Facilities' : 'منشآتي'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'en' 
              ? 'Manage your sports facilities and their details' 
              : 'إدارة منشآتك الرياضية وتفاصيلها'}
          </p>
        </div>
        <Button 
          onClick={() => router.push(`/${countryCode.toLowerCase()}/dashboard/facilities/new`)}
          className="w-full md:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {language === 'en' ? 'Add Facility' : 'إضافة منشأة'}
        </Button>
      </div>

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">
              {language === 'en' ? 'No facilities yet' : 'لا توجد منشآت حتى الآن'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {language === 'en' 
                ? 'Get started by adding your first facility' 
                : 'ابدأ بإضافة منشأتك الأولى'}
            </p>
            <Button onClick={() => router.push('/dashboard/facilities/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === 'en' ? 'Add Facility' : 'إضافة منشأة'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {facilities.map((facility) => {
            const mainImage = facility.photos?.find(photo => photo.is_main)?.url || 
              (facility.photos?.length > 0 ? facility.photos[0].url : null);
            
            return (
              <Card key={facility.id} className="overflow-hidden">
                <div className="md:flex">
                  <div className="relative h-48 md:h-auto md:w-1/3 bg-gray-100 dark:bg-gray-800">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={language === 'en' ? facility.facility_name_en : facility.facility_name_ar}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <span>{language === 'en' ? 'No Image' : 'لا توجد صورة'}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {language === 'en' ? facility.facility_name_en : facility.facility_name_ar}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          {getStatusBadge(facility.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {facility.booking_count} {language === 'en' ? 'bookings' : 'حجز'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/${currentCountry?.code?.toLowerCase()}/dashboard/facilities/edit/${facility.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {language === 'en' ? 'Edit' : 'تعديل'}
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(facility.id)}
                          className="text-white bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {language === 'en' ? 'Delete' : 'حذف'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {language === 'en' ? 'Type' : 'النوع'}
                        </p>
                        <p className="font-medium">
                          {facility.facility_type || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {language === 'en' ? 'Created' : 'تاريخ الإنشاء'}
                        </p>
                        <p className="font-medium">
                          {new Date(facility.created_at).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'ar-SA',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${currentCountry?.code?.toLowerCase()}/dashboard/facilities/${facility.id}/bookings`)}
                      >
                        {language === 'en' ? 'View Bookings' : 'عرض الحجوزات'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${currentCountry?.code?.toLowerCase()}/facilities/${facility.id}`)}
                      >
                        {language === 'en' ? 'View Public Page' : 'عرض الصفحة العامة'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
