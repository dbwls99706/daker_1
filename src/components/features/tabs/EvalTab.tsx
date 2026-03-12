import { EmptyState } from "@/components/ui/EmptyState";
import type { HackathonDetail } from "@/types";

interface EvalTabProps {
  eval: HackathonDetail["sections"]["eval"];
}

export function EvalTab({ eval: evalData }: EvalTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">평가</h2>
      {evalData ? (
        <>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-600">평가 지표</div>
            <div className="mt-1 text-xl font-bold text-blue-600">{evalData.metricName}</div>
          </div>
          <p className="text-gray-700">{evalData.description}</p>
          {evalData.scoreDisplay && (
            <div className="space-y-2">
              <h3 className="font-semibold">{evalData.scoreDisplay.label} 구성</h3>
              <div className="flex gap-3">
                {evalData.scoreDisplay.breakdown.map((b) => (
                  <div key={b.key} className="flex-1 rounded-lg border border-gray-200 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{b.weightPercent}%</div>
                    <div className="mt-1 text-sm text-gray-600">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {evalData.limits && (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <p>최대 실행 시간: {evalData.limits.maxRuntimeSec}초</p>
              <p>일일 최대 제출: {evalData.limits.maxSubmissionsPerDay}건</p>
            </div>
          )}
        </>
      ) : (
        <EmptyState title="평가 정보 없음" description="이 해커톤의 평가 정보가 아직 등록되지 않았습니다." />
      )}
    </div>
  );
}
