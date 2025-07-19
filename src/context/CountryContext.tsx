'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Country = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  currency: string;
  currency_symbol: string;
  active: boolean;
};

interface CountryContextType {
  currentCountry: Country | null;
  countries: Country[];
  loading: boolean;
  error: string | null;
  setCurrentCountry: (country: Country) => void;
  changeCountry: (countryCode: string | { code: string } | Country, redirectPath?: string) => Promise<boolean>;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  // Fetch available countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to fetch countries
        // const { data, error } = await supabase.from('countries').select('*').eq('active', true);
        // if (error) throw error;
        
        // Mock data - replace with actual API call
        const mockCountries: Country[] = [
          {
            id: '1',
            code: 'QA',
            name_en: 'Qatar',
            name_ar: 'قطر',
            currency: 'QAR',
            currency_symbol: 'ر.ق',
            active: true,
          },
          {
            id: '2',
            code: 'SA',
            name_en: 'Saudi Arabia',
            name_ar: 'السعودية',
            currency: 'SAR',
            currency_symbol: 'ر.س',
            active: true,
          },
          {
            id: '3',
            code: 'AE',
            name_en: 'United Arab Emirates',
            name_ar: 'الإمارات العربية المتحدة',
            currency: 'AED',
            currency_symbol: 'د.إ',
            active: true,
          },
          {
            id: '4',
            code: 'OM',
            name_en: 'Oman',
            name_ar: 'سلطنة عُمان',
            currency: 'OMR',
            currency_symbol: 'ر.ع',
            active: true,
          },
          {
            id: '5',
            code: 'BH',
            name_en: 'Bahrain',
            name_ar: 'البحرين',
            currency: 'BHD',
            currency_symbol: 'د.ب',
            active: true,
          },
          {
            id: '6',
            code: 'KW',
            name_en: 'Kuwait',
            name_ar: 'الكويت',
            currency: 'KWD',
            currency_symbol: 'د.ك',
            active: true,
          },
          {
            id: '7',
            code: 'SY',
            name_en: 'Syria',
            name_ar: 'سوريا',
            currency: 'SYP',
            currency_symbol: 'ل.س',
            active: true,
          },
          {
            id: '8',
            code: 'LB',
            name_en: 'Lebanon',
            name_ar: 'لبنان',
            currency: 'LBP',
            currency_symbol: 'ل.ل',
            active: true,
          },
          {
            id: '9',
            code: 'PS',
            name_en: 'Palestine',
            name_ar: 'فلسطين',
            currency: 'EGP',
            currency_symbol: 'ج.م',
            active: true,
          },
          {
            id: '10',
            code: 'EG',
            name_en: 'Egypt',
            name_ar: 'مصر',
            currency: 'EGP',
            currency_symbol: 'ج.م',
            active: true,
          },
          {
            id: '11',
            code: 'JO',
            name_en: 'Jordan',
            name_ar: 'الأردن',
            currency: 'JOD',
            currency_symbol: 'د.أ',
            active: true,
          },
          {
            id: '12',
            code: 'IQ',
            name_en: 'Iraq',
            name_ar: 'العراق',
            currency: 'IQD',
            currency_symbol: 'د.ع',
            active: true,
          },
          {
            id: '13',
            code: 'YE',
            name_en: 'Yemen',
            name_ar: 'اليمن',
            currency: 'YER',
            currency_symbol: 'ر.ي',
            active: true,
          },
          {
            id: '14',
            code: 'TN',
            name_en: 'Tunisia',
            name_ar: 'تونس',
            currency: 'TND',
            currency_symbol: 'د.ت',
            active: true,
          },
          {
            id: '15',
            code: 'DZ',
            name_en: 'Algeria',
            name_ar: 'الجزائر',
            currency: 'DZD',
            currency_symbol: 'د.ج',
            active: true,
          },
          {
            id: '16',
            code: 'LY',
            name_en: 'Libya',
            name_ar: 'ليبيا',
            currency: 'LYD',
            currency_symbol: 'د.ل',
            active: true,
          },
          {
            id: '17',
            code: 'MA',
            name_en: 'Morocco',
            name_ar: 'المغرب',
            currency: 'MAD',
            currency_symbol: 'د.م',
            active: true,
          },
          {
            id: '18',
            code: 'MR',
            name_en: 'Mauritania',
            name_ar: 'موريتانيا',
            currency: 'MRO',
            currency_symbol: 'ر.م',
            active: true,
          },
          {
            id: '19',
            code: 'SD',
            name_en: 'Sudan',
            name_ar: 'السودان',
            currency: 'SDG',
            currency_symbol: 'ج.س',
            active: true,
          },
          {
            id: '20',
            code: 'SO',
            name_en: 'Somalia',
            name_ar: 'الصومال',
            currency: 'SOS',
            currency_symbol: 'ج.س',
            active: true,
          },
          {
            id: '21',
            code: 'DJ',
            name_en: 'Djibouti',
            name_ar: 'جيبوتي',
            currency: 'DJF',
            currency_symbol: 'ج.د',
            active: true,
          },
          {
            id: '22',
            code: 'KM',
            name_en: 'Comoros',
            name_ar: 'جزر القمر',
            currency: 'KMF',
            currency_symbol: 'ك.م',
            active: true,
          },
          // Add more countries as needed
        ];
        
