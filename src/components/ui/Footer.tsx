"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const footerLinks = [
  { href: "/hackathons", label: "해커톤" },
  { href: "/camp", label: "팀 모집" },
  { href: "/rankings", label: "랭킹" },
];

export function Footer() {
  const [showReset, setShowReset] = useState(false);

  function handleReset() {
    const keys = ["batonhub_hackathons", "batonhub_details", "batonhub_leaderboards", "batonhub_teams", "batonhub_submissions", "batonhub_bookmarks", "batonhub_recent", "batonhub_seeded"];
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-blue-600">BatonHub</Link>
            <p className="mt-1 text-xs text-gray-500">해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지</p>
          </div>
          <nav className="flex gap-4 items-center" aria-label="푸터 내비게이션">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-700 transition"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setShowReset(true)}
              className="text-xs text-gray-400 hover:text-red-500 transition"
              aria-label="데이터 초기화"
            >
              데이터 초기화
            </button>
          </nav>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400">
              DACON 월간 해커톤 : 긴급 인수인계 해커톤 출품작
            </p>
            <p className="mt-1 text-xs text-gray-400">
              &copy; 2026 BatonHub. Built with Next.js + Tailwind CSS
            </p>
            <p className="mt-1 text-xs text-gray-400">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1 py-0.5 text-[10px] font-medium">?</kbd> 키보드 단축키 도움말
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
