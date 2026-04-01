interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: "search" | "team" | "trophy" | "inbox" | "document";
}

function EmptyIcon({ type }: { type: string }) {
  const baseClass = "h-16 w-16 text-gray-300 animate-float";
  switch (type) {
    case "search":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="28" cy="28" r="16" />
          <path strokeLinecap="round" d="M40 40l12 12" strokeWidth={2.5} />
          <path strokeLinecap="round" d="M22 24h12M22 32h8" strokeWidth={1.5} />
        </svg>
      );
    case "team":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="22" cy="20" r="7" />
          <circle cx="42" cy="20" r="7" />
          <path strokeLinecap="round" d="M8 48c0-8 6-14 14-14h2M40 34h2c8 0 14 6 14 14" />
          <path strokeLinecap="round" d="M32 38v10M27 43h10" strokeWidth={2} />
        </svg>
      );
    case "trophy":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20 12h24v20c0 6.6-5.4 12-12 12s-12-5.4-12-12V12z" />
          <path strokeLinecap="round" d="M20 18H12c0 6 4 10 8 10M44 18h8c0 6-4 10-8 10" />
          <path strokeLinecap="round" d="M26 52h12M32 44v8" strokeWidth={2} />
        </svg>
      );
    case "document":
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
          <path d="M16 8h22l12 12v36H16V8z" />
          <path d="M38 8v12h12" />
          <path strokeLinecap="round" d="M24 28h16M24 36h12M24 44h8" strokeWidth={1.5} />
        </svg>
      );
    default:
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
          <rect x="12" y="20" width="40" height="28" rx="4" />
          <path d="M12 28l20 12 20-12" />
          <path strokeLinecap="round" d="M28 8h8M32 8v12" strokeWidth={2} />
        </svg>
      );
  }
}

export function EmptyState({
  title = "데이터가 없습니다",
  description = "아직 등록된 항목이 없습니다.",
  action,
  icon = "inbox",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 px-6 text-center bg-gray-50/50">
      <EmptyIcon type={icon} />
      <h3 className="mt-4 text-lg font-semibold text-gray-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
