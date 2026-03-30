import ContactHero from '@/components/contact/hero'
import ContactInfoSection from '@/components/contact/email'
import ContactFormSection from '@/components/contact/form'
import React from 'react'
import ReadySection from '@/components/home/ready/ready'

function ContactPage() {
  return (
    <div>
        <ContactHero />
        <ContactInfoSection />
        <ContactFormSection />
        <ReadySection />        
    </div>
  )
}

export default ContactPage