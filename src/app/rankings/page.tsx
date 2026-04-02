"use client";

import { useState, useMemo } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getAllLeaderboards, getHackathons } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { BarChart } from "@/components/features/BarChart";

type PeriodFilter = "all" | "monthly" | "yearly";

interface RankedTeam {
  teamName: string;
  totalScore: number;
  count: number;
  hackathons: string[];
  rank: number;
}

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
  const [page, setPage] = useState(1);

  const hackathons = useMemo(() => {
    if (!ready) return [];
    return getHackathons();
  }, [ready]);

  const rankings = useMemo(() => {
    if (!ready) return [];
    const leaderboards = getAllLeaderboards();

    const allEntries = leaderboards.flatMap((lb) => {
      const maxScore = lb.entries.length > 0 ? Math.max(...lb.entries.map((e) => e.score)) : 1;
      const is01Scale = maxScore <= 1.0;
      return lb.entries.map((e) => ({
        ...e,
        score: is01Scale ? Math.round(e.score * 10000) / 100 : e.score,
        rawScore: e.score,
        hackathonSlug: lb.hackathonSlug,
        hackathonTitle:
          hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug,
      }));
    });

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

    const sorted = Array.from(teamScores.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.teamName.localeCompare(b.teamName);
      });

    const ranked = assignTieRanks(sorted);

    return ranked;
  }, [ready, period, hackathonFilter, hackathons]);

  if (!ready) {
    return <SkeletonPage />;
  }

  const totalPages = Math.ceil(rankings.length / PAGE_SIZE);
  const paginatedRankings = rankings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 animate-page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">글로벌 랭킹</h1>
          <p className="mt-1 text-sm text-gray-500">해커톤별 팀 순위를 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
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
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition btn-press"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV 내보내기
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition btn-press ${
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
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          aria-label="해커톤 필터"
        >
          <option value="all">전체 해커톤</option>
          {hackathons.map((h) => (
            <option key={h.slug} value={h.slug}>{h.title}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 text-sm text-gray-500" aria-live="polite">
        <span>총 <span className="font-semibold text-gray-700">{rankings.length}</span>개 팀</span>
        {period === "monthly" && <span>({new Date().getMonth() + 1}월 기준)</span>}
        {period === "yearly" && <span>({new Date().getFullYear()}년 기준)</span>}
        {hackathonFilter !== "all" && (
          <span>· {hackathons.find((h) => h.slug === hackathonFilter)?.title}</span>
        )}
      </div>

      {rankings.length === 0 ? (
        <EmptyState title="랭킹 데이터 없음" description="해당 조건에 제출된 결과가 없습니다." icon="trophy" />
      ) : (
        <>
        {/* Score Distribution Chart */}
        {rankings.length >= 2 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-slide-up">
            <BarChart
              title="상위 팀 점수 분포"
              data={rankings.slice(0, 8).map((r, i) => ({
                label: r.teamName.length > 8 ? r.teamName.slice(0, 8) + ".." : r.teamName,
                value: r.totalScore,
                color: i === 0 ? "#eab308" : i === 1 ? "#64748b" : i === 2 ? "#f97316" : "#3b82f6",
              }))}
            />
          </section>
        )}

        {/* Podium for top 3 */}
        {rankings.length >= 3 && (
          <section className="hidden select-none sm:flex items-end justify-center gap-6 py-8 animate-slide-up" aria-label="상위 3팀 포디움">
            {[rankings[1], rankings[0], rankings[2]].map((r, i) => {
              const heights = ["h-28", "h-40", "h-24"];
              const bgColors = [
                "bg-gradient-to-t from-gray-200 to-gray-100 border-gray-300 dark:from-zinc-800 dark:to-zinc-700 dark:border-zinc-600",
                "bg-gradient-to-t from-yellow-200 to-yellow-50 border-yellow-300 dark:from-amber-900/70 dark:to-amber-800/70 dark:border-amber-700",
                "bg-gradient-to-t from-orange-200 to-orange-50 border-orange-200 dark:from-orange-900/70 dark:to-orange-800/70 dark:border-orange-700"
              ];
              const textSizes = ["text-lg", "text-2xl", "text-lg"];
              return (
                <div key={r.teamName} className="flex w-44 flex-col items-center gap-2" draggable={false}>
                  <span className="text-4xl" aria-hidden="true">{medals[i === 1 ? 0 : i === 0 ? 1 : 2]}</span>
                  <span className={`max-w-full truncate text-center font-extrabold text-gray-900 ${textSizes[i]}`}>{r.teamName}</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                    {Number.isInteger(r.totalScore) ? r.totalScore : r.totalScore.toFixed(2)}점
                  </span>
                  <div className={`${heights[i]} w-full rounded-t-2xl border-2 ${bgColors[i]} flex items-center justify-center transition-all shadow-sm`}>
                    <span className="text-3xl font-extrabold text-gray-700/90 dark:text-gray-100/90">{r.rank}</span>
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
              className={`rounded-xl border p-4 bg-white shadow-sm card-hover-glow ${
                r.rank === 1 ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-white" :
                r.rank === 2 ? "border-gray-300 bg-gradient-to-r from-gray-50 to-white" :
                r.rank === 3 ? "border-orange-200 bg-gradient-to-r from-orange-50 to-white" :
                "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      r.rank === 1 ? "bg-yellow-100 text-yellow-800" :
                      r.rank === 2 ? "bg-gray-200 text-gray-700" :
                      r.rank === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.rank <= 3 ? medals[r.rank - 1] : r.rank}
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
                  <p className="text-xs text-gray-500">점</p>
                </div>
              </div>
              {/* Score bar */}
              {rankings.length > 0 && (
                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    style={{ width: `${Math.max((r.totalScore / Math.max(rankings[0].totalScore, 1)) * 100, 3)}%` }}
                  />
                </div>
              )}
              {r.hackathons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.hackathons.map((h) => (
                    <span key={h} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {h.length > 20 ? h.slice(0, 20) + "..." : h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="글로벌 랭킹">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th scope="col" className="w-16 px-4 py-3.5 font-semibold text-gray-600">순위</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-gray-600">팀</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-gray-600">총 점수</th>
                <th scope="col" className="w-20 px-4 py-3.5 font-semibold text-gray-600">참가</th>
                <th scope="col" className="px-4 py-3.5 font-semibold text-gray-600">참가 해커톤</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRankings.map((r) => (
                <tr key={r.teamName} className="border-b last:border-0 hover:bg-blue-50/40 transition group">
                  <td className="px-4 py-3.5">
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
                      {r.rank <= 3 ? medals[r.rank - 1] : r.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{r.teamName}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">
                        {Number.isInteger(r.totalScore) ? r.totalScore : r.totalScore.toFixed(4)}
                      </span>
                      {rankings.length > 0 && (
                        <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${(r.totalScore / Math.max(rankings[0].totalScore, 1)) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{r.count}회</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {r.hackathons.map((h) => (
                        <span key={h} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
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
          <div className="flex items-center justify-center gap-1 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition btn-press"
              aria-label="이전 페이지"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition btn-press ${
                  p === page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={`${p}페이지`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition btn-press"
              aria-label="다음 페이지"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
