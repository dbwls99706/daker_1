import { describe, it, expect, beforeEach } from "vitest";
import {
  seedIfNeeded,
  getHackathons,
  getHackathonDetail,
  getLeaderboard,
  getAllLeaderboards,
  updateLeaderboard,
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  getSubmissions,
  saveSubmission,
  getBookmarks,
  toggleBookmark,
  isBookmarked,
  addRecentlyViewed,
  getRecentlyViewed,
  joinTeam,
  leaveTeam,
  hasJoinedTeam,
} from "@/lib/storage";
import type { Team, Submission, LeaderboardData } from "@/types";

beforeEach(() => {
  localStorage.clear();
});

describe("seedIfNeeded", () => {
  it("seeds data on first call", () => {
    seedIfNeeded();
    expect(localStorage.getItem("batonhub_seeded")).toBeTruthy();
    expect(getHackathons().length).toBeGreaterThan(0);
  });

  it("does not re-seed if already seeded", () => {
    seedIfNeeded();
    const hackathonsBefore = getHackathons();
    // Modify data
    localStorage.setItem("batonhub_hackathons", JSON.stringify([]));
    // Re-seed should not overwrite
    seedIfNeeded();
    expect(getHackathons()).toEqual([]);
    // Sanity check: original had data
    expect(hackathonsBefore.length).toBeGreaterThan(0);
  });
});

describe("Hackathons", () => {
  beforeEach(() => seedIfNeeded());

  it("returns hackathon list", () => {
    const hackathons = getHackathons();
    expect(hackathons.length).toBe(8);
    expect(hackathons[0]).toHaveProperty("slug");
    expect(hackathons[0]).toHaveProperty("title");
    expect(hackathons[0]).toHaveProperty("status");
  });
});

describe("HackathonDetail", () => {
  beforeEach(() => seedIfNeeded());

  it("returns detail for known slug", () => {
    const detail = getHackathonDetail("aimers-8-model-lite");
    expect(detail).not.toBeNull();
    expect(detail!.slug).toBe("aimers-8-model-lite");
    expect(detail!.sections).toBeDefined();
  });

  it("returns null for unknown slug", () => {
    expect(getHackathonDetail("nonexistent")).toBeNull();
  });
});

describe("Leaderboard", () => {
  beforeEach(() => seedIfNeeded());

  it("returns leaderboard for known slug", () => {
    const lb = getLeaderboard("aimers-8-model-lite");
    expect(lb).not.toBeNull();
    expect(lb!.entries.length).toBeGreaterThan(0);
  });

  it("returns null for unknown slug", () => {
    expect(getLeaderboard("nonexistent")).toBeNull();
  });

  it("returns all leaderboards", () => {
    const all = getAllLeaderboards();
    expect(all.length).toBeGreaterThan(0);
  });

  it("updates existing leaderboard", () => {
    const lb = getLeaderboard("aimers-8-model-lite")!;
    const originalLength = lb.entries.length;
    lb.entries.push({ rank: 99, teamName: "TestTeam", score: 0, submittedAt: new Date().toISOString() });
    updateLeaderboard(lb);
    const updated = getLeaderboard("aimers-8-model-lite")!;
    expect(updated.entries.length).toBe(originalLength + 1);
  });

  it("adds new leaderboard for unknown slug", () => {
    const newLb: LeaderboardData = {
      hackathonSlug: "new-hack",
      updatedAt: new Date().toISOString(),
      entries: [{ rank: 1, teamName: "Team1", score: 100, submittedAt: new Date().toISOString() }],
    };
    updateLeaderboard(newLb);
    expect(getLeaderboard("new-hack")).not.toBeNull();
  });
});

describe("Teams", () => {
  beforeEach(() => seedIfNeeded());

  it("returns all teams", () => {
    const teams = getTeams();
    expect(teams.length).toBeGreaterThan(0);
  });

  it("filters teams by hackathonSlug", () => {
    const teams = getTeams("daker-handover-2026-03");
    expect(teams.every((t) => t.hackathonSlug === "daker-handover-2026-03")).toBe(true);
  });

  it("adds a new team", () => {
    const before = getTeams().length;
    const team: Team = {
      teamCode: "T-TEST-01",
      hackathonSlug: "daker-handover-2026-03",
      name: "Test Team",
      isOpen: true,
      memberCount: 1,
      lookingFor: ["Frontend"],
      intro: "Test intro",
      contact: { type: "link", url: "https://test.com" },
      createdAt: new Date().toISOString(),
    };
    const ok = addTeam(team);
    expect(ok).toBe(true);
    expect(getTeams().length).toBe(before + 1);
  });

  it("prevents duplicate teamCode", () => {
    const team: Team = {
      teamCode: "T-DUP-01",
      hackathonSlug: "daker-handover-2026-03",
      name: "First Team",
      isOpen: true,
      memberCount: 1,
      lookingFor: ["Frontend"],
      intro: "Test intro",
      contact: { type: "link", url: "https://test.com" },
      createdAt: new Date().toISOString(),
    };
    expect(addTeam(team)).toBe(true);
    expect(addTeam({ ...team, name: "Second Team" })).toBe(false);
  });

  it("sanitizes team name and intro length", () => {
    const team: Team = {
      teamCode: "T-LONG-01",
      hackathonSlug: "test",
      name: "A".repeat(100),
      isOpen: true,
      memberCount: 1,
      lookingFor: ["Frontend"],
      intro: "B".repeat(500),
      contact: { type: "link", url: "#" },
      createdAt: new Date().toISOString(),
    };
    addTeam(team);
    const added = getTeams().find((t) => t.teamCode === "T-LONG-01")!;
    expect(added.name.length).toBeLessThanOrEqual(30);
    expect(added.intro.length).toBeLessThanOrEqual(200);
  });

  it("updates a team", () => {
    const teams = getTeams();
    const first = teams[0];
    const ok = updateTeam(first.teamCode, { isOpen: false });
    expect(ok).toBe(true);
    const updated = getTeams().find((t) => t.teamCode === first.teamCode)!;
    expect(updated.isOpen).toBe(false);
  });

  it("deletes a team", () => {
    const before = getTeams().length;
    const first = getTeams()[0];
    const ok = deleteTeam(first.teamCode);
    expect(ok).toBe(true);
    expect(getTeams().length).toBe(before - 1);
  });

  it("joins and leaves team safely", () => {
    const team = getTeams()[0];
    const originalMembers = team.memberCount;

    expect(joinTeam(team.teamCode)).toBe(true);
    expect(hasJoinedTeam(team.teamCode)).toBe(true);
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.memberCount).toBe(originalMembers + 1);

    expect(leaveTeam(team.teamCode)).toBe(true);
    expect(hasJoinedTeam(team.teamCode)).toBe(false);
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.memberCount).toBe(originalMembers);
  });
});

