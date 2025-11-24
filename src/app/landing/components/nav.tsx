"use client";

import Link from "next/link";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "History", href: "#history" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  return (
    <nav className="sticky top-0 text-xs md:text-sm font-semibold left-0 w-screen p-4 flex gap-4 z-20">
      <div className="flex-1">
        <Link href={NAV_ITEMS[0].href}>{NAV_ITEMS[0].label}</Link>
      </div>
      <div className="flex grow justify-between items-start">
        <div>
          {NAV_ITEMS.slice(1).map((item) => (
            <div key={item.label}>
              <Link href={item.href}>{item.label}</Link>
            </div>
          ))}
        </div>
        <div>By DeepCacao</div>
      </div>
    </nav>
  );
}
