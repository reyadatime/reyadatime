import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Reyada Time',
};

export default function TermsLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
}
