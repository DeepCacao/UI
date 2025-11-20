"use client";

export default function Nav() {
  const links = [
    { href: "", label: "History" },
    { href: "", label: "Pricing" },
    { href: "", label: "Contact" },
  ];
  return (
    <nav className="sticky top-0 text-xs md:text-sm font-semibold left-0 w-screen p-4 flex gap-4 z-20">
      <div className="flex-1">Home</div>
      <div className="flex flex-grow justify-between items-start">
        <div>
          <div>History</div>
          <div>Pricing</div>
          <div>Contact</div>
        </div>
        <div>By DeepCacao</div>
      </div>
    </nav>
  );
}
