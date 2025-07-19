'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextArea from '@/components/ui/FormTextArea';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { SportType, CancellationPolicy, BilingualItem, TimeSlot, DayPricing, SportPricing, Equipment, SportFacility } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();
import type { Database } from '@/types/supabase';
import { twMerge } from 'tailwind-merge';

// Define Country and City interfaces locally since they're not exported from @/types/supabase
interface Country {
  id: number;
  name_en: string;
  name_ar: string;
  code: string;
  currency_code: string;
  currency_name_en: string;
  currency_name_ar: string;
  currency_symbol_en: string;
  currency_symbol_ar: string;
}

interface City {
  id: number;
  name_en: string;
  name_ar: string;
  country_id: number;
}

type SupabaseCountryResult = {
  data: Country[] | null;
  error: any;
};

interface SupabaseCityResult {
  data: City[] | null;
  error: any;
}

type CustomSupabaseClient = {
  from: (table: 'countries' | 'cities' | 'sports') => {
    select: (columns: string) => any;
    eq: (column: string, value: any) => any;
  }
};

type RegistrationStep = 'basic' | 'details' | 'media' | 'review';

interface BasicInfo {
  // Basic Information

  facility_name_en: string;
  facility_name_ar: string;
  facility_description_en: string;
  facility_description_ar: string;
  country_id: number | null;
  city_id: number | null;
  address_en: string;
  address_ar: string;
  phone: string;
  email: string;
  website?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export default function PartnerRegistration() {
  const t = (key: string) => key; // TODO: Add translations
  const router = useRouter();

  const { user } = useAuth();
  const { language } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('basic');
  
  // Image upload state - single declaration
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const MAX_IMAGES = 10;

  // Image and validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle navigation to the next step
  const handleNextStep = async () => {
    switch (currentStep) {
      case 'basic':
        if (!validateBasicInfo()) {
          toast.error(t('Please fill in all required fields'));
          return;
        }
        setCurrentStep('details');
        break;
      case 'details':
        if (!validateDetailsInfo()) {
          toast.error(t('Please fill in all required fields'));
          return;
        }
        setCurrentStep('media');
        break;
      case 'media':
        if (!validateMediaInfo()) {
          toast.error(t('Please upload at least one photo'));
          return;
        }
        setCurrentStep('review');
        break;
      case 'review':
        await handleSubmit();
        return; // Don't scroll after submit
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle navigation to the previous step
  const handlePreviousStep = () => {
    const steps: RegistrationStep[] = ['basic', 'details', 'media', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - images.length;
    const newFiles = files.slice(0, remainingSlots);

    if (newFiles.length === 0) return;

    const fileInput = e.target;
    
    try {
      // Clear any existing validation errors
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });

      // Create temporary URLs for preview
      const newTempUrls = newFiles.map(file => URL.createObjectURL(file));
      
      // Update state with temporary URLs and files
      setImageUrls(prev => [...prev, ...newTempUrls]);
      setImages(prev => [...prev, ...newFiles]);
      
      // If this is the first image, set it as main
      if (images.length === 0) {
        setMainImageIndex(0);
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error(t('Error processing images. Please try again.'));
    } finally {
      // Clear the file input
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Remove an image from the selection
  const removeImage = (index: number) => {
    // Revoke the URL to prevent memory leaks
    if (imageUrls[index]) {
      URL.revokeObjectURL(imageUrls[index]);
    }

    // Update state to remove the image
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    
    // Adjust main image index if needed
    if (mainImageIndex >= index && mainImageIndex > 0) {
      setMainImageIndex(prev => prev - 1);
    }

    // Clear validation errors for this image
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`image_${index}`];
      return newErrors;
    });

    // Update states with proper type annotations
    setImages((prev: File[]) => prev.filter((_, i) => i !== index));
    setImageUrls((prev: string[]) => prev.filter((_, i) => i !== index));
    
    // Adjust main image index if needed
    if (index === mainImageIndex) {
      setMainImageIndex(0);
    } else if (index < mainImageIndex) {
      setMainImageIndex(prev => prev - 1);
    }

    // If this was the last image, show the 'no photos' error
    if (images.length === 1) {
      setValidationErrors(prev => ({
        ...prev,
        images: t('At least one photo is required')
      }));
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  // Upload images to Supabase Storage and create photo records
  const uploadImages = async (files: File[], facilityId: string): Promise<{url: string, isMain: boolean}[]> => {
    if (!user) {
      toast.error(t('Please sign in to upload images'));
      return [];
    }
    
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Generate a unique filename to prevent overwrites
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `images/${user.id}/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('facilities')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('facilities')
          .getPublicUrl(filePath);
        
        // Create a record in the photos table
        const isMain = index === mainImageIndex;
        const { data: photo, error: photoError } = await supabase
          .from('photos')
          .insert([{
            facility_id: facilityId,
            url: publicUrl,
            is_main: isMain
          }])
          .select()
          .single();
        
        if (photoError) throw photoError;
        
        return { url: publicUrl, isMain };
      } catch (error) {
        console.error('Error uploading image:', file.name, error);
        toast.error(t('Error uploading image: ') + file.name);
        return null;
      }
    });
    
    // Wait for all uploads to complete and filter out any failed ones
    const results = await Promise.all(uploadPromises);
    return results.filter((result): result is {url: string, isMain: boolean} => result !== null);
  };

  // Validate form based on current step
  const validateForm = (): boolean => {
    switch (currentStep) {
      case 'basic':
        return validateBasicInfo();
      case 'details':
        return validateDetailsInfo();
      case 'media':
        return validateMediaInfo();
      default:
        return true;
    }
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    // Only call preventDefault if event exists (form submission)
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return false;
    }
    
    // If this is not the last step, go to the next step
    if (currentStep !== 'review') {
      const steps: RegistrationStep[] = ['basic', 'details', 'media', 'review'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return true;
    }
    
    // If we're on the review step, submit the form
    try {
      setIsUploading(true);
      
      // Submit the form with the image files
      const success = await submitForm(images);
      
      if (success) {
        // Clear the form
        setImages([]);
        setImageUrls([]);
        setMainImageIndex(0);
        
        // Show success message without redirecting
        toast.success(t('Your facility has been submitted for review. We will contact you soon!'));
      }
      
      return success;
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error(t('An error occurred. Please try again.'));
      return false;
    } finally {
      setIsUploading(false);
    }
  };
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    facility_name_en: '',
    facility_name_ar: '',
    facility_description_en: '',
    facility_description_ar: '',
    country_id: user?.country_id || null,
    city_id: user?.city_id || null,
    address_en : '',
    address_ar : '',
    website: '',
    phone: user?.phone || '',
    email: user?.email || '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
  });

  // Fetch countries from database
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const supabaseClient = supabase as unknown as CustomSupabaseClient;
        const result = await supabaseClient
          .from('countries')
          .select('id, name_en, name_ar, code, currency_code, currency_name_en, currency_name_ar, currency_symbol_en, currency_symbol_ar') as any;
        
        if (result.error) {
          console.error('Supabase error:', result.error);
          toast.error(t('Failed to load countries'));
          return;
        }
        
        const data = result.data;
        if (!data || data.length === 0) {
          console.warn('No countries found');
          toast.error(t('No countries available'));
          return;
        }

        const processedCountries: Country[] = data.map((country: Country) => ({
          id: country.id,
          name_en: country.name_en,
          name_ar: country.name_ar,
          code: country.code,
          currency_code: country.currency_code,
          currency_name_en: country.currency_name_en,
          currency_name_ar: country.currency_name_ar,
          currency_symbol_en: country.currency_symbol_en,
          currency_symbol_ar: country.currency_symbol_ar,
          is_active: true
        }));
        
        setCountries(processedCountries);
      } catch (error) {
        console.error('Unexpected error fetching countries:', error);
        toast.error(t('An unexpected error occurred'));
      }
    };

    fetchCountries();
  }, []);

  // Get country name based on ID
  const getCountryName = (id: number) => {
    const country = countries.find(c => c.id === id);
    return country ? (language === 'ar' ? country.name_ar : country.name_en) : '';
  };

  const getCityName = (id: number) => {
    const city = cities.find(c => c.id === id);
    return city ? (language === 'ar' ? city.name_ar : city.name_en) : '';
  };

  const getCountryCurrency = (id: number | null) => {
    const country = countries.find(c => c.id === id);
    if (!country) return { code: 'USD', symbol: '$' };
    return {
      code: country.currency_code,
      symbol: language === 'ar' ? country.currency_symbol_ar : country.currency_symbol_en,
      name: language === 'ar' ? country.currency_name_ar : country.currency_name_en
    };
  };

  // Fetch cities when country changes
  useEffect(() => {
    const fetchCities = async () => {
      console.log('Fetching cities for country_id:', basicInfo.country_id);
      if (!basicInfo.country_id) {
        console.warn('No country_id selected');
        return;
      }

      try {
        const supabaseClient = supabase as unknown as CustomSupabaseClient;
        const result = await (supabaseClient
          .from('cities')
          .select('id, name_en, name_ar, country_id') as any)
          .eq('country_id', basicInfo.country_id);
        
        console.log('Cities fetch result:', result);
        
        if (result.error) {
          console.error('Supabase error:', result.error);
          toast.error(t('Failed to load cities'));
          return;
        }
        
        const data = result.data;
        if (!data || data.length === 0) {
          console.warn('No cities found for this country');
          setCities([]);
          return;
        }

        const processedCities: City[] = data.map((city: City) => ({
          id: city.id,
          name_en: city.name_en,
          name_ar: city.name_ar,
          country_id: city.country_id,
          is_active: true
        }));
        
        console.log('Processed cities:', processedCities);
        setCities(processedCities);
      } catch (error) {
        console.error('Unexpected error fetching cities:', error);
        toast.error(t('An unexpected error occurred'));
      }
    };

    fetchCities();
  }, [basicInfo.country_id]);

  // Update basic info if user's country changes
  useEffect(() => {
    if (user?.country_id) {
      setBasicInfo(prev => ({
        ...prev,
        country_id: user.country_id
      }));
    }
  }, [user?.country_id]);

  const handleBasicInfoChange = (field: keyof BasicInfo, value: string | number | null) => {
    // Clear validation error when field is changed
    setValidationErrors(prev => ({ ...prev, [field]: '' }));

    if (field === 'country_id') {
      const countryId = value ? parseInt(value.toString()) : null;
      console.log('Country selected:', countryId);
      setBasicInfo(prev => ({
        ...prev,
        [field]: countryId,
        city_id: null, // Reset city when country changes
      }));
    } else if (field === 'city_id') {
      const cityId = value ? parseInt(value.toString()) : null;
      console.log('City selected:', cityId);
      setBasicInfo(prev => ({
        ...prev,
        [field]: cityId
      }));
    } else {
      setBasicInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSocialMediaChange = (platform: keyof Required<BasicInfo>['social_media'], value: string) => {
    setBasicInfo(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const validateBasicInfo = () => {
    const required = ['facility_name_en', 'facility_name_ar', 'facility_description_en', 'facility_description_ar', 'country_id', 'city_id', 'address_en', 'address_ar', 'phone', 'email'];
    const errors: Record<string, string> = {};
    let isValid = true;

    required.forEach(field => {
      const value = basicInfo[field as keyof BasicInfo];
      if (value === null || value === undefined || value === '') {
        errors[field] = t('This field is required');
        isValid = false;
      }
    });

    // Email validation
    if (basicInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicInfo.email)) {
      errors.email = t('Please enter a valid email address');
      isValid = false;
    }

    // Phone validation
    if (basicInfo.phone && !/^\+?[0-9\s-()]+$/.test(basicInfo.phone)) {
      errors.phone = t('Please enter a valid phone number');
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };
  const validateDetailsInfo = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate sport types
    if (sportTypes.length === 0) {
      errors.sportTypes = t('At least one sport type is required');
      isValid = false;
    } else {
      sportTypes.forEach((sport, index) => {
        if (!sport.name_en) {
          errors[`sport_${index}_name_en`] = t('Sport name in English is required');
          isValid = false;
        }
        if (!sport.name_ar) {
          errors[`sport_${index}_name_ar`] = t('Sport name in Arabic is required');
          isValid = false;
        }
        // Convert to array of entries to ensure type safety
        const pricingEntries = Object.entries(sport.pricing) as [keyof SportPricing, DayPricing][];
        pricingEntries.forEach(([day, dayPricing]) => {
          dayPricing.timeSlots.forEach((slot: TimeSlot, slotIndex: number) => {
            if (!slot.price) {
              errors[`sport_${index}_${day}_${slotIndex}_price`] = t('Price is required');
              isValid = false;
            }
            if (!slot.start || !slot.end) {
              errors[`sport_${index}_${day}_${slotIndex}_time`] = t('Time slot is required');
              isValid = false;
            }
          });
        });
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const validateMediaInfo = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (images.length === 0) {
      errors.images = t('At least one photo is required');
      isValid = false;
    }

    // Validate image sizes and types
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    images.forEach((image, index) => {
      if (image.size > maxSize) {
        errors[`image_${index}`] = t('Image size must be less than 5MB');
        isValid = false;
      }
      if (!allowedTypes.includes(image.type)) {
        errors[`image_${index}`] = t('Only JPG, PNG and WebP images are allowed');
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };



  const submitForm = async (files: File[]) => {
    // Basic validation
    if (!acceptedTerms) {
      toast.error(t('Please accept the terms and conditions'));
      return false;
    }

    // Required fields validation
    if (!basicInfo.facility_name_en || !basicInfo.facility_name_ar || 
        !basicInfo.facility_description_en || !basicInfo.facility_description_ar ||
        !basicInfo.country_id || !basicInfo.city_id || 
        !basicInfo.address_en || !basicInfo.address_ar) {
      toast.error(t('Please fill in all required basic information'));
      return false;
    }

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get country currency
      const country = countries.find(c => c.id === basicInfo.country_id);
      if (!country) {
        throw new Error('Invalid country selected');
      }

      // Prepare sport types data with additional contact information
      const sportTypesData = sportTypes.map((sport, index) => ({
        name_en: sport.name_en,
        name_ar: sport.name_ar,
        pricing: sport.pricing,
        facility: sport.facility,
        // Include contact info in the first sport type
        ...(index === 0 ? {
          contact_info: {
            phone: basicInfo.phone,
            email: basicInfo.email,
            website: basicInfo.website,
            social_media: basicInfo.social_media
          }
        } : {})
      }));

      // Insert facility data into Supabase without images
      const facilityData = {
        facility_name_en: basicInfo.facility_name_en,
        facility_name_ar: basicInfo.facility_name_ar,
        facility_description_en: basicInfo.facility_description_en,
        facility_description_ar: basicInfo.facility_description_ar,
        owner_id: user.id,
        facility_type: 'sports_facility',
        address_en: basicInfo.address_en,
        address_ar: basicInfo.address_ar,
        country_id: basicInfo.country_id,
        city_id: basicInfo.city_id,
        location: { latitude: 0, longitude: 0 },
        sport_types: sportTypesData,
        currency: country.currency_code,
        verification_status: 'pending',
        is_active: true
      };

      console.log('Submitting facility data:', facilityData);

      // First, create the facility
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .insert([facilityData])
        .select()
        .single();

      if (facilityError) {
        console.error('Error creating facility:', facilityError);
        throw facilityError;
      }

      if (!facility) {
        throw new Error('No facility data returned from database');
      }

      // Upload images and create photo records
      if (files.length > 0) {
        const uploadResults = await uploadImages(files, facility.id);
        
        if (uploadResults.length === 0) {
          toast.error(t('Failed to upload some images. Please check and try again.'));
          return false;
        }
      }

      toast.success(t('Registration submitted successfully! Our team will review your application and get back to you soon.'));
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('An error occurred while submitting the form. Please try again.'));
      return false;
    }
  };


  
  const renderBasicInfo = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormInput
            id="facility_name_en"
            className="px-2"
            label={t('Facility Name (English)*')}
            value={basicInfo.facility_name_en}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('facility_name_en', e.target.value)}
            error={validationErrors.facility_name_en}
            required
          />
        </div>
        <div className="space-y-2">
          <FormInput
            id="facility_name_ar"
            className="px-2"
            label={t('Facility Name (Arabic)*')}
            value={basicInfo.facility_name_ar}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('facility_name_ar', e.target.value)}
            error={validationErrors.facility_name_ar}
            required
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormTextArea
            id="facility_description_en"
            className="px-2"
            label={t('Facility Description (English)*')}
            value={basicInfo.facility_description_en}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBasicInfoChange('facility_description_en', e.target.value)}
            error={validationErrors.facility_description_en}
            required
          />
        </div>
        <div className="space-y-2">
          <FormTextArea
            id="facility_description_ar"
            className="px-2"
            label={t('Facility Description (Arabic)*')}
            value={basicInfo.facility_description_ar}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleBasicInfoChange('facility_description_ar', e.target.value)}
            error={validationErrors.facility_description_ar}
            required
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium input-label mb-1">{t('Country')}</label>
          <select
            className={twMerge(
              'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm',
              validationErrors.country_id && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            value={basicInfo.country_id?.toString() || ''}
            onChange={(e) => handleBasicInfoChange('country_id', e.target.value ? parseInt(e.target.value) : null)}
            required
          >
            <option value="">{t('Select Country')}</option>
            {countries.map(country => (
              <option key={country.id} value={country.id.toString()}>
                {language === 'ar' ? country.name_ar : country.name_en}
              </option>
            ))}
          </select>
          {validationErrors.country_id && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{validationErrors.country_id}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium input-label mb-1">{t('City')}</label>
          <select
            value={basicInfo.city_id || ''}
            onChange={(e) => handleBasicInfoChange('city_id', e.target.value || null)}
            className={twMerge(
              'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm',
              validationErrors.city_id && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            disabled={!basicInfo.country_id}
            required
          >
            <option value="">{t('Select City')}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {language === 'ar' ? city.name_ar : city.name_en}
              </option>
            ))}
          </select>
          {validationErrors.city_id && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{validationErrors.city_id}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <FormInput
          id="address_en"
          className="px-2"
          label={t('Address (English)*')}
          value={basicInfo.address_en}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('address_en', e.target.value)}
          error={validationErrors.address_en}
          required
        />
      </div>

      <div className="space-y-2">
        <FormInput
          id="address_ar"
          className="px-2"
          label={t('Address (Arabic)*')}
          value={basicInfo.address_ar}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('address_ar', e.target.value)}
          error={validationErrors.address_ar}
          required
          dir="rtl"
        />
      </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormInput
            id="phone"
            className="px-2"
            label={t('Phone*')}
            type="tel"
            value={basicInfo.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('phone', e.target.value)}
            error={validationErrors.phone}
            required
          />
        </div>
        <div className="space-y-2">
          <FormInput
            id="email"
            className="px-2"
            label={t('Email*')}
            type="email"
            value={basicInfo.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('email', e.target.value)}
            error={validationErrors.email}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <FormInput
          id="website"
          className="px-2"
          label={t('Website (Optional)')}
          type="url"
          value={basicInfo.website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBasicInfoChange('website', e.target.value)}
          placeholder="https://"
        />
      </div>

      <div className="space-y-6">
        <div className="text-sm font-medium text-muted-foreground mb-4">{t('Social Media (Optional)')}</div>
        <div className="space-y-4">
          <FormInput
            placeholder="Facebook"
            value={basicInfo.social_media?.facebook}
            className="px-2"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialMediaChange('facebook', e.target.value)}
          />
          <FormInput
            placeholder="Instagram"
            value={basicInfo.social_media?.instagram}
            className="px-2"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialMediaChange('instagram', e.target.value)}
          />
          <FormInput
            placeholder="Twitter"
            value={basicInfo.social_media?.twitter}
            className="px-2"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSocialMediaChange('twitter', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const defaultTimeSlot = { start: '', end: '', price: 0 };

interface SportField {
  sport_name_en: string;
  sport_name_ar: string;
  surface_types_en: string[];
  surface_types_ar: string[];
}

const defaultSportFacility: SportFacility = {
  equipment: [],
  dimensions: {
    width: 0,
    length: 0
  },
  surface_type_en: '',
  surface_type_ar: '',
  field_type: '',
  custom_field_type_en: '',
  custom_field_type_ar: '',
  custom_surface_type_en: '',
  custom_surface_type_ar: '',
  max_capacity: 0
};

const [sportsFields, setSportsFields] = useState<SportField[]>([]);

useEffect(() => {
  const fetchSports = async () => {
    try {
      const supabaseClient = supabase as unknown as CustomSupabaseClient;
      const result = await supabaseClient
        .from('sports')
        .select('sport_name_en, sport_name_ar, surface_types');

      if (result.error) {
        console.error('Supabase error:', result.error);
        toast.error(t('Failed to load sports'));
        return;
      }

      const data = result.data;
      if (!data || data.length === 0) {
        console.warn('No sports found');
        setSportsFields([]);
        return;
      }

      interface SportData {
        sport_name_en: string;
        sport_name_ar: string;
        surface_types: {
          surface_types_en: string[];
          surface_types_ar: string[];
        };
      }

      const processedSports: SportField[] = data.map((sport: SportData) => ({
        sport_name_en: sport.sport_name_en,
        sport_name_ar: sport.sport_name_ar,
        surface_types_en: sport.surface_types.surface_types_en || [],
        surface_types_ar: sport.surface_types.surface_types_ar || []
      }));

      setSportsFields(processedSports);
    } catch (error) {
      console.error('Unexpected error fetching sports:', error);
      toast.error(t('An unexpected error occurred'));
    }
  };

  fetchSports();
}, []);

const defaultDayPricing = {
    isWeekend: false,
    timeSlots: [defaultTimeSlot]
  };

const defaultSportPricing = {
    sunday: { ...defaultDayPricing },
    monday: { ...defaultDayPricing },
    tuesday: { ...defaultDayPricing },
    wednesday: { ...defaultDayPricing },
    thursday: { ...defaultDayPricing, isWeekend: true },
    friday: { ...defaultDayPricing, isWeekend: true },
    saturday: { ...defaultDayPricing, isWeekend: true }
  };

const [sportTypes, setSportTypes] = useState<SportType[]>([
    { 
      id: '1', 
      name_en: '', 
      name_ar: '', 
      pricing: JSON.parse(JSON.stringify(defaultSportPricing)),
      facility: JSON.parse(JSON.stringify(defaultSportFacility))
    }
  ]);

  const [amenities, setAmenities] = useState<BilingualItem[]>([]);
  const [rules, setRules] = useState<BilingualItem[]>([]);
  const [newAmenity, setNewAmenity] = useState({ name_en: '', name_ar: '' });
  const [newRule, setNewRule] = useState({ name_en: '', name_ar: '' });
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>({
    hours: 24,
    refund_percentage: 100
  });

  const handleSportTypeChange = (index: number, field: keyof SportType, value: string | number) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`sport_${index}_${field}`];
      return newErrors;
    });

    const newSportTypes = [...sportTypes];
    const selectedSport = sportsFields.find(s => s.sport_name_en === value || s.sport_name_ar === value);
    
    if (selectedSport) {
      newSportTypes[index] = {
        ...newSportTypes[index],
        name_en: selectedSport.sport_name_en,
        name_ar: selectedSport.sport_name_ar,
        facility: {
          ...newSportTypes[index].facility,
          surface_type_en: '',
          surface_type_ar: ''
        }
      };
    } else if (value === 'Other') {
      newSportTypes[index] = {
        ...newSportTypes[index],
        name_en: 'Other',
        name_ar: 'أخرى',
        facility: {
          ...newSportTypes[index].facility,
          surface_type_en: '',
          surface_type_ar: ''
        }
      };
    } else {
      newSportTypes[index] = { ...newSportTypes[index], [field]: value };
    }
    
    setSportTypes(newSportTypes);
  };

  const handlePricingChange = (sportIndex: number, day: keyof SportPricing, slotIndex: number, field: 'start' | 'end' | 'price', value: string | number) => {
    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (field === 'price') {
        delete newErrors[`sport_${sportIndex}_${day}_${slotIndex}_price`];
      } else {
        delete newErrors[`sport_${sportIndex}_${day}_${slotIndex}_time`];
      }
      return newErrors;
    });

    const newSportTypes = [...sportTypes];
    const timeSlots = [...newSportTypes[sportIndex].pricing[day].timeSlots];
    timeSlots[slotIndex] = { ...timeSlots[slotIndex], [field]: value };
    
    newSportTypes[sportIndex].pricing[day].timeSlots = timeSlots;
    setSportTypes(newSportTypes);

    // Update opening hours if start or end time changed
    if (field === 'start' || field === 'end') {
      // Update sport type pricing
      const newSportTypes = [...sportTypes];
      newSportTypes[sportIndex].pricing[day as keyof SportPricing] = {
        ...newSportTypes[sportIndex].pricing[day as keyof SportPricing],
        timeSlots: timeSlots
      };
      setSportTypes(newSportTypes);
    }
  };

  const addTimeSlot = (sportIndex: number, day: keyof SportPricing): void => {
    const newSportTypes = [...sportTypes];
    const timeSlots = [...newSportTypes[sportIndex].pricing[day].timeSlots];
    timeSlots.push({ ...defaultTimeSlot });
    
    newSportTypes[sportIndex].pricing[day].timeSlots = timeSlots;
    setSportTypes(newSportTypes);
  };

  const removeTimeSlot = (sportIndex: number, day: keyof SportPricing, slotIndex: number): void => {
    const newSportTypes = [...sportTypes];
    const timeSlots = newSportTypes[sportIndex].pricing[day].timeSlots.filter((_, i) => i !== slotIndex);
    
    newSportTypes[sportIndex].pricing[day].timeSlots = timeSlots;
    setSportTypes(newSportTypes);
  };

  const toggleWeekendPricing = (sportIndex: number, day: keyof SportPricing): void => {
    const newSportTypes = [...sportTypes];
    newSportTypes[sportIndex].pricing[day].isWeekend = !newSportTypes[sportIndex].pricing[day].isWeekend;
    setSportTypes(newSportTypes);
  };

  const handleFacilityChange = (sportIndex: number, field: keyof SportFacility, value: any) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`sport_${sportIndex}_facility_${field}`];
      return newErrors;
    });

    const newSportTypes = [...sportTypes];
    const currentSport = sportTypes[sportIndex];
    const selectedSport = sportsFields.find(s => s.sport_name_en === currentSport.name_en);

    if (field === 'surface_type_en') {
      if (value === 'other') {
        newSportTypes[sportIndex].facility = {
          ...newSportTypes[sportIndex].facility,
          surface_type_en: 'other',
          surface_type_ar: 'other'
        };
      } else if (selectedSport) {
        const surfaceIndex = selectedSport.surface_types_en.indexOf(value);
        if (surfaceIndex !== -1) {
          newSportTypes[sportIndex].facility = {
            ...newSportTypes[sportIndex].facility,
            surface_type_en: value,
            surface_type_ar: selectedSport.surface_types_ar[surfaceIndex]
          };
        }
      } else {
        newSportTypes[sportIndex].facility = {
          ...newSportTypes[sportIndex].facility,
          surface_type_en: value
        };
      }
    } else {
      newSportTypes[sportIndex].facility = {
        ...newSportTypes[sportIndex].facility,
        [field]: value
      };
    }
    setSportTypes(newSportTypes);
  };

  const handleEquipmentChange = (sportIndex: number, equipIndex: number, field: keyof Equipment, value: string | number) => {
    const newSportTypes = [...sportTypes];
    const equipment = [...newSportTypes[sportIndex].facility.equipment];
    equipment[equipIndex] = { ...equipment[equipIndex], [field]: value };
    
    newSportTypes[sportIndex] = {
      ...newSportTypes[sportIndex],
      facility: {
        ...newSportTypes[sportIndex].facility,
        equipment
      }
    };
    setSportTypes(newSportTypes);
  };

  const addEquipment = (sportIndex: number) => {
    const newSportTypes = [...sportTypes];
    const newEquipment: Equipment = {
      id: Date.now().toString(),
      name_en: '',
      name_ar: '',
      quantity: 1
    };
    
    newSportTypes[sportIndex] = {
      ...newSportTypes[sportIndex],
      facility: {
        ...newSportTypes[sportIndex].facility,
        equipment: [...newSportTypes[sportIndex].facility.equipment, newEquipment]
      }
    };
    setSportTypes(newSportTypes);
  };

  const removeEquipment = (sportIndex: number, equipIndex: number) => {
    const newSportTypes = [...sportTypes];
    const equipment = newSportTypes[sportIndex].facility.equipment.filter((_: Equipment, i: number) => i !== equipIndex);
    
    newSportTypes[sportIndex] = {
      ...newSportTypes[sportIndex],
      facility: {
        ...newSportTypes[sportIndex].facility,
        equipment
      }
    };
    setSportTypes(newSportTypes);
  };

  const addSportType = () => {
    setSportTypes([...sportTypes, { 
      id: Date.now().toString(), 
      name_en: '', 
      name_ar: '', 
      pricing: JSON.parse(JSON.stringify(defaultSportPricing)),
      facility: JSON.parse(JSON.stringify(defaultSportFacility))
    }]);
  };

  const removeSportType = (index: number) => {
    setSportTypes(sportTypes.filter((_, i) => i !== index));
  };

  const renderDetailsInfo = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">{t('Additional Details')}</h2>
      
      {/* Sport Types and Pricing */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-medium">{t('Sport Types and Pricing') + '*'}</h3>
        <p className="text-sm text-black dark:text-gray-300 mt-1 py-2">{t('Add sports available in your facility with weekday and weekend pricing per hour.')}</p>
        {sportTypes.map((sport, index) => (
          <div key={sport.id} className="space-y-4 p-2 border rounded-lg mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('Sport Type')}</label>
                <select
                  value={sport.name_en}
                  onChange={(e) => handleSportTypeChange(index, 'name_en', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                  required
                >
                  <option value="">{t('Select Sport')}</option>
                  {sportsFields.map(field => (
                    <option key={field.sport_name_en} value={field.sport_name_en}>
                      {language === 'ar' ? field.sport_name_ar : field.sport_name_en}
                    </option>
                  ))}
                  <option value="Other">{t('Other')}</option>
                </select>
              </div>
              {sport.name_en === 'Other' && (
                <>
                  <FormInput
                    label={t('Custom Sport Name (English)')}
                    value={sport.name_en === 'Other' ? '' : sport.name_en}
                    className="px-2"
                    onChange={(e) => handleSportTypeChange(index, 'name_en', e.target.value)}
                    error={validationErrors[`sport_${index}_name_en`]}
                    required
                  />
                  <FormInput
                    label={t('Custom Sport Name (Arabic)')}
                    value={sport.name_ar}
                    className="px-2"
                    onChange={(e) => handleSportTypeChange(index, 'name_ar', e.target.value)}
                    error={validationErrors[`sport_${index}_name_ar`]}
                    required
                    dir="rtl"
                  />
                </>
              )}
            </div>

            {/* Facility Details */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">{t('Facility Details')}</h4>
              
              {/* Field Type and Surface Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('Field Type')}</label>
                  <select
                    value={sport.facility.field_type || ''}
                    onChange={(e) => handleFacilityChange(index, 'field_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    disabled={!sport.name_en || sport.name_en === ''}
                    required
                  >
                    <option value="">{t('Select Field Type')}</option>
                    <option value="indoor">{t('Indoor')}</option>
                    <option value="outdoor">{t('Outdoor')}</option>
                    <option value="other">{t('Other')}</option>
                  </select>
                  {sport.facility.field_type === 'other' && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label={t('Custom Field Type (English)')}
                        value={sport.facility.custom_field_type_en}
                        className="px-2"
                        onChange={(e) => handleFacilityChange(index, 'custom_field_type_en', e.target.value)}
                        required
                      />
                      <FormInput
                        label={t('Custom Field Type (Arabic)')}
                        value={sport.facility.custom_field_type_ar}
                        className="px-2"
                        onChange={(e) => handleFacilityChange(index, 'custom_field_type_ar', e.target.value)}
                        required
                        dir="rtl"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('Surface Type')}</label>
                  <select
                    value={sport.facility.surface_type_en || ''}
                    onChange={(e) => handleFacilityChange(index, 'surface_type_en', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    disabled={!sport.name_en || sport.name_en === ''}
                    required
                  >
                    <option value="">{t('Select Surface Type')}</option>
                    {sport.name_en && sport.name_en !== '' && sport.name_en !== 'Other' && 
                      sportsFields.find(s => s.sport_name_en === sport.name_en)?.surface_types_en.map((surfaceType, i) => (
                        <option key={surfaceType} value={surfaceType}>
                          {language === 'ar' ? 
                            sportsFields.find(s => s.sport_name_en === sport.name_en)?.surface_types_ar[i] : 
                            surfaceType
                          }
                        </option>
                      ))}
                      <option value="other">{t('Other')}</option>
                    </select>
                  </div>
                  {sport.facility.surface_type_en === 'other' && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label={t('Custom Surface Type (English)')}
                        value={sport.facility.custom_surface_type_en}
                        className="px-2"
                        onChange={(e) => handleFacilityChange(index, 'custom_surface_type_en', e.target.value)}
                        required
                      />
                      <FormInput
                        label={t('Custom Surface Type (Arabic)')}
                        value={sport.facility.custom_surface_type_ar}
                        className="px-2"
                        onChange={(e) => handleFacilityChange(index, 'custom_surface_type_ar', e.target.value)}
                        required
                        dir="rtl"
                      />
                    </div>
                  )}
              </div>
             {/* Dimensions (in meters) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  type="number"
                  label={t('Length (meters)')}
                  value={sport.facility.dimensions.length}
                  className="px-2"
                  onChange={(e) => handleFacilityChange(index, 'dimensions', { ...sport.facility.dimensions, length: parseFloat(e.target.value) })}
                  required
                />
                <FormInput
                  type="number"
                  label={t('Width (meters)')}
                  value={sport.facility.dimensions.width}
                  className="px-2"
                  onChange={(e) => handleFacilityChange(index, 'dimensions', { ...sport.facility.dimensions, width: parseFloat(e.target.value) })}
                  required
                />
              </div>
              {/* Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  type="number"
                  label={t('Maximum Capacity')}
                  value={sport.facility.max_capacity}
                  className="px-2"
                  onChange={(e) => handleFacilityChange(index, 'max_capacity', parseInt(e.target.value))}
                  required
                />
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <h5 className="font-medium">{t('Equipment')}</h5>
                {sport.facility.equipment.map((item, equipIndex) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 bg-muted/30 rounded-lg">
                    <FormInput
                      label={t('Name (English)')}
                      value={item.name_en}
                      className="px-2"
                      onChange={(e) => handleEquipmentChange(index, equipIndex, 'name_en', e.target.value)}
                      required
                    />
                    <FormInput
                      label={t('Name (Arabic)')}
                      value={item.name_ar}
                      className="px-2"
                      onChange={(e) => handleEquipmentChange(index, equipIndex, 'name_ar', e.target.value)}
                      required
                      dir="rtl"
                    />
                    <FormInput
                      type="number"
                      label={t('Quantity')}
                      value={item.quantity}
                      className="px-2"
                      onChange={(e) => handleEquipmentChange(index, equipIndex, 'quantity', parseInt(e.target.value))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeEquipment(index, equipIndex)}
                      className="self-end h-8 px-4 text-red-500 hover:text-red-600 border border-red-500 rounded-lg"
                    >
                      {t('Remove')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addEquipment(index)}
                  className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-sm"
                >
                  {t('Add Equipment')}
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(sport.pricing).map(([day, dayPricing]) => (
                <div key={day} className="border rounded-lg p-4 col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{t(day)}</h4>
                    <button
                      type="button"
                      onClick={() => toggleWeekendPricing(index, day as keyof SportPricing)}
                      className={`px-2 py-1 text-xs rounded ${dayPricing.isWeekend ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {dayPricing.isWeekend ? t('Weekend') : t('Weekday')}
                    </button>
                  </div>
                  {dayPricing.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="grid grid-cols-1 gap-2 mb-4">
                      <FormInput
                        type="time"
                        value={slot.start}
                        className="px-2"
                        onChange={(e) => handlePricingChange(index, day as keyof SportPricing, slotIndex, 'start', e.target.value)}
                        error={validationErrors[`sport_${index}_${day}_${slotIndex}_time`]}
                        required
                      />
                      <FormInput
                        type="time"
                        value={slot.end}
                        className="px-2"
                        onChange={(e) => handlePricingChange(index, day as keyof SportPricing, slotIndex, 'end', e.target.value)}
                        error={validationErrors[`sport_${index}_${day}_${slotIndex}_time`]}
                        required
                      />
                      <div className="flex gap-2">
                        <FormInput
                          type="number"
                          value={slot.price}
                          className="px-2 flex-1"
                          onChange={(e) => handlePricingChange(index, day as keyof SportPricing, slotIndex, 'price', parseFloat(e.target.value))}
                          error={validationErrors[`sport_${index}_${day}_${slotIndex}_price`]}
                          required
                        />
                        {dayPricing.timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index, day as keyof SportPricing, slotIndex)}
                            className="px-2 text-red-500 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addTimeSlot(index, day as keyof SportPricing)}
                    className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-sm"
                  >
                    {t('Add Time Slot')}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => removeSportType(index)}
                className="h-8 px-4 text-red-500 hover:text-red-600 border border-red-500 rounded-lg"
              >
                {t('Remove')}
              </button>
            </div>
          </div>
        ))}
        <div className="py-2"></div>
        <button
          type="button"
          onClick={addSportType}
          className="w-full h-10 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          {t('Add Sport Type')}
        </button>
      </div>


      {/* Amenities */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-medium">{t('Amenities')}</h3>
        <p className="text-sm text-black dark:text-gray-300 mt-1">{t('List all available amenities in your facility, such as parking, lockers, showers, etc.')}</p>
        {amenities.map((amenity) => (
          <div key={amenity.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
            <FormInput
              label={t('Amenity Name (English)')}
              value={amenity.name_en}
              className="px-2"
              onChange={(e) => {
                const newAmenities = [...amenities];
                const index = newAmenities.findIndex(a => a.id === amenity.id);
                newAmenities[index] = { ...newAmenities[index], name_en: e.target.value };
                setAmenities(newAmenities);
              }}
              required
            />
            <FormInput
              label={t('Amenity Name (Arabic)')}
              value={amenity.name_ar}
              className="px-2"
              onChange={(e) => {
                const newAmenities = [...amenities];
                const index = newAmenities.findIndex(a => a.id === amenity.id);
                newAmenities[index] = { ...newAmenities[index], name_ar: e.target.value };
                setAmenities(newAmenities);
              }}
              required
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => setAmenities(amenities.filter(a => a.id !== amenity.id))}
              className="self-end h-8 px-4 text-red-500 hover:text-red-600 border border-red-500 rounded-lg"
            >
              {t('Remove')}
            </button>
          </div>
        ))}
        <div className="pt-2"></div>
        <button
          type="button"
          onClick={() => setAmenities([...amenities, { id: Date.now().toString(), name_en: '', name_ar: '' }])}
          className="w-full h-10 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          {t('Add Amenity')}
        </button>
      </div>

      {/* Rules */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-medium">{t('Facility Rules')}</h3>
        <p className="text-sm text-black dark:text-gray-300 mt-1">{t('Set the rules and guidelines that users must follow when using your facility.')}</p>
        {rules.map((rule) => (
          <div key={rule.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
            <FormInput
              label={t('Rule (English)')}
              value={rule.name_en}
              className="px-2"
              onChange={(e) => {
                const newRules = [...rules];
                const index = newRules.findIndex(r => r.id === rule.id);
                newRules[index] = { ...newRules[index], name_en: e.target.value };
                setRules(newRules);
              }}
              required
            />
            <FormInput
              label={t('Rule (Arabic)')}
              value={rule.name_ar}
              className="px-2"
              onChange={(e) => {
                const newRules = [...rules];
                const index = newRules.findIndex(r => r.id === rule.id);
                newRules[index] = { ...newRules[index], name_ar: e.target.value };
                setRules(newRules);
              }}
              required
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
              className="self-end h-8 px-4 text-red-500 hover:text-red-600 border border-red-500 rounded-lg"
            >
              {t('Remove')}
            </button>
          </div>
        ))}
        <div className="pt-2"></div>
        <button
          type="button"
          onClick={() => setRules([...rules, { id: Date.now().toString(), name_en: '', name_ar: '' }])}
          className="w-full h-10 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          {t('Add Rule')}
        </button>
      </div>
      
            {/* Cancellation Policy */}
            <div className="border rounded-lg p-4">
        <h3 className="text-xl font-medium">{t('Cancellation Policy') + '*'}</h3>
        <p className="text-sm text-black dark:text-gray-300 mt-1">{t('Define how many hours before a booking users can cancel and what percentage will be refunded.')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <FormInput
            label={t('Hours before booking')}
              type="number"
              className="px-2"
              value={cancellationPolicy.hours}
            onChange={(e) => setCancellationPolicy((prev: CancellationPolicy) => ({ ...prev, hours: parseInt(e.target.value) }))}
              required
            />
            <FormInput
              label={t('Refund Percentage')}
              type="number"
              className="px-2"
              max={100}
              min={0}
              value={cancellationPolicy.refund_percentage}
            onChange={(e) => setCancellationPolicy((prev: CancellationPolicy) => ({ ...prev, refund_percentage: parseInt(e.target.value) }))}
              required
            />
        </div>
      </div>

    </div>
  );

  const renderMediaInfo = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold mb-6">{t('Media Upload')}</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium">{t('Facility Photos') + '*'}</h3>
          <span className="text-sm text-black dark:text-gray-300">
            {images.length}/{MAX_IMAGES} {t('photos uploaded')}
          </span>
        </div>
        {validationErrors.images && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.images}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div 
              key={url} 
              className={`relative group aspect-[4/3] cursor-pointer rounded-lg ${index === mainImageIndex ? 'ring-4 ring-green-400' : 'hover:ring-2 hover:ring-green-400'}`}
              onClick={() => setMainImageIndex(index)}
            >
              <img
                src={url}
                alt={t('Facility photo') + ` ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              {validationErrors[`image_${index}`] && (
                <div className="absolute bottom-2 left-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  {validationErrors[`image_${index}`]}
                </div>
              )}
              {index === mainImageIndex && (
                <div className="absolute top-2 right-2 bg-green-400 text-white px-2 py-1 rounded-full text-xs border">
                  {t('Main Photo')}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('Remove photo')}
              >
                ✕
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="border-2 border-dashed rounded-lg aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
              <span className="text-3xl">+</span>
              <span className="text-sm text-center text-black dark:text-gray-300">
                {t('Add Photo')}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <p className="text-sm text-black dark:text-gray-300">
          {t('Upload up to 10 high-quality photos of your facility. The photo tagged as main will be used as the main photo.')}
        </p>
      </div>
    </div>
  );

  const renderReviewInfo = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold mb-6">{t('Review Information')}</h2>
      
      {/* Basic Information */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Basic Information')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">{t('Facility Information')}</h4>
            <dl className="space-y-2">
              <dt className="text-sm text-muted-foreground">{t('Name (English)')}</dt>
              <dd>{basicInfo.facility_name_en}</dd>
              <dt className="text-sm text-muted-foreground">{t('Name (Arabic)')}</dt>
              <dd dir="rtl">{basicInfo.facility_name_ar}</dd>
              <dt className="text-sm text-muted-foreground">{t('Description (English)')}</dt>
              <dd>{basicInfo.facility_description_en}</dd>
              <dt className="text-sm text-muted-foreground">{t('Description (Arabic)')}</dt>
              <dd dir="rtl">{basicInfo.facility_description_ar}</dd>
            </dl>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t('Contact Information')}</h4>
            <dl className="space-y-2">
              <dt className="text-sm text-muted-foreground">{t('Email')}</dt>
              <dd>{basicInfo.email}</dd>
              <dt className="text-sm text-muted-foreground">{t('Phone')}</dt>
              <dd>{basicInfo.phone}</dd>
              <dt className="text-sm text-muted-foreground">{t('Address (English)')}</dt>
              <dd>{basicInfo.address_en}</dd>
              <dt className="text-sm text-muted-foreground">{t('Address (Arabic)')}</dt>
              <dd dir="rtl">{basicInfo.address_ar}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Sport Types and Pricing */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Sport Types and Pricing')}</h3>
        <div className="grid grid-cols-3 gap-4">
          {sportTypes.map((sport) => (
            <div key={sport.id} className="p-2 bg-background rounded-lg mb-2 border">
              <div className="space-y-4">
                <div>
                  <div className="font-medium">{sport.name_en}</div>
                  <div dir="rtl" className="text-sm text-black dark:text-gray-300">{sport.name_ar}</div>
                </div>
                {Object.entries(sport.pricing).map(([day, dayPricing]) => (
                  <div key={day} className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">{t(day)}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${dayPricing.isWeekend ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {dayPricing.isWeekend ? t('Weekend') : t('Weekday')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dayPricing.timeSlots.map((slot: TimeSlot, index: number) => (
                        <div key={index} className="text-sm text-black dark:text-gray-300">
                          ({slot.start} - {slot.end}) {slot.price} {getCountryCurrency(basicInfo.country_id).symbol}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {t('Prices shown include all applicable taxes and fees')}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Amenities */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Amenities')}</h3>
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <div key={amenity.name_en} className="flex flex-col gap-1 p-2 bg-background rounded-lg">
                <span className="text-sm">{amenity.name_en}</span>
                <span className="text-sm" dir="rtl">{amenity.name_ar}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            {t('No amenities have been added. Please go back and add some amenities to make your facility more attractive to customers.')}
          </p>
        )}
      </div>
      
      {/* Rules */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Facility Rules')}</h3>
        {rules.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {rules.map((rule, index) => (
              <li key={index} className="flex flex-col gap-1 p-2 bg-background rounded-lg">
                <div className="text-sm">{rule.name_en}</div>
                <div className="text-sm" dir="rtl">{rule.name_ar}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            {t('No rules have been added. Please go back and add some rules to set clear expectations for your customers.')}
          </p>
        )}
      </div>
      {/* Cancellation Policy */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Cancellation Policy')}</h3>
        <p>
          {t('Cancellations made')} {cancellationPolicy.hours} {t('hours before the booking will receive a')} {cancellationPolicy.refund_percentage}% {t('refund')}
        </p>
      </div>

      {/* Opening Hours */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Opening Hours')}</h3>
        <div className="grid grid-cols-1 gap-6">
          {/* Weekdays */}
          <div className="space-y-2">
            <h4 className="font-medium text-black dark:text-gray-300">{t('Weekdays')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sportTypes.map((sport) => (
                Object.entries(sport.pricing)
                  .filter(([_, pricing]) => !pricing.isWeekend)
                  .map(([day, pricing]) => (
                    <div key={`${sport.id}-${day}`} className="flex flex-col p-3 bg-background rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{t(day.charAt(0).toUpperCase() + day.slice(1))}</div>
                        <div className="text-sm text-muted-foreground">{sport.name_en}</div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {pricing.timeSlots.map((slot: TimeSlot, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground flex justify-between">
                            <span>{slot.start} - {slot.end}</span>
                            <span>{slot.price} {getCountryCurrency(basicInfo.country_id).code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ))}
            </div>
          </div>
          {/* Weekends */}
          <div className="space-y-2">
            <h4 className="font-medium text-black dark:text-gray-300">{t('Weekends')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sportTypes.map((sport) => (
                Object.entries(sport.pricing)
                  .filter(([_, pricing]) => pricing.isWeekend)
                  .map(([day, pricing]) => (
                    <div key={`${sport.id}-${day}`} className="flex flex-col p-3 bg-background rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{t(day.charAt(0).toUpperCase() + day.slice(1))}</div>
                        <div className="text-sm text-muted-foreground">{sport.name_en}</div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {pricing.timeSlots.map((slot: TimeSlot, index: number) => (
                          <div key={index} className="text-sm text-muted-foreground flex justify-between">
                            <span>{slot.start} - {slot.end}</span>
                            <span>{slot.price} {getCountryCurrency(basicInfo.country_id).code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <h3 className="text-xl font-medium">{t('Facility Photos')}</h3>
        <span className="text-sm text-black dark:text-gray-300 block mb-4">
          {images.length}/{MAX_IMAGES} {t('photos uploaded')}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative aspect-[4/3]">
              <img
                src={url}
                alt={t('Facility photo') + ` ${index + 1}`}
                className={`w-full h-full object-cover rounded-lg border-2 ${index === mainImageIndex ? 'border-primary' : 'border-transparent'}`}
              />
              {index === mainImageIndex && (
                <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs">
                  {t('Main Photo')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            {t('I confirm that all provided information is accurate and I agree to the')} {' '}
            <a href="/terms" target="_blank" className="text-green-300 hover:underline">
              {t('Terms and Conditions')}
            </a>
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-card p-4 rounded-xl shadow-lg border border-border/50 dark:border-gray-700">
          <div className="mb-8 border-b border-border/50 dark:border-gray-700">
            <h1 className="text-3xl font-bold mb-3 text-">{t('Partner Registration')}</h1>
            <p className="text-black dark:text-gray-300 mb-6">{t('Register your facility and start accepting bookings')}</p>
            <div className="flex gap-3 mb-8">
              {['basic', 'details', 'media', 'review'].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 w-full rounded-full transition-colors border ${currentStep === step ? 'bg-green-400 dark:bg-green-400 shadow-sm' : 'bg-muted'}`}
                  />
                  <div className="mt-2 text-xs text-center text-black dark:text-gray-300 capitalize">
                    {t(step)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentStep === 'basic' && renderBasicInfo()}
          {currentStep === 'details' && renderDetailsInfo()}
          {currentStep === 'media' && renderMediaInfo()}
          {currentStep === 'review' && renderReviewInfo()}

          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {currentStep !== 'basic' && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="px-6"
                >
                  {t('Previous')}
                </Button>
              )}
            </div>
            <Button
              onClick={handleNextStep}
              className={`px-8 ${currentStep === 'basic' ? 'ml-auto' : ''}`}
            >
              {currentStep === 'review' ? t('Submit') : t('Next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
