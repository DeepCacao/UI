'use client'



export default function Features() {
  return (
    <section className='grid h-screen grid-cols-12 grid-rows-6 gap-4'>

      <div className='col-span-8 row-start-1'>
        <p className='font-light'>
          Computer vision, a keen digital eye, Inspects each pod as the seasons roll by, Detecting disease and the pests that might creep, Predicting the yield while the farmers all sleep, Optimizing water and nutrient supply, Ensuring the finest of harvests they tie.
        </p>
      </div>

      <div className='col-span-4 row-start-3 flex flex-col gap-4'>
        <h1 className='text-8xl font-medium'>
          99%
        </h1>
        <h3 className='text-2xl font-thin uppercase tracking-widest'>
          DETECTION ACCURACY
        </h3>
        <p className='font-light'>
          Our cutting-edge Computer Vision model identifies key pests and diseases with 99% precision, providing instant, reliable diagnostics.
        </p>
      </div>
      <div className='col-span-4 row-start-3 flex flex-col gap-4'>
        <h1 className='text-8xl font-medium'>
          25%
        </h1>
        <h3 className='text-2xl font-thin uppercase tracking-widest'>
          LOSS REDUCTION
        </h3>
        <p className='font-light'>
          Our advanced computer vision model provides instant feedback on cacao leaf health and disease identification in under 3 seconds.
        </p>
      </div>
      <div className='col-span-4 row-start-3 flex flex-col gap-4'>
        <h1 className='text-8xl font-medium'>
          &lt;3s
        </h1>
        <h3 className='text-2xl font-thin uppercase tracking-widest'>
          REAL-TIME DIAGNOSIS
        </h3>
        <p className='font-light'>
          Our advanced computer vision model provides instant feedback on cacao leaf health and disease identification in under 3 seconds.
        </p>
      </div>
    </section>
  )
}