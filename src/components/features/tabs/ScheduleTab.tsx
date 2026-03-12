import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, getDday } from "@/lib/utils";
import type { HackathonDetail } from "@/types";

interface ScheduleTabProps {
  schedule: HackathonDetail["sections"]["schedule"];
}

export function ScheduleTab({ schedule }: ScheduleTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">일정</h2>
      {schedule?.milestones?.length ? (
        <div className="relative space-y-0">
          {schedule.milestones.map((m, i) => {
            const isPast = new Date(m.at) < new Date();
            return (
              <div key={i} className="flex gap-4 pb-6">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      isPast ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                    }`}
                  />
                  {i < schedule.milestones.length - 1 && (
                    <div className={`w-0.5 flex-1 ${isPast ? "bg-blue-200" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="-mt-0.5">
                  <div className={`font-semibold ${isPast ? "text-gray-400" : "text-gray-900"}`}>{m.name}</div>
                  <div className="text-sm text-gray-500">{formatDateTime(m.at)}</div>
                  {!isPast && getDday(m.at) !== "D-Day" && (
                    <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {getDday(m.at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="일정 정보 없음" description="이 해커톤의 일정 정보가 아직 등록되지 않았습니다." />
      )}
    </div>
  );
}
