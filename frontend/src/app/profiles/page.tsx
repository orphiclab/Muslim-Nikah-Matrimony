import React from 'react';
import ProfilesHeader from '@/components/profiles/header';
import ProfilesListing from '@/components/profiles/listing';

export const metadata = {
  title: 'Browse Profiles | Muslim Nikah',
  description: 'Browse verified matrimonial profiles. Filter by age, gender, city, education and more.',
};

export default function ProfilesPage() {
  return (
    <main>
      <ProfilesHeader />
      <ProfilesListing />
    </main>
  );
}
