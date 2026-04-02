"use client";

import Link from "next/link";
import { HackathonThumbnail } from "@/components/ui/HackathonThumbnail";
import { TiltCard } from "@/components/ui/TiltCard";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathons, getTeams, getAllLeaderboards, getBookmarks, getSubmissions, toggleBookmark, getRecentlyViewed } from "@/lib/storage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Toast } from "@/components/ui/Toast";
import { getDday, formatDate, getTimeRemaining } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { CountdownTimer } from "@/components/features/CountdownTimer";
import { DonutChart } from "@/components/features/DonutChart";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedStat({ value, label, icon, color, bg, border, delay }: { value: number; label: string; icon: string; color: string; bg: string; border: string; delay: number }) {
  const animated = useCountUp(value);
  return (
    <div
      className={`rounded-xl border ${border} ${bg} p-5 text-center shadow-sm transition-all hover:shadow-md hover:scale-[1.02] animate-slide-up card-hover-glow`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="mb-2 flex justify-center">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} text-lg`} aria-hidden="true">{icon}</span>
      </div>
      <div className={`text-3xl font-extrabold tabular-nums ${color}`}>{animated}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const ready = useSeedData();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (ready && !localStorage.getItem("batonhub_onboarded")) {
      setShowOnboarding(true);
    }
  }, [ready]);

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

  const onboardingSteps = [
    { label: "1. 해커톤 둘러보기", href: "/hackathons" },
    { label: "2. 팀 찾기 / 생성", href: "/camp" },
    { label: "3. 결과 제출", href: "/hackathons" },
    { label: "4. 랭킹 확인", href: "/rankings" },
  ] as const;

  return (
    <div className="space-y-10 animate-page-enter">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      {/* Onboarding Banner */}
      {showOnboarding && (
        <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 animate-slide-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl flex-shrink-0" aria-hidden="true">👋</span>
              <div>
                <h2 className="font-bold text-blue-900">BatonHub에 오신 것을 환영합니다!</h2>
                <p className="mt-1 text-sm text-blue-700">해커톤 탐색, 팀 빌딩, 제출, 순위 확인을 한곳에서 할 수 있습니다.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {onboardingSteps.map((step) => (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="cursor-pointer rounded-full bg-white/80 px-3 py-1.5 text-blue-700 font-medium shadow-sm border border-blue-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      {step.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setShowOnboarding(false); localStorage.setItem("batonhub_onboarded", "true"); }}
              className="cursor-pointer flex-shrink-0 rounded-lg p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition btn-press"
              aria-label="온보딩 닫기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 sm:px-10 sm:py-16 text-white animate-slide-up">
        <div className="relative z-10">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-200 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            해커톤 통합 플랫폼
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">BatonHub</h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100 leading-relaxed">
            해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지<br className="hidden sm:block" />
            한곳에서 완결하는 해커톤 통합 대시보드
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/hackathons"
              className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-[0_14px_28px_rgba(30,64,175,0.28)] btn-press"
            >
              해커톤 둘러보기
              <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </Link>
            <Link
              href="/camp"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_12px_24px_rgba(255,255,255,0.18)] btn-press"
            >
              팀 찾기
              <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="absolute left-1/3 -top-8 h-24 w-24 rounded-full bg-purple-400/15 blur-xl" />
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
          <section className="rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-5 animate-slide-up animate-pulse-glow">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl" aria-hidden="true">⏰</span>
              <div className="flex-1">
                <h2 className="font-bold text-orange-800">마감 임박 해커톤!</h2>
                <div className="mt-2 space-y-1.5">
                  {urgent.map((h) => (
                    <Link
                      key={h.slug}
                      href={`/hackathons/${h.slug}`}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-2.5 text-sm transition hover:bg-white hover:shadow-sm"
                    >
                      <span className="font-medium text-gray-900">{h.title}</span>
                      <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full text-xs">{getDday(h.period.submissionDeadlineAt)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Stats Dashboard */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { value: hackathons.length, label: "등록된 해커톤", icon: "🏆", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { value: ongoingCount, label: "진행중인 해커톤", icon: "🔥", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
          { value: openTeamCount, label: "모집중인 팀", icon: "👥", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          { value: submittedCount, label: "제출 완료", icon: "✅", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
        ].map((stat, i) => (
          <AnimatedStat key={stat.label} {...stat} delay={i * 80} />
        ))}
      </section>

      {/* Countdown Timers for Active Hackathons */}
      {(() => {
        const active = hackathons.filter((h) => h.status === "ongoing" || h.status === "upcoming");
        if (active.length === 0) return null;
        return (
          <Section>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              실시간 마감 카운트다운
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((h) => (
                <Link key={h.slug} href={`/hackathons/${h.slug}`} className="block hover:scale-[1.01] transition-transform">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-sm font-medium text-gray-700 truncate">{h.title}</span>
                    </div>
                    <CountdownTimer targetIso={h.period.submissionDeadlineAt} label="제출 마감까지" />
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        );
      })()}

      {/* Statistics Overview */}
      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm card-hover-glow">
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm" aria-hidden="true">📊</span>
              해커톤 현황
            </h2>
            <DonutChart
              segments={[
                { label: "진행중", value: hackathons.filter((h) => h.status === "ongoing").length, color: "#22c55e" },
                { label: "예정", value: hackathons.filter((h) => h.status === "upcoming").length, color: "#3b82f6" },
                { label: "종료", value: hackathons.filter((h) => h.status === "ended").length, color: "#9ca3af" },
              ]}
              title="해커톤"
              size={140}
              thickness={22}
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm card-hover-glow">
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-sm" aria-hidden="true">👥</span>
              팀 모집 현황
            </h2>
            <DonutChart
              segments={[
                { label: "모집중", value: teams.filter((t) => t.isOpen).length, color: "#22c55e" },
                { label: "모집마감", value: teams.filter((t) => !t.isOpen).length, color: "#9ca3af" },
              ]}
              title="팀"
              size={140}
              thickness={22}
            />
          </div>
        </div>
      </Section>

      {/* Participation Chart */}
      {leaderboards.length > 0 && (
        <Section>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm" aria-hidden="true">📈</span>
              해커톤별 참가 현황
            </h2>
            <div className="space-y-4">
              {leaderboards.map((lb) => {
                const title = hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug;
                const maxEntries = Math.max(...leaderboards.map((l) => l.entries.length), 1);
                const pct = Math.round((lb.entries.length / maxEntries) * 100);
                return (
                  <div key={lb.hackathonSlug}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 truncate max-w-[250px]">{title}</span>
                      <span className="text-gray-500 font-semibold">{lb.entries.length}팀</span>
                    </div>
                    <div className="h-7 w-full rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${title} 참가 현황 ${pct}%`}>
                      <div
                        className="progress-gradient h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 flex items-center justify-end pr-3"
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
          </div>
        </Section>
      )}

      {/* Quick Nav Cards */}
      <Section>
        <div className="grid gap-4 sm:grid-cols-3 overflow-visible">
          {[
            { href: "/hackathons", icon: "🏆", iconBg: "bg-blue-100", title: "해커톤 보러가기", desc: `${hackathons.length}개의 해커톤이 등록되어 있습니다`, hoverBorder: "hover:border-blue-300", hoverText: "group-hover:text-blue-600" },
            { href: "/camp", icon: "👥", iconBg: "bg-green-100", title: "팀 찾기", desc: `${openTeamCount}개 팀이 모집중입니다`, hoverBorder: "hover:border-green-300", hoverText: "group-hover:text-green-600" },
            { href: "/rankings", icon: "📊", iconBg: "bg-purple-100", title: "랭킹 보기", desc: `${totalEntries}명의 참가자가 등록되었습니다`, hoverBorder: "hover:border-purple-300", hoverText: "group-hover:text-purple-600" },
          ].map((card, i) => (
            <TiltCard key={card.href} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}>
              <Link
                href={card.href}
                className={`group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${card.hoverBorder} card-hover-glow`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} text-2xl transition-transform group-hover:scale-110`} aria-hidden="true">
                  {card.icon}
                </div>
                <h2 className={`text-lg font-bold text-gray-900 ${card.hoverText}`}>{card.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500">{card.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>바로가기</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </Section>

      {/* Bookmarked Hackathons */}
      {bookmarks.length > 0 && (
        <Section>
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
                  className="group rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up card-hover-glow"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge status={h.status} />
                    <button
                      onClick={(e) => handleBookmark(h.slug, e)}
                      className="text-yellow-500 hover:text-yellow-600 text-lg transition-transform hover:scale-125 btn-press"
                      aria-label="북마크 제거"
                    >
                      ★
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">{h.title}</h3>
                  <p className="mt-2 text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</p>
                  {h.status !== "ended" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-orange-600">{getDday(h.period.submissionDeadlineAt)}</span>
                        <span className="text-gray-400">{getTimeRemaining(h.period.submissionDeadlineAt)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="progress-gradient-sm h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${getTimeRemaining(h.period.submissionDeadlineAt)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </Section>
      )}

      {/* Recently Viewed */}
      {(() => {
        const recentHackathons = recentSlugs
          .map((s) => hackathons.find((h) => h.slug === s))
          .filter((h): h is NonNullable<typeof h> => Boolean(h));
        if (recentHackathons.length === 0) return null;
        return (
          <Section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-blue-500" aria-hidden="true">🕐</span> 최근 본 해커톤
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {recentHackathons.map((h) => (
                <Link
                  key={h.slug}
                  href={`/hackathons/${h.slug}`}
                  className="group flex-shrink-0 w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 card-hover-glow"
                >
                  <StatusBadge status={h.status} />
                  <h3 className="mt-2 text-sm font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {h.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(h.period.submissionDeadlineAt)} 마감</p>
                </Link>
              ))}
            </div>
          </Section>
        );
      })()}

      {/* Hackathon Preview */}
      <Section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">해커톤</h2>
          <Link href="/hackathons" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
            전체보기
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h, i) => (
            <Link
              key={h.slug}
              href={`/hackathons/${h.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up card-hover-glow"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="mb-3 overflow-hidden rounded-xl aspect-video">
                <HackathonThumbnail
                  slug={h.slug}
                  title={h.title}
                  status={h.status}
                  className="h-full w-full"
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
                  className={`cursor-pointer text-lg transition-all hover:scale-125 btn-press ${bookmarks.includes(h.slug) ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
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
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={getTimeRemaining(h.period.submissionDeadlineAt)} aria-valuemin={0} aria-valuemax={100} aria-label={`마감 진행률 ${getTimeRemaining(h.period.submissionDeadlineAt)}%`}>
                  <div
                    className="progress-gradient-sm h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    style={{ width: `${getTimeRemaining(h.period.submissionDeadlineAt)}%` }}
                  />
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {h.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Team Preview */}
      <Section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">팀원 모집</h2>
          <Link href="/camp" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
            전체보기
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {teams.filter((t) => t.isOpen).length === 0 ? (
          <EmptyState title="모집중인 팀이 없습니다" description="캠프에서 첫 팀을 만들어보세요!" icon="team" />
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams
            .filter((t) => t.isOpen)
            .slice(0, 4)
            .map((team, i) => (
              <Link
                key={team.teamCode}
                href={team.hackathonSlug ? `/camp?hackathon=${team.hackathonSlug}` : "/camp"}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-green-200 hover:-translate-y-0.5 animate-slide-up card-hover-glow"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold shadow-sm">
                      {team.name.charAt(0)}
                    </span>
                    <h3 className="font-bold group-hover:text-green-600">{team.name}</h3>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    모집중
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{team.intro}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.lookingFor.map((role) => (
                    <span key={role} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 font-medium">
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {team.memberCount}명 참여중
                </p>
              </Link>
            ))}
        </div>
        )}
      </Section>

      {/* Leaderboard Preview */}
      <Section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">최근 랭킹</h2>
          <Link href="/rankings" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
            전체보기
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {leaderboards.flatMap((lb) => lb.entries).length === 0 ? (
          <EmptyState title="랭킹 데이터 없음" description="아직 제출된 결과가 없습니다." icon="trophy" />
        ) : (
        (() => {
          const topEntries = [...leaderboards
            .flatMap((lb) => {
              const maxScore = lb.entries.length > 0 ? Math.max(...lb.entries.map((e) => e.score)) : 1;
              const is01Scale = maxScore <= 1.0;
              return lb.entries.map((e) => ({
                ...e,
                score: is01Scale ? Math.round(e.score * 10000) / 100 : e.score,
                hackathonSlug: lb.hackathonSlug,
                hackathonTitle: hackathons.find((h) => h.slug === lb.hackathonSlug)?.title || lb.hackathonSlug,
              }));
            })]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          const medals = ["🥇", "🥈", "🥉"];

          return (
            <>
            {/* Mobile card layout */}
            <div className="sm:hidden space-y-3">
              {topEntries.map((entry, i) => (
                <div key={`${entry.hackathonSlug}-${entry.teamName}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm card-hover-glow">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-800" :
                    i === 1 ? "bg-gray-200 text-gray-700" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{i < 3 ? medals[i] : i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entry.teamName}</p>
                    <p className="text-xs text-gray-500 truncate">{entry.hackathonTitle}</p>
                  </div>
                  <span className="text-blue-600 font-bold flex-shrink-0">{entry.score}</span>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm" aria-label="최근 랭킹">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-600">순위</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-600">팀</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-600">점수</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-600">해커톤</th>
                  </tr>
                </thead>
                <tbody>
                  {topEntries.map((entry, i) => (
                    <tr key={`${entry.hackathonSlug}-${entry.teamName}`} className="border-b last:border-0 hover:bg-blue-50/50 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-yellow-100 text-yellow-800" :
                          i === 1 ? "bg-gray-200 text-gray-700" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "text-gray-500"
                        }`}>{i < 3 ? medals[i] : i + 1}</span>
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
          );
        })()
        )}
      </Section>
    </div>
  );
}
