"use client";

import { useState } from "react";
import NavOverlay from "./nav-overlay";



interface NavProps {
    confidenceThreshold?: number
    setConfidenceThreshold?: (value: number) => void
}

export default function Nav({ confidenceThreshold, setConfidenceThreshold }: NavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <nav className="sticky top-0 text-xs md:text-sm font-semibold left-0 w-screen p-2 py-4 md:p-4 flex gap-4 z-20 pointer-events-none">
                <div className="flex grow justify-end items-start pointer-events-auto">
                    <button
                        onClick={() => setIsMenuOpen(true)}
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
            />
        </>
    );
}
