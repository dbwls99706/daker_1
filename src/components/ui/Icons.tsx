import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

function createIcon(path: React.ReactNode, displayName: string) {
  const Icon: React.FC<IconProps> = ({ className, size = 20 }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

/** Trophy — for hackathons (replaces 🏆) */
export const TrophyIcon = createIcon(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>,
  'TrophyIcon'
);

/** Users — for teams (replaces 👥) */
export const UsersIcon = createIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
  'UsersIcon'
);

/** ChartBar — for stats/rankings (replaces 📊) */
export const ChartBarIcon = createIcon(
  <>
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="8" rx="0.5" />
    <rect x="12" y="6" width="3" height="12" rx="0.5" />
    <rect x="17" y="2" width="3" height="16" rx="0.5" />
  </>,
  'ChartBarIcon'
);

/** TrendingUp — for trends (replaces 📈) */
export const TrendingUpIcon = createIcon(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>,
  'TrendingUpIcon'
);

/** Clock — for countdown/time (replaces ⏰) */
export const ClockIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>,
  'ClockIcon'
);

/** Fire — for ongoing/hot (replaces 🔥) */
export const FireIcon = createIcon(
  <path d="M12 22c4.97 0 8-3.03 8-8 0-4.418-4-7-4-12 0 0-2.5 3-2.5 5 0 1.5-.5 2-1.5 2s-2-1.5-2-4c0-1.5-1-3.5-2-5-1.5 3-4 5.5-4 10 0 4.97 3.03 8 8 8Z" />,
  'FireIcon'
);

/** CheckCircle — for completed/submitted (replaces ✅) */
export const CheckCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>,
  'CheckCircleIcon'
);

/** Wave — for welcome/greeting (replaces 👋) */
export const WaveIcon = createIcon(
  <>
    <path d="M7.5 12.5 5 10a1.5 1.5 0 0 1 2.12-2.12L10 10.76" />
    <path d="M13.42 9.17 11.3 7.05a1.5 1.5 0 0 1 2.12-2.12l4.24 4.24" />
    <path d="M10 10.76 8.12 8.88a1.5 1.5 0 0 1 2.12-2.12l5.66 5.66" />
    <path d="m15.54 13.42-3.42-3.42a1.5 1.5 0 0 1 2.12-2.12l3.54 3.54" />
    <path d="M17.78 17.78a8 8 0 0 0-2.34-12.84" />
    <path d="M11 21.5c-3.06-.56-5.87-2.56-7.44-5.5" />
    <path d="M20.73 14.27a8 8 0 0 0-.73-2.77" />
  </>,
  'WaveIcon'
);

/** History — for recently viewed (replaces 🕐) */
export const HistoryIcon = createIcon(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </>,
  'HistoryIcon'
);

/** Star — for bookmarks (replaces ★/☆) */
export const StarIcon = createIcon(
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2Z" />,
  'StarIcon'
);

/** Share — for sharing */
export const ShareIcon = createIcon(
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>,
  'ShareIcon'
);

/** Chat — for comments/activity */
export const ChatIcon = createIcon(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="13" y2="12" />
  </>,
  'ChatIcon'
);

/** Sparkles — for AI/special features */
export const SparklesIcon = createIcon(
  <>
    <path d="M12 3l1.46 4.27L18 8.73l-4.54 1.46L12 14.46l-1.46-4.27L6 8.73l4.54-1.46L12 3Z" />
    <path d="M5 16l.73 2.14L8 18.87l-2.27.73L5 21.73l-.73-2.13L2 18.87l2.27-.73L5 16Z" />
    <path d="M19 14l.73 2.14L22 16.87l-2.27.73L19 19.73l-.73-2.13L16 16.87l2.27-.73L19 14Z" />
  </>,
  'SparklesIcon'
);

/** Bolt — for urgency */
export const BoltIcon = createIcon(
  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  'BoltIcon'
);

/** Document — for submissions */
export const DocumentIcon = createIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </>,
  'DocumentIcon'
);

/** Funnel — for filters */
export const FunnelIcon = createIcon(
  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />,
  'FunnelIcon'
);

/** MagnifyingGlass — for search */
export const MagnifyingGlassIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>,
  'MagnifyingGlassIcon'
);
