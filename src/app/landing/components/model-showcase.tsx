'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CacaoPod, { CacaoPodHandle } from './cacaopod'

gsap.registerPlugin(ScrollTrigger)

export default function ModelShowcase() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cacaoRef = useRef<CacaoPodHandle>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add({
            isMobile: "(max-width: 767px)",
            isDesktop: "(min-width: 768px)",
        }, (context) => {
            const { isMobile } = context.conditions || {};

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=300%", // Pin for 3 screen heights
                    pin: true,
                    scrub: 1,
                    onUpdate: (self) => {
                        if (cacaoRef.current?.model) {
                            // Rotate 360 degrees over the scroll duration
                            cacaoRef.current.model.rotation.y = self.progress * Math.PI * 2
                        }
                    }
                }
            })

            // Annotation 1: Left Top (Desktop) / Left Bottom (Mobile)
            tl.fromTo(".annotation-1", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 })
                .to(".annotation-1", { opacity: 0, x: -50, duration: 1 }, "+=1")

            // Annotation 2: Right Middle (Desktop) / Left Bottom (Mobile)
            // On mobile, it slides from left (-50). On desktop, from right (50).
            const xOffset2 = isMobile ? -50 : 50;
            tl.fromTo(".annotation-2", { opacity: 0, x: xOffset2 }, { opacity: 1, x: 0, duration: 1 })
                .to(".annotation-2", { opacity: 0, x: xOffset2, duration: 1 }, "+=1")

            // Annotation 3: Left Bottom
            tl.fromTo(".annotation-3", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 })
                .to(".annotation-3", { opacity: 0, x: -50, duration: 1 }, "+=1")
        });

    }, { scope: containerRef })

    return (
        <section ref={containerRef} className='h-[100svh] w-full relative overflow-hidden bg-background flex items-center justify-center will-change-transform'>

            {/* 3D Model Centered */}
            <div className='absolute inset-0 flex items-center justify-center z-10'>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl opacity-30 scale-50" />
                <CacaoPod ref={cacaoRef} className="w-full h-full" />
            </div>

            {/* Annotations Overlay */}
            <div ref={overlayRef} className='absolute inset-0 z-20 pointer-events-none grid grid-cols-1 grid-rows-[1fr_auto] md:grid-cols-12 md:grid-rows-6 gap-4 pb-2 md:pb-4'>

                {/* Annotation 1 */}
                <div className="annotation-1 row-start-2 col-start-1 place-self-end-start md:col-span-4 md:row-start-2 md:col-start-1 md:place-self-center opacity-0 max-w-[80%] md:max-w-xs">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-left">
                            <h3 className="text-5xl font-medium uppercase">Fungal Infection</h3>
                            <p className="font-light">Detects early signs of Moniliophthora roreri.</p>
                        </div>
                        
                    </div>
                </div>

                {/* Annotation 2 */}
                <div className="annotation-2 row-start-2 col-start-1 place-self-end-start md:col-span-4 md:row-start-3 md:col-start-9 md:place-self-center opacity-0 max-w-[80%] md:max-w-xs">
                    <div className="flex items-center gap-2 md:gap-4 flex-row md:flex-row-reverse">
                        <div className="text-left md:text-right">
                            <h3 className="text-5xl font-medium uppercase">Pest Damage</h3>
                            <p className="font-light">Identifies bore holes from Carmenta foraseminis.</p>
                        </div>
                        
                    </div>
                </div>

                {/* Annotation 3 */}
                <div className="annotation-3 row-start-2 col-start-1 place-self-end-start md:col-span-4 md:row-start-5 md:col-start-1 md:place-self-center opacity-0 max-w-[80%] md:max-w-xs">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-left ">
                            <h3 className="text-5xl font-medium uppercase">Structural Anomalies</h3>
                            <p className="font-light">Analyzes pod shape for growth irregularities.</p>
                        </div>
                        
                    </div>
                </div>

            </div>
        </section>
    )
}
