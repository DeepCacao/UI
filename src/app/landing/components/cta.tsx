'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className='grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] gap-4 items-center'>
      <div className='col-span-1 md:col-span-6 md:col-start-4 flex flex-col items-center justify-center gap-6 text-center'>
        <h2 className='text-8xl font-medium uppercase tracking-tighter leading-[0.8]'>
          Get <br /> Started
        </h2>
        <p className='font-light text-lg max-w-md leading-relaxed'>
          Ready to protect your cacao crop? Our tool is free to use and requires
          no registration. Get started today and ensure the health of your
          plants.
        </p>
        <Link href="/home">
          <Button 
            variant="outline"
            className='rounded-none border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white px-10 py-6 text-sm uppercase tracking-[0.2em] font-light transition-all duration-300'
          >
            Launch tool
          </Button>
        </Link>
      </div>
    </section>
  )
}