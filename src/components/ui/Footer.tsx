"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";

const footerLinks = [
  { href: "/hackathons", label: "해커톤", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/camp", label: "팀 모집", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/rankings", label: "랭킹", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

export function Footer() {
  const [showReset, setShowReset] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSecretClick() {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      setShowReset(true);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  }

  function handleReset() {
    const keys = ["batonhub_hackathons", "batonhub_details", "batonhub_leaderboards", "batonhub_teams", "batonhub_submissions", "batonhub_bookmarks", "batonhub_recent", "batonhub_seeded", "batonhub_my_teams", "batonhub_joined_teams"];
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white" role="contentinfo" style={{ borderImage: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899) 1" }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">BatonHub</Link>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드</p>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-3" aria-label="푸터 내비게이션">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">탐색</h3>
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition"
              >
                <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Info */}
          <div className="text-right sm:text-right">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">정보</h3>
            <p className="mt-3 text-xs text-gray-400">
              DACON 월간 해커톤 : 긴급 인수인계 해커톤 출품작
            </p>
            <p
              className="mt-2 text-xs text-gray-400 select-none cursor-default"
              onClick={handleSecretClick}
            >
              &copy; 2026 BatonHub. Built with Next.js + Tailwind CSS
            </p>
            <p className="mt-2 text-xs text-gray-400 flex items-center justify-end gap-1.5">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">?</kbd>
              <span>키보드 단축키 도움말</span>
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title="데이터 초기화"
        actions={
          <>
            <button
              onClick={() => setShowReset(false)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition btn-press"
            >
              취소
            </button>
            <button
              onClick={handleReset}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition btn-press"
            >
              초기화
            </button>
          </>
        }
      >
        <p>모든 데이터를 초기화합니다. 저장된 북마크, 제출물, 팀 데이터가 삭제됩니다.</p>
        <p className="mt-2 text-sm text-gray-500">페이지가 새로고침되며 시드 데이터가 다시 로드됩니다.</p>
      </Modal>
    </footer>
  );
}
