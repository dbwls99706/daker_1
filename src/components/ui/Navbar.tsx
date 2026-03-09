"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "BatonHub" },
  { href: "/hackathons", label: "해커톤" },
  { href: "/camp", label: "캠프" },
  { href: "/rankings", label: "랭킹" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
          BatonHub
        </Link>
        <div className="flex items-center gap-1">
          {links.slice(1).map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
