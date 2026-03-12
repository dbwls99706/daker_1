import { EmptyState } from "@/components/ui/EmptyState";
import type { HackathonDetail } from "@/types";

interface OverviewTabProps {
  overview: HackathonDetail["sections"]["overview"];
}

export function OverviewTab({ overview }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">개요</h2>
      {overview ? (
        <>
          <p className="text-gray-700 leading-relaxed">{overview.summary}</p>
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">팀 정책</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>개인 참가: {overview.teamPolicy.allowSolo ? "가능" : "불가"}</li>
              <li>최대 팀원: {overview.teamPolicy.maxTeamSize}명</li>
            </ul>
          </div>
        </>
      ) : (
        <EmptyState title="개요 정보 없음" description="이 해커톤의 개요 정보가 아직 등록되지 않았습니다." />
      )}
    </div>
  );
}
