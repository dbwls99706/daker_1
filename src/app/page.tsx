"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useMemo } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons, getTeams, getAllLeaderboards, getBookmarks, getSubmissions, toggleBookmark, getRecentlyViewed } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Toast } from "@/components/ui/Toast";
import { getDday, formatDate, getTimeRemaining } from "@/lib/utils";

export default function HomePage() {
  const ready = useSeedData();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookmark = useCallback((slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark(slug);
    setToastMsg(added ? "북마크에 추가되었습니다" : "북마크에서 제거되었습니다");
    setRefreshKey((n) => n + 1);
  }, []);

  const hackathons = useMemo(() => (ready ? getHackathons() : []), [ready]);
  const teams = useMemo(() => (ready ? getTeams() : []), [ready]);
  const leaderboards = useMemo(() => (ready ? getAllLeaderboards() : []), [ready]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bookmarks = useMemo(() => (ready ? getBookmarks() : []), [ready, refreshKey]);
  const submissions = useMemo(() => (ready ? getSubmissions() : []), [ready]);
  const recentSlugs = useMemo(() => (ready ? getRecentlyViewed() : []), [ready]);

  const { ongoingCount, openTeamCount, totalEntries, submittedCount } = useMemo(() => ({
    ongoingCount: hackathons.filter((h) => h.status === "ongoing").length,
    openTeamCount: teams.filter((t) => t.isOpen).length,
    totalEntries: leaderboards.reduce((sum, lb) => sum + lb.entries.length, 0),
    submittedCount: submissions.filter((s) => s.status === "submitted").length,
  }), [hackathons, teams, leaderboards, submissions]);

  if (!ready) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-10">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-10 sm:px-8 sm:py-16 text-white animate-slide-up">
        <div className="relative z-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-200">해커톤 통합 플랫폼</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">BatonHub</h1>
          <p className="mt-3 max-w-xl text-lg text-blue-100">
            해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hackathons"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl"
            >
              해커톤 둘러보기
            </Link>
            <Link
              href="/camp"
              className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              팀 찾기
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
      </section>

      {/* Deadline Alert */}
      {(() => {
        const urgent = hackathons.filter((h) => {
          if (h.status === "ended") return false;
          const now = new Date();
          const deadline = new Date(h.period.submissionDeadlineAt);
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 7;
        });
        if (urgent.length === 0) return null;
        return (
          <section className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <span className="text-xl" aria-hidden="true">⏰</span>
              <div className="flex-1">
                <h2 className="font-bold text-orange-800">마감 임박 해커톤!</h2>
                <div className="mt-2 space-y-1">
                  {urgent.map((h) => (
                    <Link
                      key={h.slug}
                      href={`/hackathons/${h.slug}`}
                      className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm transition hover:bg-white"
                    >
                      <span className="font-medium text-gray-900">{h.title}</span>
                      <span className="font-bold text-orange-600">{getDday(h.period.submissionDeadlineAt)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Stats Dashboard */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: hackathons.length, label: "등록된 해커톤", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { value: ongoingCount, label: "진행중인 해커톤", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
          { value: openTeamCount, label: "모집중인 팀", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          { value: submittedCount, label: "제출 완료", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`rounded-xl border ${stat.border} ${stat.bg} p-5 text-center shadow-sm transition hover:shadow-md animate-slide-up`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Participation Chart */}
      {leaderboards.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-slide-up">
          <h2 className="mb-4 text-lg font-bold">해커톤별 참가 현황</h2>
          <div className="space-y-3">
            {leaderboards.map((lb) => {
              const title = hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug;
              const maxEntries = Math.max(...leaderboards.map((l) => l.entries.length), 1);
              const pct = Math.round((lb.entries.length / maxEntries) * 100);
              return (
                <div key={lb.hackathonSlug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{title}</span>
                    <span className="text-gray-500">{lb.entries.length}팀</span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      {pct > 20 && (
                        <span className="text-xs font-semibold text-white">{lb.entries.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Nav Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/hackathons", icon: "🏆", title: "해커톤 보러가기", desc: `${hackathons.length}개의 해커톤이 등록되어 있습니다`, hoverBorder: "hover:border-blue-300", hoverText: "group-hover:text-blue-600" },
          { href: "/camp", icon: "👥", title: "팀 찾기", desc: `${openTeamCount}개 팀이 모집중입니다`, hoverBorder: "hover:border-green-300", hoverText: "group-hover:text-green-600" },
          { href: "/rankings", icon: "📊", title: "랭킹 보기", desc: `${totalEntries}명의 참가자가 등록되었습니다`, hoverBorder: "hover:border-purple-300", hoverText: "group-hover:text-purple-600" },
        ].map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${card.hoverBorder} hover:-translate-y-0.5 animate-slide-up`}
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="mb-3 text-3xl" aria-hidden="true">{card.icon}</div>
            <h2 className={`text-lg font-bold text-gray-900 ${card.hoverText}`}>{card.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </section>

      {/* Bookmarked Hackathons */}
      {bookmarks.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-yellow-500" aria-hidden="true">★</span> 북마크한 해커톤
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons
              .filter((h) => bookmarks.includes(h.slug))
              .map((h, i) => (
                <Link
                  key={h.slug}
                  href={`/hackathons/${h.slug}`}
                  className="group rounded-xl border-2 border-yellow-200 bg-yellow-50 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge status={h.status} />
                    <button
                      onClick={(e) => handleBookmark(h.slug, e)}
                      className="text-yellow-500 hover:text-yellow-600 text-lg transition-transform hover:scale-110"
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
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
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

      {/* Recently Viewed */}
      {(() => {
        const recentHackathons = recentSlugs
          .map((s) => hackathons.find((h) => h.slug === s))
          .filter(Boolean);
        if (recentHackathons.length === 0) return null;
        return (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-blue-500" aria-hidden="true">🕐</span> 최근 본 해커톤
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentHackathons.map((h) => (
                <Link
                  key={h!.slug}
                  href={`/hackathons/${h!.slug}`}
                  className="group flex-shrink-0 w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <StatusBadge status={h!.status} />
                  <h3 className="mt-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {h!.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(h!.period.submissionDeadlineAt)} 마감</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Hackathon Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">해커톤</h2>
          <Link href="/hackathons" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
            전체보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h, i) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              {h.thumbnailUrl && (
                <div className="relative mb-3 overflow-hidden rounded-lg bg-gray-100 aspect-video">
                  <Image
                    src={h.thumbnailUrl}
                    alt={h.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                  className={`text-lg transition-all hover:scale-110 ${bookmarks.includes(h.slug) ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
                  aria-label={bookmarks.includes(h.slug) ? "북마크 제거" : "북마크 추가"}
                  aria-pressed={bookmarks.includes(h.slug)}
                >
                  {bookmarks.includes(h.slug) ? "★" : "☆"}
                </button>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">{h.title}</h3>
              <p className="mt-2 text-xs text-gray-500">
                {formatDate(h.period.submissionDeadlineAt)} 마감
              </p>
              {h.status !== "ended" && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
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
          <Link href="/camp" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
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
            .map((team, i) => (
              <Link
                key={team.teamCode}
                href={team.hackathonSlug ? `/camp?hackathon=${team.hackathonSlug}` : "/camp"}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-green-200 hover:-translate-y-0.5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
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
          <Link href="/rankings" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
            전체보기 →
          </Link>
        </div>
        {leaderboards.flatMap((lb) => lb.entries).length === 0 ? (
          <EmptyState title="랭킹 데이터 없음" description="아직 제출된 결과가 없습니다." />
        ) : (
        <>
        <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스크롤하세요 →</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
