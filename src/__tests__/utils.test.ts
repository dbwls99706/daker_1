import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatKRW,
  getDday,
  statusLabel,
  statusColor,
  sanitizeUrl,
  sanitizeText,
  isExternalUrl,
  isValidUrl,
  generateId,
  getTimeRemaining,
} from "@/lib/utils";

describe("formatDate", () => {
  it("formats ISO date string to ko-KR format", () => {
    const result = formatDate("2026-03-15T10:00:00Z");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/15/);
  });

  it("returns dash for empty string", () => {
    expect(formatDate("")).toBe("-");
  });

  it("returns dash for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("formats ISO string with time", () => {
    const result = formatDateTime("2026-03-15T14:30:00Z");
    expect(result).toMatch(/2026/);
  });

  it("returns dash for empty", () => {
    expect(formatDateTime("")).toBe("-");
  });
});

describe("formatKRW", () => {
  it("formats number as Korean Won", () => {
    expect(formatKRW(500000)).toBe("500,000원");
    expect(formatKRW(1000)).toBe("1,000원");
    expect(formatKRW(0)).toBe("0원");
  });
});

describe("getDday", () => {
  it("returns D-Day for today", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    expect(getDday(today.toISOString())).toBe("D-Day");
  });

  it("returns D-N for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDday(future.toISOString())).toBe("D-5");
  });

  it("returns D+N for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(getDday(past.toISOString())).toBe("D+3");
  });
});

describe("statusLabel", () => {
  it("returns Korean labels for known statuses", () => {
    expect(statusLabel("ongoing")).toBe("진행중");
    expect(statusLabel("ended")).toBe("종료");
    expect(statusLabel("upcoming")).toBe("예정");
  });

  it("returns raw string for unknown status", () => {
    expect(statusLabel("custom")).toBe("custom");
  });
});

describe("statusColor", () => {
  it("returns green for ongoing", () => {
    expect(statusColor("ongoing")).toContain("green");
  });

  it("returns gray for ended", () => {
    expect(statusColor("ended")).toContain("gray");
  });

  it("returns blue for upcoming", () => {
    expect(statusColor("upcoming")).toContain("blue");
  });
});

describe("sanitizeUrl", () => {
  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("allows http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("allows mailto URLs", () => {
    expect(sanitizeUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
  });

  it("blocks javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });

  it("blocks data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>")).toBe("#");
  });

  it("blocks vbscript: URLs", () => {
    expect(sanitizeUrl("vbscript:msgbox")).toBe("#");
  });

  it("returns # for empty string", () => {
    expect(sanitizeUrl("")).toBe("#");
  });

  it("returns # for hash", () => {
    expect(sanitizeUrl("#")).toBe("#");
  });

  it("blocks JavaScript with mixed case and whitespace", () => {
    expect(sanitizeUrl("JaVaScRiPt:alert(1)")).toBe("#");
    expect(sanitizeUrl("  javascript:alert(1)")).toBe("#");
  });
});

describe("sanitizeText", () => {
  it("escapes HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(600);
    expect(sanitizeText(long, 500)).toHaveLength(500);
  });
});

describe("isExternalUrl", () => {
  it("returns true for http/https", () => {
    expect(isExternalUrl("https://google.com")).toBe(true);
  });

  it("returns false for empty", () => {
    expect(isExternalUrl("")).toBe(false);
    expect(isExternalUrl("#")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("accepts empty string (optional fields)", () => {
    expect(isValidUrl("")).toBe(true);
  });

  it("accepts valid https URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("rejects invalid URL", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("rejects ftp URL", () => {
    expect(isValidUrl("ftp://files.example.com")).toBe(false);
  });
});

describe("generateId", () => {
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("returns a non-empty string", () => {
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe("getTimeRemaining", () => {
  it("returns 100 for past deadlines", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(getTimeRemaining(past)).toBe(100);
  });

  it("returns value between 0 and 100 for future deadlines", () => {
    const future = new Date(Date.now() + 86400000 * 15).toISOString();
    const result = getTimeRemaining(future);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("returns 0 for very far future deadlines", () => {
    const farFuture = new Date(Date.now() + 86400000 * 365).toISOString();
    const result = getTimeRemaining(farFuture);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
