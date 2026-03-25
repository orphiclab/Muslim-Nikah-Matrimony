import React from 'react'
import Hero from '@/components/home/hero/Hero'
import About from '@/components/home/journey/about'
import JourneyCards from '@/components/home/journey/cards'

function page() {
  return (
    <main>
      <Hero />
      <About />
      <JourneyCards />
    </main>
  )
}

export default page