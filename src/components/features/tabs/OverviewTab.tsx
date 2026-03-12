import { EmptyState } from "@/components/ui/EmptyState";
import type { HackathonDetail } from "@/types";

interface OverviewTabProps {
  overview: HackathonDetail["sections"]["overview"];
}

function RenderDescription({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];
  let inTable = false;

  function flushTable(idx: number) {
    if (tableHeader.length === 0 && tableRows.length === 0) return;
    elements.push(
      <div key={`table-${idx}`} className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          {tableHeader.length > 0 && (
            <thead>
              <tr className="border-b-2 border-gray-200">
                {tableHeader.map((cell, ci) => (
                  <th key={ci} className="text-left px-3 py-2 font-semibold text-gray-900 bg-gray-50">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-100">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeader = [];
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
      // Separator row (|---|---|...)
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable && tableHeader.length === 0) {
        tableHeader = cells;
      } else {
        inTable = true;
        tableRows.push(cells);
      }
      continue;
    }

    // If we were in a table and now hit a non-table line, flush
    if (inTable || tableHeader.length > 0) {
      flushTable(i);
    }

    // Empty line
    if (trimmed === "") {
      continue;
    }

    // H2
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2 first:mt-0">
          {trimmed.slice(3)}
        </h3>
      );
      continue;
    }

    // Bullet point
    if (trimmed.startsWith("- **")) {
      const match = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/);
      if (match) {
        elements.push(
          <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-disc">
            <span className="font-semibold text-gray-900">{match[1]}</span>
            {match[2]}
          </li>
        );
        continue;
      }
    }

    if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-disc">
          {trimmed.slice(2)}
        </li>
      );
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-gray-700 leading-relaxed list-decimal">
          <span className="font-semibold text-gray-900">{numMatch[2]}</span>
          {numMatch[3] ? ` ${numMatch[3]}` : ""}
        </li>
      );
      continue;
    }

    // Regular paragraph — handle inline bold
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let m;
    while ((m = regex.exec(trimmed)) !== null) {
      if (m.index > lastIndex) {
        parts.push(trimmed.slice(lastIndex, m.index));
      }
      parts.push(<strong key={`b-${i}-${m.index}`} className="font-semibold text-gray-900">{m[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < trimmed.length) {
      parts.push(trimmed.slice(lastIndex));
    }

    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {parts.length > 0 ? parts : trimmed}
      </p>
    );
  }

  // Flush any remaining table
  if (inTable || tableHeader.length > 0) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}

export function OverviewTab({ overview }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">개요</h2>
      {overview ? (
        <>
          <p className="text-gray-700 leading-relaxed font-medium">{overview.summary}</p>

          {overview.description && (
            <div className="mt-2">
              <RenderDescription text={overview.description} />
            </div>
          )}

          {(overview.host || overview.organizer) && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
              {overview.host && (
                <span>주최: <span className="font-medium text-gray-900">{overview.host}</span></span>
              )}
              {overview.organizer && (
                <span>주관: <span className="font-medium text-gray-900">{overview.organizer}</span></span>
              )}
            </div>
          )}

          {overview.tags && overview.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {overview.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

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
