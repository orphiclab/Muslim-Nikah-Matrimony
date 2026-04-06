import React from 'react'
import Hero from '@/components/home/hero/Hero'
import About from '@/components/home/journey/about'
import JourneyCards from '@/components/home/journey/cards'
import SafetyHeader from '@/components/home/safety/header'
import SafetyCards from '@/components/home/safety/cards'
import GenuineSection from '@/components/home/genuine/genie'
import EverythingSection from '@/components/home/everthing/everthig'
import ReadySection from '@/components/home/ready/ready'

function page() {
  return (
    <main>
      <Hero />
      <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="2000">
      <About />
      <JourneyCards />
      </div>
      <GenuineSection />
      <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="1500">
      <SafetyHeader />
      <SafetyCards />
      </div>
      <div data-aos="fade-up"  data-aos-duration="1500">
      <EverythingSection />
      </div>  
      <ReadySection />
  
    </main>
  )
}

export default page