        setCountries(mockCountries);
        
        // List of paths that don't require country code
        const countryAgnosticPaths = [
          '/contact', 
          '/auth', 
          '/about', 
          '/privacy', 
          '/terms',
          '/profile',
          '/settings',
          '/admin',
          '/notifications',
          '/api',
          '/_next'
        ];
        
        // Detect country from URL or localStorage on initial load
        const detectCountry = async () => {
          const segments = pathname.split('/');
          const countryCodeFromUrl = segments[1]?.toUpperCase();
          const isCountryAgnosticPath = countryAgnosticPaths.some(path => pathname.startsWith(path));
          
          // If this is a country-agnostic path, don't redirect
          if (isCountryAgnosticPath) {
            return;
          }
          
          // If we have a valid country code in the URL, use it
          if (countryCodeFromUrl && countryCodeFromUrl.length === 2) {
            const country = mockCountries.find(c => c.code === countryCodeFromUrl);
            if (country) {
              setCurrentCountry(country);
              localStorage.setItem('selectedCountry', JSON.stringify(country));
              return;
            }
          }
          
          // Try to get country from localStorage
          const savedCountry = localStorage.getItem('selectedCountry');
          if (savedCountry) {
            try {
              const parsedCountry = JSON.parse(savedCountry);
              const isValidCountry = mockCountries.some(c => c.code === parsedCountry.code);
              if (isValidCountry) {
                setCurrentCountry(parsedCountry);
                // Redirect to include country code in URL
                const newPath = `/${parsedCountry.code.toLowerCase()}${pathname}`;
                if (pathname !== newPath) {
                  router.replace(newPath);
                }
                return;
              }
            } catch (e) {
              console.error('Error parsing saved country:', e);
            }
          }
          
          // Default to Qatar if no valid country found
          const qatarCountry = mockCountries.find(c => c.code === 'QA');
          if (qatarCountry) {
            setCurrentCountry(qatarCountry);
            if (!countryCodeFromUrl) {
              const newPath = `/qa${pathname}`;
              if (pathname !== newPath) {
                router.replace(newPath);
              }
            }
          }
        };
        
        if (mockCountries.length > 0) {
          detectCountry();
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError('Failed to load country data');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [pathname]);

  /**
   * Normalizes the country input to a standard Country object
   */
  const normalizeCountryInput = (input: string | { code: string } | Country): { code: string; country: Country } | null => {
    try {
      let code: string;
      let country: Country;

      if (typeof input === 'string') {
        code = input.toUpperCase();
        const found = countries.find(c => c.code === code);
        if (!found) return null;
        country = found;
      } 
      else if (input && typeof input === 'object' && 'code' in input) {
        code = input.code.toUpperCase();
        country = countries.find(c => c.code === code) || {
          id: 'id' in input ? input.id : `temp-${Date.now()}`,
          code,
          name_en: 'name_en' in input ? input.name_en : '',
          name_ar: 'name_ar' in input ? input.name_ar : '',
          currency: 'currency' in input ? input.currency : '',
          currency_symbol: 'currency_symbol' in input ? input.currency_symbol : '',
          active: 'active' in input ? input.active : true
        };
      } else {
        return null;
      }

      return { code, country };
    } catch (error) {
      console.error('Error normalizing country input:', error);
      return null;
    }
  };

  /**
   * Handles country change with improved navigation and state management
   */
  const changeCountry = async (input: string | { code: string } | Country, redirectPath?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Normalize the input to get a valid country object
      const normalized = normalizeCountryInput(input);
      if (!normalized) {
        throw new Error('Invalid country selection');
      }

      const { code, country } = normalized;
      const lowerCode = code.toLowerCase();
      const currentPath = window.location.pathname;
      
      // Always redirect to the home page of the selected country
      const targetPath = `/${lowerCode}`;

      // Update state and storage
      setCurrentCountry(country);
      localStorage.setItem('selectedCountry', JSON.stringify(country));

      // Only navigate if the path would change
      if (targetPath !== currentPath) {
        // Use replaceState to avoid adding to browser history
        window.history.replaceState({}, '', targetPath);
        
        // Force a soft navigation for client-side routing
        router.replace(targetPath);
        
        // Force a hard navigation if we're still on the same page after a short delay
        setTimeout(() => {
          if (window.location.pathname === currentPath) {
            window.location.href = targetPath;
          }
        }, 100);
      }

      return true;
      
    } catch (err) {
      console.error('Error changing country:', err);
      setError(err instanceof Error ? err.message : 'Failed to change country');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CountryContext.Provider
      value={{
        currentCountry,
        countries,
        loading,
        error,
        setCurrentCountry: (country) => {
          setCurrentCountry(country);
          localStorage.setItem('selectedCountry', JSON.stringify(country));
        },
        changeCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
