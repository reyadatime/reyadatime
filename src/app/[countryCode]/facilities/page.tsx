'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiFilter, FiSearch } from 'react-icons/fi';
import FacilityCard from '@/components/facility/FacilityCard';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';
import { useCountry } from '@/context/CountryContext';

const supabase = createClient();
import { Database } from '@/types/supabase';

export type Facility = Database['public']['Tables']['facilities']['Row'] & {
  country: {
    name_en: string;
    name_ar: string;
  };
  city: {
    name_en: string;
    name_ar: string;
  };
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
import Button from '@/components/ui/Button';

interface PageProps {
  params: {
    countryCode: string;
  };
  searchParams: {
    type?: string;
  };
}

export default function FacilitiesPage({ params }: PageProps) {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {currentCountry} = useCountry();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Get the country code from URL parameter and ensure lowercase
  const countryCode = currentCountry?.code.toLowerCase() || '';
  
  // Ensure the country code is valid
  useEffect(() => {
    // If country code is not provided, redirect to Qatar by default
    if (!countryCode) {
      router.push(`/${currentCountry?.code.toLowerCase()}/facilities`);
      return;
    }
    
    console.log('Current country code:', countryCode);
    
    // Fetch facilities when country code changes
    fetchFacilities();
  }, [countryCode, router]);

  // Sport types for filtering
  const sportTypes = [
    { id: '', name: t('allSports') },
    { id: 'football', name: t('football') },
    { id: 'basketball', name: t('basketball') },
    { id: 'volleyball', name: t('volleyball') },
    { id: 'tennis', name: t('tennis') },
    { id: 'padel', name: t('padel') },
    { id: 'swimming', name: t('swimming') },
    { id: 'gym', name: t('gym') },
  ];

  // Locations for filtering (would come from database in a real app)
  const locations = [
    { id: '', name: t('allLocations') },
    { id: 'doha', name: 'Doha' },
    { id: 'lusail', name: 'Lusail' },
    { id: 'al-wakrah', name: 'Al Wakrah' },
  ];

  // This effect is now handled by the countryId effect above
  useEffect(() => {
    if (selectedType) {
      fetchFacilities();
    }
  }, [selectedType]);

  const fetchFacilities = async () => {
    setLoading(true);
    
    try {
          // First, get all approved and active facilities for the current country with their main photo
      console.log('Fetching facilities for country code:', countryCode);
      
      if (!countryCode) {
        console.error('No country code provided');
        setLoading(false);
        return;
      }
      
      // First, get the country ID from the countries table using the code
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .ilike('code', countryCode.toUpperCase())
        .single();
      
      if (countryError || !countryData) {
        console.error('Country not found:', countryError);
        setLoading(false);
        return;
      }
      
      // Then get facilities for this country
      let query = supabase
        .from('facilities')
        .select(`
          id,
          facility_name_en,
          facility_name_ar,
          facility_description_en,
          facility_description_ar,
          address_en,
          address_ar,
          country_id,
          city_id,
          sport_types,
          amenities_en,
          amenities_ar,
          rules_en,
          rules_ar,
          verification_status,
          is_active,
          is_featured,
          rating,
          review_count,
          currency,
          country:countries(id, name_en, name_ar, code),
          city:cities(name_en, name_ar),
          photos!left(
            url,
            is_main
          )
        `)
        .eq('verification_status', 'approved')
        .eq('is_active', true)
        .eq('country_id', countryData.id) // Use the ID from the countries table
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });
      
      // Apply location filter if selected
      if (selectedLocation) {
        query = query.ilike('address_en', `%${selectedLocation}%`);
      }
      
      // Apply search term filter if any
      if (searchTerm) {
        query = query.or(`facility_name_en.ilike.%${searchTerm}%,facility_description_en.ilike.%${searchTerm}%,address_en.ilike.%${searchTerm}%`);
      }
      
      const { data: facilitiesData, error } = await query;
      
      if (error) {
        console.error('Error fetching facilities:', error);
        throw error;
      }
      
      console.log('Fetched facilities:', facilitiesData);
      
      // Process facilities to extract the main photo
      const processedFacilities = facilitiesData.map(facility => {
        // Find the main photo or use the first one if no main is set
        const mainPhoto = facility.photos?.find(photo => photo.is_main) || facility.photos?.[0];
        
        return {
          ...facility,
          main_photo: mainPhoto ? { url: mainPhoto.url } : null
        };
      });
      
      // Apply sport type filter
      let filteredFacilities = processedFacilities;
      if (selectedType) {
        filteredFacilities = processedFacilities.filter(facility => {
          return facility.sport_types.some((sport: any) => sport.name_en.toLowerCase() === selectedType.toLowerCase());
        });
      }
      
      setFacilities(filteredFacilities as unknown as Facility[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Instead of filtering here, we'll trigger the fetchFacilities function
    // which already has the logic to filter by searchTerm
    fetchFacilities();
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 dark:text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">{t('facilitiesTitle')}</h1>
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 md:hidden bg-gray-100 dark:bg-gray-800 p-2 rounded-md dark:text-gray-200"
        >
          <FiFilter />
          {t('filters')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <div className="w-full md:w-64 hidden md:block">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-4">{t('filterBy')}</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('sportType')}</h3>
              <div className="space-y-2">
                {sportTypes.map(type => (
                  <div key={type.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`type-${type.id}`}
                      name="sportType"
                      value={type.id}
                      checked={selectedType === type.id}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`type-${type.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {type.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('location')}</h3>
              <div className="space-y-2">
                {locations.map(location => (
                  <div key={location.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`location-${location.id}`}
                      name="location"
                      value={location.id}
                      checked={selectedLocation === location.id}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`location-${location.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {location.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('price')}</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0 QAR</span>
                  <span>{priceRange[1]} QAR</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setSelectedType('');
                setSelectedLocation('');
                setPriceRange([0, 1000]);
                fetchFacilities();
              }}
            >
              {t('resetFilters')}
            </Button>
          </div>
        </div>

        {/* Filters - Mobile */}
        {showFilters && (
          <div className="md:hidden bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
            <h2 className="font-semibold text-lg mb-4">{t('filterBy')}</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('sportType')}</h3>
              <div className="space-y-2">
                {sportTypes.map(type => (
                  <div key={type.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`mobile-type-${type.id}`}
                      name="mobileSportType"
                      value={type.id}
                      checked={selectedType === type.id}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`mobile-type-${type.id}`} className="ml-2 text-sm text-gray-700">
                      {type.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('location')}</h3>
              <div className="space-y-2">
                {locations.map(location => (
                  <div key={location.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`mobile-location-${location.id}`}
                      name="mobileLocation"
                      value={location.id}
                      checked={selectedLocation === location.id}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`mobile-location-${location.id}`} className="ml-2 text-sm text-gray-700">
                      {location.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('price')}</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0 QAR</span>
                  <span>{priceRange[1]} QAR</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => {
                  setSelectedType('');
                  setSelectedLocation('');
                  setPriceRange([0, 1000]);
                  fetchFacilities();
                  setShowFilters(false);
                }}
              >
                {t('resetFilters')}
              </Button>
              <Button
                size="sm"
                fullWidth
                onClick={() => setShowFilters(false)}
              >
                {t('applyFilters')}
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full">
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchFacilities')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <Button type="submit" className="ml-3 mr-2">
                {t('search')}
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-gray-500 dark:text-gray-400">{t('loading')}</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-gray-500 dark:text-gray-400">{t('noFacilitiesFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <FacilityCard 
                  key={facility.id} 
                  facility={facility} 
                  language={language}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
