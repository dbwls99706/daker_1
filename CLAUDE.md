# CLAUDE.md — AI Assistant Guide for DACON Hackathon Project

## Contest Overview

**Name:** 월간 해커톤 : 긴급 인수인계 해커톤 - 문서만 남기고 사라졌다
**Platform:** DACON (AI Hackathon Platform)
**Period:** 2026-03-05 14:00 ~ 2026-04-27 10:00
**Goal:** Build and deploy a web service using "vibe coding" based on provided reference documents. Extend it with team ideas for better UX/features.

### Key Deadlines
| Phase | Deadline |
|---|---|
| Registration & Planning Doc | 3/30 10:00 |
| Final Web Link Submission | 4/6 10:00 |
| Final Solution PPT (PDF) | 4/13 10:00 |
| Peer + Judge Voting | 4/13 12:00 ~ 4/17 10:00 |
| Internal Judging | 4/17 ~ 4/24 23:59 |

### Prizes
- 1st: 500,000 KRW
- 2nd: 300,000 KRW
- 3rd: 200,000 KRW

---

## Evaluation Criteria

| Category | Weight | Key Points |
|---|---|---|
| **Basic Implementation** | 30% | Page rendering, data-driven rendering, filter/sort, empty-state UI |
| **Extension (Ideas)** | 30% | Novel features/UX improvements, "service value", consistent flow |
| **Completeness** | 25% | Usability, stability (error handling), performance (loading/responsiveness), accessibility/responsive design |
| **Documentation** | 15% | Planning doc clarity, PPT explanation quality, reproducibility |

---

## Provided Reference Data

All provided data is located in `data/` (JSON) and `docs/` (images).

### Reference Images
- `docs/Hackathon-UI-Flow.png` — **Page routing & architecture diagram** (see Page Structure below)
- `docs/memo.png` — **Handwritten feature specification memo** (해커톤 웹 기능 명세)

### JSON Data Files (`data/`)

#### `public_hackathons.json` — Hackathon List
Array of hackathon cards. Each entry:
```ts
{
  slug: string;           // URL identifier (e.g., "daker-handover-2026-03")
  title: string;          // Display name
  status: "ended" | "ongoing" | "upcoming";
  tags: string[];         // e.g., ["VibeCoding", "Web", "Vercel", "Handover"]
  thumbnailUrl: string;
  period: {
    timezone: string;
    submissionDeadlineAt: string;  // ISO datetime
    endAt: string;
  };
  links: {
    detail: string;       // → /hackathons/:slug
    rules: string;
    faq: string;
  };
}
```
Contains 3 hackathons: `aimers-8-model-lite` (ended), `monthly-vibe-coding-2026-02` (ongoing), `daker-handover-2026-03` (upcoming).

#### `public_hackathon_detail.json` — Hackathon Detail
Nested detail object with sections:
- `overview` — summary, teamPolicy (allowSolo, maxTeamSize)
- `info` — notice array, links (rules, faq)
- `eval` — metricName, description, scoring breakdown (participant 30% / judge 70%), limits
- `schedule` — timezone, milestones array (name + ISO datetime)
- `prize` — items array (place + amountKRW)
- `teams` — campEnabled, listUrl
- `submit` — allowedArtifactTypes, submissionUrl, guide, submissionItems (plan/web/pdf)
- `leaderboard` — publicLeaderboardUrl, note

**Important:** The `daker-handover-2026-03` detail is nested inside `extraDetails[]` of the aimers hackathon object.

#### `public_leaderboard.json` — Leaderboard Data
```ts
{
  hackathonSlug: string;
  updatedAt: string;
  entries: [{
    rank: number;
    teamName: string;
    score: number;
    submittedAt: string;
    scoreBreakdown?: { participant: number; judge: number; };
    artifacts?: { webUrl: string; pdfUrl: string; planTitle: string; };
  }];
}
```
Main leaderboard for `aimers-8-model-lite` + `extraLeaderboards[]` for `daker-handover-2026-03`.

#### `public_teams.json` — Team / Camp Recruitment
```ts
{
  teamCode: string;          // e.g., "T-HANDOVER-01"
  hackathonSlug: string;     // links team to hackathon
  name: string;
  isOpen: boolean;           // recruiting or not
  memberCount: number;
  lookingFor: string[];      // e.g., ["Frontend", "Designer"]
  intro: string;
  contact: { type: string; url: string; };
  createdAt: string;
}
```
4 teams across 3 hackathons. Filter by `hackathonSlug` to show relevant teams per hackathon.

