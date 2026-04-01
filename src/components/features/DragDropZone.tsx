"use client";

import { useState, useCallback, useRef } from "react";

interface DragDropZoneProps {
  accept?: string;
  label: string;
  onFileSelect: (name: string, dataUrl: string) => void;
  currentValue?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DragDropZone({ accept, label, onFileSelect, currentValue, disabled }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기가 10MB를 초과합니다.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onFileSelect(file.name, reader.result);
      }
    };

    reader.onerror = () => {
      setError("파일을 읽는 중 오류가 발생했습니다. 다시 시도해주세요.");
      setFileName(null);
    };

    // For URLs/text just read as text; for pdf/images read as dataURL
    if (file.type.startsWith("text/") || file.type === "application/json") {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          disabled
            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
            : error
            ? "border-red-300 bg-red-50"
            : isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${label} 파일 업로드`}
        aria-describedby={error ? "dragdrop-error" : undefined}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />
        <div className="flex flex-col items-center gap-2">
          <svg className={`h-8 w-8 ${error ? "text-red-400" : isDragging ? "text-blue-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-gray-600">
            {isDragging ? (
              <span className="font-semibold text-blue-600">여기에 놓으세요!</span>
            ) : (
              <>
                <span className="font-semibold text-blue-600">클릭</span> 또는 <span className="font-semibold text-blue-600">드래그 앤 드롭</span>으로 파일 업로드
              </>
            )}
          </p>
          <p className="text-xs text-gray-400">{label} (최대 10MB)</p>
        </div>
        {(fileName || currentValue) && !error && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2">
            <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-700 truncate max-w-[200px]">
              {fileName || (currentValue && currentValue.length > 40 ? currentValue.slice(0, 40) + "..." : currentValue)}
            </span>
          </div>
        )}
      </div>
      {error && (
        <p id="dragdrop-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
