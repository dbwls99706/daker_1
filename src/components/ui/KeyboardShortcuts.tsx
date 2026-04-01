"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";

const shortcuts = [
  { keys: ["Ctrl+K", "⌘+K"], description: "커맨드 팔레트 열기 (검색/이동/액션)" },
  { keys: ["↑ / ↓"], description: "커맨드 팔레트 항목 선택" },
  { keys: ["Enter"], description: "선택 항목 실행" },
  { keys: ["Escape"], description: "검색/모달 닫기" },
  { keys: ["?"], description: "키보드 단축키 도움말" },
  { keys: ["Tab"], description: "다음 요소로 이동" },
  { keys: ["← / →"], description: "해커톤 상세 탭 전환" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="키보드 단축키"
      actions={
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          닫기
        </button>
      }
    >
      <div className="space-y-2">
        {shortcuts.map((s) => (
          <div key={s.description} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700">{s.description}</span>
            <div className="flex gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
