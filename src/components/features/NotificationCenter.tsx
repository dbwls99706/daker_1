"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { getHackathons, getTeams, getSubmissions } from "@/lib/storage";

interface Notification {
  id: string;
  type: "deadline" | "team" | "submit" | "info";
  title: string;
  message: string;
  href?: string;
  timestamp: string;
  read: boolean;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "deadline": return <span className="text-orange-500" aria-hidden="true">&#9200;</span>;
    case "team": return <span className="text-green-500" aria-hidden="true">&#128101;</span>;
    case "submit": return <span className="text-blue-500" aria-hidden="true">&#128196;</span>;
    case "info": return <span className="text-purple-500" aria-hidden="true">&#128276;</span>;
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("batonhub_notif_read");
      if (stored) setReadIds(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try { localStorage.setItem("batonhub_notif_read", JSON.stringify(allIds)); } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const notifications = useMemo<Notification[]>(() => {
    if (typeof window === "undefined") return [];
    const notifs: Notification[] = [];
    const now = new Date();

    // Deadline notifications
    try {
      const hackathons = getHackathons();
      for (const h of hackathons) {
        if (h.status === "ended") continue;
        const deadline = new Date(h.period.submissionDeadlineAt);
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 14) {
          notifs.push({
            id: `deadline-${h.slug}`,
            type: "deadline",
            title: daysLeft <= 3 ? "긴급! 마감 임박" : "마감 알림",
            message: `${h.title} - ${daysLeft}일 남음`,
            href: `/hackathons/${h.slug}`,
            timestamp: now.toISOString(),
            read: readIds.includes(`deadline-${h.slug}`),
          });
        }
      }

      // Open team notifications
      const teams = getTeams();
      const openTeams = teams.filter((t) => t.isOpen);
      if (openTeams.length > 0) {
        notifs.push({
          id: "teams-open",
          type: "team",
          title: "모집중인 팀",
          message: `${openTeams.length}개 팀이 새로운 멤버를 찾고 있습니다`,
          href: "/camp",
          timestamp: now.toISOString(),
          read: readIds.includes("teams-open"),
        });
      }

      // Submission status
      const submissions = getSubmissions();
      const drafts = submissions.filter((s) => s.status === "draft");
      if (drafts.length > 0) {
        notifs.push({
          id: "drafts-pending",
          type: "submit",
          title: "미완료 제출물",
          message: `${drafts.length}개의 제출물이 임시 저장 상태입니다`,
          href: `/hackathons/${drafts[0].hackathonSlug}`,
          timestamp: now.toISOString(),
          read: readIds.includes("drafts-pending"),
        });
      }
    } catch { /* ignore storage errors */ }

    return notifs;
  }, [readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); }}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 읽지 않음)` : ""}`}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50 animate-slide-down overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-bold text-gray-900 text-sm">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">알림이 없습니다</div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className={`flex gap-3 px-4 py-3 border-b border-gray-50 transition hover:bg-gray-50 ${!n.read ? "bg-blue-50/30" : ""}`}>
                    <div className="text-lg flex-shrink-0 mt-0.5">{getNotificationIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
