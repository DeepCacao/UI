'use client'

export default function CTA() {
  return (
    <section className='grid grid-cols-12 gap-8 p-8'>
      <div className='col-span-6 col-start-4 flex flex-col items-center justify-center gap-4 text-center'>
        <h2 className='text-4xl font-thin uppercase tracking-widest'>
          Get started
        </h2>
        <p className='font-light'>
          Ready to protect your cacao crop? Our tool is free to use and requires
          no registration. Get started today and ensure the health of your
          plants.
        </p>
        <button className='border border-neutral-800 px-8 py-3 font-light uppercase tracking-widest'>
          Launch tool
        </button>
      </div>
    </section>
  )
}