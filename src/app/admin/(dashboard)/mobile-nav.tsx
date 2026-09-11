"use client";

import { useRouter } from "next/navigation";

export function MobileNavSelect({ navItems }: { navItems: { href: string; label: string }[] }) {
  const router = useRouter();
  return (
    <select 
      className="bg-transparent border-none text-sm font-medium outline-none"
      onChange={(e) => {
        if(e.target.value) {
          router.push(e.target.value);
        }
      }}
    >
      <option value="">Navigation...</option>
      {navItems.map((item) => (
         <option key={item.href} value={item.href}>{item.label}</option>
      ))}
    </select>
  );
}