---

## Page Structure & Routing (from UI Flow Diagram)

Based on `docs/Hackathon-UI-Flow.png` and `docs/memo.png`:

### Common Layout
- All pages share a navigation bar with links to: 메인(/), /hackathons, /camp, /rankings
- Logo + search bar in header

### Routes

| Route | Page | Description |
|---|---|---|
| `/` | **메인페이지** | Landing page with hackathon cards, team recruitment preview, rankings preview |
| `/hackathons` | **해커톤 목록** | Filterable list of hackathons (status/tags/sort/keyword). Card click → `/hackathons/:slug` |
| `/hackathons/:slug` | **해커톤 상세** | Detail page with tabbed sections (see below) |
| `/rankings` | **랭킹** | Cross-hackathon rankings with rank/score/points, time-based filters |
| `/camp` | **팀원 모집** | Team recruitment board, create/join teams, linked by `hackathonSlug` |

### Hackathon Detail Sections (Required Tabs)
These are tabs/sections within `/hackathons/:slug`:

1. **개요 (Overview)** — `HackOverview`: summary, team policy
2. **평가 (Eval)** — scoring criteria, metric info
3. **일정 (Schedule)** — milestone timeline
4. **상금 (Prize)** — prize breakdown
5. **안내 (Info)** — notices, rules/FAQ links
6. **팀 (Teams)** — team list for this hackathon, link to camp, "view teams for this hackathon"
7. **제출 (Submit)** — submission form/status, file upload, notes (optional)
8. **리더보드 (Leaderboard)** — rankings table with score, team, submission time

### Data Flow (from diagram)
```
localStorage
├── hackathons      ← from public_hackathons.json (seed)
├── teams (camp)    ← from public_teams.json (seed)
├── submissions     ← user-created (CRUD via UI)
└── leaderboards    ← from public_leaderboard.json (seed, updated on submit)
```

---

## Feature Specification (from memo.png)

### 1. 메인페이지 (/)
- Logo + search bar
- Hackathon cards → /hackathons
- Team recruitment → /camp
- Rankings → /rankings

### 2. 해커톤 목록 (/hackathons)
- List displayed as cards
- **Filters:** status (진행중/종료/예정), tags, sort (최신/마감임박), keyword search
- Card click → `/hackathons/:slug`

### 3. 해커톤 상세 (/hackathons/:slug)
- Overview section with description
- Tabbed navigation for all sections
- **+ Teams section:** show teams for this hackathon, link to create team
- **+ Submit section:**
  - File upload UI
  - Save/submit buttons
  - Notes field (optional)
  - `artifact(?)` — supports text, url, pdf based on hackathon config
- **+ Leaderboard:** display rankings, sorted by score
  - Linked to hackathon, updates on new submissions
  - Shows rank, team, score, submission time

### 4. 팀원 모집 (/camp)
- Team cards linked to hackathons
- `/camp?hackathon=:slug` → filter by hackathon
- Each card shows: team name, hackathon, member count, lookingFor roles, intro
- **Create team:** team name, intro, contact (link/url), max size
- **Join:** contact link displayed
- Linked via `team.hackathonSlug`

### 5. 랭킹 (/rankings)
- Cross-hackathon ranking of teams
- Columns: rank, team name (nickname), score/points
- Time-based filters (기간 필터 : 전체/월별/연도별)

---

## Technical Requirements & Constraints

### Mandatory
- **Deployment:** Vercel (URL must be publicly accessible during judging)
- **Source Code:** GitHub repository link required
- **Submissions:** Planning doc, deployed URL, GitHub link, solution PPT as PDF

### Rules
- **Tech stack:** No restrictions — free choice of framework/language
- **Data:** No external dataset provided. Use dummy data and `localStorage` for persistence
- **External APIs/DB:** Allowed, but judges must be able to use features without API keys
- **AI tools:** Generative AI usage is permitted and encouraged (vibe coding)
- **Copyright:** All assets (code, images, fonts, icons) must comply with licenses

---

## Project Architecture

### Recommended Stack
```
Framework:    Next.js (App Router) or React + Vite
Styling:      Tailwind CSS
Language:     TypeScript
Deployment:   Vercel
Data:         localStorage / dummy JSON (seeded from data/*.json)
```

