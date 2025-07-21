'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Database } from '@/types/supabase';
import {useCountry} from '@/context/CountryContext';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BookingType = Database['public']['Tables']['bookings']['Row'] & {
  facility: Database['public']['Tables']['facilities']['Row'];
  number_of_players?: number;
  duration_minutes?: number;
};

interface BookingDisplayProps {
  id: string;
  user_id: string;
  facility_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  number_of_players: number;
  total_price: number;
  status: string;
  facility: {
    id: string;
    facility_name_en: string;
    facility_name_ar: string;
    address_en: string;
    address_ar: string;
    currency: string;
  };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const {currentCountry} = useCountry();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchBookings();
  }, [user, authLoading, activeTab]);

  const fetchBookings = async () => {
    if (!user) {
      setError(t('You must be logged in to view your bookings'));
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(id, facility_name_en, facility_name_ar, address_en, address_ar, currency)
        `)
        .eq('user_id', user.id)
        .or(
          // For upcoming tab, show all future bookings and pending bookings
          activeTab === 'upcoming' 
            ? `booking_date.gte.${today.toISOString().split('T')[0]},status.eq.pending`
            // For past tab, show completed or cancelled bookings that are in the past
            : `and(booking_date.lt.${today.toISOString().split('T')[0]},status.in.(${['completed', 'cancelled_by_user', 'cancelled_by_facility', 'no_show'].join(',')}))`
        )
        .order('booking_date', { ascending: activeTab === 'upcoming' })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Filter out any cancelled or completed bookings from the upcoming tab
      const filteredBookings = activeTab === 'upcoming'
        ? (bookingsData || []).filter(booking => 
            booking.status === 'pending' || 
            booking.status === 'confirmed' ||
            booking.status === 'checked_in'
          )
        : (bookingsData || []);

      setBookings(filteredBookings as BookingType[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('Failed to load bookings'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_user' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('Booking cancelled'));
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('Error cancelling booking'));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';

    return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingStatusText = (status: BookingType['status'], lang: string) => {
    switch (status) {
      case 'pending':
        return lang === 'en' ? 'Pending' : 'قيد الانتظار';
      case 'confirmed':
        return lang === 'en' ? 'Confirmed' : 'مؤكد';
      case 'cancelled_by_user':
        return lang === 'en' ? 'Cancelled by User' : 'ملغى من قبل المستخدم';
      case 'cancelled_by_facility':
        return lang === 'en' ? 'Cancelled by Facility' : 'ملغى من قبل المنشأة';
      default:
        return status;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-SA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: BookingType['status']) => {
    if (!status) return '';

    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled_by_user':
      case 'cancelled_by_facility':
      case 'cancelled_by_user':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading || authLoading) {
    return <div>{t('Loading...')}</div>;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <FiX className="text-6xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('Error')}</h1>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
        <h1 className="text-3xl font-bold">{language === 'en' ? 'My Bookings' : 'حجوزاتي'}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">{language === 'en' ? 'Total Bookings' : 'إجمالي الحجوزات'}</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{bookings.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">{language === 'en' ? 'Active Bookings' : 'الحجوزات النشطة'}</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {bookings.filter(b => !['cancelled_by_user', 'cancelled_by_facility'].includes(b.status)).length}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 justify-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
          <button
            className={`py-2 px-6 rounded-lg font-medium transition-all ${activeTab === 'upcoming'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            onClick={() => setActiveTab('upcoming')}
          >
            {language === 'en' ? 'Upcoming' : 'القادمة'}
          </button>
          <button
            className={`py-2 px-6 rounded-lg font-medium transition-all ${activeTab === 'past'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            onClick={() => setActiveTab('past')}
          >
            {language === 'en' ? 'Past' : 'السابقة'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <img 
            src="/illustrations/no-bookings.svg" 
            alt="No Bookings" 
            className="mx-auto mb-6 w-64 h-64"
          />
          <p className="text-xl text-gray-600 dark:text-gray-400">{language === 'en' ? 'No bookings found' : 'لم يتم العثور على حجوزات'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/${currentCountry?.code.toLowerCase()}/bookings/${booking.id}`}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700">
              
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {language === 'en' ? booking.facility.facility_name_en : booking.facility.facility_name_ar}
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getBookingStatusText(booking.status, language)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FiMapPin className="flex-shrink-0 text-blue-500" />
                      {language === 'en' ? booking.facility.address_en : booking.facility.address_ar}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FiUsers className="flex-shrink-0 text-blue-500" /> {booking.number_of_players || '-'} {language === 'en' ? 'players' : 'لاعبين'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FiClock className="flex-shrink-0 text-blue-500" /> {booking.duration_minutes || '-'} {language === 'en' ? 'minutes' : 'دقيقة'}
                    </p>
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <FiCalendar className="text-blue-500 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'Date' : 'تاريخ'}</div>
                      <div className="font-medium">{formatDate(booking.booking_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <FiClock className="text-blue-500 text-xl" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'Time' : 'الوقت'}</div>
                      <div className="font-medium">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {booking.total_price} {booking.facility.currency}
                  </div>
                  {activeTab === 'upcoming' && !['cancelled_by_user', 'cancelled_by_facility', 'confirmed'].includes(booking.status) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="flex items-center gap-2 hover:bg-red-600"
                    >
                      <FiX className="text-lg" />
                      {language === 'en' ? 'Cancel Booking' : 'إلغاء الحجز'}
                    </Button>
                  )}
                </div>
            </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
