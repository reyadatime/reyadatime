'use client';

'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCountry } from '@/context/CountryContext';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';

// Define the Country type
type Country = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  currency: string;
  currency_symbol: string;
  active: boolean;
};

const CountrySelector = () => {
  const { t, language } = useLanguage();
  const { currentCountry, countries, changeCountry, loading } = useCountry();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Ensure countries is properly typed as Country[]
  const countryList: Country[] = Array.isArray(countries) ? countries : [];

  const handleCountryChange = (countryCode: string | { code: string } | Country) => {
    try {
      // Create a full country object based on the input type
      let countryObj: Country;
      
      // If it's a full Country object
      if (countryCode && typeof countryCode === 'object' && 'id' in countryCode && 'code' in countryCode) {
        countryObj = {
          id: countryCode.id,
          code: countryCode.code,
          name_en: 'name_en' in countryCode ? countryCode.name_en : '',
          name_ar: 'name_ar' in countryCode ? countryCode.name_ar : '',
          currency: 'currency' in countryCode ? countryCode.currency : '',
          currency_symbol: 'currency_symbol' in countryCode ? countryCode.currency_symbol : '',
          active: 'active' in countryCode ? countryCode.active : true
        };
      }
      // If it's an object with just a code property
      else if (countryCode && typeof countryCode === 'object' && 'code' in countryCode) {
        const code = countryCode.code;
        if (!code) {
          console.error('Empty country code in object:', countryCode);
          return;
        }
        // Create a minimal country object with just the code
        countryObj = { 
          id: '', 
          code, 
          name_en: '', 
          name_ar: '', 
          currency: '', 
          currency_symbol: '', 
          active: true 
        };
      }
      // If it's a string
      else if (typeof countryCode === 'string') {
        // Create a minimal country object with just the code
        countryObj = { 
          id: '', 
          code: countryCode, 
          name_en: '', 
          name_ar: '', 
          currency: '', 
          currency_symbol: '', 
          active: true 
        };
      } else {
        console.error('Invalid country code format:', countryCode);
        return;
      }
      
      // Call changeCountry with the properly formatted country object
      changeCountry(countryObj).catch((error: Error) => {
        console.error('Failed to change country:', error);
      });
    } catch (error) {
      console.error('Error in handleCountryChange:', error);
    }
  };
  
  // Helper function to handle country selection from the dropdown
  const handleCountrySelect = (country: Country) => {
    // Pass the full country object to handleCountryChange
    handleCountryChange({
      id: country.id,
      code: country.code,
      name_en: country.name_en,
      name_ar: country.name_ar,
      currency: country.currency,
      currency_symbol: country.currency_symbol,
      active: country.active
    });
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin mr-2" />
        {t('loading', 'Loading...')}
      </div>
    );
  }

  if ((!currentCountry || !currentCountry.code) && !loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
          <h2 className="text-xl font-bold mb-4">{t('select_country', 'Select Your Country')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('select_country_message', 'Please select your country to continue')}
          </p>
          <div className="overflow-y-auto pr-2 -mr-2 flex-1">
            <div className="space-y-2 pr-2">
              {countryList.map((country: Country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange({
                    id: country.id,
                    code: country.code,
                    name_en: country.name_en,
                    name_ar: country.name_ar,
                    currency: country.currency,
                    currency_symbol: country.currency_symbol,
                    active: country.active
                  })}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between"
                >
                  <span>{country.name_en}</span>
                  <span className="text-gray-500 text-sm">{country.name_ar}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trigger = (
    <button
      className="flex items-center text-gray-500 dark:text-gray-400 space-x-2 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
      aria-label="Select country"
      onClick={() => setIsOpen(!isOpen)}
    >
      <FiGlobe className="w-5 h-5" />
      <span className="hidden sm:inline">{currentCountry?.code || ''}</span>
      <FiChevronDown
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  if (!currentCountry) {
    return null; // Or a loading state
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1 max-h-80 overflow-y-auto">
            {countryList.map((country: Country) => (
              <div
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
              >
                <span className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? country.name_ar : country.name_en} ({country.code})
                </span>
                {currentCountry?.code === country.code && (
                  <FiCheck className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
