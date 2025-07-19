'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FiCheck, FiMapPin, FiStar, FiUsers, FiClock, FiCalendar, FiArrowLeft, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import {useCountry} from '@/context/CountryContext';

interface TimeSlot {
  start: string;
  end: string;
  price: number;
}

interface DayPricing {
  isWeekend: boolean;
  timeSlots: TimeSlot[];
}

interface Equipment {
  id: string;
  name_en: string;
  name_ar: string;
  quantity: number;
}

interface FacilityDetails {
  rules_ar: string[];
  rules_en: string[];
  equipment: Equipment[];
  dimensions: {
    width: number;
    length: number;
  };
  field_type: string;
  max_capacity: number;
  surface_type_ar: string;
  surface_type_en: string;
  custom_field_type_ar: string;
  custom_field_type_en: string;
  custom_surface_type_ar: string;
  custom_surface_type_en: string;
}

interface SportType {
  name_en: string;
  name_ar: string;
  pricing: {
    [key: string]: DayPricing;
  };
  facility: FacilityDetails;
}

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
  facility_description_en: string;
  facility_description_ar: string;
  owner_id: string;
  facility_type: string;
  address_en: string;
  address_ar: string;
  country_id: string;
  city_id: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  featured_until?: string | null;
  verification_status?: string;
  photos: Photo[];
  sport_types: SportType[];
  capacity?: number;
  rating?: number;
  review_count?: number;
  currency?: string;
  amenities_en?: string[];
  amenities_ar?: string[];
  rules_en?: string[];
  rules_ar?: string[];
  city?: {
    name_en: string;
    name_ar: string;
  };
  country?: {
    name_en: string;
    name_ar: string;
  };
  is_active?: boolean;
  is_featured?: boolean;
  featured_priority?: number;
  created_at?: string;
  updated_at?: string;
}

const supabase = createClientComponentClient();

