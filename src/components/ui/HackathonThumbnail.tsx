"use client";

const GRADIENT_PRESETS: Record<string, { gradient: string }> = {
  ended: { gradient: "from-slate-500 via-gray-600 to-zinc-700" },
  ongoing: { gradient: "from-emerald-400 via-teal-500 to-cyan-600" },
  upcoming: { gradient: "from-violet-500 via-purple-500 to-fuchsia-500" },
};

const SLUG_GRADIENTS: Record<string, string> = {
  "aimers-8-model-lite": "from-blue-600 via-indigo-600 to-purple-700",
  "monthly-vibe-coding-2026-02": "from-rose-500 via-pink-500 to-orange-400",
  "daker-handover-2026-03": "from-cyan-500 via-blue-500 to-indigo-600",
  "sesac-hackathon-2026": "from-emerald-500 via-green-500 to-teal-600",
  "cyber-attack-prediction-2026": "from-red-600 via-rose-600 to-pink-700",
  "voice-classification-2026": "from-amber-500 via-orange-500 to-red-500",
  "smart-factory-ai-2026": "from-slate-600 via-zinc-600 to-gray-700",
  "ev-price-prediction-2026": "from-lime-500 via-green-500 to-emerald-600",
};

interface HackathonThumbnailProps {
  slug: string;
  title: string;
  status: string;
  className?: string;
}

export function HackathonThumbnail({ slug, title, status, className = "" }: HackathonThumbnailProps) {
  const gradient = SLUG_GRADIENTS[slug] || GRADIENT_PRESETS[status]?.gradient || "from-blue-500 via-purple-500 to-pink-500";

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-md" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-md" />
      <div className="absolute right-1/4 bottom-1/3 h-14 w-14 rounded-full bg-white/5 blur-lg" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
      {/* Dark scrim for text contrast (WCAG AA) */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
      {/* Title overlay — generous padding to prevent clipping */}
      {title && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <span
            className="block text-[10px] sm:text-[11px] font-semibold text-white line-clamp-2 leading-snug break-words"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
