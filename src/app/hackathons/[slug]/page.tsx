"use client";

import { useState, useCallback, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathonDetail, getHackathons, getLeaderboard, getTeams, getSubmissions, saveSubmission, updateLeaderboard, addRecentlyViewed } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Toast } from "@/components/ui/Toast";
import { SubmitTab } from "@/components/features/SubmitTab";
import { OverviewTab } from "@/components/features/tabs/OverviewTab";
import { EvalTab } from "@/components/features/tabs/EvalTab";
import { ScheduleTab } from "@/components/features/tabs/ScheduleTab";
import { PrizeTab } from "@/components/features/tabs/PrizeTab";
import { InfoTab } from "@/components/features/tabs/InfoTab";
import { TeamsTab } from "@/components/features/tabs/TeamsTab";
import { LeaderboardTab } from "@/components/features/tabs/LeaderboardTab";
import { getDday, generateId, getTimeRemaining } from "@/lib/utils";
import { Confetti } from "@/components/features/Confetti";
import { CountdownTimer } from "@/components/features/CountdownTimer";
import { ShareButton } from "@/components/features/ShareButton";
import type { Submission } from "@/types";

const TABS = [
  { key: "overview", label: "개요", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "eval", label: "평가", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { key: "schedule", label: "일정", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "prize", label: "상금", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "info", label: "안내", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "teams", label: "팀", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "submit", label: "제출", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { key: "leaderboard", label: "리더보드", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HackathonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const ready = useSeedData();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    urlTab && TABS.some((t) => t.key === urlTab) ? urlTab : "overview"
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Sync tab to URL without full navigation
  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const refreshData = useCallback(() => {
    setDataVersion((n) => n + 1);
  }, []);

  useEffect(() => {
    if (ready) addRecentlyViewed(slug);
  }, [ready, slug]);

  const detail = useMemo(() => (ready ? getHackathonDetail(slug) : null), [ready, slug]);
  const hackathon = useMemo(() => {
    if (!ready) return null;
    return getHackathons().find((h) => h.slug === slug) || null;
  }, [ready, slug]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { teams, leaderboard, submissions } = useMemo(() => ({
    teams: ready ? getTeams(slug) : [],
    leaderboard: ready ? getLeaderboard(slug) : null,
    submissions: ready ? getSubmissions(slug) : [],
  }), [ready, slug, dataVersion]);

  if (!ready) {
    return <SkeletonPage />;
  }

  if (!hackathon) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <span className="text-4xl" aria-hidden="true">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-700">404</h1>
        <p className="text-gray-500">해커톤을 찾을 수 없습니다.</p>
        <Link href="/hackathons" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 btn-press">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div>
          <Link href="/hackathons" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            해커톤 목록
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{hackathon.title}</h1>
            <StatusBadge status={hackathon.status} />
          </div>
        </div>
        <EmptyState
          title="상세 정보 준비중"
          description="이 해커톤의 상세 정보가 아직 등록되지 않았습니다."
          icon="document"
          action={
            <Link href="/hackathons" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 btn-press">
              다른 해커톤 보기
            </Link>
          }
        />
      </div>
    );
  }

  const sec = detail.sections;

  function handleSaveSubmission(items: { key: string; value: string }[], memo: string, teamName: string) {
    const existing = submissions?.length > 0 ? submissions?.[0] : null;
    const sub: Submission = {
      id: existing?.id || generateId(),
      hackathonSlug: slug,
      teamName: teamName.trim(),
      status: "draft",
      items,
      memo,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveSubmission(sub);
    setToastMsg("임시 저장되었습니다.");
    refreshData();
  }

  function handleSubmit(items: { key: string; value: string }[], memo: string, teamName: string) {
    const existing = submissions?.length > 0 ? submissions?.[0] : null;
    const finalTeamName = teamName.trim();
    const sub: Submission = {
      id: existing?.id || generateId(),
      hackathonSlug: slug,
      teamName: finalTeamName,
      status: "submitted",
      items,
      memo,
      submittedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveSubmission(sub);

    const lb = getLeaderboard(slug) || {
      hackathonSlug: slug,
      updatedAt: new Date().toISOString(),
      entries: [],
    };
    const existingEntry = lb.entries.find((e) => e.teamName === finalTeamName);
    if (!existingEntry) {
      const unscoredRank = lb.entries.filter((e) => e.score > 0).length + lb.entries.filter((e) => e.score === 0).length + 1;
      lb.entries.push({
        rank: unscoredRank,
        teamName: finalTeamName,
        score: 0,
        submittedAt: new Date().toISOString(),
      });
      lb.updatedAt = new Date().toISOString();
      updateLeaderboard(lb);
    } else {
      existingEntry.submittedAt = new Date().toISOString();
      lb.updatedAt = new Date().toISOString();
      updateLeaderboard(lb);
    }

    setToastMsg("제출이 완료되었습니다!");
    setShowConfetti(true);
    refreshData();
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
      <Confetti trigger={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* Header */}
      <div>
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-gray-500" aria-label="브레드크럼">
          <Link href="/" className="hover:text-gray-700 transition">홈</Link>
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/hackathons" className="hover:text-gray-700 transition">해커톤</Link>
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-[200px]" aria-current="page">{detail.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">{detail.title}</h1>
          <StatusBadge status={hackathon.status} />
          {hackathon.status !== "ended" && (
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
              {getDday(hackathon.period.submissionDeadlineAt)}
            </span>
          )}
          <ShareButton title={detail.title} description={detail.sections?.overview?.summary} />
        </div>
        {hackathon.status !== "ended" && (
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>마감까지</span>
              <span className="font-medium">{100 - getTimeRemaining(hackathon.period.submissionDeadlineAt)}% 남음</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={getTimeRemaining(hackathon.period.submissionDeadlineAt)} aria-valuemin={0} aria-valuemax={100} aria-label={`마감 진행률 ${getTimeRemaining(hackathon.period.submissionDeadlineAt)}%`}>
              <div
                className="progress-gradient h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${getTimeRemaining(hackathon.period.submissionDeadlineAt)}%` }}
              />
            </div>
          </div>
        )}
        {hackathon.status !== "ended" && (
          <div className="mt-4">
            <CountdownTimer targetIso={hackathon.period.submissionDeadlineAt} label="제출 마감까지" />
          </div>
        )}

        {/* Mini Stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-100">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-500">팀</span>
            <span className="font-semibold text-gray-900">{teams.length}개</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-100">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-gray-500">리더보드</span>
            <span className="font-semibold text-gray-900">{leaderboard?.entries.length || 0}팀</span>
          </div>
          {submissions.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm border border-gray-100">
              <div className={`h-2.5 w-2.5 rounded-full ${submissions?.[0]?.status === "submitted" ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="font-semibold text-gray-900">
                {submissions?.[0]?.status === "submitted" ? "제출 완료" : "임시 저장됨"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <p className="text-xs text-gray-400 sm:hidden mb-1.5">← 좌우로 스와이프하여 탭 이동 →</p>
        <div
          className="relative flex gap-0.5 overflow-x-auto rounded-xl bg-gray-100 p-1 tab-scroll-hint scrollbar-thin"
          role="tablist"
          aria-label="해커톤 상세 탭"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
              e.preventDefault();
              const idx = TABS.findIndex((t) => t.key === activeTab);
              let next: number;
              if (e.key === "Home") next = 0;
              else if (e.key === "End") next = TABS.length - 1;
              else if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
              else next = (idx - 1 + TABS.length) % TABS.length;
              handleTabChange(TABS[next].key);
              document.getElementById(`tab-${TABS[next].key}`)?.focus();
            }
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={activeTab === tab.key ? 0 : -1}
              className={`cursor-pointer whitespace-nowrap flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition btn-press ${
                activeTab === tab.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
              {tab.key === "teams" && teams.length > 0 && (
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{teams.length}</span>
              )}
              {tab.key === "leaderboard" && leaderboard && leaderboard.entries.length > 0 && (
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{leaderboard.entries.length}</span>
              )}
              {tab.key === "submit" && submissions.length > 0 && (
                <span className={`ml-0.5 inline-flex h-2 w-2 rounded-full ${submissions?.[0]?.status === "submitted" ? "bg-green-500" : "bg-yellow-500"}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-tab-fade" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "overview" && <OverviewTab overview={sec.overview} />}
        {activeTab === "eval" && <EvalTab eval={sec.eval} />}
        {activeTab === "schedule" && <ScheduleTab schedule={sec.schedule} />}
        {activeTab === "prize" && <PrizeTab prize={sec.prize} />}
        {activeTab === "info" && <InfoTab info={sec.info} />}
        {activeTab === "teams" && <TeamsTab teams={teams} slug={slug} />}
        {activeTab === "submit" && (
          sec.submit ? (
            <SubmitTab
              key={submissions?.[0]?.id || "new"}
              sections={sec.submit}
              existingSubmission={submissions?.[0] ?? null}
              onSave={handleSaveSubmission}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">제출</h2>
              <EmptyState title="제출 정보 없음" description="이 해커톤의 제출 양식이 아직 등록되지 않았습니다." icon="document" />
            </div>
          )
        )}
        {activeTab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} leaderboardSection={sec.leaderboard} />}
      </div>
    </div>
  );
}
