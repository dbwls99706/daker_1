import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLink } from "@/components/ui/ExternalLink";
import type { Team } from "@/types";

interface TeamsTabProps {
  teams: Team[];
  slug: string;
}

export function TeamsTab({ teams, slug }: TeamsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">팀 목록</h2>
        <Link
          href={`/camp?hackathon=${slug}`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          팀 보기 / 생성
        </Link>
      </div>
      {teams.length === 0 ? (
        <EmptyState title="등록된 팀이 없습니다" description="캠프에서 첫 팀을 만들어보세요!" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <div key={t.teamCode} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{t.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.isOpen ? "모집중" : "모집마감"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{t.intro}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.lookingFor.map((r) => (
                  <span key={r} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {r}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>{t.memberCount}명</span>
                {t.isOpen && (
                  <ExternalLink href={t.contact.url} className="text-blue-600 hover:underline">
                    연락하기
                  </ExternalLink>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
