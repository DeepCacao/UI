'use client'
import About from '../landing/components/about'
import CTA from '../landing/components/cta'
import Features from '../landing/components/features'
import Hero from '../landing/components/hero'
import ModelShowcase from '../landing/components/model-showcase'

export default function Page() {
  return (
    <div className='bg-background px-2 md:px-4'>
      <Hero />
      <ModelShowcase />
      <Features />
      <About />
      <CTA />
    </div>
  )
}
