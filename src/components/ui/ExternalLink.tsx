"use client";

import { sanitizeUrl } from "@/lib/utils";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/** Safe external link with noopener/noreferrer, sanitized URL, and visual indicator */
export function ExternalLink({ href, children, className = "" }: ExternalLinkProps) {
  const safeUrl = sanitizeUrl(href);

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={safeUrl !== "#" ? safeUrl : undefined}
    >
      {children}
      {safeUrl !== "#" && (
        <svg className="ml-0.5 inline-block h-3 w-3 flex-shrink-0 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3.5 3h5.5v5.5M9 3L3 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </a>
  );
}
