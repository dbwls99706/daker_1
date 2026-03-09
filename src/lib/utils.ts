export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
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
  const target = new Date(iso);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
