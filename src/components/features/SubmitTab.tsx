"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { DragDropZone } from "@/components/features/DragDropZone";
import { formatDateTime, isValidUrl } from "@/lib/utils";
import type { Submission } from "@/types";

interface SubmitTabProps {
  sections: {
    allowedArtifactTypes: string[];
    guide: string[];
    submissionItems?: { key: string; title: string; format: string }[];
  };
  existingSubmission: Submission | null;
  onSave: (items: { key: string; value: string }[], memo: string, teamName: string) => void;
  onSubmit: (items: { key: string; value: string }[], memo: string, teamName: string) => void;
}

const MAX_TEAM_NAME = 50;
const MAX_MEMO = 500;
const DRAFT_KEY = "batonhub_submit_draft";

export function SubmitTab({ sections, existingSubmission, onSave, onSubmit }: SubmitTabProps) {
  const hasSteps = sections.submissionItems && sections.submissionItems.length > 0;
  const keys = hasSteps
    ? sections.submissionItems!.map((s) => s.key)
    : sections.allowedArtifactTypes.map((t) => t);

  const initialItems = keys.map((k) => ({
    key: k,
    value: existingSubmission?.items.find((i) => i.key === k)?.value || "",
  }));

  const [items, setItems] = useState(initialItems);
  const [memo, setMemo] = useState(existingSubmission?.memo || "");
  const [teamName, setTeamName] = useState(existingSubmission?.teamName || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});
  const [teamNameError, setTeamNameError] = useState("");
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft from localStorage on mount (only if no existing submission)
  useEffect(() => {
    if (existingSubmission) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.items) setItems(draft.items);
        if (draft.memo) setMemo(draft.memo);
        if (draft.teamName) setTeamName(draft.teamName);
      }
    } catch { /* ignore corrupt drafts */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft with debounce
  const saveDraft = useCallback(() => {
    if (existingSubmission?.status === "submitted") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ items, memo, teamName }));
    } catch { /* quota exceeded - ignore */ }
  }, [items, memo, teamName, existingSubmission]);

  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(saveDraft, 1000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [saveDraft]);

  // Clear draft after successful save/submit
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  function updateItem(key: string, value: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, value } : i)));
    if (urlErrors[key]) {
      setUrlErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validateForm(requireTeamName: boolean): boolean {
    let valid = true;
    const errors: Record<string, string> = {};

    if (requireTeamName && !teamName.trim()) {
      setTeamNameError("팀명을 입력해주세요.");
      valid = false;
    } else {
      setTeamNameError("");
    }

    if (hasSteps) {
      for (const step of sections.submissionItems!) {
        const val = items.find((i) => i.key === step.key)?.value || "";
        // Validate required fields are not empty on final submit
        if (requireTeamName && !val.trim()) {
          errors[step.key] = "필수 항목입니다.";
          valid = false;
        } else if ((step.format === "url" || step.format === "pdf_url") && val && !isValidUrl(val)) {
          errors[step.key] = "올바른 URL 형식이 아닙니다 (https://...)";
        }
      }
    }
    setUrlErrors(errors);
    if (Object.keys(errors).length > 0) valid = false;

    return valid;
  }

  const isSubmitted = existingSubmission?.status === "submitted";

  const filledCount = items.filter((i) => i.value.trim()).length;
  const totalItems = items.length + 1;
  const filledTotal = filledCount + (teamName.trim() ? 1 : 0);
  const completionPercent = Math.round((filledTotal / totalItems) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">제출</h2>
        {!isSubmitted && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">작성</span>
            <div className="h-2 w-24 rounded-full bg-gray-200" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`작성 진행률 ${completionPercent}%`}>
              <div
                className={`h-2 rounded-full transition-all ${completionPercent === 100 ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="font-semibold text-gray-700">{completionPercent}%</span>
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-800">제출이 완료되었습니다</span>
            </div>
            <button
              onClick={() => setShowResubmit(true)}
              className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 transition"
            >
              수정하기 (재제출)
            </button>
          </div>
          <p className="mt-1 text-xs text-green-700">
            제출일시: {formatDateTime(existingSubmission!.submittedAt!)} | 팀명: {existingSubmission!.teamName}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-gray-700">제출 가이드</h3>
        <ul className="space-y-1">
          {sections.guide.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="text-blue-500">{i + 1}.</span>
              {g}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="submit-team-name" className="block text-sm font-semibold text-gray-700">
            팀명 / 닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            id="submit-team-name"
            type="text"
            value={teamName}
            onChange={(e) => { setTeamName(e.target.value); if (teamNameError) setTeamNameError(""); }}
            disabled={isSubmitted}
            aria-required="true"
            aria-invalid={!!teamNameError || undefined}
            aria-describedby={teamNameError ? "submit-team-name-error" : undefined}
            maxLength={MAX_TEAM_NAME}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${teamNameError ? "border-red-400" : "border-gray-300"}`}
            placeholder="리더보드에 표시될 팀명을 입력하세요"
          />
          {teamNameError && (
            <p id="submit-team-name-error" className="text-xs text-red-500 mt-0.5" role="alert">{teamNameError}</p>
          )}
          {!isSubmitted && !teamNameError && (
            <p className="text-xs text-gray-400 text-right mt-0.5">{teamName.length}/{MAX_TEAM_NAME}</p>
          )}
        </div>

        {hasSteps
          ? sections.submissionItems!.map((step) => (
              <div key={step.key} className="space-y-2">
                <label htmlFor={`submit-${step.key}`} className="block text-sm font-semibold text-gray-700">{step.title}</label>
                {step.format === "text_or_url" ? (
                  <>
                    <textarea
                      id={`submit-${step.key}`}
                      value={items.find((i) => i.key === step.key)?.value || ""}
                      onChange={(e) => updateItem(step.key, e.target.value)}
                      rows={3}
                      disabled={isSubmitted}
                      aria-required="true"
                      aria-invalid={!!urlErrors[step.key] || undefined}
                      aria-describedby={urlErrors[step.key] ? `submit-error-${step.key}` : undefined}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${urlErrors[step.key] ? "border-red-400" : "border-gray-300"}`}
                      placeholder="텍스트 또는 URL을 입력하세요"
                    />
                    {urlErrors[step.key] && (
                      <p id={`submit-error-${step.key}`} className="text-xs text-red-500" role="alert">{urlErrors[step.key]}</p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      id={`submit-${step.key}`}
                      type="url"
                      value={items.find((i) => i.key === step.key)?.value || ""}
                      onChange={(e) => updateItem(step.key, e.target.value)}
                      disabled={isSubmitted}
                      aria-required="true"
                      aria-describedby={urlErrors[step.key] ? `submit-error-${step.key}` : undefined}
                      aria-invalid={!!urlErrors[step.key] || undefined}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${urlErrors[step.key] ? "border-red-400" : "border-gray-300"}`}
                      placeholder="https://..."
                    />
                    {urlErrors[step.key] && (
                      <p id={`submit-error-${step.key}`} className="text-xs text-red-500" role="alert">{urlErrors[step.key]}</p>
                    )}
                  </>
                )}
                {step.format === "pdf_url" && (
                  <DragDropZone
                    accept=".pdf"
                    label="PDF 파일을 드래그하거나 클릭하여 업로드"
                    onFileSelect={(name) => updateItem(step.key, name)}
                    currentValue={items.find((i) => i.key === step.key)?.value}
                    disabled={isSubmitted}
                  />
                )}
              </div>
            ))
          : keys.map((k) => (
              <div key={k} className="space-y-2">
                <label htmlFor={`submit-${k}`} className="block text-sm font-semibold text-gray-700 capitalize">{k} 파일</label>
                <input
                  id={`submit-${k}`}
                  type="text"
                  value={items.find((i) => i.key === k)?.value || ""}
                  onChange={(e) => updateItem(k, e.target.value)}
                  disabled={isSubmitted}
                  aria-required="true"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder={`${k} 파일 경로 또는 URL`}
                />
                {k === "pdf" && (
                  <DragDropZone
                    accept=".pdf"
                    label="PDF 파일 (최대 10MB)"
                    onFileSelect={(name) => updateItem(k, name)}
                    currentValue={items.find((i) => i.key === k)?.value}
                    disabled={isSubmitted}
                  />
                )}
              </div>
            ))}

        <div className="space-y-2">
          <label htmlFor="submit-memo" className="block text-sm font-semibold text-gray-700">메모 (선택)</label>
          <textarea
            id="submit-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            disabled={isSubmitted}
            maxLength={MAX_MEMO}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="심사위원에게 전달할 메모 (최대 500자)"
          />
          <p className="text-xs text-gray-400 text-right">{memo.length}/{MAX_MEMO}</p>
        </div>
      </div>

      {!isSubmitted && (
        <div className="space-y-2 pt-2">
          {!teamName.trim() && (
            <p className="text-xs text-red-500" role="alert">팀명을 입력해야 제출할 수 있습니다.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { if (validateForm(false)) { clearDraft(); onSave(items, memo, teamName); } }}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              임시 저장
            </button>
            <button
              onClick={() => { if (validateForm(true)) setShowConfirm(true); }}
              disabled={!teamName.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              제출 완료
            </button>
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="제출을 확정하시겠습니까?"
        actions={
          <>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                clearDraft();
                onSubmit(items, memo, teamName);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              확인, 제출합니다
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-red-600 font-medium">제출 후에는 수정이 불가합니다.</p>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p><span className="font-semibold">팀명:</span> {teamName}</p>
            {items.filter((i) => i.value).map((i) => (
              <p key={i.key} className="mt-1"><span className="font-semibold">{i.key}:</span> {i.value.length > 50 ? i.value.slice(0, 50) + "..." : i.value}</p>
            ))}
            {memo && <p className="mt-1"><span className="font-semibold">메모:</span> {memo.length > 50 ? memo.slice(0, 50) + "..." : memo}</p>}
          </div>
        </div>
      </Modal>

      {/* Resubmit confirmation modal */}
      <Modal
        open={showResubmit}
        onClose={() => setShowResubmit(false)}
        title="제출을 철회하시겠습니까?"
        actions={
          <>
            <button
              onClick={() => setShowResubmit(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => {
                setShowResubmit(false);
                onSave(
                  existingSubmission!.items,
                  existingSubmission!.memo,
                  existingSubmission!.teamName
                );
              }}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              수정 모드로 전환
            </button>
          </>
        }
      >
        <p>제출을 철회하고 수정 모드로 전환합니다. 수정 후 다시 제출해야 합니다.</p>
      </Modal>
    </div>
  );
}
