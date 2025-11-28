'use client'

export default function About() {
  return (
    <section className='grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] gap-8 items-center'>
      <div className='col-span-1 md:col-span-5 md:col-start-2'>
        <h2 className='text-8xl font-medium uppercase tracking-tighter leading-[0.8]'>
          Our <br /> Mission
        </h2>
      </div>
      <div className='col-span-1 md:col-span-5 md:col-start-7 flex flex-col gap-8'>
        <p className='font-light leading-relaxed'>
          We are a team of researchers, developers, and agricultural experts
          dedicated to leveraging technology to support cacao farmers.
        </p>
        <p className='font-light'>
          Our mission is to provide accessible, accurate, and actionable
          information to help protect one of the world&apos;s most valuable
          crops.
        </p>
      </div>
    </section>
  )
}
