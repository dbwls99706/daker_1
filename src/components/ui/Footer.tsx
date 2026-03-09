export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <span className="text-lg font-bold text-blue-600">BatonHub</span>
            <p className="mt-1 text-xs text-gray-500">해커톤 통합 대시보드</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-gray-400">
              DACON 월간 해커톤 : 긴급 인수인계 해커톤 출품작
            </p>
            <p className="mt-1 text-xs text-gray-400">
              &copy; 2026 BatonHub. Built with Next.js + Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