describe("Submissions", () => {
  beforeEach(() => seedIfNeeded());

  it("starts with no submissions", () => {
    expect(getSubmissions().length).toBe(0);
  });

  it("saves a new submission", () => {
    const sub: Submission = {
      id: "sub-1",
      hackathonSlug: "test-hack",
      teamName: "Team1",
      status: "draft",
      items: [{ key: "plan", value: "plan text" }],
      memo: "test memo",
      createdAt: new Date().toISOString(),
    };
    expect(saveSubmission(sub)).toBe(true);
    expect(getSubmissions().length).toBe(1);
    expect(getSubmissions("test-hack").length).toBe(1);
  });

  it("updates existing submission", () => {
    const sub: Submission = {
      id: "sub-2",
      hackathonSlug: "test-hack",
      teamName: "Team2",
      status: "draft",
      items: [],
      memo: "",
      createdAt: new Date().toISOString(),
    };
    saveSubmission(sub);
    sub.status = "submitted";
    sub.submittedAt = new Date().toISOString();
    expect(saveSubmission(sub)).toBe(true);
    expect(getSubmissions().length).toBe(1);
    expect(getSubmissions()[0].status).toBe("submitted");
  });

  it("filters submissions by hackathonSlug", () => {
    expect(saveSubmission({ id: "s1", hackathonSlug: "h1", teamName: "T1", status: "draft", items: [], memo: "", createdAt: "" })).toBe(true);
    expect(saveSubmission({ id: "s2", hackathonSlug: "h2", teamName: "T2", status: "draft", items: [], memo: "", createdAt: "" })).toBe(true);
    expect(getSubmissions("h1").length).toBe(1);
    expect(getSubmissions("h2").length).toBe(1);
  });
});

describe("Bookmarks", () => {
  beforeEach(() => seedIfNeeded());

  it("starts with empty bookmarks", () => {
    expect(getBookmarks()).toEqual([]);
  });

  it("toggles bookmark on and off", () => {
    const added = toggleBookmark("test-slug");
    expect(added).toBe(true);
    expect(isBookmarked("test-slug")).toBe(true);

    const removed = toggleBookmark("test-slug");
    expect(removed).toBe(false);
    expect(isBookmarked("test-slug")).toBe(false);
  });

  it("ignores blank bookmark slug", () => {
    expect(toggleBookmark("   ")).toBe(false);
    expect(getBookmarks()).toEqual([]);
  });

  it("manages multiple bookmarks", () => {
    toggleBookmark("slug-1");
    toggleBookmark("slug-2");
    toggleBookmark("slug-3");
    expect(getBookmarks().length).toBe(3);
    toggleBookmark("slug-2");
    expect(getBookmarks().length).toBe(2);
    expect(getBookmarks()).not.toContain("slug-2");
  });
});

describe("Recently Viewed", () => {
  beforeEach(() => seedIfNeeded());

  it("starts with empty recent list", () => {
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("adds items to recent list", () => {
    addRecentlyViewed("slug-1");
    addRecentlyViewed("slug-2");
    expect(getRecentlyViewed()).toEqual(["slug-2", "slug-1"]);
  });

  it("moves existing item to front", () => {
    addRecentlyViewed("slug-1");
    addRecentlyViewed("slug-2");
    addRecentlyViewed("slug-1");
    expect(getRecentlyViewed()).toEqual(["slug-1", "slug-2"]);
  });

  it("limits to 5 items", () => {
    for (let i = 0; i < 8; i++) {
      addRecentlyViewed(`slug-${i}`);
    }
    expect(getRecentlyViewed().length).toBe(5);
    expect(getRecentlyViewed()[0]).toBe("slug-7");
  });
});
