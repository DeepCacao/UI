'use client'

export default function About() {
  return (
    <section className='grid grid-cols-12 h-screen gap-8  bg-neutral-900 text-white'>
      <div className='col-span-6 col-start-4 flex flex-col items-center justify-center gap-4 text-center'>
        <h2 className='text-4xl font-thin uppercase tracking-widest'>
          Our mission
        </h2>
        <p className='font-light'>
          We are a team of researchers, developers, and agricultural experts
          dedicated to leveraging technology to support cacao farmers. Our
          mission is to provide accessible, accurate, and actionable information
          to help protect one of the world's most valuable crops.
        </p>
      </div>
    </section>
  )
}