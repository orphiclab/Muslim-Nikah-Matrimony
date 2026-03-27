import React from 'react'
import PackagesHeader from '@/components/packages/header'
import PricingCards from '@/components/packages/priceCard'
import FaqSection from '@/components/packages/faq'
import PlanSection from '@/components/packages/plan'


function packages() {
  return (
    <div>
        <PackagesHeader />
        <PricingCards />
        <FaqSection />
        <PlanSection />     
    </div>
  )
}

export default packages