"use client";

import { useState, useCallback, useEffect, useMemo, use } from "react";
import Link from "next/link";
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
import { CountdownTimer } from "@/components/features/CountdownTimer";
import type { Submission } from "@/types";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "eval", label: "평가" },
  { key: "schedule", label: "일정" },
  { key: "prize", label: "상금" },
  { key: "info", label: "안내" },
  { key: "teams", label: "팀" },
  { key: "submit", label: "제출" },
  { key: "leaderboard", label: "리더보드" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HackathonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const ready = useSeedData();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

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
        <h1 className="text-2xl font-bold text-gray-700">404</h1>
        <p className="text-gray-500">해커톤을 찾을 수 없습니다.</p>
        <Link href="/hackathons" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/hackathons" className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700">
            ← 해커톤 목록
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{hackathon.title}</h1>
            <StatusBadge status={hackathon.status} />
          </div>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">📋</div>
          <h3 className="text-lg font-semibold text-gray-700">상세 정보 준비중</h3>
          <p className="mt-1 text-sm text-gray-500">이 해커톤의 상세 정보가 아직 등록되지 않았습니다.</p>
          <Link href="/hackathons" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            다른 해커톤 보기
          </Link>
        </div>
      </div>
    );
  }

  const sec = detail.sections;

  function handleSaveSubmission(items: { key: string; value: string }[], memo: string, teamName: string) {
    const existing = submissions.length > 0 ? submissions[0] : null;
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
    const existing = submissions.length > 0 ? submissions[0] : null;
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

    // Read leaderboard fresh to minimize race condition window
    const lb = getLeaderboard(slug) || {
      hackathonSlug: slug,
      updatedAt: new Date().toISOString(),
      entries: [],
    };
    const existingEntry = lb.entries.find((e) => e.teamName === finalTeamName);
    if (!existingEntry) {
      // Assign rank based on score ordering (unscored entries go last)
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
      // Update submission time for resubmission
      existingEntry.submittedAt = new Date().toISOString();
      lb.updatedAt = new Date().toISOString();
      updateLeaderboard(lb);
    }

    setToastMsg("제출이 완료되었습니다!");
    refreshData();
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      {/* Header */}
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-gray-500" aria-label="브레드크럼">
          <Link href="/" className="hover:text-gray-700 transition">홈</Link>
          <span aria-hidden="true">›</span>
          <Link href="/hackathons" className="hover:text-gray-700 transition">해커톤</Link>
          <span aria-hidden="true">›</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{detail.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{detail.title}</h1>
          <StatusBadge status={hackathon.status} />
          {hackathon.status !== "ended" && (
            <span className="text-sm font-semibold text-orange-600">
              {getDday(hackathon.period.submissionDeadlineAt)}
            </span>
          )}
          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => setToastMsg("링크가 복사되었습니다!"));
              }
            }}
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-1"
            aria-label="링크 복사"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            공유
          </button>
        </div>
        {hackathon.status !== "ended" && (
          <div className="mt-3 max-w-md">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>마감까지</span>
              <span>{100 - getTimeRemaining(hackathon.period.submissionDeadlineAt)}% 남음</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={getTimeRemaining(hackathon.period.submissionDeadlineAt)} aria-valuemin={0} aria-valuemax={100} aria-label={`마감 진행률 ${getTimeRemaining(hackathon.period.submissionDeadlineAt)}%`}>
              <div
                className="progress-gradient h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${getTimeRemaining(hackathon.period.submissionDeadlineAt)}%` }}
              />
            </div>
          </div>
        )}
        {/* Countdown Timer */}
        {hackathon.status !== "ended" && (
          <div className="mt-4">
            <CountdownTimer targetIso={hackathon.period.submissionDeadlineAt} label="제출 마감까지" />
          </div>
        )}

        {/* Mini Stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
            <span className="text-gray-500">팀</span>
            <span className="font-semibold text-gray-900">{teams.length}개</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
            <span className="text-gray-500">리더보드</span>
            <span className="font-semibold text-gray-900">{leaderboard?.entries.length || 0}팀</span>
          </div>
          {submissions.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${submissions[0].status === "submitted" ? "bg-green-500" : "bg-yellow-500"}`} />
              <span className="font-semibold text-gray-900">
                {submissions[0].status === "submitted" ? "제출 완료" : "임시 저장됨"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스와이프하여 탭 이동 →</p>
      <div
        className="relative flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 tab-scroll-hint"
        role="tablist"
        aria-label="해커톤 상세 탭"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const idx = TABS.findIndex((t) => t.key === activeTab);
            const next = e.key === "ArrowRight"
              ? (idx + 1) % TABS.length
              : (idx - 1 + TABS.length) % TABS.length;
            setActiveTab(TABS[next].key);
            document.getElementById(`tab-${TABS[next].key}`)?.focus();
          }
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {tab.key === "teams" && teams.length > 0 && (
              <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{teams.length}</span>
            )}
            {tab.key === "leaderboard" && leaderboard && leaderboard.entries.length > 0 && (
              <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{leaderboard.entries.length}</span>
            )}
            {tab.key === "submit" && submissions.length > 0 && (
              <span className={`ml-1.5 inline-flex h-2 w-2 rounded-full ${submissions[0].status === "submitted" ? "bg-green-500" : "bg-yellow-500"}`} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div key={activeTab} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-tab-fade" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "overview" && <OverviewTab overview={sec.overview} />}
        {activeTab === "eval" && <EvalTab eval={sec.eval} />}
        {activeTab === "schedule" && <ScheduleTab schedule={sec.schedule} />}
        {activeTab === "prize" && <PrizeTab prize={sec.prize} />}
        {activeTab === "info" && <InfoTab info={sec.info} />}
        {activeTab === "teams" && <TeamsTab teams={teams} slug={slug} />}
        {activeTab === "submit" && (
          sec.submit ? (
            <SubmitTab
              key={submissions[0]?.id || "new"}
              sections={sec.submit}
              existingSubmission={submissions[0] || null}
              onSave={handleSaveSubmission}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">제출</h2>
              <EmptyState title="제출 정보 없음" description="이 해커톤의 제출 양식이 아직 등록되지 않았습니다." />
            </div>
          )
        )}
        {activeTab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} leaderboardSection={sec.leaderboard} />}
      </div>
    </div>
  );
}
