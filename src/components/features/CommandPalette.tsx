"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getHackathons, getTeams, getBookmarks, toggleBookmark } from "@/lib/storage";
import { fuzzyMatch, highlightMatches } from "@/lib/fuzzy";
import { statusLabel, getDday } from "@/lib/utils";

const RECENT_KEY = "batonhub_cmd_recent";
const MAX_RECENT = 5;

interface CmdItem {
  id: string;
  category: string;
  icon: string;
  title: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
  badge?: { text: string; color: string };
  score?: number;
  indices?: number[];
}

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRecent(id: string) {
  const list = getRecent().filter((r) => r !== id);
  list.unshift(id);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {}
}

function HighlightText({ text, indices }: { text: string; indices?: number[] }) {
  if (!indices || indices.length === 0) return <>{text}</>;
  const parts = highlightMatches(text, indices);
  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <span key={i} className="text-blue-600 font-semibold">{p.char}</span>
        ) : (
          <span key={i}>{p.char}</span>
        )
      )}
    </>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Ctrl+K / Cmd+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Auto-focus input & lock body scroll
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Build items
  const allItems = useMemo<CmdItem[]>(() => {
    if (!open) return [];
    const items: CmdItem[] = [];

    // Pages
    const pages = [
      { id: "page-home", icon: "🏠", title: "홈", href: "/" },
      { id: "page-hackathons", icon: "🏆", title: "해커톤 목록", href: "/hackathons" },
      { id: "page-camp", icon: "👥", title: "팀원 모집 (캠프)", href: "/camp" },
      { id: "page-rankings", icon: "📊", title: "글로벌 랭킹", href: "/rankings" },
    ];
    pages.forEach((p) => items.push({ ...p, category: "페이지" }));

    // Hackathons
    try {
      const hackathons = getHackathons();
      const bookmarks = getBookmarks();
      for (const h of hackathons) {
        items.push({
          id: `hack-${h.slug}`,
          category: "해커톤",
          icon: h.status === "ongoing" ? "🟢" : h.status === "upcoming" ? "🔵" : "⚫",
          title: h.title,
          subtitle: h.tags.join(", "),
          href: `/hackathons/${h.slug}`,
          badge: h.status !== "ended"
            ? { text: getDday(h.period.submissionDeadlineAt), color: "text-orange-600 bg-orange-50" }
            : { text: statusLabel(h.status), color: "text-gray-500 bg-gray-100" },
        });
        // Bookmark state for actions
        if (bookmarks.includes(h.slug)) {
          items.push({
            id: `unbookmark-${h.slug}`,
            category: "빠른 액션",
            icon: "⭐",
            title: `"${h.title}" 북마크 제거`,
            action: () => { toggleBookmark(h.slug); },
          });
        }
      }

      // Teams
      const teams = getTeams();
      for (const t of teams) {
        if (!t.isOpen) continue;
        items.push({
          id: `team-${t.teamCode}`,
          category: "팀",
          icon: "👥",
          title: t.name,
          subtitle: t.lookingFor.join(", "),
          href: t.hackathonSlug ? `/camp?hackathon=${t.hackathonSlug}` : "/camp",
          badge: { text: `${t.memberCount}명`, color: "text-green-600 bg-green-50" },
        });
      }
    } catch {}

    // Quick Actions
    items.push({
      id: "action-dark",
      category: "빠른 액션",
      icon: "🌓",
      title: "다크 모드 토글",
      action: () => {
        const isDark = document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", !isDark);
        localStorage.setItem("batonhub_dark", String(!isDark));
      },
    });
    items.push({
      id: "action-create-team",
      category: "빠른 액션",
      icon: "➕",
      title: "새 팀 만들기",
      href: "/camp",
    });
    items.push({
      id: "action-shortcuts",
      category: "빠른 액션",
      icon: "⌨️",
      title: "키보드 단축키 보기",
      action: () => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
      },
    });

    return items;
  }, [open]);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent + pages + quick actions when no query
      const recent = getRecent();
      const recentItems = recent
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is CmdItem => !!item)
        .map((item) => ({ ...item, category: "최근" }));

      const pages = allItems.filter((i) => i.category === "페이지");
      const actions = allItems.filter((i) => i.category === "빠른 액션").slice(0, 3);
      return [...recentItems, ...pages, ...actions];
    }

    return allItems
      .map((item) => {
        const titleMatch = fuzzyMatch(query, item.title);
        const subMatch = item.subtitle ? fuzzyMatch(query, item.subtitle) : { match: false, score: 0, indices: [] };
        const bestScore = Math.max(titleMatch.score, subMatch.score);
        if (!titleMatch.match && !subMatch.match) return null;
        return {
          ...item,
          score: bestScore,
          indices: titleMatch.score >= subMatch.score ? titleMatch.indices : undefined,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => (b!.score ?? 0) - (a!.score ?? 0))
      .slice(0, 15);
  }, [query, allItems]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const execute = useCallback((item: CmdItem) => {
    addRecent(item.id);
    setOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) execute(filtered[selectedIdx]);
    }
  }, [filtered, selectedIdx, execute]);

  if (!open) return null;

  // Group items by category
  const groups: { category: string; items: CmdItem[] }[] = [];
  for (const item of filtered) {
    const existing = groups.find((g) => g.category === item.category);
    if (existing) existing.items.push(item);
    else groups.push({ category: item.category, items: [item] });
  }

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색하거나 명령을 입력하세요..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={filtered[selectedIdx] ? `cmd-${filtered[selectedIdx].id}` : undefined}
            aria-label="커맨드 팔레트 검색"
          />
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto scrollbar-thin py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              &ldquo;{query}&rdquo;에 대한 결과가 없습니다
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.category}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {group.category}
                </div>
                {group.items.map((item) => {
                  const idx = flatIdx++;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                      data-idx={idx}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base flex-shrink-0 w-6 text-center" aria-hidden="true">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          <HighlightText text={item.title} indices={item.indices} />
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                        )}
                      </div>
                      {item.badge && (
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.badge.color}`}>
                          {item.badge.text}
                        </span>
                      )}
                      {isSelected && (
                        <kbd className="flex-shrink-0 rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] text-gray-400">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1 py-0.5">↑↓</kbd> 이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1 py-0.5">↵</kbd> 실행
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-300 bg-gray-50 px-1 py-0.5">esc</kbd> 닫기
            </span>
          </div>
          <span>BatonHub 커맨드</span>
        </div>
      </div>
    </div>
  );
}
