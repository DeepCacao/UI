'use client'

import Link from 'next/link'
import AsciiImg from '@/components/AsciiImg/AsciiImg'

const SECTIONS = [
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ],
  },
  {
    title: 'Products',
    items: [
      { label: 'Cacao Scan', href: '/product/cacao-scan' },
      { label: 'Mobile App', href: '/product/mobile' },
      { label: 'API', href: '/product/api' },
      { label: 'Dashboard', href: '/product/dashboard' },
    ],
  },
  {
    title: 'Models',
    items: [
      { label: 'Leaf Diagnosis', href: '/models/leaf-diagnosis' },
      { label: 'Pod Detection', href: '/models/pod-detection' },
      { label: 'Yield Prediction', href: '/models/yield-prediction' },
      { label: 'Anomaly Detection', href: '/models/anomaly' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/company/about' },
      { label: 'Careers', href: '/company/careers' },
      { label: 'Contact', href: '/company/contact' },
      { label: 'Blog', href: '/company/blog' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className='relative grid grid-cols-1 md:grid-cols-12 gap-12 p-2 md:p-4 border-t min-h-[280px] items-start overflow-hidden'>
      <div className='absolute inset-0 pointer-events-none'>
        <AsciiImg
          src='/capilla.png'
          color='original'
          backgroundColor='#ffffff'
          fontSize={15}
          className='w-full h-full opacity-30 contain'
        />
      </div>
      <div className='col-span-1 md:col-span-3 flex flex-col gap-4 z-10'>
        <div className='text-2xl font-bold uppercase tracking-widest'>
          DeepCacao
        </div>
        <div className='text-sm text-muted-foreground font-light max-w-[200px]'>
          AI-powered protection for the world&apos;s most valuable crop.
        </div>
      </div>
      <div className='col-span-1 md:col-span-6 z-10'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4'>
          {SECTIONS.map((section) => (
            <div key={section.title} className='flex flex-col gap-4'>
              <div className='text-sm font-semibold uppercase tracking-wider text-foreground'>
                {section.title}
              </div>
              <div className='flex flex-col gap-3 text-sm text-muted-foreground font-light'>
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className='hover:text-foreground transition-colors'
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='col-span-1 md:col-span-3 flex items-end justify-start md:justify-end z-10 h-full'>
        <div className='text-sm text-muted-foreground font-light'>
          © 2025 DeepCacao Inc.
        </div>
      </div>
    </footer>
  )
}
