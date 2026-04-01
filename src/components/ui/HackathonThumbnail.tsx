"use client";

const GRADIENT_PRESETS: Record<string, { gradient: string; pattern: string }> = {
  ended: {
    gradient: "from-slate-500 via-gray-600 to-zinc-700",
    pattern: "opacity-20",
  },
  ongoing: {
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    pattern: "opacity-30",
  },
  upcoming: {
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    pattern: "opacity-25",
  },
};

const SLUG_GRADIENTS: Record<string, string> = {
  "aimers-8-model-lite": "from-blue-600 via-indigo-600 to-purple-700",
  "monthly-vibe-coding-2026-02": "from-rose-500 via-pink-500 to-orange-400",
  "daker-handover-2026-03": "from-cyan-500 via-blue-500 to-indigo-600",
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
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      {/* Title overlay */}
      <div className="absolute inset-0 flex items-end p-3">
        <span className="text-xs font-bold text-white drop-shadow-md line-clamp-2 leading-tight">
          {title}
        </span>
      </div>
    </div>
  );
}
