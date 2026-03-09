"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSeedData } from "@/hooks/useSeedData";
import { getTeams, getHackathons, addTeam, updateTeam, deleteTeam } from "@/lib/storage";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { generateId } from "@/lib/utils";
import type { Team } from "@/types";

function CampContent() {
  const ready = useSeedData();
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get("hackathon") || "";

  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonFilter);

  // Sync selectedHackathon when URL filter changes
  useEffect(() => {
    setSelectedHackathon(hackathonFilter);
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
    setRefreshKey((n) => n + 1);
  }

  if (!ready) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">팀원 모집</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "취소" : "팀 모집글 생성"}
        </button>
      </div>

      {/* Hackathon Filter */}
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

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
          <h2 className="text-lg font-bold">새 팀 모집글</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="camp-team-name" className="block text-sm font-semibold text-gray-700 mb-1">팀명 *</label>
              <input
                id="camp-team-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="팀 이름"
              />
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
            <label htmlFor="camp-intro" className="block text-sm font-semibold text-gray-700 mb-1">소개 *</label>
            <textarea
              id="camp-intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="팀 소개를 작성하세요"
            />
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
                onChange={(e) => setContactUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://open.kakao.com/o/..."
              />
            </div>
          </div>
          {(!name.trim() || !intro.trim()) && (name || intro) && (
            <p className="text-xs text-red-500">팀명과 소개를 모두 입력해야 생성할 수 있습니다.</p>
          )}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !intro.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            생성하기
          </button>
        </div>
      )}

      {/* Team List */}
      {teams.length === 0 ? (
        <EmptyState
          title="등록된 팀이 없습니다"
          description="첫 팀을 만들어보세요!"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              팀 만들기
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div
              key={t.teamCode}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t.name}</h3>
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
                <span>{t.memberCount}명 참여중</span>
                <div className="flex items-center gap-2">
                  {t.isOpen ? (
                    <>
                      <button
                        onClick={() => { updateTeam(t.teamCode, { isOpen: false }); setRefreshKey((n) => n + 1); }}
                        className="font-medium text-orange-500 hover:text-orange-700"
                      >
                        모집마감
                      </button>
                      <a
                        href={t.contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        연락하기
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => { updateTeam(t.teamCode, { isOpen: true }); setRefreshKey((n) => n + 1); }}
                      className="font-medium text-green-600 hover:text-green-800"
                    >
                      모집재개
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`"${t.name}" 팀을 삭제하시겠습니까?`)) {
                        deleteTeam(t.teamCode);
                        setRefreshKey((n) => n + 1);
                      }
                    }}
                    className="font-medium text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CampContent />
    </Suspense>
  );
}
