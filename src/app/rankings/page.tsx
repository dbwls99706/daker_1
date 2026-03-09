"use client";

import { useState, useMemo } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getAllLeaderboards, getHackathons } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type PeriodFilter = "all" | "7d" | "30d";

export default function RankingsPage() {
  const ready = useSeedData();
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const rankings = useMemo(() => {
    if (!ready) return [];
    const leaderboards = getAllLeaderboards();
    const hackathons = getHackathons();

    const allEntries = leaderboards.flatMap((lb) =>
      lb.entries.map((e) => ({
        ...e,
        hackathonSlug: lb.hackathonSlug,
        hackathonTitle:
          hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug,
      }))
    );

    // Period filter
    let filtered = allEntries;
    if (period !== "all") {
      const now = new Date();
      const days = period === "7d" ? 7 : 30;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = allEntries.filter((e) => new Date(e.submittedAt) >= cutoff);
    }

    // Aggregate scores per team
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

    return Array.from(teamScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [ready, period]);

  if (!ready) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">글로벌 랭킹</h1>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(
            [
              { key: "all", label: "전체" },
              { key: "30d", label: "최근 30일" },
              { key: "7d", label: "최근 7일" },
            ] as { key: PeriodFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setPeriod(f.key)}
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
      </div>

      {rankings.length === 0 ? (
        <EmptyState title="랭킹 데이터 없음" description="해당 기간에 제출된 결과가 없습니다." />
      ) : (
        <>
        <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스크롤하세요 →</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 w-16">순위</th>
                <th className="px-4 py-3 font-semibold text-gray-600">팀</th>
                <th className="px-4 py-3 font-semibold text-gray-600">총 점수</th>
                <th className="px-4 py-3 font-semibold text-gray-600">참가 횟수</th>
                <th className="px-4 py-3 font-semibold text-gray-600">참가 해커톤</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
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
        </>
      )}
    </div>
  );
}
