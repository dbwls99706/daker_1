"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { HackathonThumbnail } from "@/components/ui/HackathonThumbnail";
import { useSearchParams } from "next/navigation";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons, getBookmarks, toggleBookmark } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Toast } from "@/components/ui/Toast";
import { getDday, formatDate, getTimeRemaining } from "@/lib/utils";

type SortKey = "latest" | "deadline";
type StatusFilter = "all" | "ongoing" | "ended" | "upcoming";

function HackathonsContent() {
  const ready = useSeedData();
  const searchParams = useSearchParams();
  const urlKeyword = searchParams.get("keyword") || "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [keyword, setKeyword] = useState(urlKeyword);
  const [sort, setSort] = useState<SortKey>("latest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshKey, refresh] = useState(0);

  useEffect(() => {
    if (urlKeyword) setKeyword(urlKeyword);
  }, [urlKeyword]);

  const handleBookmark = useCallback((slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark(slug);
    setToastMsg(added ? "북마크에 추가되었습니다" : "북마크에서 제거되었습니다");
    refresh((n) => n + 1);
  }, []);

  const hackathons = useMemo(() => {
    if (!ready) return [];
    let list = getHackathons();

    if (statusFilter !== "all") {
      list = list.filter((h) => h.status === statusFilter);
    }
    if (tagFilter) {
      list = list.filter((h) => h.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())));
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (h) =>
          h.title.toLowerCase().includes(kw) ||
          h.tags.some((t) => t.toLowerCase().includes(kw))
      );
    }

    list.sort((a, b) => {
      if (sort === "deadline") {
        return new Date(a.period.submissionDeadlineAt).getTime() - new Date(b.period.submissionDeadlineAt).getTime();
      }
      return new Date(b.period.submissionDeadlineAt).getTime() - new Date(a.period.submissionDeadlineAt).getTime();
    });

    return list;
  }, [ready, statusFilter, tagFilter, keyword, sort]);

  const allTags = useMemo(() => {
    if (!ready) return [];
    const tags = new Set<string>();
    getHackathons().forEach((h) => h.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [ready]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bookmarks = useMemo(() => getBookmarks(), [ready, refreshKey]);

  const hasActiveFilter = statusFilter !== "all" || tagFilter !== "" || keyword.trim() !== "" || sort !== "latest";

  function clearFilters() {
    setStatusFilter("all");
    setTagFilter("");
    setKeyword("");
    setSort("latest");
  }

  if (!ready) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
      <h1 className="text-2xl font-bold">해커톤 목록</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="상태 필터">
          {(["all", "ongoing", "upcoming", "ended"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
                statusFilter === s ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {s === "all" ? "전체" : s === "ongoing" ? "진행중" : s === "upcoming" ? "예정" : "종료"}
            </button>
          ))}
        </div>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
          aria-label="태그 필터"
        >
          <option value="">태그 전체</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
          aria-label="정렬 기준"
        >
          <option value="latest">최신순</option>
          <option value="deadline">마감임박순</option>
        </select>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="키워드 검색..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="키워드 검색"
        />

        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* Result count + view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500" aria-live="polite">총 {hackathons.length}개의 해커톤</p>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="보기 모드">
          <button
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`cursor-pointer rounded-md p-1.5 transition ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            aria-label="그리드 보기"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" /></svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`cursor-pointer rounded-md p-1.5 transition ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            aria-label="리스트 보기"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" /></svg>
          </button>
        </div>
      </div>

      {/* List */}
      {hackathons.length === 0 ? (
        <EmptyState
          title="해커톤이 없습니다"
          description="조건에 맞는 해커톤이 없습니다. 필터를 변경해보세요."
          action={
            hasActiveFilter ? (
              <button
                onClick={clearFilters}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                필터 초기화
              </button>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h, i) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className={`group flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up border-l-4 ${
                h.status === "ongoing"
                  ? "border-l-green-500 border-gray-200 hover:border-green-200"
                  : h.status === "upcoming"
                  ? "border-l-blue-500 border-gray-200 hover:border-blue-200"
                  : "border-l-gray-300 border-gray-200 hover:border-gray-300"
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="mb-3 overflow-hidden rounded-lg aspect-video">
                <HackathonThumbnail
                  slug={h.slug}
                  title={h.title}
                  status={h.status}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  {h.status !== "ended" && (
                    <span className="text-xs font-semibold text-orange-600">
                      {getDday(h.period.submissionDeadlineAt)}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleBookmark(h.slug, e)}
                  className={`cursor-pointer text-lg transition-all hover:scale-110 ${bookmarks.includes(h.slug) ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                  aria-label={bookmarks.includes(h.slug) ? "북마크 제거" : "북마크 추가"}
                  aria-pressed={bookmarks.includes(h.slug)}
                >
                  {bookmarks.includes(h.slug) ? "★" : "☆"}
                </button>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 flex-1">
                {h.title}
              </h3>
              <div className="mt-3">
                <p className="text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</p>
                {h.status !== "ended" && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${getTimeRemaining(h.period.submissionDeadlineAt)}%` }}
                    />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {h.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {hackathons.map((h, i) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className={`group flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md animate-slide-up border-l-4 ${
                h.status === "ongoing"
                  ? "border-l-green-500 border-gray-200 hover:border-green-200"
                  : h.status === "upcoming"
                  ? "border-l-blue-500 border-gray-200 hover:border-blue-200"
                  : "border-l-gray-300 border-gray-200 hover:border-gray-300"
              }`}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="hidden sm:block h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg">
                <HackathonThumbnail slug={h.slug} title="" status={h.status} className="h-full w-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={h.status} />
                  {h.status !== "ended" && (
                    <span className="text-xs font-semibold text-orange-600">{getDday(h.period.submissionDeadlineAt)}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 truncate">{h.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</span>
                  <div className="flex gap-1">
                    {h.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleBookmark(h.slug, e)}
                className={`cursor-pointer text-lg flex-shrink-0 transition-all hover:scale-110 ${bookmarks.includes(h.slug) ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                aria-label={bookmarks.includes(h.slug) ? "북마크 제거" : "북마크 추가"}
                aria-pressed={bookmarks.includes(h.slug)}
              >
                {bookmarks.includes(h.slug) ? "★" : "☆"}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HackathonsPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <HackathonsContent />
    </Suspense>
  );
}
