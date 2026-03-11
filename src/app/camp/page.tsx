"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getTeams, getHackathons, addTeam, updateTeam, deleteTeam } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonPage } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { ExternalLink } from "@/components/ui/ExternalLink";
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
    <div className="space-y-6">
      <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">팀원 모집</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "취소" : "팀 모집글 생성"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/camp"
          className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
            !hackathonFilter
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          전체
        </Link>
        {hackathons.map((h) => (
          <Link
            key={h.slug}
            href={`/camp?hackathon=${h.slug}`}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              hackathonFilter === h.slug
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            {h.title.length > 20 ? h.title.slice(0, 20) + "..." : h.title}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={teamSearch}
          onChange={(e) => { setTeamSearch(e.target.value); setCampPage(1); }}
          placeholder="팀명 또는 포지션 검색..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="팀 검색"
        />
        <select
          value={campSort}
          onChange={(e) => { setCampSort(e.target.value as "newest" | "name" | "members"); setCampPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
          aria-label="정렬"
        >
          <option value="newest">최신순</option>
          <option value="name">팀명순</option>
          <option value="members">인원순</option>
        </select>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 space-y-4 animate-slide-up">
          <h2 className="text-lg font-bold">새 팀 모집글</h2>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${contactError ? "border-red-400" : "border-gray-300"}`}
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
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            생성하기
          </button>
        </div>
      )}

      {/* Team Matcher */}
      <TeamMatcher teams={teams} hackathonSlug={hackathonFilter || undefined} />

      <p className="text-sm text-gray-500" aria-live="polite">총 {filteredTeams.length}개의 팀</p>

      {(() => {
        if (filteredTeams.length === 0) return (
          <EmptyState
            title="등록된 팀이 없습니다"
            description={teamSearch.trim() ? "검색 조건에 맞는 팀이 없습니다." : "첫 팀을 만들어보세요!"}
            action={
              teamSearch.trim() ? (
                <button onClick={() => setTeamSearch("")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">검색 초기화</button>
              ) : (
                <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">팀 만들기</button>
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
          {pagedTeams.map((t, i) => (
            <div
              key={t.teamCode}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 truncate max-w-[180px]" title={t.name}>{t.name}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    t.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.isOpen ? "모집중" : "모집마감"}
                </span>
              </div>
              {t.hackathonSlug && (
                <Link
                  href={`/hackathons/${t.hackathonSlug}`}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  {hackathons.find((h) => h.slug === t.hackathonSlug)?.title || t.hackathonSlug}
                </Link>
              )}
              <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-3">{t.intro}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.lookingFor.map((r) => (
                  <span key={r} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {r}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>{t.memberCount}명 참여중</span>
                  <span>· {formatDate(t.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.isOpen ? (
                    <>
                      <button
                        onClick={() => {
                          updateTeam(t.teamCode, { isOpen: false });
                          setToastMsg("모집이 마감되었습니다.");
                          setRefreshKey((n) => n + 1);
                        }}
                        className="font-medium text-orange-500 hover:text-orange-700"
                      >
                        모집마감
                      </button>
                      <ExternalLink
                        href={t.contact.url}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        연락하기
                      </ExternalLink>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        updateTeam(t.teamCode, { isOpen: true });
                        setToastMsg("모집이 재개되었습니다.");
                        setRefreshKey((n) => n + 1);
                      }}
                      className="font-medium text-green-600 hover:text-green-800"
                    >
                      모집재개
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget({ teamCode: t.teamCode, name: t.name })}
                    className="font-medium text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCampPage((p) => Math.max(1, p - 1))}
              disabled={campPage <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {campPage} / {totalPages}
            </span>
            <button
              onClick={() => setCampPage((p) => Math.min(totalPages, p + 1))}
              disabled={campPage >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (deleteTarget) {
                  deleteTeam(deleteTarget.teamCode);
                  setRefreshKey((n) => n + 1);
                  setDeleteTarget(null);
                  setToastMsg("팀이 삭제되었습니다.");
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </>
        }
      >
        <p>&ldquo;{deleteTarget?.name}&rdquo; 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
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
