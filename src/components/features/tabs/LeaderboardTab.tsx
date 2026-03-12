import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { formatDateTime } from "@/lib/utils";
import type { LeaderboardData, HackathonDetail } from "@/types";

interface LeaderboardTabProps {
  leaderboard: LeaderboardData | null;
  leaderboardSection: HackathonDetail["sections"]["leaderboard"];
}

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1
    ? "bg-yellow-100 text-yellow-800"
    : rank === 2
    ? "bg-gray-200 text-gray-700"
    : rank === 3
    ? "bg-orange-100 text-orange-700"
    : "text-gray-500";

  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${cls}`}>
      {rank}
    </span>
  );
}

export function LeaderboardTab({ leaderboard, leaderboardSection }: LeaderboardTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">리더보드</h2>
      {leaderboardSection?.note && (
        <p className="text-sm text-gray-500">{leaderboardSection.note}</p>
      )}
      {!leaderboard || leaderboard.entries.length === 0 ? (
        <EmptyState title="리더보드 데이터 없음" description="아직 제출된 결과가 없습니다." />
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="sm:hidden space-y-3">
            {[...leaderboard.entries]
              .sort((a, b) => a.rank - b.rank)
              .map((e) => (
                <div key={e.teamName} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                    e.rank === 1 ? "bg-yellow-100 text-yellow-800" :
                    e.rank === 2 ? "bg-gray-200 text-gray-700" :
                    e.rank === 3 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{e.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{e.teamName}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(e.submittedAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {e.score === 0 ? (
                      <span className="text-sm text-gray-400">채점 대기</span>
                    ) : (
                      <span className="text-lg font-bold text-blue-600">{e.score}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            {(() => {
              const hasBreakdown = leaderboard.entries.some((e) => e.scoreBreakdown);
              const hasArtifacts = leaderboard.entries.some((e) => e.artifacts);
              return (
                <table className="w-full text-sm" aria-label="리더보드">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th scope="col" className="px-4 py-3 font-semibold">순위</th>
                      <th scope="col" className="px-4 py-3 font-semibold">팀</th>
                      <th scope="col" className="px-4 py-3 font-semibold">점수</th>
                      {hasBreakdown && (
                        <>
                          <th scope="col" className="px-4 py-3 font-semibold">참가자</th>
                          <th scope="col" className="px-4 py-3 font-semibold">심사위원</th>
                        </>
                      )}
                      {hasArtifacts && (
                        <th scope="col" className="px-4 py-3 font-semibold">제출물</th>
                      )}
                      <th scope="col" className="px-4 py-3 font-semibold">제출일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...leaderboard.entries]
                      .sort((a, b) => a.rank - b.rank)
                      .map((e) => (
                        <tr key={e.teamName} className="border-b last:border-0 hover:bg-gray-50 transition">
                          <td className="px-4 py-3"><RankBadge rank={e.rank} /></td>
                          <td className="px-4 py-3 font-medium">{e.teamName}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600">
                            {e.score === 0 ? (
                              <span className="text-gray-400 font-normal">채점 대기</span>
                            ) : e.score}
                          </td>
                          {hasBreakdown && (
                            <>
                              <td className="px-4 py-3 text-gray-600">{e.scoreBreakdown?.participant ?? "-"}</td>
                              <td className="px-4 py-3 text-gray-600">{e.scoreBreakdown?.judge ?? "-"}</td>
                            </>
                          )}
                          {hasArtifacts && (
                            <td className="px-4 py-3">
                              {e.artifacts ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {e.artifacts.planTitle && (
                                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700" title={e.artifacts.planTitle}>
                                      {e.artifacts.planTitle.length > 15 ? e.artifacts.planTitle.slice(0, 15) + "..." : e.artifacts.planTitle}
                                    </span>
                                  )}
                                  {e.artifacts.webUrl && (
                                    <ExternalLink href={e.artifacts.webUrl} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:underline">웹</ExternalLink>
                                  )}
                                  {e.artifacts.pdfUrl && (
                                    <ExternalLink href={e.artifacts.pdfUrl} className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700 hover:underline">PDF</ExternalLink>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(e.submittedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
