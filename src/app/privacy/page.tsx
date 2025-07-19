'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  const PrivacySection = ({ title, description }: { title: string, description: string }) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-primary dark:text-primary-light">{title}</h2>
      <p className="text-gray-700 dark:text-gray-300">{description}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-primary dark:text-primary-light">
        {t('privacyPageTitle')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('privacyLastUpdated')}
      </p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          {t('privacyIntro')}
        </p>

        <PrivacySection 
          title={t('privacyInformationCollection')} 
          description={t('privacyInformationCollectionDesc')} 
        />

        <PrivacySection 
          title={t('privacyInformationUsage')} 
          description={t('privacyInformationUsageDesc')} 
        />

        <PrivacySection 
          title={t('privacyThirdPartyDisclosure')} 
          description={t('privacyThirdPartyDisclosureDesc')} 
        />

        <PrivacySection 
          title={t('privacySecurity')} 
          description={t('privacySecurityDesc')} 
        />

        <PrivacySection 
          title={t('privacyCookies')} 
          description={t('privacyCookiesDesc')} 
        />

        <PrivacySection 
          title={t('privacyUserRights')} 
          description={t('privacyUserRightsDesc')} 
        />

        <PrivacySection 
          title={t('privacyContactUs')} 
          description={t('privacyContactUsDesc')} 
        />
      </div>
    </div>
  );
}
