import { EmptyState } from "@/components/ui/EmptyState";
import { formatKRW } from "@/lib/utils";
import type { HackathonDetail } from "@/types";

interface PrizeTabProps {
  prize: HackathonDetail["sections"]["prize"];
}

export function PrizeTab({ prize }: PrizeTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">상금</h2>
      {prize?.items?.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {prize.items.map((p, i) => (
            <div
              key={i}
              className={`rounded-xl border-2 p-6 text-center ${
                i === 0
                  ? "border-yellow-300 bg-yellow-50"
                  : i === 1
                  ? "border-gray-300 bg-gray-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="text-2xl" aria-hidden="true">{i === 0 ? "\uD83E\uDD47" : i === 1 ? "\uD83E\uDD48" : "\uD83E\uDD49"}</div>
              <div className="mt-2 text-sm font-medium text-gray-600">{p.place}</div>
              <div className="mt-1 text-xl font-bold">{formatKRW(p.amountKRW)}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="상금 정보 없음" description="이 해커톤의 상금 정보가 아직 등록되지 않았습니다." />
      )}
    </div>
  );
}
