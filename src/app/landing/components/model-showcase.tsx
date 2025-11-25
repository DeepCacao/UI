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

        // Annotation 1: Left Top (Fungal Infection)
        tl.fromTo(".annotation-1", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 })
            .to(".annotation-1", { opacity: 0, x: -50, duration: 1 }, "+=1")

        // Annotation 2: Right Middle (Pest Damage)
        tl.fromTo(".annotation-2", { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 1 })
            .to(".annotation-2", { opacity: 0, x: 50, duration: 1 }, "+=1")

        // Annotation 3: Left Bottom (Structural Anomalies)
        tl.fromTo(".annotation-3", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 })
            .to(".annotation-3", { opacity: 0, x: -50, duration: 1 }, "+=1")

    }, { scope: containerRef })

    return (
        <section ref={containerRef} className='h-screen w-full relative overflow-hidden bg-background flex items-center justify-center will-change-transform'>

            {/* 3D Model Centered */}
            <div className='absolute inset-0 flex items-center justify-center z-10'>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl opacity-30 scale-50" />
                <CacaoPod ref={cacaoRef} className="w-full h-full" />
            </div>

            {/* Annotations Overlay */}
            <div ref={overlayRef} className='absolute inset-0 z-20 pointer-events-none'>

                {/* Annotation 1 */}
                <div className="annotation-1 absolute top-[15%] left-4 md:left-10 lg:left-20 max-w-[150px] md:max-w-xs opacity-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-right">
                            <h3 className="text-lg md:text-2xl font-bold uppercase">Fungal Infection</h3>
                            <p className="text-xs md:text-base text-muted-foreground">Detects early signs of Moniliophthora roreri.</p>
                        </div>
                        <div className="w-8 md:w-16 h-[1px] bg-foreground/50" />
                    </div>
                </div>

                {/* Annotation 2 */}
                <div className="annotation-2 absolute top-[55%] md:top-1/2 right-4 md:right-10 lg:right-20 max-w-[150px] md:max-w-xs opacity-0 transform -translate-y-1/2">
                    <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                        <div className="text-left">
                            <h3 className="text-lg md:text-2xl font-bold uppercase">Pest Damage</h3>
                            <p className="text-xs md:text-base text-muted-foreground">Identifies bore holes from Carmenta foraseminis.</p>
                        </div>
                        <div className="w-8 md:w-16 h-[1px] bg-foreground/50" />
                    </div>
                </div>

                {/* Annotation 3 */}
                <div className="annotation-3 absolute bottom-[15%] left-4 md:left-10 lg:left-20 max-w-[150px] md:max-w-xs opacity-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-right">
                            <h3 className="text-lg md:text-2xl font-bold uppercase">Structural Anomalies</h3>
                            <p className="text-xs md:text-base text-muted-foreground">Analyzes pod shape for growth irregularities.</p>
                        </div>
                        <div className="w-8 md:w-16 h-[1px] bg-foreground/50" />
                    </div>
                </div>

            </div>
        </section>
    )
}
