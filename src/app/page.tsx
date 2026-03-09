"use client";

import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons, getTeams, getAllLeaderboards } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDday, formatDate } from "@/lib/utils";

export default function HomePage() {
  const ready = useSeedData();

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-gray-500">로딩중...</div>
      </div>
    );
  }

  const hackathons = getHackathons();
  const teams = getTeams();
  const leaderboards = getAllLeaderboards();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-16 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">BatonHub</h1>
          <p className="mt-3 max-w-xl text-lg text-blue-100">
            해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      </section>

      {/* Quick Nav Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/hackathons"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-300"
        >
          <div className="mb-3 text-3xl">🏆</div>
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">해커톤 보러가기</h2>
          <p className="mt-1 text-sm text-gray-500">{hackathons.length}개의 해커톤이 등록되어 있습니다</p>
        </Link>
        <Link
          href="/camp"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-green-300"
        >
          <div className="mb-3 text-3xl">👥</div>
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-green-600">팀 찾기</h2>
          <p className="mt-1 text-sm text-gray-500">
            {teams.filter((t) => t.isOpen).length}개 팀이 모집중입니다
          </p>
        </Link>
        <Link
          href="/rankings"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-purple-300"
        >
          <div className="mb-3 text-3xl">📊</div>
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">랭킹 보기</h2>
          <p className="mt-1 text-sm text-gray-500">해커톤 전체 순위를 확인하세요</p>
        </Link>
      </section>

      {/* Hackathon Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">해커톤</h2>
          <Link href="/hackathons" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            전체보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={h.status} />
                {h.status !== "ended" && (
                  <span className="text-xs font-semibold text-orange-600">
                    {getDday(h.period.submissionDeadlineAt)}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">{h.title}</h3>
              <p className="mt-2 text-xs text-gray-500">
                {formatDate(h.period.submissionDeadlineAt)} 마감
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {h.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Team Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">팀원 모집</h2>
          <Link href="/camp" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            전체보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {teams
            .filter((t) => t.isOpen)
            .slice(0, 4)
            .map((team) => (
              <div
                key={team.teamCode}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{team.name}</h3>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    모집중
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{team.intro}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.lookingFor.map((role) => (
                    <span key={role} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {team.memberCount}명 참여중
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">최근 랭킹</h2>
          <Link href="/rankings" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            전체보기 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">순위</th>
                <th className="px-4 py-3 font-semibold text-gray-600">팀</th>
                <th className="px-4 py-3 font-semibold text-gray-600">점수</th>
                <th className="px-4 py-3 font-semibold text-gray-600">해커톤</th>
              </tr>
            </thead>
            <tbody>
              {leaderboards
                .flatMap((lb) =>
                  lb.entries.map((e) => ({ ...e, hackathonSlug: lb.hackathonSlug }))
                )
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((entry, i) => (
                  <tr key={`${entry.hackathonSlug}-${entry.teamName}`} className="border-b last:border-0">
                    <td className="px-4 py-3 font-bold text-gray-900">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{entry.teamName}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{entry.score}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{entry.hackathonSlug}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
