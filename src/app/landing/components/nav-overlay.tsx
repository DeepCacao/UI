"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
interface NavOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    items: { label: string; href: string }[];
}

export default function NavOverlay({ isOpen, onClose, items }: NavOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const linksRef = useRef<HTMLDivElement>(null);
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
            if (linksRef.current) {
                const links = Array.from(linksRef.current.children) as HTMLElement[];
                splitRefs.current = [];

                links.forEach((link) => {
                    const split = SplitText.create(link, {
                        type: "lines",
                        linesClass: "line++",
                    });
                    splitRefs.current.push(split);

                    // Handle potential text indent issues (copied from TextReveal)
                    const computedStyle = window.getComputedStyle(link);
                    const textIndent = computedStyle.textIndent;
                    if (textIndent && textIndent !== "0px") {
                        if (split.lines.length > 0 && split.lines[0] instanceof HTMLElement) {
                            (split.lines[0] as HTMLElement).style.paddingLeft = textIndent;
                        }
                        link.style.textIndent = "0";
                    }
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
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-end justify-end opacity-0 pointer-events-none p-2 md:p-4"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-2 text-xs font-semibold"
            >
                Close
            </button>
            <div ref={linksRef} className="flex flex-col gap-8 text-right">
                {items.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        className="text-4xl font-bold hover:text-primary transition-colors overflow-hidden block"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
