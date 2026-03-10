function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className || ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <Bone className="mb-3 aspect-video w-full rounded-lg" />
      <div className="mb-3 flex items-center gap-2">
        <Bone className="h-5 w-16" />
        <Bone className="h-5 w-10" />
      </div>
      <Bone className="h-5 w-3/4 mb-2" />
      <Bone className="h-4 w-1/2" />
      <div className="mt-3 flex gap-1">
        <Bone className="h-5 w-14 rounded-md" />
        <Bone className="h-5 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-gray-50 px-4 py-3 flex gap-8">
        {[80, 120, 80, 100].map((w, i) => (
          <Bone key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b last:border-0 px-4 py-3 flex gap-8 items-center">
          <Bone className="h-7 w-7 rounded-full" />
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-16" />
          <Bone className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6" role="status" aria-label="로딩중">
      <Bone className="h-8 w-48" />
      <div className="flex gap-3">
        <Bone className="h-9 w-24 rounded-lg" />
        <Bone className="h-9 w-24 rounded-lg" />
        <Bone className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <span className="sr-only">로딩중...</span>
    </div>
  );
}
