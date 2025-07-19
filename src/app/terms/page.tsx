'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

type LanguageKey = 'en' | 'ar';

export default function TermsPage() {
  const { t } = useLanguage();

  const currentLang = t('currentLang') as LanguageKey;

  const termsContent = [
    {
      title: {
        en: 'Acceptance of Terms',
        ar: 'قبول الشروط'
      },
      content: {
        en: 'By accessing and using Reyada Time, you agree to be bound by these Terms and Conditions. These terms govern your use of our platform and services.',
        ar: 'من خلال الوصول واستخدام Reyada Time، توافق على الالتزام بهذه الشروط والأحكام.'
      }
    },
    {
      title: {
        en: 'Services',
        ar: 'الخدمات'
      },
      content: {
        en: 'Reyada Time provides a platform for booking sports facilities and activities across various locations. We offer a comprehensive service to connect users with sports venues and experiences.',
        ar: 'توفر Reyada Time منصة لحجز المرافق والأنشطة الرياضية في مواقع مختلفة.'
      }
    },
    {
      title: {
        en: 'User Responsibilities',
        ar: 'مسؤوليات المستخدم'
      },
      content: {
        en: 'Users are responsible for maintaining the confidentiality of their account and for all activities under their account. You must provide accurate information and use the platform in compliance with local laws.',
        ar: 'يتحمل المستخدمون مسؤولية الحفاظ على سرية حسابهم وجميع الأنشطة تحت حسابهم.'
      }
    },
    {
      title: {
        en: 'Booking and Cancellation',
        ar: 'الحجز والإلغاء'
      },
      content: {
        en: 'Bookings are subject to venue availability. Cancellations must be made according to the specific venue\'s policy. Late cancellations may incur fees.',
        ar: 'تخضع الحجوزات لتوفر المرافق. يجب إجراء الإلغاءات وفقًا لسياسة المرفق المحدد.'
      }
    },
    {
      title: {
        en: 'Payment and Fees',
        ar: 'الدفع والرسوم'
      },
      content: {
        en: 'All prices are in local currency. Payment is required at the time of booking. Additional fees may apply for certain services or cancellations.',
        ar: 'جميع الأسعار بالعملة المحلية. الدفع مطلوب عند الحجز.'
      }
    },
    {
      title: {
        en: 'Privacy and Data',
        ar: 'الخصوصية والبيانات'
      },
      content: {
        en: 'We collect and use personal information as described in our Privacy Policy. By using our platform, you consent to our data practices.',
        ar: 'نجمع ونستخدم المعلومات الشخصية كما هو موضح في سياسة الخصوصية.'
      }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">{t('termsPageTitle')}</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
        <p className="text-sm text-gray-600 mb-2">{t('termsLastUpdated')}: May 2025</p>
        <p className="italic text-gray-700 dark:text-gray-300">{t('termsIntro')}</p>
      </div>

      {termsContent.map((section, index) => (
        <div key={index} className="mb-8 border-b pb-6 last:border-b-0">
          <h2 className="text-2xl font-semibold mb-4 text-primary-600 dark:text-primary-400">
            {section.title[currentLang]}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {section.content[currentLang]}
          </p>
        </div>
      ))}

      <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          {currentLang === 'en' 
            ? '© 2025 Reyada Time. All rights reserved.' 
            : '© 2025 Reyada Time. جميع الحقوق محفوظة.'}
        </p>
        <p>
          {currentLang === 'en' 
            ? 'For any questions, please contact our support team.' 
            : 'للاستفسارات، يرجى التواصل مع فريق الدعم.'}
        </p>
      </div>
    </div>
  );
}
