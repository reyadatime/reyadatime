'use client';

import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface Facility {
  id: number;
  facility_name_en: string;
  facility_name_ar: string;
  facility_description_en: string;
  facility_description_ar: string;
  facility_type: string;
  owner_id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  owner: {
    email: string;
  };
  country: {
    name_en: string;
    name_ar: string;
  };
  city: {
    name_en: string;
    name_ar: string;
  };
  address_en: string;
  address_ar: string;
  sport_types: string[];
  amenities_en: string[];
  amenities_ar: string[];
  rules_en: string[];
  rules_ar: string[];
  currency: string;
  capacity: number;
  price_per_hour?: number;
}

export default function AdminFacilities() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: string) => key; // TODO: Add translations
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchFacilities();
  }, [filter]);

  const fetchFacilities = async () => {
    try {
      let query = supabase
        .from('facilities')
        .select('*, country:countries(name_en, name_ar), city:cities(name_en, name_ar)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data: facilitiesData, error: facilitiesError } = await query;
      if (facilitiesError) throw facilitiesError;

      // Fetch owner emails separately
      if (facilitiesData && facilitiesData.length > 0) {
        const ownerIds = [...new Set(facilitiesData.map(f => f.owner_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', ownerIds);

        if (profilesError) throw profilesError;

        // Map owner emails to facilities
        const facilities = facilitiesData.map(facility => ({
          ...facility,
          owner: {
            email: profilesData?.find(p => p.id === facility.owner_id)?.email || 'Unknown'
          }
        }));

        setFacilities(facilities);
      } else {
        setFacilities([]);
      }
    } catch (error) {
      toast.error('Failed to fetch facilities');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: Facility['verification_status']) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ verification_status: status })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Facility ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchFacilities();
    } catch (error) {
      toast.error('Failed to update facility status');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t('Manage Facilities')}</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          className="p-2 border rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">{t('All Facilities')}</option>
          <option value="pending">{t('Pending Review')}</option>
          <option value="approved">{t('Approved')}</option>
          <option value="rejected">{t('Rejected')}</option>
        </select>
      </div>

      {/* Facilities List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">{t('Facility Name')}</th>
                <th className="px-4 py-2">{t('Owner Email')}</th>
                <th className="px-4 py-2">{t('Location')}</th>
                <th className="px-4 py-2">{t('Status')}</th>
                <th className="px-4 py-2">{t('Created At')}</th>
                <th className="px-4 py-2">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td className="border px-4 py-2">
                    {language === 'ar' ? facility.facility_name_ar : facility.facility_name_en}
                  </td>
                  <td className="border px-4 py-2">{facility.owner.email}</td>
                  <td className="border px-4 py-2">
                    {language === 'ar'
                      ? `${facility.city.name_ar}, ${facility.country.name_ar}`
                      : `${facility.city.name_en}, ${facility.country.name_en}`}
                  </td>
                  <td className="border px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded ${facility.verification_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : facility.verification_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'}`}
                    >
                      {t(facility.verification_status)}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(facility.created_at).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">
                    <div className="space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedFacility(facility);
                          setIsDetailsModalOpen(true);
                        }}
                        variant="default"
                        size="sm"
                      >
                        {t('View Details')}
                      </Button>
                      {facility.verification_status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleUpdateStatus(facility.id, 'approved')}
                            variant="default"
                            size="sm"
                          >
                            {t('Approve')}
                          </Button>
                          <Button
                            onClick={() => handleUpdateStatus(facility.id, 'rejected')}
                            variant="danger"
                            size="sm"
                          >
                            {t('Reject')}
                          </Button>
                        </>
                      )}
                      {facility.verification_status === 'rejected' && (
                        <Button
                          onClick={() => handleUpdateStatus(facility.id, 'approved')}
                          variant="default"
                          size="sm"
                        >
                          {t('Approve')}
                        </Button>
                      )}
                      {facility.verification_status === 'approved' && (
                        <Button
                          onClick={() => handleUpdateStatus(facility.id, 'rejected')}
                          variant="danger"
                          size="sm"
                        >
                          {t('Reject')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Facility Details Modal */}
      <Transition appear show={isDetailsModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsDetailsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {language === 'en' ? selectedFacility?.facility_name_en : selectedFacility?.facility_name_ar}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('Basic Information')}</h4>
                        <dl className="mt-2 space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">{t('Facility Name (English)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.facility_name_en}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Facility Name (Arabic)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.facility_name_ar}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Description (English)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.facility_description_en}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Description (Arabic)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.facility_description_ar}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Facility Type')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.facility_type}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('Location & Contact')}</h4>
                        <dl className="mt-2 space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">{t('Country')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">
                              {language === 'en' ? selectedFacility?.country?.name_en : selectedFacility?.country?.name_ar}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('City')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">
                              {language === 'en' ? selectedFacility?.city?.name_en : selectedFacility?.city?.name_ar}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Address (English)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.address_en}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Address (Arabic)')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.address_ar}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">{t('Owner Email')}</dt>
                            <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.owner?.email}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('Facility Details')}</h4>
                      <dl className="mt-2 space-y-2">
                        <div>
                          <dt className="text-sm text-gray-500">{t('Sports')}</dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100">
                            {(selectedFacility?.sport_types as string[])?.join(', ') || t('None')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">{t('Amenities (English)')}</dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedFacility?.amenities_en?.join(', ') || t('None')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">{t('Amenities (Arabic)')}</dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedFacility?.amenities_ar?.join(', ') || t('None')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">{t('Price per Hour')}</dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedFacility?.price_per_hour} {selectedFacility?.currency}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">{t('Capacity')}</dt>
                          <dd className="text-sm text-gray-900 dark:text-gray-100">{selectedFacility?.capacity}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="default"
                      onClick={() => setIsDetailsModalOpen(false)}
                    >
                      {t('Close')}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
