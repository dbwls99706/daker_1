"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ExternalLink } from "@/components/ui/ExternalLink";
import type { Team } from "@/types";

interface TeamMatcherProps {
  teams: Team[];
  hackathonSlug?: string;
}

const ALL_ROLES = ["Frontend", "Backend", "Designer", "PM", "AI/ML", "Data", "DevOps", "Mobile", "Full-stack"];

export function TeamMatcher({ teams, hackathonSlug }: TeamMatcherProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setShowResults(false);
  };

  const matchedTeams = useMemo(() => {
    if (selectedRoles.length === 0) return [];
    return teams
      .filter((t) => t.isOpen)
      .map((t) => {
        const matchCount = t.lookingFor.filter((role) =>
          selectedRoles.some((sel) => role.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(role.toLowerCase()))
        ).length;
        const matchPct = t.lookingFor.length > 0 ? Math.round((matchCount / t.lookingFor.length) * 100) : 0;
        return { team: t, matchCount, matchPct };
      })
      .filter((r) => r.matchCount > 0)
      .sort((a, b) => b.matchPct - a.matchPct || b.matchCount - a.matchCount);
  }, [teams, selectedRoles]);

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-bold text-purple-900">팀 매칭 추천</h3>
      </div>
      <p className="text-sm text-purple-700">내 역할을 선택하면 나를 찾는 팀을 추천해드립니다.</p>

      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => toggleRole(role)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              selectedRoles.includes(role)
                ? "border-purple-500 bg-purple-600 text-white"
                : "border-purple-300 text-purple-700 hover:bg-purple-100"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {selectedRoles.length > 0 && (
        <button
          onClick={() => setShowResults(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
        >
          매칭 결과 보기 ({matchedTeams.length}팀)
        </button>
      )}

      {showResults && (
        <div className="space-y-3 animate-slide-up">
          {matchedTeams.length === 0 ? (
            <p className="text-sm text-purple-600">선택한 역할을 모집하는 팀이 없습니다.</p>
          ) : (
            matchedTeams.slice(0, 5).map(({ team, matchPct }) => (
              <div key={team.teamCode} className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{team.name}</h4>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      {matchPct}% 매칭
                    </span>
                  </div>
                  <ExternalLink href={team.contact.url} className="text-xs font-medium text-blue-600 hover:underline">
                    연락하기
                  </ExternalLink>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{team.intro}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {team.lookingFor.map((r) => (
                    <span
                      key={r}
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        selectedRoles.some((sel) => r.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(r.toLowerCase()))
                          ? "bg-purple-100 text-purple-700 font-semibold ring-1 ring-purple-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                {team.hackathonSlug && (
                  <Link href={`/hackathons/${team.hackathonSlug}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                    연결된 해커톤 보기
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
