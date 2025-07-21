'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const supabase = createClient();

interface Facility {
  id: string;
  facility_name_en: string;
  facility_name_ar: string;
  facility_description_en: string;
  facility_description_ar: string;
  facility_type: string;
  address_en: string;
  address_ar: string;
  country_id: number;
  city_id: number;
  location: { latitude: number; longitude: number };
  sport_types: string[];
  amenities_en: string[];
  amenities_ar: string[];
  rules_en: string[];
  rules_ar: string[];
  is_active: boolean;
  currency: string;
  is_featured: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  images: string[];
}

export default function EditFacilityPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentCountry } = useCountry();
  const router = useRouter();
  const params = useParams();
  const facilityId = params?.id as string;
  const countryCode = params?.countryCode as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facility, setFacility] = useState<Partial<Facility> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<Facility>>({
    facility_name_en: '',
    facility_name_ar: '',
    facility_description_en: '',
    facility_description_ar: '',
    facility_type: '',
    address_en: '',
    address_ar: '',
    is_active: true,
    currency: 'QAR',
    sport_types: [],
    amenities_en: [],
    amenities_ar: [],
    rules_en: [],
    rules_ar: [],
  });

  // Fetch facility data
  useEffect(() => {
    if (user && facilityId) {
      fetchFacility();
    }
  }, [user, facilityId]);

  const fetchFacility = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId)
        .single();

      if (error) throw error;
      
      // Verify facility belongs to the current user
      if (data.owner_id !== user?.id) {
        throw new Error('Unauthorized');
      }

      setFacility(data);
      setFormData({
        facility_name_en: data.facility_name_en,
        facility_name_ar: data.facility_name_ar,
        facility_description_en: data.facility_description_en,
        facility_description_ar: data.facility_description_ar,
        facility_type: data.facility_type,
        address_en: data.address_en,
        address_ar: data.address_ar,
        is_active: data.is_active,
        currency: data.currency,
        sport_types: data.sport_types || [],
        amenities_en: data.amenities_en || [],
        amenities_ar: data.amenities_ar || [],
        rules_en: data.rules_en || [],
        rules_ar: data.rules_ar || [],
      });
    } catch (err) {
      console.error('Error fetching facility:', err);
      setError(
        language === 'en'
          ? 'Failed to load facility. Please try again.'
          : 'فشل تحميل بيانات المنشأة. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: keyof Facility, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!facility) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('facilities')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', facilityId);

      if (error) throw error;

      toast.success(
        language === 'en'
          ? 'Facility updated successfully!'
          : 'تم تحديث المنشأة بنجاح!'
      );
      
      // Redirect back to facilities list
      router.push(`/${countryCode}/dashboard/facilities`);
    } catch (err) {
      console.error('Error updating facility:', err);
      toast.error(
        language === 'en'
          ? 'Failed to update facility. Please try again.'
          : 'فشل تحديث المنشأة. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'en' ? 'Facility not found' : 'المنشأة غير موجودة'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'en' ? 'Edit Facility' : 'تعديل المنشأة'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'Update your facility information'
                : 'قم بتحديث معلومات منشأتك'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {language === 'en' ? 'Basic Information' : 'المعلومات الأساسية'}
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facility_name_en">
                  {language === 'en' ? 'Facility Name (English)' : 'اسم المنشأة (الإنجليزية)'}
                </Label>
                <Input
                  id="facility_name_en"
                  name="facility_name_en"
                  value={formData.facility_name_en || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facility_name_ar">
                  {language === 'en' ? 'Facility Name (Arabic)' : 'اسم المنشأة (العربية)'}
                </Label>
                <Input
                  id="facility_name_ar"
                  name="facility_name_ar"
                  value={formData.facility_name_ar || ''}
                  onChange={handleInputChange}
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facility_description_en">
                  {language === 'en' ? 'Description (English)' : 'الوصف (الإنجليزية)'}
                </Label>
                <textarea
                  id="facility_description_en"
                  name="facility_description_en"
                  value={formData.facility_description_en || ''}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facility_description_ar">
                  {language === 'en' ? 'Description (Arabic)' : 'الوصف (العربية)'}
                </Label>
                <textarea
                  id="facility_description_ar"
                  name="facility_description_ar"
                  value={formData.facility_description_ar || ''}
                  onChange={handleInputChange}
                  dir="rtl"
                  rows={4}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facility_type">
                  {language === 'en' ? 'Facility Type' : 'نوع المنشأة'}
                </Label>
                <select
                  id="facility_type"
                  name="facility_type"
                  value={formData.facility_type || ''}
                  onChange={(e) => handleSelectChange('facility_type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">{language === 'en' ? 'Select type' : 'اختر النوع'}</option>
                  <option value="indoor">{language === 'en' ? 'Indoor' : 'داخلي'}</option>
                  <option value="outdoor">{language === 'en' ? 'Outdoor' : 'خارجي'}</option>
                  <option value="both">{language === 'en' ? 'Both' : 'كلاهما'}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  {language === 'en' ? 'Currency' : 'العملة'}
                </Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency || 'QAR'}
                  onChange={(e) => handleSelectChange('currency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="QAR">QAR - Qatari Riyal</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="BHD">BHD - Bahraini Dinar</option>
                  <option value="OMR">OMR - Omani Rial</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address_en">
                  {language === 'en' ? 'Address (English)' : 'العنوان (الإنجليزية)'}
                </Label>
                <Input
                  id="address_en"
                  name="address_en"
                  value={formData.address_en || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address_ar">
                  {language === 'en' ? 'Address (Arabic)' : 'العنوان (العربية)'}
                </Label>
                <Input
                  id="address_ar"
                  name="address_ar"
                  value={formData.address_ar || ''}
                  onChange={handleInputChange}
                  dir="rtl"
                  required
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center space-x-4 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  id="is_active"
                  className="sr-only peer"
                  checked={!!formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  {formData.is_active 
                    ? (language === 'en' ? 'Active' : 'نشط')
                    : (language === 'en' ? 'Inactive' : 'غير نشط')}
                </span>
              </label>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {language === 'en' ? 'Save Changes' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
