"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getHackathonDetail, getHackathons, getLeaderboard, getTeams, getSubmissions, saveSubmission, updateLeaderboard } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatKRW, formatDateTime, getDday, generateId, sanitizeUrl } from "@/lib/utils";
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
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

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
          <div className="mb-3 text-4xl">📋</div>
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
  const teams = getTeams(slug);
  const leaderboard = getLeaderboard(slug);
  const submissions = getSubmissions(slug);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

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
    setSubmission(sub);
    showToast("임시 저장되었습니다.");
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
    setSubmission(sub);

    // Update leaderboard
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

    showToast("제출 완료!");
    forceUpdate((n) => n + 1);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 animate-fade-in rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <Link href="/hackathons" className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700">
          ← 해커톤 목록
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{detail.title}</h1>
          <StatusBadge status={hackathon.status} />
          {hackathon.status !== "ended" && (
            <span className="text-sm font-semibold text-orange-600">
              {getDday(hackathon.period.submissionDeadlineAt)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1" role="tablist" aria-label="해커톤 상세 탭">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">개요</h2>
            <p className="text-gray-700 leading-relaxed">{sec.overview.summary}</p>
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">팀 정책</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>개인 참가: {sec.overview.teamPolicy.allowSolo ? "가능" : "불가"}</li>
                <li>최대 팀원: {sec.overview.teamPolicy.maxTeamSize}명</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "eval" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">평가</h2>
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
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">일정</h2>
            <div className="relative space-y-0">
              {sec.schedule.milestones.map((m, i) => {
                const isPast = new Date(m.at) < new Date();
                return (
                  <div key={i} className="flex gap-4 pb-6">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${
                          isPast ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                        }`}
                      />
                      {i < sec.schedule.milestones.length - 1 && (
                        <div className={`w-0.5 flex-1 ${isPast ? "bg-blue-200" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="-mt-0.5">
                      <div className="font-semibold text-gray-900">{m.name}</div>
                      <div className="text-sm text-gray-500">{formatDateTime(m.at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "prize" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">상금</h2>
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
                  <div className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                  <div className="mt-2 text-sm font-medium text-gray-600">{p.place}</div>
                  <div className="mt-1 text-xl font-bold">{formatKRW(p.amountKRW)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">안내</h2>
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
                href={sec.info.links.rules}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                규정 보기
              </a>
              <a
                href={sec.info.links.faq}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                FAQ
              </a>
            </div>
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
          <SubmitTab
            sections={sec.submit}
            hackathonSlug={slug}
            existingSubmission={submission || submissions[0] || null}
            onSave={handleSaveSubmission}
            onSubmit={handleSubmit}
          />
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">리더보드</h2>
            {sec.leaderboard.note && (
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
                      <th className="px-4 py-3 font-semibold">순위</th>
                      <th className="px-4 py-3 font-semibold">팀</th>
                      <th className="px-4 py-3 font-semibold">점수</th>
                      {hasBreakdown && (
                        <>
                          <th className="px-4 py-3 font-semibold">참가자</th>
                          <th className="px-4 py-3 font-semibold">심사위원</th>
                        </>
                      )}
                      <th className="px-4 py-3 font-semibold">제출일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...leaderboard.entries]
                      .sort((a, b) => a.rank - b.rank)
                      .map((e) => (
                        <tr key={e.teamName} className="border-b last:border-0">
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
                              {e.score === 0 ? "-" : e.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{e.teamName}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {e.score === 0 ? "미제출" : e.score}
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
  hackathonSlug,
  existingSubmission,
  onSave,
  onSubmit,
}: {
  sections: {
    allowedArtifactTypes: string[];
    guide: string[];
    submissionItems?: { key: string; title: string; format: string }[];
  };
  hackathonSlug: string;
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

  function updateItem(key: string, value: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, value } : i)));
  }

  const isSubmitted = existingSubmission?.status === "submitted";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">제출</h2>
      {isSubmitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          제출이 완료되었습니다. ({formatDateTime(existingSubmission!.submittedAt!)})
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
        {/* Team Name */}
        <div className="space-y-2">
          <label htmlFor="submit-team-name" className="block text-sm font-semibold text-gray-700">팀명 / 닉네임 *</label>
          <input
            id="submit-team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={isSubmitted}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="리더보드에 표시될 팀명을 입력하세요"
          />
        </div>

        {hasSteps
          ? sections.submissionItems!.map((step) => (
              <div key={step.key} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">{step.title}</label>
                {step.format === "text_or_url" ? (
                  <textarea
                    value={items.find((i) => i.key === step.key)?.value || ""}
                    onChange={(e) => updateItem(step.key, e.target.value)}
                    rows={3}
                    disabled={isSubmitted}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="텍스트 또는 URL을 입력하세요"
                  />
                ) : (
                  <input
                    type="url"
                    value={items.find((i) => i.key === step.key)?.value || ""}
                    onChange={(e) => updateItem(step.key, e.target.value)}
                    disabled={isSubmitted}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="URL을 입력하세요"
                  />
                )}
              </div>
            ))
          : keys.map((k) => (
              <div key={k} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 capitalize">{k} 파일</label>
                <input
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="심사위원에게 전달할 메모"
          />
        </div>
      </div>

      {!isSubmitted && (
        <div className="space-y-2 pt-2">
          {!teamName.trim() && (
            <p className="text-xs text-red-500">팀명을 입력해야 제출할 수 있습니다.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => onSave(items, memo, teamName)}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              임시 저장
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!teamName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              제출 완료
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
        <p>제출 후에는 수정이 불가합니다. 내용을 다시 한번 확인해주세요.</p>
        {teamName && (
          <p className="mt-2 font-medium text-gray-900">팀명: {teamName}</p>
        )}
      </Modal>
    </div>
  );
}
