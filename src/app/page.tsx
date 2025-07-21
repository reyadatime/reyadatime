'use client';

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { FiSearch, FiCalendar, FiMapPin, FiArrowRight, FiStar, FiClock, FiUsers, FiDownload } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/ui/Button';
import FacilityCard from '@/components/facility/FacilityCard';
import { useCountry } from '@/context/CountryContext';

export default function Home() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentCountry } = useCountry();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.append('search', searchTerm);
    if (selectedLocation) queryParams.append('location', selectedLocation);
    if (selectedDate) queryParams.append('date', selectedDate);
    
    router.push(`/${currentCountry?.code?.toLowerCase()}/facilities`);
  };
  
  // Mock data for featured facilities
  const featuredFacilities = [
    {
      id: '1',
      facility_name_en: 'Al Sadd Sports Club',
      facility_name_ar: 'نادي السد الرياضي',
      facility_description_en: 'Premium sports facility with multiple fields',
      facility_description_ar: 'منشأة رياضية فاخرة مع ملاعب متعددة',
      owner_id: '',
      facility_type: 'stadium',
      address_en: 'Al Waab Street, Doha',
      address_ar: 'شارع الوعب، الدوحة',
      country_id: 'QA',
      city_id: 'doha',
      location: { latitude: 25.2667, longitude: 51.5167 },
      featured_until: null,
      verification_status: 'verified',
      photos: [{ id: '1', url: '/facilities/facility1.jpg', is_main: true, created_at: new Date().toISOString() }],
      sport_types: [
        {
          name_en: 'Football',
          name_ar: 'كرة القدم',
          pricing: {},
          facility: {
            rules_ar: [],
            rules_en: [],
            equipment: [],
            dimensions: { width: 0, length: 0 },
            field_type: 'grass',
            max_capacity: 22,
            surface_type_ar: 'عشب طبيعي',
            surface_type_en: 'Natural Grass',
            custom_field_type_ar: '',
            custom_field_type_en: '',
            custom_surface_type_ar: '',
            custom_surface_type_en: ''
          }
        }
      ],
      capacity: 22,
      rating: 4.8,
      review_count: 124,
      currency: 'QAR',
      amenities_en: ['Parking', 'Showers', 'Changing Rooms'],
      amenities_ar: ['موقف سيارات', 'دش', 'غرف تغيير الملابس'],
      rules_en: [],
      rules_ar: [],
      city: { name_en: 'Doha', name_ar: 'الدوحة' },
      country: { name_en: 'Qatar', name_ar: 'قطر' }
    },
    // Add more mock facilities as needed
  ];

  // Sport types for quick navigation
  const sportTypes = [
    { id: 'football', name: t('football'), icon: '⚽' },
    { id: 'basketball', name: t('basketball'), icon: '🏀' },
    { id: 'volleyball', name: t('volleyball'), icon: '🏐' },
    { id: 'tennis', name: t('tennis'), icon: '🎾' },
    { id: 'padel', name: t('padel'), icon: '🎮' },
    { id: 'swimming', name: t('swimming'), icon: '🏊' },
    { id: 'gym', name: t('gym'), icon: '💪' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden mb-12 min-h-[600px] flex items-center">
        {/* Soccer Field Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/soccer-field-football-vector_1214022-11424.png)',
          }}
        />
        {/* Black Fade Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        {/* Gradient Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FFAA]/20 via-transparent to-transparent"></div>
        <div className="relative z-10 py-16 px-6 md:py-44 md:px-12 text-white w-full backdrop-blur-sm">
          <div className={`max-w-3xl ${language === 'ar' ? 'mr-auto' : 'ml-0'} ${language === 'ar' ? 'md:mr-24' : 'md:ml-24'}`}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-2xl mb-10 max-w-2xl text-white/90">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-6">
              <Link href={`/${currentCountry?.code?.toLowerCase()}/facilities`}>
                <Button 
                  size="lg" 
                  className="px-10 py-6 bg-[#00ffaaae] hover:bg-[#00e6999d] text-slate-900 text-lg font-semibold shadow-lg"
                >
                  {t('exploreFacilities')}
                </Button>
              </Link>
              <Link href={`/${currentCountry?.code?.toLowerCase()}/auth/signup`}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-10 py-6 border-[#00FFAA]/40 text-[#00FFAA] hover:bg-[#00FFAA]/10 text-lg font-semibold"
                >
                  {t('getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-12 -mt-8 relative z-20">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('searchFacilities')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex-1 relative">
            <FiMapPin className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            <select 
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:bg-gray-700 dark:text-white"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">{t('location')}</option>
              <option value="doha">Doha</option>
              <option value="lusail">Lusail</option>
              <option value="al-wakrah">Al Wakrah</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <FiCalendar className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button type="submit" className="md:w-auto w-full py-3 px-6">{t('search')}</Button>
        </form>
      </section>

      {/* Sport Types */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold dark:text-white">{t('sportTypes')}</h2>
          <Link href={`/${currentCountry?.code?.toLowerCase()}/facilities`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm font-medium">
            {t('viewAll')} <FiArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-6">
          {sportTypes.map((sport) => (
            <Link 
              href={`/${currentCountry?.code?.toLowerCase()}/facilities?type=${sport.id}`} 
              key={sport.id}
              className="flex flex-col items-center p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md dark:shadow-gray-900/30 transition-all hover:scale-105 border border-gray-100 dark:border-gray-700"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-3">
                <span className="text-2xl">{sport.icon}</span>
              </div>
              <span className="text-sm font-medium text-center dark:text-white">{sport.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Facility section */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold dark:text-white">{t('featuredFacilities')}</h2>
          <Link href={`/${currentCountry?.code?.toLowerCase()}/facilities`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm font-medium">
            {t('viewAll')} <FiArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredFacilities.map((facility) => (
            <FacilityCard 
              key={facility.id} 
              facility={facility} 
              language={language}
              t={t}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 dark:text-white">{t('howItWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-blue-100 dark:bg-blue-900/50 z-0"></div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 relative z-10">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl font-bold mb-5">1</div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">{t('findFacility')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('findFacilityDesc')}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 relative z-10">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl font-bold mb-5">2</div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">{t('bookFacility')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('bookFacilityDesc')}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 relative z-10">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl font-bold mb-5">3</div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">{t('playGame')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('playGameDesc')}</p>
          </div>
        </div>
      </section>

      {/* Download App */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white rounded-xl overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('downloadApp')}</h2>
            <p className="mb-6 text-white/90">{t('downloadAppDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
                <FiDownload className="mr-2" /> App Store
              </button>
              <button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
                <FiDownload className="mr-2" /> Google Play
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-64 h-96">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-blue-500/20 to-transparent rounded-3xl border-4 border-white/20 overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">Reyada</div>
                  <div className="text-xl">Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="my-16">
        <h2 className="text-2xl font-bold mb-8 dark:text-white">{t('testimonials')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">"Reyada Time made booking football fields so easy! No more calling around or waiting for confirmation."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">AK</div>
              <div>
                <div className="font-medium dark:text-white">Ahmed K.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Doha</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">"I use Reyada Time weekly for my tennis matches. The facility selection is excellent and prices are reasonable."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">SM</div>
              <div>
                <div className="font-medium dark:text-white">Sara M.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Lusail</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-yellow-500" />
              <FiStar className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">"Great platform for finding and booking sports facilities. The mobile app makes it even more convenient."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">MR</div>
              <div>
                <div className="font-medium dark:text-white">Mohammed R.</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Al Wakrah</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
