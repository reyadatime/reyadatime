'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';
import {useCountry} from '@/context/CountryContext';

const supabase = createClient();
import { Booking } from '@/types';

interface Photo {
  id: string;
  url: string;
  is_main: boolean;
  created_at: string;
}

interface Facility {
  id: string;
  facility_name_en: string;
  facility_name_ar: string;
  photos: Photo[];
  [key: string]: any; // For any other properties that might exist
}
import Button from '@/components/ui/Button';
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiDollarSign, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const {currentCountry} = useCountry();  
  const [booking, setBooking] = useState<(Booking & { facility: Facility }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError(t('You must be logged in to view booking details'));
      setLoading(false);
      return;
    }
    
    fetchBooking();
  }, [user, params.id]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          facility:facilities(
            *,
            photos(*)
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      setBooking(data);
      setLoading(false);
    } catch (err) {
      setError(t('Failed to fetch booking details'));
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      // In a real app, update in Supabase
      setBooking(prev => prev ? { ...prev, status: 'cancelled_by_user' } : null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) {
    return <div>{t('Loading...')}</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <FiAlertCircle className="text-6xl text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('Access Denied')}</h1>
        <p className="text-gray-600 text-center">{error}</p>
        {!user && (
          <Link href="/auth/login" className="mt-4 text-blue-500 hover:underline">
            {t('Go to Login')}
          </Link>
        )}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">{t('Booking not found')}</h2>
          <div className="mt-6">
            <Link href="/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg dark:bg-gray-800 border dark:border-gray-700 ${
        booking.status === 'confirmed' 
          ? 'bg-green-50 border border-green-200' 
          : booking.status === 'pending'
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          {booking.status === 'confirmed' ? (
            <FiCheckCircle className="h-6 w-6 text-green-500 mr-3" />
          ) : (
            <FiAlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
          )}
          <div>
            <h2 className="text-lg font-semibold">
              {booking.status === 'confirmed' && 'Booking Confirmed'}
              {booking.status === 'pending' && 'Booking Pending'}
              {booking.status === 'cancelled_by_user' && 'Booking Cancelled'}
            </h2>
            <p className="text-sm">
              {booking.status === 'confirmed' && 'Your booking has been confirmed. You\'re all set!'}
              {booking.status === 'pending' && 'Your booking is being processed.'}
              {booking.status === 'cancelled_by_user' && 'This booking has been cancelled.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden dark:border-gray-700 dark:border">
        {/* Facility Images */}
      <div className="relative group">
        <div className="relative rounded-t-lg overflow-hidden" style={{ paddingBottom: '60%' }}>
          {booking.facility.photos?.length > 0 ? (
            <div className="absolute inset-0">
              <Image
                src={booking.facility.photos.find(photo => photo.is_main)?.url || booking.facility.photos[0].url}
                alt={booking.facility[`facility_name_${language}`]}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-400 dark:text-gray-300 text-lg">{t('No Images Available')}</span>
            </div>
          )}
        </div>
      </div>

        {/* Booking Details */}
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">{booking.facility.facility_name_en}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center">
                <FiCalendar className="mr-3 text-blue-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">{t('date')}</p>
                  <p className="font-medium">{booking.booking_date}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiClock className="mr-3 text-green-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">{t('time')}</p>
                  <p className="font-medium">{booking.time_slot} ({booking.duration_minutes} mins)</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiUsers className="mr-3 text-purple-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">{t('players')}</p>
                  <p className="font-medium">{booking.number_of_players} players</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center">
                <FiMapPin className="mr-3 text-red-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">{t('location')}</p>
                  <p className="font-medium">{language === 'en' ? booking.facility.address_en : booking.facility.address_ar}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiDollarSign className="mr-3 text-yellow-500 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">{t('price')}</p>
                  <p className="font-medium">{booking.total_price} QAR</p>
                </div>
              </div>

              {booking.booking_details?.special_requests && (
                <div>
                  <p className="text-sm text-gray-500">{t('specialRequests')}</p>
                  <p className="font-medium">{booking.booking_details.special_requests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            {booking.status === 'confirmed' && (
              <Button 
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleCancelBooking}
              >
                {t('cancelBooking')}
              </Button>
            )}
            <Link href={`/${currentCountry?.code.toLowerCase()}/facilities/${booking.facility_id}`} className="flex-1">
              <Button 
                variant="outline"
                size="sm"
                className="w-full"
              >
                {t('viewFacility')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
