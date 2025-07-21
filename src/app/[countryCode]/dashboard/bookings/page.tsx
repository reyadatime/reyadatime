'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase-browser';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, CheckCircle2, XCircle, Clock4, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const supabase = createClient();

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'cancelled_by_user' | 'cancelled_by_facility' | 'no_show';
  total_price: number;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  facility: {
    id: string;
    facility_name_en: string;
    facility_name_ar: string;
  };
}

export default function FacilityBookingsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // First, get all facilities owned by the current user
      const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_id', user?.id);

      if (facilitiesError) throw facilitiesError;

      if (!facilities || facilities.length === 0) {
        setBookings([]);
        return;
      }

      const facilityIds = facilities.map(f => f.id);

      // First, get the bookings with facility data
      const { data: bookingsWithFacilities, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('facility_id', facilityIds);

      if (bookingsError) throw bookingsError;

      if (!bookingsWithFacilities || bookingsWithFacilities.length === 0) {
        setBookings([]);
        return;
      }

      // Get user IDs from the bookings
      const userIds = [...new Set(bookingsWithFacilities.map(b => b.user_id))];
      
      // Fetch user data using the auth.users table
      const { data: usersData, error: usersError } = await supabase
        .from('auth.users')
        .select('id, raw_user_meta_data')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Create a map of user data for quick lookup
      const usersMap = new Map(usersData?.map(user => [
        user.id, 
        { 
          id: user.id, 
          full_name: user.raw_user_meta_data?.full_name || 'User',
          email: user.raw_user_meta_data?.email || ''
        }
      ]) || []);

      // Fetch facility data in a single query
      const { data: facilitiesData, error: facilitiesDataError } = await supabase
        .from('facilities')
        .select('id, facility_name_en, facility_name_ar')
        .in('id', facilityIds);

      if (facilitiesDataError) throw facilitiesDataError;

      // Create a map of facility data for quick lookup
      const facilitiesMap = new Map(facilitiesData?.map(facility => [facility.id, facility]) || []);

      // Combine the data
      const bookingsData = bookingsWithFacilities.map(booking => ({
        ...booking,
        user: usersMap.get(booking.user_id) || { id: booking.user_id, full_name: 'Unknown User', email: '' },
        facility: facilitiesMap.get(booking.facility_id) || { 
          id: booking.facility_id, 
          facility_name_en: 'Unknown Facility', 
          facility_name_ar: 'منشأة غير معروفة' 
        }
      }));

      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(language === 'en' ? 'Failed to load bookings' : 'فشل تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh the bookings list
      await fetchBookings();
      toast.success(
        language === 'en' 
          ? `Booking ${status === 'confirmed' ? 'confirmed' : 'rejected'} successfully`
          : `تم ${status === 'confirmed' ? 'تأكيد' : 'رفض'} الحجز بنجاح`
      );
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to update booking status' 
          : 'فشل تحديث حالة الحجز'
      );
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.facility?.[`facility_name_${language}`]?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { 
        text: language === 'en' ? 'Confirmed' : 'مؤكد', 
        icon: CheckCircle2, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      },
      pending: { 
        text: language === 'en' ? 'Pending' : 'قيد الانتظار', 
        icon: Clock4, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
      completed: { 
        text: language === 'en' ? 'Completed' : 'مكتمل', 
        icon: CheckCircle2, 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      cancelled: { 
        text: language === 'en' ? 'Cancelled' : 'ملغي', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      cancelled_by_user: { 
        text: language === 'en' ? 'Cancelled by User' : 'ملغي من قبل المستخدم', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      cancelled_by_facility: { 
        text: language === 'en' ? 'Cancelled by Facility' : 'ملغي من قبل المنشأة', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      no_show: { 
        text: language === 'en' ? 'No Show' : 'لم يحضر', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      rejected: { 
        text: language === 'en' ? 'Rejected' : 'مرفوض', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      }
    };

    const { text, icon: Icon, className } = statusConfig[status as keyof typeof statusConfig] || 
      { text: status, icon: CheckCircle2, className: 'text-gray-500' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === 'en' ? 'My Bookings' : 'حجوزاتي'}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'en' 
              ? 'Manage your facility bookings' 
              : 'إدارة حجوزات منشأتك'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={language === 'en' ? 'Search bookings...' : 'ابحث في الحجوزات...'}
            className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{language === 'en' ? 'All Statuses' : 'جميع الحالات'}</option>
          <option value="pending">{language === 'en' ? 'Pending' : 'قيد الانتظار'}</option>
          <option value="confirmed">{language === 'en' ? 'Confirmed' : 'مؤكد'}</option>
          <option value="completed">{language === 'en' ? 'Completed' : 'مكتمل'}</option>
          <option value="cancelled">{language === 'en' ? 'Cancelled' : 'ملغي'}</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {language === 'en' ? 'All Bookings' : 'جميع الحجوزات'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'en' 
                ? 'No bookings found' 
                : 'لا توجد حجوزات'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {booking.facility?.[`facility_name_${language}`] || 'N/A'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.booking_date).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'ar-SA',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(`2000-01-01T${booking.start_time}`).toLocaleTimeString(
                            language === 'en' ? 'en-US' : 'ar-SA',
                            { hour: '2-digit', minute: '2-digit', hour12: true }
                          )} - {new Date(`2000-01-01T${booking.end_time}`).toLocaleTimeString(
                            language === 'en' ? 'en-US' : 'ar-SA',
                            { hour: '2-digit', minute: '2-digit', hour12: true }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        <span>{booking.user?.full_name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'en' ? 'Booking ID' : 'رقم الحجز'}: {booking.id.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'en' ? 'Total' : 'الإجمالي'}: {booking.total_price} {language === 'en' ? 'QAR' : 'ريال قطري'}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            disabled={updatingStatus[booking.id]}
                            className="flex items-center gap-1"
                          >
                            {updatingStatus[booking.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            {language === 'en' ? 'Confirm' : 'تأكيد'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'rejected')}
                            disabled={updatingStatus[booking.id]}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white"
                          >
                            {updatingStatus[booking.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            {language === 'en' ? 'Reject' : 'رفض'}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                      >
                        {language === 'en' ? 'View Details' : 'عرض التفاصيل'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
