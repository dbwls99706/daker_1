export default function Loading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4" role="status" aria-label="로딩 중">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-500 animate-pulse">로딩중...</p>
    </div>
  );
}
