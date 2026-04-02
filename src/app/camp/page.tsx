"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getTeams, getHackathons, addTeam, updateTeam, deleteTeam, addMyTeam, isMyTeam, removeMyTeam, joinTeam, hasJoinedTeam, leaveTeam } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { generateId, isValidUrl, formatDate } from "@/lib/utils";
import { TeamMatcher } from "@/components/features/TeamMatcher";
import type { Team } from "@/types";

function CampContent() {
  const ready = useSeedData();
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get("hackathon") || "";

  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ teamCode: string; name: string } | null>(null);
  const [joinTarget, setJoinTarget] = useState<{ teamCode: string; name: string } | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<{ teamCode: string; name: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [teamSearch, setTeamSearch] = useState("");
  const [campSort, setCampSort] = useState<"newest" | "name" | "members">("newest");
  const [campPage, setCampPage] = useState(1);
  const CAMP_PAGE_SIZE = 9;

  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    setSelectedHackathon(hackathonFilter);
    setCampPage(1);
  }, [hackathonFilter]);

  const teams = useMemo(() => {
    if (!ready) return [];
    return getTeams(hackathonFilter || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hackathonFilter, refreshKey]);

  const hackathons = useMemo(() => {
    if (!ready) return [];
    return getHackathons();
  }, [ready]);

  const hackathonMap = useMemo(() => {
    return new Map(hackathons.map((h) => [h.slug, h]));
  }, [hackathons]);

  const isRecruitmentOpen = (team: Team) => {
    if (!team.hackathonSlug) return team.isOpen;
    const hackathon = hackathonMap.get(team.hackathonSlug);
    if (!hackathon) return team.isOpen;
    return team.isOpen && new Date() < new Date(hackathon.period.submissionDeadlineAt);
  };

  function handleCreate() {
    if (!name.trim() || !intro.trim()) return;
    if (contactUrl.trim() && !isValidUrl(contactUrl.trim())) {
      setContactError("올바른 URL 형식이 아닙니다 (https://...)");
      return;
    }
    setContactError("");

    const team: Team = {
      teamCode: `T-${generateId().toUpperCase()}`,
      hackathonSlug: selectedHackathon,
      name: name.trim(),
      isOpen: true,
      memberCount: 1,
      lookingFor: lookingFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      intro: intro.trim(),
      contact: { type: "link", url: contactUrl.trim() || "#" },
      createdAt: new Date().toISOString(),
    };
    addTeam(team);
    addMyTeam(team.teamCode);
    setName("");
    setIntro("");
    setContactUrl("");
    setLookingFor("");
    setShowCreate(false);
    setToastMsg("팀이 생성되었습니다!");
    setRefreshKey((n) => n + 1);
  }

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (!teamSearch.trim()) return true;
      const q = teamSearch.trim().toLowerCase();
      return t.name.toLowerCase().includes(q) || t.lookingFor.some((r) => r.toLowerCase().includes(q)) || t.intro.toLowerCase().includes(q);
    }).sort((a, b) => {
      if (campSort === "name") return a.name.localeCompare(b.name);
      if (campSort === "members") return b.memberCount - a.memberCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [teams, teamSearch, campSort]);

  if (!ready) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">팀원 모집</h1>
          <p className="mt-1 text-sm text-gray-500">함께할 팀원을 찾거나 팀을 만들어보세요</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition btn-press ${
            showCreate
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          }`}
        >
          {showCreate ? "취소" : "+ 팀 모집글 생성"}
        </button>
      </div>

      {/* Hackathon filter pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/camp"
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition btn-press ${
            !hackathonFilter
              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
              : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          전체
        </Link>
        {hackathons.map((h) => (
          <Link
            key={h.slug}
            href={`/camp?hackathon=${h.slug}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition flex items-center gap-1.5 btn-press ${
              hackathonFilter === h.slug
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <StatusBadge status={h.status} />
            <span>{h.title.length > 15 ? h.title.slice(0, 15) + "..." : h.title}</span>
          </Link>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={teamSearch}
            onChange={(e) => { setTeamSearch(e.target.value); setCampPage(1); }}
            placeholder="팀명 또는 포지션 검색..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            aria-label="팀 검색"
          />
        </div>
        <select
          value={campSort}
          onChange={(e) => { setCampSort(e.target.value as "newest" | "name" | "members"); setCampPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          aria-label="정렬"
        >
          <option value="newest">최신순</option>
          <option value="name">팀명순</option>
          <option value="members">인원순</option>
        </select>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-6 space-y-4 animate-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm" aria-hidden="true">✏️</span>
            새 팀 모집글
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="camp-team-name" className="block text-sm font-semibold text-gray-700 mb-1">
                팀명 <span className="text-red-500">*</span>
              </label>
              <input
                id="camp-team-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
                maxLength={30}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="팀 이름 (최대 30자)"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">{name.length}/30</p>
            </div>
            <div>
              <label htmlFor="camp-hackathon" className="block text-sm font-semibold text-gray-700 mb-1">해커톤 연결</label>
              <select
                id="camp-hackathon"
                value={selectedHackathon}
                onChange={(e) => setSelectedHackathon(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">선택 안함</option>
                {hackathons.map((h) => (
                  <option key={h.slug} value={h.slug}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="camp-intro" className="block text-sm font-semibold text-gray-700 mb-1">
              소개 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="camp-intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={2}
              aria-required="true"
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="팀 소개를 작성하세요 (최대 200자)"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{intro.length}/200</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="camp-positions" className="block text-sm font-semibold text-gray-700 mb-1">모집 포지션</label>
              <input
                id="camp-positions"
                type="text"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Frontend, Designer (쉼표로 구분)"
              />
            </div>
            <div>
              <label htmlFor="camp-contact" className="block text-sm font-semibold text-gray-700 mb-1">연락 링크</label>
              <input
                id="camp-contact"
                type="url"
                value={contactUrl}
                onChange={(e) => { setContactUrl(e.target.value); setContactError(""); }}
                aria-describedby={contactError ? "camp-contact-error" : undefined}
                aria-invalid={!!contactError}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${contactError ? "border-red-400" : "border-gray-300"}`}
                placeholder="https://open.kakao.com/o/..."
              />
              {contactError && <p id="camp-contact-error" className="text-xs text-red-500 mt-0.5" role="alert">{contactError}</p>}
            </div>
          </div>
          {(!name.trim() || !intro.trim()) && (name || intro) && (
            <p className="text-xs text-red-500">팀명과 소개를 모두 입력해야 생성할 수 있습니다.</p>
          )}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !intro.trim() || !!contactError}
            className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition btn-press shadow-sm"
          >
            생성하기
          </button>
        </div>
      )}

      {/* Team Matcher */}
      <TeamMatcher teams={teams} hackathonSlug={hackathonFilter || undefined} />

      <p className="text-sm text-gray-500" aria-live="polite">
        총 <span className="font-semibold text-gray-700">{filteredTeams.length}</span>개의 팀
      </p>

      {(() => {
        if (filteredTeams.length === 0) return (
          <EmptyState
            title="등록된 팀이 없습니다"
            description={teamSearch.trim() ? "검색 조건에 맞는 팀이 없습니다." : "첫 팀을 만들어보세요!"}
            icon="team"
            action={
              teamSearch.trim() ? (
                <button onClick={() => setTeamSearch("")} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition btn-press">검색 초기화</button>
              ) : (
                <button onClick={() => setShowCreate(true)} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition btn-press">팀 만들기</button>
              )
            }
          />
        );
        const totalPages = Math.max(1, Math.ceil(filteredTeams.length / CAMP_PAGE_SIZE));
        const safePage = Math.min(campPage, totalPages);
        if (safePage !== campPage) setCampPage(safePage);
        const pagedTeams = filteredTeams.slice((safePage - 1) * CAMP_PAGE_SIZE, safePage * CAMP_PAGE_SIZE);
        return (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagedTeams.map((t, i) => {
            const recruitmentOpen = isRecruitmentOpen(t);
            const recruitmentClosedByDeadline = t.isOpen && !recruitmentOpen;

            return (
            <div
              key={t.teamCode}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up card-hover-glow"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm ${
                    recruitmentOpen
                      ? "bg-gradient-to-br from-green-400 to-emerald-500"
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  }`}>
                    {t.name.charAt(0)}
                  </span>
                  <h3 className="font-bold text-gray-900 truncate max-w-[140px]" title={t.name}>{t.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    recruitmentOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {recruitmentOpen ? "모집중" : "모집마감"}
                </span>
              </div>
              {t.hackathonSlug && (
                <Link
                  href={`/hackathons/${t.hackathonSlug}`}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  </svg>
                  {hackathonMap.get(t.hackathonSlug)?.title || t.hackathonSlug}
                </Link>
              )}
              <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-3">{t.intro}</p>
              {t.lookingFor.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.lookingFor.map((r) => (
                    <span key={r} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              )}
              {/* Member capacity bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                    style={{ width: `${Math.min((t.memberCount / 5) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">{t.memberCount}/5명</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>{formatDate(t.createdAt)}</span>
                <div className="flex items-center gap-2">
                  {isMyTeam(t.teamCode) ? (
                    <>
                      {recruitmentOpen ? (
                        <button
                          onClick={() => {
                            updateTeam(t.teamCode, { isOpen: false });
                            setToastMsg("모집이 마감되었습니다.");
                            setRefreshKey((n) => n + 1);
                          }}
                          className="cursor-pointer font-medium text-orange-500 hover:text-orange-700 btn-press"
                        >
                          모집마감
                        </button>
                      ) : recruitmentClosedByDeadline ? (
                        <span className="font-medium text-gray-400">모집기간종료</span>
                      ) : (
                        <button
                          onClick={() => {
                            updateTeam(t.teamCode, { isOpen: true });
                            setToastMsg("모집이 재개되었습니다.");
                            setRefreshKey((n) => n + 1);
                          }}
                          className="cursor-pointer font-medium text-green-600 hover:text-green-800 btn-press"
                        >
                          모집재개
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ teamCode: t.teamCode, name: t.name })}
                        className="cursor-pointer font-medium text-red-400 hover:text-red-600 btn-press"
                      >
                        삭제
                      </button>
                    </>
                  ) : recruitmentOpen ? (
                    <>
                      {hasJoinedTeam(t.teamCode) ? (
                        <button
                          onClick={() => setLeaveTarget({ teamCode: t.teamCode, name: t.name })}
                          className="cursor-pointer font-medium text-orange-500 hover:text-orange-700 btn-press"
                        >
                          탈퇴
                        </button>
                      ) : (
                        <button
                          onClick={() => setJoinTarget({ teamCode: t.teamCode, name: t.name })}
                          className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 btn-press"
                        >
                          참여하기
                        </button>
                      )}
                      <ExternalLink
                        href={t.contact.url}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        연락하기
                      </ExternalLink>
                    </>
                  ) : (
                    <span className="text-gray-400">모집마감</span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
        {/* Pagination with page numbers */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-4">
            <button
              onClick={() => setCampPage((p) => Math.max(1, p - 1))}
              disabled={campPage <= 1}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              aria-label="이전 페이지"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCampPage(p)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition btn-press ${
                  p === campPage
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={`${p}페이지`}
                aria-current={p === campPage ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCampPage((p) => Math.min(totalPages, p + 1))}
              disabled={campPage >= totalPages}
              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed btn-press"
              aria-label="다음 페이지"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        </>
        );
      })()}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="팀 삭제"
        actions={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition btn-press"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (deleteTarget) {
                  deleteTeam(deleteTarget.teamCode);
                  removeMyTeam(deleteTarget.teamCode);
                  setRefreshKey((n) => n + 1);
                  setDeleteTarget(null);
                  setToastMsg("팀이 삭제되었습니다.");
                }
              }}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition btn-press"
            >
              삭제
            </button>
          </>
        }
      >
        <p>&ldquo;{deleteTarget?.name}&rdquo; 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      </Modal>

      <Modal
        open={!!joinTarget}
        onClose={() => setJoinTarget(null)}
        title="팀 참여"
        actions={
          <>
            <button
              onClick={() => setJoinTarget(null)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition btn-press"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (joinTarget) {
                  if (joinTeam(joinTarget.teamCode)) {
                    setToastMsg(`${joinTarget.name} 팀에 참여했습니다!`);
                    setRefreshKey((n) => n + 1);
                  } else {
                    const team = teams.find((t) => t.teamCode === joinTarget.teamCode);
                    setToastMsg(team && team.memberCount >= 5 ? "팀 인원이 가득 찼습니다." : "이미 참여한 팀입니다.");
                  }
                  setJoinTarget(null);
                }
              }}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition btn-press"
            >
              참여하기
            </button>
          </>
        }
      >
        <p>&ldquo;{joinTarget?.name}&rdquo; 팀에 참여하시겠습니까?</p>
        <p className="mt-1 text-sm text-gray-500">참여 후에는 팀 카드에서 탈퇴할 수 있습니다.</p>
      </Modal>

      <Modal
        open={!!leaveTarget}
        onClose={() => setLeaveTarget(null)}
        title="팀 탈퇴"
        actions={
          <>
            <button
              onClick={() => setLeaveTarget(null)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition btn-press"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (leaveTarget) {
                  if (leaveTeam(leaveTarget.teamCode)) {
                    setToastMsg(`${leaveTarget.name} 팀에서 탈퇴했습니다.`);
                    setRefreshKey((n) => n + 1);
                  }
                  setLeaveTarget(null);
                }
              }}
              className="cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition btn-press"
            >
              탈퇴하기
            </button>
          </>
        }
      >
        <p>&ldquo;{leaveTarget?.name}&rdquo; 팀에서 탈퇴하시겠습니까?</p>
      </Modal>
    </div>
  );
}

export default function CampPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <CampContent />
    </Suspense>
  );
}
