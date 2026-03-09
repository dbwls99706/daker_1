"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons, getTeams, getAllLeaderboards, getBookmarks, getSubmissions, toggleBookmark } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Toast } from "@/components/ui/Toast";
import { getDday, formatDate, getTimeRemaining } from "@/lib/utils";

export default function HomePage() {
  const ready = useSeedData();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [, refresh] = useState(0);

  const handleBookmark = useCallback((slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark(slug);
    setToastMsg(added ? "북마크에 추가되었습니다" : "북마크에서 제거되었습니다");
    refresh((n) => n + 1);
  }, []);

  if (!ready) {
    return <LoadingSpinner />;
  }

  const hackathons = getHackathons();
  const teams = getTeams();
  const leaderboards = getAllLeaderboards();
  const bookmarks = getBookmarks();
  const submissions = getSubmissions();

  const ongoingCount = hackathons.filter((h) => h.status === "ongoing").length;
  const openTeamCount = teams.filter((t) => t.isOpen).length;
  const totalEntries = leaderboards.reduce((sum, lb) => sum + lb.entries.length, 0);
  const submittedCount = submissions.filter((s) => s.status === "submitted").length;

  return (
    <div className="space-y-10">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-16 text-white animate-slide-up">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">BatonHub</h1>
          <p className="mt-3 max-w-xl text-lg text-blue-100">
            해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      </section>

      {/* Stats Dashboard */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-blue-600">{hackathons.length}</div>
          <div className="mt-1 text-sm text-gray-500">등록된 해커톤</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-green-600">{ongoingCount}</div>
          <div className="mt-1 text-sm text-gray-500">진행중인 해커톤</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-purple-600">{openTeamCount}</div>
          <div className="mt-1 text-sm text-gray-500">모집중인 팀</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-orange-600">{submittedCount}</div>
          <div className="mt-1 text-sm text-gray-500">제출 완료</div>
        </div>
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
            {openTeamCount}개 팀이 모집중입니다
          </p>
        </Link>
        <Link
          href="/rankings"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-purple-300"
        >
          <div className="mb-3 text-3xl">📊</div>
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">랭킹 보기</h2>
          <p className="mt-1 text-sm text-gray-500">{totalEntries}명의 참가자가 등록되었습니다</p>
        </Link>
      </section>

      {/* Bookmarked Hackathons */}
      {bookmarks.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-yellow-500">★</span> 북마크한 해커톤
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons
              .filter((h) => bookmarks.includes(h.slug))
              .map((h) => (
                <Link
                  key={h.slug}
                  href={`/hackathons/${h.slug}`}
                  className="group rounded-xl border-2 border-yellow-200 bg-yellow-50 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge status={h.status} />
                    <button
                      onClick={(e) => handleBookmark(h.slug, e)}
                      className="text-yellow-500 hover:text-yellow-600 text-lg"
                      aria-label="북마크 제거"
                    >
                      ★
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">{h.title}</h3>
                  <p className="mt-2 text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</p>
                  {h.status !== "ended" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-orange-600">{getDday(h.period.submissionDeadlineAt)}</span>
                        <span className="text-gray-400">{getTimeRemaining(h.period.submissionDeadlineAt)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                          style={{ width: `${getTimeRemaining(h.period.submissionDeadlineAt)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </section>
      )}

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
              {h.thumbnailUrl && (
                <div className="mb-3 overflow-hidden rounded-lg bg-gray-100 aspect-video">
                  <img
                    src={h.thumbnailUrl}
                    alt={h.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => { const p = (e.target as HTMLImageElement).parentElement; if (p) p.style.display = "none"; }}
                  />
                </div>
              )}
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
                  className={`text-lg transition ${bookmarks.includes(h.slug) ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                  aria-label={bookmarks.includes(h.slug) ? "북마크 제거" : "북마크 추가"}
                >
                  {bookmarks.includes(h.slug) ? "★" : "☆"}
                </button>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">{h.title}</h3>
              <p className="mt-2 text-xs text-gray-500">
                {formatDate(h.period.submissionDeadlineAt)} 마감
              </p>
              {h.status !== "ended" && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    style={{ width: `${getTimeRemaining(h.period.submissionDeadlineAt)}%` }}
                  />
                </div>
              )}
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
        {teams.filter((t) => t.isOpen).length === 0 ? (
          <EmptyState title="모집중인 팀이 없습니다" description="캠프에서 첫 팀을 만들어보세요!" />
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams
            .filter((t) => t.isOpen)
            .slice(0, 4)
            .map((team) => (
              <Link
                key={team.teamCode}
                href={team.hackathonSlug ? `/camp?hackathon=${team.hackathonSlug}` : "/camp"}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-green-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold group-hover:text-green-600">{team.name}</h3>
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
              </Link>
            ))}
        </div>
        )}
      </section>

      {/* Leaderboard Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">최근 랭킹</h2>
          <Link href="/rankings" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            전체보기 →
          </Link>
        </div>
        {leaderboards.flatMap((lb) => lb.entries).length === 0 ? (
          <EmptyState title="랭킹 데이터 없음" description="아직 제출된 결과가 없습니다." />
        ) : (
        <>
        <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스크롤하세요 →</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[480px] text-sm" aria-label="최근 랭킹">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">순위</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">팀</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">점수</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-600">해커톤</th>
              </tr>
            </thead>
            <tbody>
              {[...leaderboards
                .flatMap((lb) =>
                  lb.entries.map((e) => ({
                    ...e,
                    hackathonSlug: lb.hackathonSlug,
                    hackathonTitle: hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug,
                  }))
                )]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((entry, i) => (
                  <tr key={`${entry.hackathonSlug}-${entry.teamName}`} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : i === 1
                            ? "bg-gray-200 text-gray-700"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.teamName}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{entry.score}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {entry.hackathonTitle.length > 20 ? entry.hackathonTitle.slice(0, 20) + "..." : entry.hackathonTitle}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </section>
    </div>
  );
}
