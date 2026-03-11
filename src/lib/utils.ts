export function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export function getDday(iso: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "진행중";
    case "ended":
      return "종료";
    case "upcoming":
      return "예정";
    default:
      return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "ongoing":
      return "bg-green-100 text-green-800";
    case "ended":
      return "bg-gray-100 text-gray-600";
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

/** Sanitize a URL to prevent XSS and open redirects. Only allows http(s) and mailto protocols. */
export function sanitizeUrl(url: string): string {
  if (!url || url === "#") return "#";
  const trimmed = url.trim();
  // Block dangerous URI schemes before URL parsing (case-insensitive, whitespace-stripped)
  const normalized = trimmed.replace(/[\s\u200B\u200C\u200D\uFEFF]/g, "");
  if (/^(javascript|data|vbscript|blob):/i.test(normalized)) return "#";
  try {
    const parsed = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return parsed.href;
    }
    return "#";
  } catch {
    return "#";
  }
}

/** Sanitize text input to prevent script injection in rendered content */
export function sanitizeText(text: string, maxLength = 500): string {
  return text.slice(0, maxLength).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Check if a URL points to an external domain */
export function isExternalUrl(url: string): boolean {
  if (!url || url === "#") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidUrl(url: string): boolean {
  if (!url) return true; // empty is ok for optional fields
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getTimeRemaining(deadlineIso: string, startIso?: string): number {
  const now = new Date().getTime();
  const target = new Date(deadlineIso).getTime();
  if (target <= now) return 100;
  const start = startIso ? new Date(startIso).getTime() : target - 30 * 24 * 60 * 60 * 1000;
  const totalDuration = target - start;
  if (totalDuration <= 0) return 100;
  const elapsed = now - start;
  if (elapsed <= 0) return 0;
  return Math.min(100, Math.round((elapsed / totalDuration) * 100));
}
