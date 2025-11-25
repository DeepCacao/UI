"use client";

import Link from "next/link";
import { useState } from "react";
import NavOverlay from "./nav-overlay";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "History", href: "#history" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 text-xs md:text-sm font-semibold left-0 w-screen p-2 py-4 md:p-4 flex gap-4 z-20">
        <div className="flex-1 hidden md:block">
          <Link href={NAV_ITEMS[0].href}>{NAV_ITEMS[0].label}</Link>
        </div>
        <div className="flex grow justify-end md:justify-between items-start">
          <div className="hidden md:block">
            {NAV_ITEMS.slice(1).map((item) => (
              <div key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </div>
            ))}
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden"
          >
            Menu
          </button>
          <div className="hidden md:block">By DeepCacao</div>
        </div>
      </nav>
      <NavOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={NAV_ITEMS}
      />
    </>
  );
}
