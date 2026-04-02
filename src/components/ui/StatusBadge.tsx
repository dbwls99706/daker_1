import React from "react";
import { statusLabel, statusColor } from "@/lib/utils";

const statusIcon: Record<string, string> = {
  ongoing: "●",
  ended: "✓",
  upcoming: "◎",
};

export const StatusBadge = React.memo(function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(status)}`}>
      <span className={`text-[8px] ${status === "ongoing" ? "animate-pulse" : ""}`} aria-hidden="true">
        {statusIcon[status] || "●"}
      </span>
      {statusLabel(status)}
    </span>
  );
});
