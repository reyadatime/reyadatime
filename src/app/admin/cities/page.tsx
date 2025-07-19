'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import { toast } from 'react-hot-toast';

interface City {
  id: number;
  name_en: string;
  name_ar: string;
  country_id: number;
  country: {
    name_en: string;
    name_ar: string;
  };
}

interface Country {
  id: number;
  name_en: string;
  name_ar: string;
}

export default function AdminCities() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: string) => key; // TODO: Add translations
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCity, setNewCity] = useState<Partial<City>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch cities with country information
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*, country:countries(name_en, name_ar)')
        .order('name_en');

      if (citiesError) throw citiesError;
      setCities(citiesData || []);

      // Fetch countries for the dropdown
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('id, name_en, name_ar')
        .order('name_en');

      if (countriesError) throw countriesError;
      setCountries(countriesData || []);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async () => {
    try {
      if (!newCity.name_en || !newCity.name_ar || !newCity.country_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .insert([newCity])
        .select();

      if (error) throw error;

      toast.success('City added successfully');
      setNewCity({});
      fetchData();
    } catch (error) {
      toast.error('Failed to add city');
      console.error('Error:', error);
    }
  };

  const handleUpdateCity = async (city: City) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update(city)
        .eq('id', city.id);

      if (error) throw error;

      toast.success('City updated successfully');
      setEditingCity(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update city');
      console.error('Error:', error);
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this city?')) return;

    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('City deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete city');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('Manage Cities')}</h1>

      {/* Add New City Form */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('Add New City')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('Name (English)')}
            value={newCity.name_en || ''}
            onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })}
          />
          <FormInput
            label={t('Name (Arabic)')}
            value={newCity.name_ar || ''}
            onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })}
          />
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">{t('Country')}</label>
            <select
              className="w-full p-2 border rounded"
              value={newCity.country_id || ''}
              onChange={(e) => setNewCity({ ...newCity, country_id: Number(e.target.value) })}
            >
              <option value="">{t('Select a country')}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {language === 'ar' ? country.name_ar : country.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleAddCity} className="mt-4">
          {t('Add City')}
        </Button>
      </div>

      {/* Cities List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{t('Cities List')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">{t('Name (English)')}</th>
                <th className="px-4 py-2">{t('Name (Arabic)')}</th>
                <th className="px-4 py-2">{t('Country')}</th>
                <th className="px-4 py-2">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id}>
                  <td className="border px-4 py-2">
                    {editingCity?.id === city.id ? (
                      <FormInput
                        value={editingCity.name_en}
                        onChange={(e) => setEditingCity({ ...editingCity, name_en: e.target.value })}
                      />
                    ) : (
                      city.name_en
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {editingCity?.id === city.id ? (
                      <FormInput
                        value={editingCity.name_ar}
                        onChange={(e) => setEditingCity({ ...editingCity, name_ar: e.target.value })}
                      />
                    ) : (
                      city.name_ar
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {editingCity?.id === city.id ? (
                      <select
                        className="w-full p-2 border rounded"
                        value={editingCity.country_id}
                        onChange={(e) => setEditingCity({ ...editingCity, country_id: Number(e.target.value) })}
                      >
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {language === 'ar' ? country.name_ar : country.name_en}
                          </option>
                        ))}
                      </select>
                    ) : (
                      language === 'ar' ? city.country.name_ar : city.country.name_en
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {editingCity?.id === city.id ? (
                      <div className="space-x-2">
                        <Button onClick={() => handleUpdateCity(editingCity)} size="sm">
                          {t('Save')}
                        </Button>
                        <Button onClick={() => setEditingCity(null)} variant="secondary" size="sm">
                          {t('Cancel')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button onClick={() => setEditingCity(city)} variant="secondary" size="sm">
                          {t('Edit')}
                        </Button>
                        <Button onClick={() => handleDeleteCity(city.id)} variant="danger" size="sm">
                          {t('Delete')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
