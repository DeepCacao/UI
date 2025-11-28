"use client";
import PixelatedVideo from "@/components/PixelatedVideo/PixelatedVideo";

export default function Hero() {
  return (
    <section className="grid h-[calc(100vh-5rem)] grid-rows-2 gap-8">
      <div className="relative h-2/5 md:h-3/4 row-span-1">
        <PixelatedVideo 
          autoPlay
          muted
          loop
          playsInline
          src="/videos/hero2.mp4"
          className="absolute inset-0 w-full rounded-xl h-full object-cover "
        />
        {/* <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full rounded-xl h-full object-cover "
        >
          <source src="/videos/hero2.mp4" type="video/mp4" />
        </video> */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-y-4 gap-x-4">
        <h1 className="md:col-span-8 md:row-start-1 text-start text-4xl md:text-5xl font-medium uppercase tracking-widest">
          Cacao Scan
        </h1>
        <p className="md:col-span-4 md:col-start-9 md:row-start-1 text-start font-light">
          The definitive digital platform for identifying, monitoring, and
          preventing the most devastating diseases affecting Theobroma cacao,
          powered by AI.
        </p>
      </div>
    </section>
  );
}
