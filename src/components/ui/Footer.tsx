import Link from "next/link";

const footerLinks = [
  { href: "/hackathons", label: "해커톤" },
  { href: "/camp", label: "팀 모집" },
  { href: "/rankings", label: "랭킹" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-blue-600">BatonHub</Link>
            <p className="mt-1 text-xs text-gray-500">해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지</p>
          </div>
          <nav className="flex gap-4" aria-label="푸터 내비게이션">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400">
              DACON 월간 해커톤 : 긴급 인수인계 해커톤 출품작
            </p>
            <p className="mt-1 text-xs text-gray-400">
              &copy; 2026 BatonHub. Built with Next.js + Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
