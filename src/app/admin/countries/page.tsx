'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import { toast } from 'react-hot-toast';

interface Country {
  id: number;
  name_en: string;
  name_ar: string;
  code: string;
  currency_code: string;
  currency_name_en: string;
  currency_name_ar: string;
  flag_url?: string;
}

export default function AdminCountries() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: string) => key; // TODO: Add translations
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [newCountry, setNewCountry] = useState<Partial<Country>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name_en');

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      toast.error('Failed to fetch countries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = async () => {
    try {
      if (!newCountry.name_en || !newCountry.name_ar || !newCountry.code || !newCountry.currency_code) {
        toast.error('Please fill in all required fields');
        return;
      }

      const { data, error } = await supabase
        .from('countries')
        .insert([newCountry])
        .select();

      if (error) throw error;

      toast.success('Country added successfully');
      setNewCountry({});
      fetchCountries();
    } catch (error) {
      toast.error('Failed to add country');
      console.error('Error:', error);
    }
  };

  const handleUpdateCountry = async (country: Country) => {
    try {
      const { error } = await supabase
        .from('countries')
        .update(country)
        .eq('id', country.id);

      if (error) throw error;

      toast.success('Country updated successfully');
      setEditingCountry(null);
      fetchCountries();
    } catch (error) {
      toast.error('Failed to update country');
      console.error('Error:', error);
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this country?')) return;

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Country deleted successfully');
      fetchCountries();
    } catch (error) {
      toast.error('Failed to delete country');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('Manage Countries')}</h1>

      {/* Add New Country Form */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('Add New Country')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('Name (English)')}
            value={newCountry.name_en || ''}
            onChange={(e) => setNewCountry({ ...newCountry, name_en: e.target.value })}
          />
          <FormInput
            label={t('Name (Arabic)')}
            value={newCountry.name_ar || ''}
            onChange={(e) => setNewCountry({ ...newCountry, name_ar: e.target.value })}
          />
          <FormInput
            label={t('Country Code')}
            value={newCountry.code || ''}
            onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value })}
          />
          <FormInput
            label={t('Currency Code')}
            value={newCountry.currency_code || ''}
            onChange={(e) => setNewCountry({ ...newCountry, currency_code: e.target.value })}
          />
          <FormInput
            label={t('Currency Name (English)')}
            value={newCountry.currency_name_en || ''}
            onChange={(e) => setNewCountry({ ...newCountry, currency_name_en: e.target.value })}
          />
          <FormInput
            label={t('Currency Name (Arabic)')}
            value={newCountry.currency_name_ar || ''}
            onChange={(e) => setNewCountry({ ...newCountry, currency_name_ar: e.target.value })}
          />
        </div>
        <Button onClick={handleAddCountry} className="mt-4">
          {t('Add Country')}
        </Button>
      </div>

      {/* Countries List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{t('Countries List')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">{t('Name (English)')}</th>
                <th className="px-4 py-2">{t('Name (Arabic)')}</th>
                <th className="px-4 py-2">{t('Code')}</th>
                <th className="px-4 py-2">{t('Currency')}</th>
                <th className="px-4 py-2">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country) => (
                <tr key={country.id}>
                  <td className="border px-4 py-2">
                    {editingCountry?.id === country.id ? (
                      <FormInput
                        value={editingCountry.name_en}
                        onChange={(e) => setEditingCountry({ ...editingCountry, name_en: e.target.value })}
                      />
                    ) : (
                      country.name_en
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {editingCountry?.id === country.id ? (
                      <FormInput
                        value={editingCountry.name_ar}
                        onChange={(e) => setEditingCountry({ ...editingCountry, name_ar: e.target.value })}
                      />
                    ) : (
                      country.name_ar
                    )}
                  </td>
                  <td className="border px-4 py-2">{country.code}</td>
                  <td className="border px-4 py-2">{country.currency_code}</td>
                  <td className="border px-4 py-2">
                    {editingCountry?.id === country.id ? (
                      <div className="space-x-2">
                        <Button onClick={() => handleUpdateCountry(editingCountry)} size="sm">
                          {t('Save')}
                        </Button>
                        <Button onClick={() => setEditingCountry(null)} variant="secondary" size="sm">
                          {t('Cancel')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button onClick={() => setEditingCountry(country)} variant="secondary" size="sm">
                          {t('Edit')}
                        </Button>
                        <Button onClick={() => handleDeleteCountry(country.id)} variant="danger" size="sm">
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
