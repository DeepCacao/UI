"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface NavOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    confidenceThreshold?: number;
    setConfidenceThreshold?: (value: number) => void;
}

export default function NavOverlay({ isOpen, onClose, confidenceThreshold, setConfidenceThreshold }: NavOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderWrapperRef = useRef<HTMLDivElement>(null);
    const splitRefs = useRef<ReturnType<typeof SplitText.create>[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Overlay animation
            gsap.to(overlayRef.current, {
                opacity: 1,
                pointerEvents: "auto",
                duration: 0.3,
                ease: "power2.out",
            });

            // Text animation
            if (containerRef.current) {
                const textElements = containerRef.current.querySelectorAll('.animate-text');
                splitRefs.current = [];

                textElements.forEach((el) => {
                    const split = SplitText.create(el as HTMLElement, {
                        type: "lines",
                        linesClass: "line++",
                    });
                    splitRefs.current.push(split);
                });

                // Animate lines
                const lines = splitRefs.current.flatMap(split => split.lines);
                gsap.set(lines, { y: "100%" });

                gsap.to(lines, {
                    y: "0%",
                    duration: 1,
                    stagger: 0.1,
                    ease: "power4.out",
                    delay: 0.1,
                });
            }

            // Slider Animation (Slide Up)
            if (sliderWrapperRef.current) {
                gsap.fromTo(sliderWrapperRef.current,
                    { y: "100%" },
                    { y: "0%", duration: 1, ease: "power4.out", delay: 0.2 }
                );
            }

        } else {
            // Overlay animation
            gsap.to(overlayRef.current, {
                opacity: 0,
                pointerEvents: "none",
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    // Cleanup SplitText after animation is done/closed
                    splitRefs.current.forEach(split => split.revert());
                    splitRefs.current = [];
                }
            });
        }
    }, [isOpen]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100] flex flex-col items-end justify-end opacity-0 pointer-events-none p-2 md:p-4"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-2 text-xs font-semibold"
            >
                Close
            </button>
            <div ref={containerRef} className="flex flex-col gap-8 text-right items-end">
                {/* Model Name */}
                <div className="overflow-hidden">
                    <h2 className="text-4xl font-bold animate-text">Theobroma-1-beta</h2>
                </div>

                {/* Confidence Slider */}
                {confidenceThreshold !== undefined && setConfidenceThreshold && (
                    <div className="mt-8 flex flex-col items-end gap-4 w-full">
                        <div className="flex items-baseline gap-4 overflow-hidden">
                            <span className="text-4xl font-bold text-neutral-900 dark:text-white animate-text">
                                Confidence
                            </span>
                            <span className="text-4xl font-bold text-neutral-300 dark:text-neutral-700 tabular-nums animate-text">
                                {Math.round(confidenceThreshold * 100)}%
                            </span>
                        </div>

                        <div className="overflow-hidden w-full max-w-[300px] py-1">
                            <div ref={sliderWrapperRef} className="relative w-full h-12 flex items-center group">
                                {/* Track */}
                                <div className="absolute w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    {/* Fill */}
                                    <div
                                        className="h-full bg-neutral-900 dark:bg-white transition-all duration-100 ease-out"
                                        style={{ width: `${confidenceThreshold * 100}%` }}
                                    />
                                </div>

                                {/* Thumb (Visual only, follows position) */}
                                <div
                                    className="absolute h-4 w-4 bg-neutral-900 dark:bg-white rounded-full shadow-sm transition-all duration-100 ease-out pointer-events-none group-hover:scale-125"
                                    style={{
                                        left: `${confidenceThreshold * 100}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                />

                                {/* Invisible Interactive Input */}
                                <input
                                    type="range"
                                    min="25"
                                    max="95"
                                    step="5"
                                    value={confidenceThreshold * 100}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
