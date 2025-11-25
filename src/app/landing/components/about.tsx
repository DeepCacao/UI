'use client'

export default function About() {
  return (
    <section className='grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] gap-8'>
      <div className='col-span-1 md:col-span-6 md:col-start-4 flex flex-col items-center justify-center gap-6 text-center'>
        <h2 className='text-4xl md:text-5xl font-thin uppercase tracking-widest text-foreground'>
          Our mission
        </h2>
        <p className='font-light text-muted-foreground max-w-[60ch]'>
          We are a team of researchers, developers, and agricultural experts
          dedicated to leveraging technology to support cacao farmers. Our
          mission is to provide accessible, accurate, and actionable information
          to help protect one of the world&apos;s most valuable crops.
        </p>
      </div>
    </section>
  )
}
