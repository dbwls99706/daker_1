"use client";

import { useState, useCallback, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathonDetail, getHackathons, getLeaderboard, getTeams, getSubmissions, saveSubmission, updateLeaderboard, addRecentlyViewed } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
import { formatKRW, formatDateTime, getDday, generateId, sanitizeUrl, isValidUrl, getTimeRemaining } from "@/lib/utils";
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

  if (!ready) {
    return <LoadingSpinner />;
  }

  const detail = getHackathonDetail(slug);
  const hackathon = getHackathons().find((h) => h.slug === slug);

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
  // dataVersion in dependency triggers re-read after save/submit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { teams, leaderboard, submissions } = useMemo(() => ({
    teams: getTeams(slug),
    leaderboard: getLeaderboard(slug),
    submissions: getSubmissions(slug),
  }), [slug, dataVersion]);

  function handleSaveSubmission(items: { key: string; value: string }[], memo: string, teamName: string) {
    const existing = submissions[0];
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
    const existing = submissions[0];
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
      lb.entries.push({
        rank: lb.entries.length + 1,
        teamName: finalTeamName,
        score: 0,
        submittedAt: new Date().toISOString(),
      });
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
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-1"
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
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${getTimeRemaining(hackathon.period.submissionDeadlineAt)}%` }}
              />
            </div>
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
      <div
        className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1"
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
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">개요</h2>
            {sec.overview ? (
              <>
                <p className="text-gray-700 leading-relaxed">{sec.overview.summary}</p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">팀 정책</h3>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    <li>개인 참가: {sec.overview.teamPolicy.allowSolo ? "가능" : "불가"}</li>
                    <li>최대 팀원: {sec.overview.teamPolicy.maxTeamSize}명</li>
                  </ul>
                </div>
              </>
            ) : (
              <EmptyState title="개요 정보 없음" description="이 해커톤의 개요 정보가 아직 등록되지 않았습니다." />
            )}
          </div>
        )}

        {activeTab === "eval" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">평가</h2>
            {sec.eval ? (
            <>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-600">평가 지표</div>
              <div className="mt-1 text-xl font-bold text-blue-600">{sec.eval.metricName}</div>
            </div>
            <p className="text-gray-700">{sec.eval.description}</p>
            {sec.eval.scoreDisplay && (
              <div className="space-y-2">
                <h3 className="font-semibold">{sec.eval.scoreDisplay.label} 구성</h3>
                <div className="flex gap-3">
                  {sec.eval.scoreDisplay.breakdown.map((b) => (
                    <div key={b.key} className="flex-1 rounded-lg border border-gray-200 p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{b.weightPercent}%</div>
                      <div className="mt-1 text-sm text-gray-600">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sec.eval.limits && (
              <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                <p>최대 실행 시간: {sec.eval.limits.maxRuntimeSec}초</p>
                <p>일일 최대 제출: {sec.eval.limits.maxSubmissionsPerDay}건</p>
              </div>
            )}
            </>
            ) : (
              <EmptyState title="평가 정보 없음" description="이 해커톤의 평가 정보가 아직 등록되지 않았습니다." />
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">일정</h2>
            {sec.schedule?.milestones?.length ? (
            <div className="relative space-y-0">
              {sec.schedule!.milestones.map((m, i) => {
                const isPast = new Date(m.at) < new Date();
                return (
                  <div key={i} className="flex gap-4 pb-6">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${
                          isPast ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                        }`}
                      />
                      {i < sec.schedule!.milestones.length - 1 && (
                        <div className={`w-0.5 flex-1 ${isPast ? "bg-blue-200" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="-mt-0.5">
                      <div className={`font-semibold ${isPast ? "text-gray-400" : "text-gray-900"}`}>{m.name}</div>
                      <div className="text-sm text-gray-500">{formatDateTime(m.at)}</div>
                      {!isPast && getDday(m.at) !== "D-Day" && (
                        <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {getDday(m.at)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <EmptyState title="일정 정보 없음" description="이 해커톤의 일정 정보가 아직 등록되지 않았습니다." />
            )}
          </div>
        )}

        {activeTab === "prize" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">상금</h2>
            {sec.prize?.items?.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {sec.prize.items.map((p, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border-2 p-6 text-center ${
                      i === 0
                        ? "border-yellow-300 bg-yellow-50"
                        : i === 1
                        ? "border-gray-300 bg-gray-50"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="text-2xl" aria-hidden="true">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                    <div className="mt-2 text-sm font-medium text-gray-600">{p.place}</div>
                    <div className="mt-1 text-xl font-bold">{formatKRW(p.amountKRW)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="상금 정보 없음" description="이 해커톤의 상금 정보가 아직 등록되지 않았습니다." />
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">안내</h2>
            {sec.info ? (
              <>
                <div className="space-y-3">
                  {sec.info.notice.map((n, i) => (
                    <div key={i} className="flex gap-2 rounded-lg bg-gray-50 p-3">
                      <span className="text-blue-500">•</span>
                      <p className="text-sm text-gray-700">{n}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <a
                    href={sanitizeUrl(sec.info.links.rules)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    규정 보기 ↗
                  </a>
                  <a
                    href={sanitizeUrl(sec.info.links.faq)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    FAQ ↗
                  </a>
                </div>
              </>
            ) : (
              <EmptyState title="안내 정보 없음" description="이 해커톤의 안내 정보가 아직 등록되지 않았습니다." />
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">팀 목록</h2>
              <Link
                href={`/camp?hackathon=${slug}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                팀 보기 / 생성
              </Link>
            </div>
            {teams.length === 0 ? (
              <EmptyState title="등록된 팀이 없습니다" description="캠프에서 첫 팀을 만들어보세요!" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {teams.map((t) => (
                  <div key={t.teamCode} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{t.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          t.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t.isOpen ? "모집중" : "모집마감"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t.intro}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.lookingFor.map((r) => (
                        <span key={r} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>{t.memberCount}명</span>
                      {t.isOpen && (
                        <a
                          href={sanitizeUrl(t.contact.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          연락하기
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">리더보드</h2>
            {sec.leaderboard?.note && (
              <p className="text-sm text-gray-500">{sec.leaderboard.note}</p>
            )}
            {!leaderboard || leaderboard.entries.length === 0 ? (
              <EmptyState title="리더보드 데이터 없음" description="아직 제출된 결과가 없습니다." />
            ) : (
              <div className="overflow-x-auto">
                <p className="text-xs text-gray-400 sm:hidden mb-1">← 좌우로 스크롤하세요 →</p>
                {(() => {
                  const hasBreakdown = leaderboard.entries.some((e) => e.scoreBreakdown);
                  return (
                <table className="w-full text-sm" aria-label="리더보드">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th scope="col" className="px-4 py-3 font-semibold">순위</th>
                      <th scope="col" className="px-4 py-3 font-semibold">팀</th>
                      <th scope="col" className="px-4 py-3 font-semibold">점수</th>
                      {hasBreakdown && (
                        <>
                          <th scope="col" className="px-4 py-3 font-semibold">참가자</th>
                          <th scope="col" className="px-4 py-3 font-semibold">심사위원</th>
                        </>
                      )}
                      <th scope="col" className="px-4 py-3 font-semibold">제출일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...leaderboard.entries]
                      .sort((a, b) => a.rank - b.rank)
                      .map((e) => (
                        <tr key={e.teamName} className="border-b last:border-0 hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                e.rank === 1
                                  ? "bg-yellow-100 text-yellow-800"
                                  : e.rank === 2
                                  ? "bg-gray-200 text-gray-700"
                                  : e.rank === 3
                                  ? "bg-orange-100 text-orange-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {e.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{e.teamName}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {e.score === 0 ? (
                              <span className="text-gray-400 font-normal">채점 대기</span>
                            ) : (
                              e.score
                            )}
                          </td>
                          {hasBreakdown && (
                            <>
                              <td className="px-4 py-3 text-gray-600">{e.scoreBreakdown?.participant ?? "-"}</td>
                              <td className="px-4 py-3 text-gray-600">{e.scoreBreakdown?.judge ?? "-"}</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(e.submittedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Submit Tab Component
function SubmitTab({
  sections,
  existingSubmission,
  onSave,
  onSubmit,
}: {
  sections: {
    allowedArtifactTypes: string[];
    guide: string[];
    submissionItems?: { key: string; title: string; format: string }[];
  };
  existingSubmission: Submission | null;
  onSave: (items: { key: string; value: string }[], memo: string, teamName: string) => void;
  onSubmit: (items: { key: string; value: string }[], memo: string, teamName: string) => void;
}) {
  const hasSteps = sections.submissionItems && sections.submissionItems.length > 0;
  const keys = hasSteps
    ? sections.submissionItems!.map((s) => s.key)
    : sections.allowedArtifactTypes.map((t) => t);

  const initialItems = keys.map((k) => ({
    key: k,
    value: existingSubmission?.items.find((i) => i.key === k)?.value || "",
  }));

  const [items, setItems] = useState(initialItems);
  const [memo, setMemo] = useState(existingSubmission?.memo || "");
  const [teamName, setTeamName] = useState(existingSubmission?.teamName || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  function updateItem(key: string, value: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, value } : i)));
    if (urlErrors[key]) {
      setUrlErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validateUrls(): boolean {
    const errors: Record<string, string> = {};
    if (hasSteps) {
      for (const step of sections.submissionItems!) {
        if (step.format === "url" || step.format === "pdf_url") {
          const val = items.find((i) => i.key === step.key)?.value || "";
          if (val && !isValidUrl(val)) {
            errors[step.key] = "올바른 URL 형식이 아닙니다 (https://...)";
          }
        }
      }
    }
    setUrlErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const isSubmitted = existingSubmission?.status === "submitted";

  const filledCount = items.filter((i) => i.value.trim()).length;
  const totalItems = items.length + 1;
  const filledTotal = filledCount + (teamName.trim() ? 1 : 0);
  const completionPercent = Math.round((filledTotal / totalItems) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">제출</h2>
        {!isSubmitted && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">작성</span>
            <div className="h-2 w-24 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${completionPercent === 100 ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="font-semibold text-gray-700">{completionPercent}%</span>
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-800">제출이 완료되었습니다</span>
            </div>
            <button
              onClick={() => {
                if (confirm("제출을 철회하고 수정 모드로 전환합니다. 계속하시겠습니까?")) {
                  onSave(
                    existingSubmission!.items,
                    existingSubmission!.memo,
                    existingSubmission!.teamName
                  );
                }
              }}
              className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 transition"
            >
              수정하기 (재제출)
            </button>
          </div>
          <p className="mt-1 text-xs text-green-700">
            제출일시: {formatDateTime(existingSubmission!.submittedAt!)} | 팀명: {existingSubmission!.teamName}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-gray-700">제출 가이드</h3>
        <ul className="space-y-1">
          {sections.guide.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="text-blue-500">{i + 1}.</span>
              {g}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="submit-team-name" className="block text-sm font-semibold text-gray-700">
            팀명 / 닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            id="submit-team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={isSubmitted}
            aria-required="true"
            maxLength={50}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="리더보드에 표시될 팀명을 입력하세요"
          />
        </div>

        {hasSteps
          ? sections.submissionItems!.map((step) => (
              <div key={step.key} className="space-y-2">
                <label htmlFor={`submit-${step.key}`} className="block text-sm font-semibold text-gray-700">{step.title}</label>
                {step.format === "text_or_url" ? (
                  <textarea
                    id={`submit-${step.key}`}
                    value={items.find((i) => i.key === step.key)?.value || ""}
                    onChange={(e) => updateItem(step.key, e.target.value)}
                    rows={3}
                    disabled={isSubmitted}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="텍스트 또는 URL을 입력하세요"
                  />
                ) : (
                  <>
                    <input
                      id={`submit-${step.key}`}
                      type="url"
                      value={items.find((i) => i.key === step.key)?.value || ""}
                      onChange={(e) => updateItem(step.key, e.target.value)}
                      disabled={isSubmitted}
                      aria-describedby={urlErrors[step.key] ? `submit-error-${step.key}` : undefined}
                      aria-invalid={!!urlErrors[step.key]}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${urlErrors[step.key] ? "border-red-400" : "border-gray-300"}`}
                      placeholder="https://..."
                    />
                    {urlErrors[step.key] && (
                      <p id={`submit-error-${step.key}`} className="text-xs text-red-500" role="alert">{urlErrors[step.key]}</p>
                    )}
                  </>
                )}
              </div>
            ))
          : keys.map((k) => (
              <div key={k} className="space-y-2">
                <label htmlFor={`submit-${k}`} className="block text-sm font-semibold text-gray-700 capitalize">{k} 파일</label>
                <input
                  id={`submit-${k}`}
                  type="text"
                  value={items.find((i) => i.key === k)?.value || ""}
                  onChange={(e) => updateItem(k, e.target.value)}
                  disabled={isSubmitted}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder={`${k} 파일 경로 또는 URL`}
                />
              </div>
            ))}

        <div className="space-y-2">
          <label htmlFor="submit-memo" className="block text-sm font-semibold text-gray-700">메모 (선택)</label>
          <textarea
            id="submit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            disabled={isSubmitted}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="심사위원에게 전달할 메모 (최대 500자)"
          />
          <p className="text-xs text-gray-400 text-right">{memo.length}/500</p>
        </div>
      </div>

      {!isSubmitted && (
        <div className="space-y-2 pt-2">
          {!teamName.trim() && (
            <p className="text-xs text-red-500">팀명을 입력해야 제출할 수 있습니다.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { if (validateUrls()) onSave(items, memo, teamName); }}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              임시 저장
            </button>
            <button
              onClick={() => { if (validateUrls()) setShowConfirm(true); }}
              disabled={!teamName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              제출 완료
            </button>
          </div>
        </div>
      )}

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="제출을 확정하시겠습니까?"
        actions={
          <>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                onSubmit(items, memo, teamName);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              확인, 제출합니다
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-red-600 font-medium">제출 후에는 수정이 불가합니다.</p>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p><span className="font-semibold">팀명:</span> {teamName}</p>
            {items.filter((i) => i.value).map((i) => (
              <p key={i.key} className="mt-1"><span className="font-semibold">{i.key}:</span> {i.value.length > 50 ? i.value.slice(0, 50) + "..." : i.value}</p>
            ))}
            {memo && <p className="mt-1"><span className="font-semibold">메모:</span> {memo.length > 50 ? memo.slice(0, 50) + "..." : memo}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