### Directory Structure (Target)
```
/
├── CLAUDE.md              # This file — AI assistant guide
├── README.md              # Project documentation (for judges)
├── package.json
├── tsconfig.json
├── next.config.js         # or vite.config.ts
├── vercel.json            # Vercel deployment config (if needed)
├── data/                  # Provided reference JSON (seed data)
│   ├── public_hackathons.json
│   ├── public_hackathon_detail.json
│   ├── public_leaderboard.json
│   └── public_teams.json
├── docs/                  # Reference images from handover
│   ├── Hackathon-UI-Flow.png
│   └── memo.png
├── public/
│   └── assets/            # Static images, icons, fonts
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── layout.tsx     # Root layout with nav bar
│   │   ├── page.tsx       # Home (/)
│   │   ├── hackathons/
│   │   │   ├── page.tsx          # Hackathon list (/hackathons)
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Hackathon detail (/hackathons/:slug)
│   │   ├── camp/
│   │   │   └── page.tsx          # Team recruitment (/camp)
│   │   └── rankings/
│   │       └── page.tsx          # Rankings (/rankings)
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Atomic components (Button, Input, Card...)
│   │   └── features/      # Feature-specific components
│   ├── hooks/             # Custom React hooks (useLocalStorage, etc.)
│   ├── lib/               # Utilities, helpers, constants
│   │   └── storage.ts     # localStorage wrapper with seed logic
│   ├── data/              # Seed data (copy of /data for imports)
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
└── docs/
    ├── Hackathon-UI-Flow.png
    └── memo.png
```

---

## Development Workflow

### Setup
```bash
npm create next-app@latest . --typescript --tailwind --app --eslint
npm install
npm run dev
```

### Common Commands
```bash
npm run dev        # Start development server
npm run build      # Production build (verify before deploy)
npm run lint       # Run ESLint
npm run start      # Start production server locally
```

### Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Git Workflow
- Branch: `claude/hackathon-dashboard-ui-Zw9ou`
- Commit messages: clear, descriptive, in English
- Push: `git push -u origin claude/hackathon-dashboard-ui-Zw9ou`

---

## Coding Conventions

### General
- Use TypeScript with strict mode
- Prefer functional components with hooks
- Use `localStorage` for data persistence — wrap in a utility for consistency
- Handle empty states gracefully (judges evaluate this)
- Ensure responsive design (mobile + desktop)

### Component Patterns
```tsx
// Use named exports for components
export function FeatureName() { ... }

// Props interface co-located with component
interface FeatureNameProps {
  title: string;
  items: Item[];
}
```

### Data Layer
- Seed `localStorage` on first load from JSON files in `data/`
- Use a `useLocalStorage` hook or utility for CRUD operations
- All data changes must persist across page reloads via localStorage
- Filter teams by `hackathonSlug` when displaying per-hackathon
- Leaderboard entries linked to hackathons via `hackathonSlug`

### Error Handling
- Wrap async operations in try/catch
- Show user-friendly error messages
- Provide fallback UI for failed states

### Performance
- Use `React.memo`, `useMemo`, `useCallback` where appropriate
- Lazy load routes/heavy components
- Optimize images (use `next/image` if using Next.js)

---

## Key Evaluation Reminders for Development

1. **Filter & Sort must work** — judges specifically check this (hackathon list: status/tag/sort/keyword)
2. **Empty state UI** — show meaningful content when no data/results
3. **No API keys required** — judges won't set up credentials
4. **Deployed URL must stay live** through judging period (until 4/24)
5. **Extend beyond basics** — novel features and UX improvements score 30%
6. **Documentation matters** — 15% of score; keep README and docs clear
7. **Submission flow** — must support plan(text/url) → web link(url) → PDF upload per hackathon type
8. **Team recruitment** — must link teams to hackathons via `hackathonSlug`, support create/browse

---

## Deliverables Checklist

- [ ] Planning document (service overview, page structure, system architecture, key feature specs, user flows, development plan)
- [ ] Working web application deployed on Vercel
- [ ] GitHub repository with clean code
- [ ] Solution PPT converted to PDF
- [ ] All features accessible without external API keys

### Page Implementation Checklist
- [ ] `/` — Main landing page with hackathon cards, recruitment preview, rankings preview
- [ ] `/hackathons` — Filterable hackathon list (status, tags, sort, keyword)
- [ ] `/hackathons/:slug` — Detail page with all 8 tab sections
- [ ] `/camp` — Team recruitment board with create/join functionality
- [ ] `/rankings` — Cross-hackathon rankings with time filters
- [ ] Common nav bar across all pages
- [ ] localStorage seeding from JSON data on first load
- [ ] Responsive design (mobile + desktop)