export default function FacilityDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const {currentCountry} = useCountry();

  // Effect to check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Auth state is managed by AuthContext
      }
    };
    checkAuth();
  }, []);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState<SportType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchFacility();
  }, [id]);

  useEffect(() => {
    if (facility && selectedSportType && selectedDate) {
      const slots = generateTimeSlots();
      if (slots && slots.length > 0) {
        setAvailableTimeSlots(slots);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [facility, selectedSportType, selectedDate]);

  useEffect(() => {
    if (facility && selectedSportType && selectedTimeSlot) {
      const price = calculateTotalPrice();
      setTotalPrice(price);
    }
  }, [facility, selectedSportType, selectedTimeSlot, duration]);

  const fetchFacility = async () => {
    setLoading(true);
    try {
      // First, fetch the facility data
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .select(`
          *,
          facility_name_en,
          facility_name_ar,
          facility_description_en,
          facility_description_ar,
          amenities_en,
          amenities_ar,
          rules_en,
          rules_ar,
          country:countries(name_en, name_ar),
          city:cities(name_en, name_ar)
        `)
        .eq('id', id)
        .eq('verification_status', 'approved')
        .eq('is_active', true)
        .single();

      if (facilityError) throw facilityError;

      if (!facility) {
        setFacility(null);
        return;
      }

      // Then, fetch the photos for this facility
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('facility_id', id)
        .order('is_main', { ascending: false }) // Main photo first
        .order('created_at', { ascending: true }); // Then by creation date

      if (photosError) throw photosError;

      setFacility({
        ...facility,
        photos: photos || [],
        sport_types: facility.sport_types || [],
        amenities_en: facility.amenities_en || [],
        amenities_ar: facility.amenities_ar || [],
        rules_en: facility.rules_en || [],
        rules_ar: facility.rules_ar || [],
        country: facility.country?.[0] || { name_en: '', name_ar: '' },
        city: facility.city?.[0] || { name_en: '', name_ar: '' },
      } as Facility);
    } catch (error) {
      console.error('Error fetching facility:', error);
      setFacility(null);
    } finally {
      setLoading(false);
    }
  };

  const splitTimeSlotToHourRanges = (slot: TimeSlot): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startTime = new Date(`2000-01-01T${slot.start}`);
    const endTime = new Date(`2000-01-01T${slot.end}`);
    
    // Calculate total hours between start and end
    const hoursDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Create slots for each hour
    for (let i = 0; i < Math.floor(hoursDiff); i++) {
      const slotStart = new Date(startTime.getTime() + (i * 60 * 60 * 1000));
      const slotEnd = new Date(startTime.getTime() + ((i + 1) * 60 * 60 * 1000));
      slots.push({
        start: slotStart.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        end: slotEnd.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        price: slot.price, // Price per hour remains the same
      });
    }
    
    return slots;
  };

  const generateTimeSlots = () => {
    if (!facility || !selectedSportType) return;

    // Get the day name in lowercase
    const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayPricing = selectedSportType.pricing[dayName];
    
    if (!dayPricing) return;

    // Split each time slot into hour ranges
    let availableSlots: TimeSlot[] = [];
    dayPricing.timeSlots.forEach(slot => {
      availableSlots = [...availableSlots, ...splitTimeSlotToHourRanges(slot)];
    });

    // Sort slots by start time
    availableSlots.sort((a, b) => a.start.localeCompare(b.start));

    // Filter out past time slots if it's today
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (selectedDate === today) {
      availableSlots = availableSlots.filter(slot => slot.start > currentTime);
    }

    return availableSlots;
  };

  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slotStart = e.target.value;
    const timeSlot = availableTimeSlots.find(slot => slot.start === slotStart) || null;
    setSelectedTimeSlot(timeSlot);
  };

  const calculateTotalPrice = (): number => {
    if (!selectedTimeSlot || !duration) return 0;
    return selectedTimeSlot.price * duration;
  };

  const handleBooking = async () => {
    if (!facility || !selectedSportType || !selectedTimeSlot || !user) return;

    try {
      // Convert time strings to proper time format
      const startTime = selectedTimeSlot.start;
      const endTime = selectedTimeSlot.end;
      
      // Calculate total price
      const basePrice = selectedTimeSlot.price;
      const totalPrice = calculateTotalPrice();

      const { error } = await supabase
        .from('bookings')
        .insert({
          facility_id: facility.id,
          user_id: user.id,
          booking_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration * 60, // Convert hours to minutes
          sport_type: selectedSportType.name_en,
          number_of_players: playerCount,
          base_price: basePrice,
          total_price: totalPrice,
          currency: facility.currency,
          payment_status: 'pending',
          status: 'pending',
          equipment_rentals: [], // Default empty equipment rentals
          special_requests: '', // Empty special requests for now
          player_names: [] // Empty player names for now
        });

      if (error) throw error;

      alert(t('bookingSuccess'));
      router.push('/bookings');
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error creating booking:', err.message);
      } else {
        console.error('Error creating booking:', err);
      }
      alert(t('bookingError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFAA]"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">{t('facilityNotFound')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('facilityNotFoundDesc')}</p>
        <Link
          href={`/${currentCountry?.code.toLowerCase()}/facilities`}
          className="bg-[#00FFAA] hover:bg-[#00E699] text-black px-6 py-2 rounded-lg transition-colors"
        >
          {t('backToFacilities')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 dark:text-white">
      {/* Back Button */}
      <Link href={`/${currentCountry?.code.toLowerCase()}/facilities`} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6">
        <FiArrowLeft className="mr-2" /> {t('backToFacilities')}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
          {/* Facility Details */}
          <div className="lg:w-2/3">
          {/* Facility Images */}
            <div className="space-y-4">
              {/* Main Image Carousel */}
              <div className="relative group">
                <div className="relative rounded-lg overflow-hidden" style={{ paddingBottom: '60%' }}>
                  {facility.photos?.length > 0 ? (
                    <div 
                      className="absolute inset-0 flex transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                    >
                      {facility.photos.map((photo, index) => (
                        <div 
                          key={photo.id}
                          className="w-full flex-shrink-0 relative"
                          style={{ flex: '0 0 100%' }}
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsViewerOpen(true);
                          }}
                        >
                          <Image
                            src={photo.url}
                            alt={`${facility[`facility_name_${language}`]} - ${index + 1}`}
                            fill
                            className="object-cover cursor-zoom-in"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <span className="text-gray-400 dark:text-gray-300 text-lg">{t('No Images Available')}</span>
                    </div>
                  )}
                </div>

                {/* Navigation Arrows */}
                {facility.photos && facility.photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => (prev - 1 + facility.photos.length) % facility.photos.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t('Previous image')}
                    >
                      <FiChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => (prev + 1) % facility.photos.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t('Next image')}
                    >
                      <FiChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {facility.photos && facility.photos.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {facility.photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`${t('Go to image')} ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {facility.photos && facility.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {facility.photos.map((photo, index) => (
                    <div 
                      key={photo.id}
                      className={`flex-shrink-0 w-24 h-18 rounded-md overflow-hidden border-2 transition-colors cursor-pointer relative ${
                        index === currentImageIndex 
                          ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700' 
                          : 'border-transparent hover:border-blue-300 dark:border-gray-600 dark:hover:border-blue-700'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <div className="relative w-full h-0 pb-[75%]">
                        <Image
                          src={photo.url}
                          alt={`${facility[`facility_name_${language}`]} - ${index + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Viewer Modal */}
            {isViewerOpen && facility.photos && facility.photos.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                <button 
                  onClick={() => setIsViewerOpen(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                  <FiX size={32} />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => (prev - 1 + facility.photos.length) % facility.photos.length);
                  }}
                  className="absolute left-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 z-10"
                >
                  <FiChevronLeft size={32} />
                </button>
                
                <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center">
                  <Image
                    src={facility.photos[currentImageIndex].url}
                    alt={`${facility[`facility_name_${language}`]} - ${currentImageIndex + 1}`}
                    fill
                    className="object-contain cursor-zoom-out"
                    onClick={() => setIsViewerOpen(false)}
                    priority
                  />
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => (prev + 1) % facility.photos.length);
                  }}
                  className="absolute right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                >
                  <FiChevronRight size={32} />
                </button>
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {facility.photos.length}
                  </div>
                </div>
              </div>
            )}

            {/* Facility Info */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{facility[`facility_name_${language}`]}</h1>
              <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-4 gap-4">
                <div className="flex items-center">
                  <FiStar className="text-yellow-400 mr-1" />
                  <span>{(facility.rating || 0).toFixed(1)} ({facility.review_count || 0} {t('reviews')})</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-1" />
                  <span>{facility[`address_${language}`]}</span>
                </div>
                {facility.sport_types?.[0]?.facility?.max_capacity && (
                  <div className="flex items-center">
                    <FiUsers className="mr-1" />
                    <span>{facility.sport_types[0].facility.max_capacity} {t('players')}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {facility[`facility_description_${language}`]}
              </p>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">{t('amenities')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {facility[`amenities_${language}`]?.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <FiCheck className="text-green-500 mr-2" />
                      <span>{amenity}</span>
                    </div>
                  )) || <p className="text-gray-500">{t('noAmenities')}</p>}
                </div>
              </div>

            {/* Rules */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('rules')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {facility[`rules_${language}`]?.map((rule, index) => (
                  <div key={index} className="flex items-center">
                    <FiCheck className="text-green-500 mr-2" />
                    <span>{rule}</span>
                  </div>
                )) || <p className="text-gray-500">{t('noRules')}</p>}
              </div>
            </div>
            {/* Location Map */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">{t('location')}</h2>
              <div className="h-[400px] w-full rounded-lg overflow-hidden mb-4">
                {facility.location ? (
                  <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={{
                        lat: facility.location.latitude,
                        lng: facility.location.longitude
                      }}
                      zoom={15}
                    >
                      <Marker
                        position={{
                          lat: facility.location.latitude,
                          lng: facility.location.longitude
                        }}
                        title={facility[`facility_name_${language}`]}
                      />
                    </GoogleMap>
                  </LoadScript>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <p className="text-gray-500">{t('noLocation')}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiMapPin className="mr-2" />
                <span>{facility[`address_${language}`]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-20">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('bookSession')}</h2>
            
            <div className="grid grid-cols-1 gap-2 mb-4">
              {/* Sport Type Selection */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiStar className="inline mr-2 ml-2" />
                    {t('sportType')}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedSportType?.name_en || ''}
                    onChange={(e) => {
                      const sportType = facility.sport_types.find(st => st.name_en === e.target.value);
                      // Reset dependent fields when sport type changes
                      setSelectedDate('');
                      setSelectedTimeSlot(null);
                      setDuration(1);
                      setPlayerCount(1);
                      setSelectedSportType(sportType || null);
                    }}
                  >
                    <option value="">{t('selectSportType')}</option>
                    {facility.sport_types.map((st) => (
                      <option key={st.name_en} value={st.name_en}>
                        {st[`name_${language}`]}
                      </option>
                    ))}
                  </select>
                </div>

              {/* Date Selection */}
              <div>
                  <label className="block text-sm font-medium mb-2 mt-2">
                    <FiCalendar className="inline mr-2 ml-2" />
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      // Reset dependent fields when date changes
                      setSelectedTimeSlot(null);
                      setDuration(1);
                      setPlayerCount(1);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={!selectedSportType}
                  />
                </div>


              {/* Time Slot Selection */}
              <div>
                  <label className="block text-sm font-medium mb-2 mt-2">
                    <FiClock className="inline mr-2 ml-2" />
                    {t('timeSlot')}
                  </label>
                  <select
                    className="w-full p-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedTimeSlot?.start || ''}
                    onChange={(e) => {
                      handleTimeSlotChange(e);
                      // Reset dependent fields when time slot changes
                      setDuration(1);
                      setPlayerCount(1);
                    }}
                    disabled={!selectedSportType || !selectedDate}
                  >
                    <option value="">{t('selectTimeSlot')}</option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.start} value={slot.start}>
                        {slot.start} - {slot.end}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2 mt-2">
                    <FiClock className="inline mr-2 ml-2" />
                    {t('duration')} ({t('hours')})
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    value={duration}
                    onChange={(e) => {
                      setDuration(Math.max(1, parseInt(e.target.value) || 1));
                      // Reset player count when duration changes
                      setPlayerCount(1);
                    }}
                    min={1}
                    max={10}
                    disabled={!selectedSportType || !selectedDate || !selectedTimeSlot}
                  />
                </div>

                {/* Player Count */}
                <div>
                  <label className="block text-sm font-medium mb-2 mt-2">
                    <FiUsers className="inline mr-2 ml-2" />
                    {t('playerCount')}
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                    min={1}
                    max={facility.capacity || 30}
                    disabled={!selectedSportType || !selectedDate || !selectedTimeSlot || !duration}
                  />
                </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <span className="font-medium">{t('totalPrice')}</span>
                <span className="text-xl font-bold">{calculateTotalPrice()} {facility.currency}</span>
              </div>

              {authLoading ? (
                <div className="w-full py-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm">Checking authentication...</p>
                </div>
              ) : user ? (
                <button
                  onClick={handleBooking}
                  disabled={!selectedSportType || !selectedTimeSlot}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('book_now')}
                </button>
              ) : (
                <div>
                  <Link
                    href="/auth/login"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
                  >
                    {t('loginToBook')}
                  </Link>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {t('loginRequiredMessage')} <Link href="/auth/login" className="text-blue-600 hover:underline">{t('login')}</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
