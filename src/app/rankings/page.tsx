"use client";

import { useState, useMemo } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getAllLeaderboards, getHackathons } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";

type PeriodFilter = "all" | "monthly" | "yearly";
type SortField = "rank" | "teamName" | "totalScore" | "count";
type SortDir = "asc" | "desc";

interface RankedTeam {
  teamName: string;
  totalScore: number;
  count: number;
  hackathons: string[];
  rank: number;
}

/** Assign competition-style tie ranks (1, 1, 3, 4, 4, 6...) */
function assignTieRanks(sorted: Omit<RankedTeam, "rank">[]): RankedTeam[] {
  const result: RankedTeam[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) {
      currentRank = i + 1;
    }
    result.push({ ...sorted[i], rank: currentRank });
  }
  return result;
}

const PAGE_SIZE = 10;

export default function RankingsPage() {
  const ready = useSeedData();
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [hackathonFilter, setHackathonFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

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
    setPage(1);
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

    // Aggregate scores by team
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

    // Sort by score desc, then name asc, then assign tie ranks
    const sorted = Array.from(teamScores.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.teamName.localeCompare(b.teamName);
      });

    const ranked = assignTieRanks(sorted);

    // Apply user sort (if different from default)
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
    return <SkeletonPage />;
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const totalPages = Math.ceil(rankings.length / PAGE_SIZE);
  const paginatedRankings = rankings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">글로벌 랭킹</h1>
          {rankings.length > 0 && (
            <button
              aria-label="랭킹 데이터를 CSV 파일로 다운로드"
              onClick={() => {
                const csv = [
                  "순위,팀명,총점수,참가횟수,참가해커톤",
                  ...rankings.map((r) =>
                    `${r.rank},"${r.teamName}",${r.totalScore},${r.count},"${r.hackathons.join("; ")}"`
                  ),
                ].join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "rankings.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              CSV 내보내기
            </button>
          )}
        </div>
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

      <div className="flex gap-4 text-sm text-gray-500" aria-live="polite">
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
        {/* Podium for top 3 */}
        {rankings.length >= 3 && (
          <section className="hidden sm:flex items-end justify-center gap-4 py-6 animate-slide-up" aria-label="상위 3팀 포디움">
            {[rankings[1], rankings[0], rankings[2]].map((r, i) => {
              const heights = ["h-28", "h-36", "h-24"];
              const medals = ["🥈", "🥇", "🥉"];
              const bgColors = ["bg-gray-100 border-gray-300", "bg-yellow-50 border-yellow-300", "bg-orange-50 border-orange-200"];
              const textSizes = ["text-lg", "text-2xl", "text-lg"];
              return (
                <div key={r.teamName} className="flex flex-col items-center gap-2 w-40">
                  <span className="text-3xl" aria-hidden="true">{medals[i]}</span>
                  <span className={`font-bold text-gray-900 ${textSizes[i]} truncate max-w-full text-center`}>{r.teamName}</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {Number.isInteger(r.totalScore) ? r.totalScore : r.totalScore.toFixed(2)}점
                  </span>
                  <div className={`${heights[i]} w-full rounded-t-xl border-2 ${bgColors[i]} flex items-center justify-center transition-all`}>
                    <span className="text-2xl font-extrabold text-gray-400">{r.rank}</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-3">
          {paginatedRankings.map((r) => (
            <div
              key={r.teamName}
              className={`rounded-xl border p-4 bg-white shadow-sm ${
                r.rank === 1 ? "border-yellow-300 bg-yellow-50" :
                r.rank === 2 ? "border-gray-300 bg-gray-50" :
                r.rank === 3 ? "border-orange-200 bg-orange-50" :
                "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      r.rank === 1 ? "bg-yellow-100 text-yellow-800" :
                      r.rank === 2 ? "bg-gray-200 text-gray-700" :
                      r.rank === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{r.teamName}</p>
                    <p className="text-xs text-gray-500">{r.count}회 참가</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {Number.isInteger(r.totalScore) ? r.totalScore : r.totalScore.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">점</p>
                </div>
              </div>
              {r.hackathons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.hackathons.map((h) => (
                    <span key={h} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {h.length > 20 ? h.slice(0, 20) + "..." : h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="글로벌 랭킹">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600 w-16" aria-sort={sortField === "rank" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button onClick={() => toggleSort("rank")} className="hover:text-blue-600 transition" aria-label={`순위 정렬 ${sortField === "rank" ? (sortDir === "asc" ? "오름차순" : "내림차순") : ""}`}>
                    순위{sortIcon("rank")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600" aria-sort={sortField === "teamName" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button onClick={() => toggleSort("teamName")} className="hover:text-blue-600 transition">
                    팀{sortIcon("teamName")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600" aria-sort={sortField === "totalScore" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button onClick={() => toggleSort("totalScore")} className="hover:text-blue-600 transition">
                    총 점수{sortIcon("totalScore")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600" aria-sort={sortField === "count" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button onClick={() => toggleSort("count")} className="hover:text-blue-600 transition">
                    참가 횟수{sortIcon("count")}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">참가 해커톤</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRankings.map((r) => (
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

        {/* Pagination */}
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
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
