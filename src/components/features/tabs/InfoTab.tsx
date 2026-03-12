import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLink } from "@/components/ui/ExternalLink";
import type { HackathonDetail } from "@/types";

interface InfoTabProps {
  info: HackathonDetail["sections"]["info"];
}

export function InfoTab({ info }: InfoTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">안내</h2>
      {info ? (
        <>
          <div className="space-y-3">
            {info.notice.map((n, i) => (
              <div key={i} className="flex gap-2 rounded-lg bg-gray-50 p-3">
                <span className="text-blue-500">&#8226;</span>
                <p className="text-sm text-gray-700">{n}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <ExternalLink
              href={info.links.rules}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              규정 보기
            </ExternalLink>
            <ExternalLink
              href={info.links.faq}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              FAQ
            </ExternalLink>
          </div>
        </>
      ) : (
        <EmptyState title="안내 정보 없음" description="이 해커톤의 안내 정보가 아직 등록되지 않았습니다." />
      )}
    </div>
  );
}
