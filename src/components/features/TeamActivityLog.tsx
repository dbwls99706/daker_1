"use client";

import { useState, useEffect, useMemo } from "react";
import { getTeams } from "@/lib/storage";
import type { Team } from "@/types";

interface ActivityEntry {
  id: string;
  teamName: string;
  teamCode: string;
  hackathonSlug: string;
  action: string;
  type: "created" | "recruiting" | "closed";
  date: Date;
}

interface TeamActivityLogProps {
  hackathonSlug?: string;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffWeek < 5) return `${diffWeek}주 전`;
  return `${diffMonth}개월 전`;
}

function ActivityIcon({ type }: { type: ActivityEntry["type"] }) {
  const base =
    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm";

  switch (type) {
    case "created":
      return (
        <span
          className={`${base} bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400`}
          aria-hidden="true"
        >
          +
        </span>
      );
    case "recruiting":
      return (
        <span
          className={`${base} bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400`}
          aria-hidden="true"
        >
          &#128269;
        </span>
      );
    case "closed":
      return (
        <span
          className={`${base} bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`}
          aria-hidden="true"
        >
          &#10003;
        </span>
      );
  }
}

function buildActivities(teams: Team[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const team of teams) {
    const createdDate = new Date(team.createdAt);

    // Team creation activity
    entries.push({
      id: `${team.teamCode}-created`,
      teamName: team.name,
      teamCode: team.teamCode,
      hackathonSlug: team.hackathonSlug,
      action: "팀이 생성되었습니다",
      type: "created",
      date: createdDate,
    });

    // Recruiting activity (slightly after creation)
    if (team.lookingFor && team.lookingFor.length > 0) {
      const recruitDate = new Date(createdDate.getTime() + 60_000);
      const roles = team.lookingFor.join(", ");
      entries.push({
        id: `${team.teamCode}-recruiting`,
        teamName: team.name,
        teamCode: team.teamCode,
        hackathonSlug: team.hackathonSlug,
        action: `${roles} 포지션 모집을 시작했습니다`,
        type: "recruiting",
        date: recruitDate,
      });
    }

    // Closed recruitment activity
    if (!team.isOpen) {
      const closedDate = new Date(createdDate.getTime() + 86_400_000);
      entries.push({
        id: `${team.teamCode}-closed`,
        teamName: team.name,
        teamCode: team.teamCode,
        hackathonSlug: team.hackathonSlug,
        action: "모집을 마감했습니다",
        type: "closed",
        date: closedDate,
      });
    }
  }

  return entries;
}

export function TeamActivityLog({ hackathonSlug }: TeamActivityLogProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTeams(getTeams(hackathonSlug));
    setMounted(true);
  }, [hackathonSlug]);

  const activities = useMemo(() => {
    const all = buildActivities(teams);
    all.sort((a, b) => b.date.getTime() - a.date.getTime());
    return all.slice(0, 10);
  }, [teams]);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          팀 활동 로그
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          팀 활동 로그
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span
            className="mb-2 text-3xl text-gray-300 dark:text-gray-600"
            aria-hidden="true"
          >
            &#128203;
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            아직 팀 활동이 없습니다
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            팀이 생성되면 활동 내역이 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        팀 활동 로그
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
          aria-hidden="true"
        />

        <ul className="space-y-4" role="list" aria-label="팀 활동 타임라인">
          {activities.map((entry, index) => (
            <li
              key={entry.id}
              className="relative flex items-start gap-3 opacity-0 animate-[fadeSlideIn_0.4s_ease-out_forwards]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ActivityIcon type={entry.type} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{entry.teamName}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    {entry.action}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {getRelativeTime(entry.date)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Inline keyframes for the staggered animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
