"use client";

import { useState } from "react";
import NavOverlay from "./nav-overlay";



interface NavProps {
    confidenceThreshold?: number
    setConfidenceThreshold?: (value: number) => void
    nmsThreshold?: number
    setNmsThreshold?: (value: number) => void
}

export default function Nav({ confidenceThreshold, setConfidenceThreshold, nmsThreshold, setNmsThreshold }: NavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 text-xs md:text-sm font-semibold left-0 w-full p-2 py-4 md:p-4 flex gap-4 z-50 mix-blend-difference pointer-events-none">
                <div className="flex grow justify-end items-start pointer-events-auto">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-white cursor-pointer"
                        type="button"
                    >
                        Menu
                    </button>
                </div>
            </nav>
            <NavOverlay
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                confidenceThreshold={confidenceThreshold}
                setConfidenceThreshold={setConfidenceThreshold}
                nmsThreshold={nmsThreshold}
                setNmsThreshold={setNmsThreshold}
            />
        </>
    );
}
