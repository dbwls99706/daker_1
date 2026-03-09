"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getDday, formatDate } from "@/lib/utils";

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

  useEffect(() => {
    if (urlKeyword) setKeyword(urlKeyword);
  }, [urlKeyword]);

  const hackathons = useMemo(() => {
    if (!ready) return [];
    let list = getHackathons();

    if (statusFilter !== "all") {
      list = list.filter((h) => h.status === statusFilter);
    }
    if (tagFilter) {
      list = list.filter((h) => h.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
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

  if (!ready) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">해커톤 목록</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["all", "ongoing", "upcoming", "ended"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
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
        />
      </div>

      {/* List */}
      {hackathons.length === 0 ? (
        <EmptyState
          title="해커톤이 없습니다"
          description="조건에 맞는 해커톤이 없습니다. 필터를 변경해보세요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-200"
            >
              {h.thumbnailUrl && (
                <div className="mb-3 overflow-hidden rounded-lg bg-gray-100 aspect-video">
                  <img
                    src={h.thumbnailUrl}
                    alt={h.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={h.status} />
                {h.status !== "ended" && (
                  <span className="text-xs font-semibold text-orange-600">
                    {getDday(h.period.submissionDeadlineAt)}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 flex-1">
                {h.title}
              </h3>
              <div className="mt-3">
                <p className="text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</p>
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
      )}
    </div>
  );
}

export default function HackathonsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HackathonsContent />
    </Suspense>
  );
}
