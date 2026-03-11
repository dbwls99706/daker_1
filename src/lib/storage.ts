import type { Hackathon, HackathonDetail, LeaderboardData, Team, Submission } from "@/types";

import hackathonsJson from "@/data/public_hackathons.json";
import detailJson from "@/data/public_hackathon_detail.json";
import leaderboardJson from "@/data/public_leaderboard.json";
import teamsJson from "@/data/public_teams.json";

const KEYS = {
  hackathons: "batonhub_hackathons",
  details: "batonhub_details",
  leaderboards: "batonhub_leaderboards",
  teams: "batonhub_teams",
  submissions: "batonhub_submissions",
  bookmarks: "batonhub_bookmarks",
  seeded: "batonhub_seeded",
} as const;

function normalizeDetails(): HackathonDetail[] {
  const raw = detailJson as Record<string, unknown>;
  const main: HackathonDetail = {
    slug: raw.slug as string,
    title: raw.title as string,
    sections: raw.sections as HackathonDetail["sections"],
  };
  const extras = ((raw.extraDetails as Array<Record<string, unknown>>) || []).map(
    (d) =>
      ({
        slug: d.slug as string,
        title: d.title as string,
        sections: d.sections as HackathonDetail["sections"],
      }) as HackathonDetail
  );
  return [main, ...extras];
}

function normalizeLeaderboards(): LeaderboardData[] {
  const raw = leaderboardJson as Record<string, unknown>;
  const main: LeaderboardData = {
    hackathonSlug: raw.hackathonSlug as string,
    updatedAt: raw.updatedAt as string,
    entries: raw.entries as LeaderboardData["entries"],
  };
  const extras = ((raw.extraLeaderboards as Array<Record<string, unknown>>) || []).map(
    (lb) =>
      ({
        hackathonSlug: lb.hackathonSlug as string,
        updatedAt: lb.updatedAt as string,
        entries: lb.entries as LeaderboardData["entries"],
      }) as LeaderboardData
  );
  return [main, ...extras];
}

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;

  try {
    localStorage.setItem(KEYS.hackathons, JSON.stringify(hackathonsJson));
    localStorage.setItem(KEYS.details, JSON.stringify(normalizeDetails()));
    localStorage.setItem(KEYS.leaderboards, JSON.stringify(normalizeLeaderboards()));
    localStorage.setItem(KEYS.teams, JSON.stringify(teamsJson));
    localStorage.setItem(KEYS.submissions, JSON.stringify([]));
    localStorage.setItem(KEYS.bookmarks, JSON.stringify([]));
    localStorage.setItem(KEYS.seeded, "true");
  } catch (e) {
    console.error("Failed to seed data:", e);
  }
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Handle quota exceeded: try clearing non-essential data first
    if (e instanceof DOMException && (e.code === 22 || e.name === "QuotaExceededError")) {
      try {
        // Remove recently viewed (least important) and retry
        localStorage.removeItem("batonhub_recent");
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        console.error("localStorage quota exceeded even after cleanup:", e);
      }
    } else {
      console.error("Failed to write to localStorage:", e);
    }
    return false;
  }
}

// Hackathons
export function getHackathons(): Hackathon[] {
  return getItem<Hackathon[]>(KEYS.hackathons, []);
}

// Details
export function getHackathonDetail(slug: string): HackathonDetail | null {
  const all = getItem<HackathonDetail[]>(KEYS.details, []);
  return all.find((d) => d.slug === slug) || null;
}

// Leaderboards
export function getLeaderboard(slug: string): LeaderboardData | null {
  const all = getItem<LeaderboardData[]>(KEYS.leaderboards, []);
  return all.find((lb) => lb.hackathonSlug === slug) || null;
}

export function getAllLeaderboards(): LeaderboardData[] {
  return getItem<LeaderboardData[]>(KEYS.leaderboards, []);
}

export function updateLeaderboard(data: LeaderboardData) {
  const all = getItem<LeaderboardData[]>(KEYS.leaderboards, []);
  const idx = all.findIndex((lb) => lb.hackathonSlug === data.hackathonSlug);
  if (idx >= 0) all[idx] = data;
  else all.push(data);
  setItem(KEYS.leaderboards, all);
}

// Teams
export function getTeams(hackathonSlug?: string): Team[] {
  const all = getItem<Team[]>(KEYS.teams, []);
  if (!hackathonSlug) return all;
  return all.filter((t) => t.hackathonSlug === hackathonSlug);
}

export function addTeam(team: Team) {
  // Enforce length limits on user input
  const sanitized: Team = {
    ...team,
    name: team.name.slice(0, 30),
    intro: team.intro.slice(0, 200),
    lookingFor: team.lookingFor.map((r) => r.slice(0, 30)).slice(0, 10),
  };
  const all = getItem<Team[]>(KEYS.teams, []);
  all.push(sanitized);
  setItem(KEYS.teams, all);
}

export function updateTeam(teamCode: string, updates: Partial<Team>) {
  const all = getItem<Team[]>(KEYS.teams, []);
  const idx = all.findIndex((t) => t.teamCode === teamCode);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    setItem(KEYS.teams, all);
  }
}

export function deleteTeam(teamCode: string) {
  const all = getItem<Team[]>(KEYS.teams, []);
  setItem(KEYS.teams, all.filter((t) => t.teamCode !== teamCode));
}

// Submissions
export function getSubmissions(hackathonSlug?: string): Submission[] {
  const all = getItem<Submission[]>(KEYS.submissions, []);
  if (!hackathonSlug) return all;
  return all.filter((s) => s.hackathonSlug === hackathonSlug);
}

export function saveSubmission(submission: Submission) {
  const all = getItem<Submission[]>(KEYS.submissions, []);
  const idx = all.findIndex((s) => s.id === submission.id);
  if (idx >= 0) all[idx] = submission;
  else all.push(submission);
  setItem(KEYS.submissions, all);
}

// Bookmarks
export function getBookmarks(): string[] {
  return getItem<string[]>(KEYS.bookmarks, []);
}

export function toggleBookmark(slug: string): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(slug);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    setItem(KEYS.bookmarks, bookmarks);
    return false;
  } else {
    bookmarks.push(slug);
    setItem(KEYS.bookmarks, bookmarks);
    return true;
  }
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}

// Recently Viewed
const RECENT_KEY = "batonhub_recent";
const MAX_RECENT = 5;

export function addRecentlyViewed(slug: string) {
  const recent = getItem<string[]>(RECENT_KEY, []);
  const filtered = recent.filter((s) => s !== slug);
  filtered.unshift(slug);
  setItem(RECENT_KEY, filtered.slice(0, MAX_RECENT));
}

export function getRecentlyViewed(): string[] {
  return getItem<string[]>(RECENT_KEY, []);
}
