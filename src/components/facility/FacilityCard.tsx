import Link from 'next/link';
import { useCountry } from '@/context/CountryContext';
import { FiStar, FiMapPin, FiClock } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { Database } from '@/types/supabase';

type Facility = Database['public']['Tables']['facilities']['Row'] & {
  country: {
    name_en: string;
    name_ar: string;
  };
  city: {
    name_en: string;
    name_ar: string;
  };
  is_featured?: boolean;
  sport_types: Array<{
    name_en: string;
    name_ar: string;
    facility: any;
    pricing: any;
  }>;
  main_photo?: {
    url: string;
  };
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md group hover:scale-105">
      <Link 
        href={facilityUrl}
        className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg"
        aria-label={`${language === 'en' ? 'View' : 'عرض'} ${language === 'en' ? facility.facility_name_en : facility.facility_name_ar}`}
      >
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
            {language === 'en' ? facility.city.name_en : facility.city.name_ar}, {language === 'en' ? facility.country.name_en : facility.country.name_ar}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {t('from')} {facility.sport_types[0]?.pricing?.monday?.timeSlots[0]?.price || 0} {facility.currency}/{t('hour')}
            </span>
            <Button size="sm">{t('book')}</Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
