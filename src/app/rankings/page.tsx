"use client";

import { useState, useMemo } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getAllLeaderboards, getHackathons } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type PeriodFilter = "all" | "monthly" | "yearly";
type SortField = "rank" | "teamName" | "totalScore" | "count";
type SortDir = "asc" | "desc";

export default function RankingsPage() {
  const ready = useSeedData();
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [hackathonFilter, setHackathonFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const hackathons = useMemo(() => {
    if (!ready) return [];
    return getHackathons();
  }, [ready]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "totalScore" ? "desc" : "asc");
    }
  }

  const rankings = useMemo(() => {
    if (!ready) return [];
    const leaderboards = getAllLeaderboards();

    const allEntries = leaderboards.flatMap((lb) =>
      lb.entries.map((e) => ({
        ...e,
        hackathonSlug: lb.hackathonSlug,
        hackathonTitle:
          hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug,
      }))
    );

    let filtered = allEntries;

    if (hackathonFilter !== "all") {
      filtered = filtered.filter((e) => e.hackathonSlug === hackathonFilter);
    }

    if (period !== "all") {
      const now = new Date();
      filtered = filtered.filter((e) => {
        const d = new Date(e.submittedAt);
        if (period === "monthly") {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
        return d.getFullYear() === now.getFullYear();
      });
    }

    const teamScores = new Map<string, { teamName: string; totalScore: number; count: number; hackathons: string[] }>();
    for (const entry of filtered) {
      const existing = teamScores.get(entry.teamName);
      if (existing) {
        existing.totalScore += entry.score;
        existing.count++;
        if (!existing.hackathons.includes(entry.hackathonTitle)) {
          existing.hackathons.push(entry.hackathonTitle);
        }
      } else {
        teamScores.set(entry.teamName, {
          teamName: entry.teamName,
          totalScore: entry.score,
          count: 1,
          hackathons: [entry.hackathonTitle],
        });
      }
    }

    const ranked = Array.from(teamScores.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.teamName.localeCompare(b.teamName);
      })
      .map((t, i) => ({ ...t, rank: i + 1 }));

    // Apply user sort
    if (sortField !== "rank" || sortDir !== "asc") {
      ranked.sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "rank": cmp = a.rank - b.rank; break;
          case "teamName": cmp = a.teamName.localeCompare(b.teamName); break;
          case "totalScore": cmp = a.totalScore - b.totalScore; break;
          case "count": cmp = a.count - b.count; break;
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }

    return ranked;
  }, [ready, period, hackathonFilter, hackathons, sortField, sortDir]);

  if (!ready) {
    return <LoadingSpinner />;
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">글로벌 랭킹</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="기간 필터">
            {(
              [
                { key: "all", label: "전체" },
                { key: "monthly", label: "월별" },
                { key: "yearly", label: "연도별" },
              ] as { key: PeriodFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => { setPeriod(f.key); setPage(1); }}
                aria-pressed={period === f.key}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  period === f.key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={hackathonFilter}
            onChange={(e) => { setHackathonFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
            aria-label="해커톤 필터"
          >
            <option value="all">전체 해커톤</option>
            {hackathons.map((h) => (
              <option key={h.slug} value={h.slug}>{h.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <span>총 {rankings.length}개 팀</span>
        {period === "monthly" && <span>({new Date().getMonth() + 1}월 기준)</span>}
        {period === "yearly" && <span>({new Date().getFullYear()}년 기준)</span>}
        {hackathonFilter !== "all" && (
          <span>· {hackathons.find((h) => h.slug === hackathonFilter)?.title}</span>
        )}
      </div>

      {rankings.length === 0 ? (
        <EmptyState title="랭킹 데이터 없음" description="해당 조건에 제출된 결과가 없습니다." />
      ) : (
        <>
        <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스크롤하세요 →</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm" aria-label="글로벌 랭킹">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600 w-16">
                  <button onClick={() => toggleSort("rank")} className="hover:text-blue-600 transition">
                    순위{sortIcon("rank")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => toggleSort("teamName")} className="hover:text-blue-600 transition">
                    팀{sortIcon("teamName")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => toggleSort("totalScore")} className="hover:text-blue-600 transition">
                    총 점수{sortIcon("totalScore")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => toggleSort("count")} className="hover:text-blue-600 transition">
                    참가 횟수{sortIcon("count")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">참가 해커톤</th>
              </tr>
            </thead>
            <tbody>
              {rankings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                <tr key={r.teamName} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        r.rank === 1
                          ? "bg-yellow-100 text-yellow-800"
                          : r.rank === 2
                          ? "bg-gray-200 text-gray-700"
                          : r.rank === 3
                          ? "bg-orange-100 text-orange-700"
                          : "text-gray-500"
                      }`}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.teamName}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">
                    {Number.isInteger(r.totalScore) ? r.totalScore : r.totalScore.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.count}회</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.hackathons.map((h) => (
                        <span key={h} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {h.length > 25 ? h.slice(0, 25) + "..." : h}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rankings.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {page} / {Math.ceil(rankings.length / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(rankings.length / PAGE_SIZE), p + 1))}
              disabled={page >= Math.ceil(rankings.length / PAGE_SIZE)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
            >
              다음
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
