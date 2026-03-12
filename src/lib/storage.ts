import type { Hackathon, HackathonDetail, LeaderboardData, Team, Submission } from "@/types";

import hackathonsJson from "@/data/public_hackathons.json";
import detailJson from "@/data/public_hackathon_detail.json";
import leaderboardJson from "@/data/public_leaderboard.json";
import teamsJson from "@/data/public_teams.json";

const SEED_VERSION = "3";

const KEYS = {
  hackathons: "batonhub_hackathons",
  details: "batonhub_details",
  leaderboards: "batonhub_leaderboards",
  teams: "batonhub_teams",
  submissions: "batonhub_submissions",
  bookmarks: "batonhub_bookmarks",
  seeded: "batonhub_seeded",
} as const;

/** Type guard: checks that a value is a non-null object with expected string fields */
function hasStringField(obj: unknown, key: string): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null && typeof (obj as Record<string, unknown>)[key] === "string";
}

function toHackathonDetail(raw: unknown): HackathonDetail | null {
  if (!hasStringField(raw, "slug") || !hasStringField(raw, "title")) return null;
  const obj = raw as Record<string, unknown>;
  return {
    slug: String(obj.slug),
    title: String(obj.title),
    sections: (obj.sections ?? {}) as HackathonDetail["sections"],
  };
}

function normalizeDetails(): HackathonDetail[] {
  const raw = detailJson as Record<string, unknown>;
  const main = toHackathonDetail(raw);
  if (!main) return [];
  const extraArr = Array.isArray(raw.extraDetails) ? raw.extraDetails : [];
  const extras = extraArr.map(toHackathonDetail).filter((d): d is HackathonDetail => d !== null);
  return [main, ...extras];
}

function toLeaderboardData(raw: unknown): LeaderboardData | null {
  if (!hasStringField(raw, "hackathonSlug")) return null;
  const obj = raw as Record<string, unknown>;
  return {
    hackathonSlug: String(obj.hackathonSlug),
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    entries: Array.isArray(obj.entries) ? (obj.entries as LeaderboardData["entries"]) : [],
  };
}

function normalizeLeaderboards(): LeaderboardData[] {
  const raw = leaderboardJson as Record<string, unknown>;
  const main = toLeaderboardData(raw);
  if (!main) return [];
  const extraArr = Array.isArray(raw.extraLeaderboards) ? raw.extraLeaderboards : [];
  const extras = extraArr.map(toLeaderboardData).filter((lb): lb is LeaderboardData => lb !== null);
  return [main, ...extras];
}

export function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded) === SEED_VERSION) return;

  try {
    // Always refresh read-only reference data
    localStorage.setItem(KEYS.hackathons, JSON.stringify(hackathonsJson));
    localStorage.setItem(KEYS.details, JSON.stringify(normalizeDetails()));
    localStorage.setItem(KEYS.leaderboards, JSON.stringify(normalizeLeaderboards()));
    localStorage.setItem(KEYS.teams, JSON.stringify(teamsJson));
    // Only initialize user data on first seed (not on version upgrades)
    if (!localStorage.getItem(KEYS.seeded)) {
      localStorage.setItem(KEYS.submissions, JSON.stringify([]));
      localStorage.setItem(KEYS.bookmarks, JSON.stringify([]));
    }
    localStorage.setItem(KEYS.seeded, SEED_VERSION);
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

// Team Ownership — track which teams the current user created
const MY_TEAMS_KEY = "batonhub_my_teams";

export function addMyTeam(teamCode: string) {
  const mine = getItem<string[]>(MY_TEAMS_KEY, []);
  if (!mine.includes(teamCode)) {
    mine.push(teamCode);
    setItem(MY_TEAMS_KEY, mine);
  }
}

export function isMyTeam(teamCode: string): boolean {
  return getItem<string[]>(MY_TEAMS_KEY, []).includes(teamCode);
}

export function removeMyTeam(teamCode: string) {
  const mine = getItem<string[]>(MY_TEAMS_KEY, []).filter((c) => c !== teamCode);
  setItem(MY_TEAMS_KEY, mine);
}

// Team membership — join a team (increment memberCount)
export function joinTeam(teamCode: string): boolean {
  const joined = getItem<string[]>("batonhub_joined_teams", []);
  if (joined.includes(teamCode)) return false; // already joined

  const all = getItem<Team[]>(KEYS.teams, []);
  const idx = all.findIndex((t) => t.teamCode === teamCode);
  if (idx < 0) return false;

  all[idx] = { ...all[idx], memberCount: all[idx].memberCount + 1 };
  setItem(KEYS.teams, all);

  joined.push(teamCode);
  setItem("batonhub_joined_teams", joined);
  return true;
}

export function hasJoinedTeam(teamCode: string): boolean {
  return getItem<string[]>("batonhub_joined_teams", []).includes(teamCode);
}

export function leaveTeam(teamCode: string): boolean {
  const joined = getItem<string[]>("batonhub_joined_teams", []);
  if (!joined.includes(teamCode)) return false;

  const all = getItem<Team[]>(KEYS.teams, []);
  const idx = all.findIndex((t) => t.teamCode === teamCode);
  if (idx < 0) return false;

  all[idx] = { ...all[idx], memberCount: Math.max(1, all[idx].memberCount - 1) };
  setItem(KEYS.teams, all);

  setItem("batonhub_joined_teams", joined.filter((c) => c !== teamCode));
  return true;
}
