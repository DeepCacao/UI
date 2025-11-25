"use client";

export default function Hero() {
  return (
    <section className="grid h-screen grid-rows-2 gap-8">
      <div className="relative h-2/5 md:h-3/4 bg-foreground row-span-1">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover "
        >
          <source src="/videos/hero2.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="grid grid-cols-12 grid-rows-6 gap-y-4 gap-x-4">
        <h1 className="col-span-12 row-start-1 md:col-span-8 text-start text-4xl md:text-5xl font-medium uppercase tracking-widest">
          Cacao Scan
        </h1>
        <p className="col-span-12 row-start-2  md:col-span-4 md:col-start-9 md:row-start-1 text-start  font-light">
          The definitive digital platform for identifying, monitoring, and
          preventing the most devastating diseases affecting Theobroma cacao,
          powered by AI.
        </p>
      </div>
    </section>
  );
}
