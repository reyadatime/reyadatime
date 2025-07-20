import Link from 'next/link';
import { useState } from 'react';
import { useCountry } from '@/context/CountryContext';
import { FiStar, FiMapPin, FiClock } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { Database } from '@/types/supabase';

type Facility = {
  id: string;
  facility_name_en: string;
  facility_name_ar: string;
  facility_description_en?: string;
  facility_description_ar?: string;
  owner_id: string;
  facility_type: string;
  address_en: string;
  address_ar: string;
  country_id: string | number;
  city_id: string | number;
  location?: {
    latitude: number;
    longitude: number;
  };
  featured_until?: string | null;
  verification_status?: string;
  photos?: Array<{ id: string; url: string; is_main?: boolean }>;
  sport_types: Array<{
    name_en: string;
    name_ar: string;
    facility: any;
    pricing: any;
  }>;
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
    code?: string;
  };
  is_active?: boolean;
  is_featured?: boolean;
  featured_priority?: number | null;
  created_at?: string;
  updated_at?: string;
  main_photo?: {
    url: string;
  };
  [key: string]: any; // For any additional properties
};

interface FacilityCardProps {
  facility: Facility;
  language: 'en' | 'ar';
  t: (key: string) => string;
}

export default function FacilityCard({ facility, language, t }: FacilityCardProps) {
  const { currentCountry } = useCountry();
  const countryCode = currentCountry?.code.toLowerCase() || '';
  
  // Generate the facility URL with country code
  const facilityUrl = `/${countryCode}/facilities/${facility.id}`;

  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="h-full">
      <Link 
        href={facilityUrl}
        className="block h-full"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        aria-label={`${language === 'en' ? 'View' : 'عرض'} ${language === 'en' ? facility.facility_name_en : facility.facility_name_ar}`}
      >
        <div className={`
          bg-white dark:bg-gray-800 
          rounded-lg overflow-hidden 
          shadow-sm hover:shadow-md 
          transition-all duration-200 
          h-full flex flex-col 
          transform ${isPressed ? 'scale-95' : 'hover:scale-[1.02]'}
          ${isPressed ? 'shadow-inner' : ''}
        `}>
        <div className="relative">
          {facility.main_photo?.url ? (
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={facility.main_photo?.url || '/placeholder-facility.svg'} 
                alt={language === 'en' ? facility.facility_name_en : facility.facility_name_ar}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-facility.svg';
                }}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center p-4 text-center">
              <img 
                src="/placeholder-facility.svg" 
                alt="" 
                className="w-16 h-16 opacity-50 mb-2"
              />
              <span className="text-gray-400 dark:text-gray-400 text-sm">
                {language === 'en' ? 'No image available' : 'لا توجد صورة متاحة'}
              </span>
            </div>
          )}
          {facility.is_featured && (
            <div className="absolute top-2 left-2 bg-[#00ffaaae] text-black text-xs px-2 py-1 rounded-full">
              {language === 'en' ? 'Featured' : 'مميز'}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold dark:text-white">
              {language === 'en' ? facility.facility_name_en : facility.facility_name_ar}
            </h3>
            <div className="flex items-center text-yellow-500">
              <FiStar className="fill-current" />
              <span className="ml-1 mr-1 text-gray-700 dark:text-gray-300">{facility.rating}</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center">
            <FiMapPin className="mr-1 ml-1" />
            {language === 'en' ? facility.address_en : facility.address_ar}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center">
            <FiClock className="mr-1 ml-1" />
            {facility.city && (
              <span>{language === 'en' ? facility.city.name_en : facility.city.name_ar}</span>
            )}
            {facility.city && facility.country && ', '}
            {facility.country && (
              <span>{language === 'en' ? facility.country.name_en : facility.country.name_ar}</span>
            )}
            {!facility.city && !facility.country && (
              <span>{t('locationNotSpecified')}</span>
            )}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {t('from')} {facility.sport_types[0]?.pricing?.monday?.timeSlots[0]?.price || 0} {facility.currency}/{t('hour')}
            </span>
            <Button size="sm">{t('book')}</Button>
          </div>
        </div>
        </div>
      </Link>
    </div>
  );
}
