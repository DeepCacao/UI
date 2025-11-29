"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

interface NavOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    confidenceThreshold?: number;
    setConfidenceThreshold?: (value: number) => void;
    nmsThreshold?: number;
    setNmsThreshold?: (value: number) => void;
}

export default function NavOverlay({ isOpen, onClose, confidenceThreshold, setConfidenceThreshold, nmsThreshold, setNmsThreshold }: NavOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderWrapperRef = useRef<HTMLDivElement>(null);
    const nmsSliderWrapperRef = useRef<HTMLDivElement>(null);
    const downloadBtnRef = useRef<HTMLDivElement>(null);
    const splitRefs = useRef<ReturnType<typeof SplitText.create>[]>([]);

    const [isPWA, setIsPWA] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');

    useEffect(() => {
        // Check if PWA
        if (typeof window !== 'undefined') {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
            setIsPWA(isStandalone);

            // Check if model is already cached
            caches.open('cacao-model-cache-v1').then(cache => {
                cache.match('/_model/best.onnx').then(response => {
                    if (response) setDownloadStatus('done');
                });
            });
        }
    }, []);

    const handleDownloadModel = async () => {
        if (downloadStatus === 'downloading' || downloadStatus === 'done') return;

        setDownloadStatus('downloading');
        const MODEL_URLS = [
            '/_model/best.onnx',
            '/_model/ort-wasm-simd-threaded.wasm',
            '/_model/ort-wasm-simd-threaded.mjs',
            '/_model/ort-wasm-simd-threaded.jsep.wasm',
        ];

        try {
            await Promise.all(MODEL_URLS.map(url => fetch(url)));
            setDownloadStatus('done');
        } catch (e) {
            console.error("Error downloading model:", e);
            setDownloadStatus('error');
        }
    };

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
            if (nmsSliderWrapperRef.current) {
                gsap.fromTo(nmsSliderWrapperRef.current,
                    { y: "100%" },
                    { y: "0%", duration: 1, ease: "power4.out", delay: 0.3 }
                );
            }
            if (downloadBtnRef.current) {
                gsap.fromTo(downloadBtnRef.current,
                    { y: "100%", opacity: 0 },
                    { y: "0%", opacity: 1, duration: 1, ease: "power4.out", delay: 0.4 }
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
                            <span className="text-4xl font-bold text-neutral-300 dark:text-neutral-700 tabular-nums">
                                {Math.round(confidenceThreshold * 100)}%
                            </span>
                        </div>

                        <div className="w-full max-w-[300px] py-1 px-2">
                            <div ref={sliderWrapperRef} className="relative w-full h-12 flex items-center group">
                                {/* Track */}
                                <div className="absolute w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    {/* Fill */}
                                    <div
                                        className="h-full bg-neutral-900 dark:bg-white"
                                        style={{ width: `${confidenceThreshold * 100}%` }}
                                    />
                                </div>

                                {/* Thumb (Visual only, follows position) */}
                                <div
                                    className="absolute h-4 w-4 bg-neutral-900 dark:bg-white rounded-full shadow-sm pointer-events-none group-hover:scale-125 transition-transform duration-100"
                                    style={{
                                        left: `${confidenceThreshold * 100}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                />

                                {/* Invisible Interactive Input */}
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={confidenceThreshold * 100}
                                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 touch-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* NMS Threshold Slider */}
                {nmsThreshold !== undefined && setNmsThreshold && (
                    <div className="flex flex-col items-end gap-4 w-full">
                        <div className="flex items-baseline gap-4 overflow-hidden">
                            <span className="text-4xl font-bold text-neutral-900 dark:text-white animate-text">
                                NMS Threshold
                            </span>
                            <span className="text-4xl font-bold text-neutral-300 dark:text-neutral-700 tabular-nums">
                                {Math.round(nmsThreshold * 100)}%
                            </span>
                        </div>

                        <div className="w-full max-w-[300px] py-1 px-2">
                            <div ref={nmsSliderWrapperRef} className="relative w-full h-12 flex items-center group">
                                {/* Track */}
                                <div className="absolute w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    {/* Fill */}
                                    <div
                                        className="h-full bg-neutral-900 dark:bg-white"
                                        style={{ width: `${nmsThreshold * 100}%` }}
                                    />
                                </div>

                                {/* Thumb (Visual only, follows position) */}
                                <div
                                    className="absolute h-4 w-4 bg-neutral-900 dark:bg-white rounded-full shadow-sm pointer-events-none group-hover:scale-125 transition-transform duration-100"
                                    style={{
                                        left: `${nmsThreshold * 100}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                />

                                {/* Invisible Interactive Input */}
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={nmsThreshold * 100}
                                    onChange={(e) => setNmsThreshold(Number(e.target.value) / 100)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 touch-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Download Model Button (PWA Only) */}
                {isPWA && (
                    <div className="mt-8 overflow-hidden w-full flex justify-end">
                        <div ref={downloadBtnRef} className="opacity-0 translate-y-full">
                            <button
                                onClick={handleDownloadModel}
                                disabled={downloadStatus === 'downloading' || downloadStatus === 'done'}
                                className={`
                                    relative px-6 py-3 text-sm font-semibold tracking-widest uppercase border transition-all duration-300
                                    ${downloadStatus === 'done'
                                        ? 'border-green-500 text-green-500 cursor-default'
                                        : downloadStatus === 'error'
                                            ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                                            : 'border-neutral-900 dark:border-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black'
                                    }
                                `}
                            >
                                {downloadStatus === 'idle' && 'Download Model Offline'}
                                {downloadStatus === 'downloading' && 'Downloading...'}
                                {downloadStatus === 'done' && 'Model Downloaded ✓'}
                                {downloadStatus === 'error' && 'Retry Download'}
                            </button>
                            {downloadStatus === 'done' && (
                                <p className="text-[10px] text-neutral-500 mt-2 text-right">
                                    Ready for offline use
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
