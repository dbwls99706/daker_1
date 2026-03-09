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
Data:         localStorage / dummy JSON
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
├── public/
│   └── assets/            # Static images, icons, fonts
├── src/
│   ├── app/               # Next.js App Router pages (or pages/)
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Home / landing page
│   │   └── [...routes]/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Atomic components (Button, Input, Card...)
│   │   └── features/      # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, helpers, constants
│   ├── data/              # Dummy data / mock JSON
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
└── docs/
    ├── planning.md        # Planning document draft
    └── solution.md        # Solution explanation draft
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
- Store dummy data in `src/data/` as typed JSON/TS files
- Use a `useLocalStorage` hook or utility for CRUD operations
- All data changes must persist across page reloads via localStorage

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

1. **Filter & Sort must work** — judges specifically check this
2. **Empty state UI** — show meaningful content when no data/results
3. **No API keys required** — judges won't set up credentials
4. **Deployed URL must stay live** through judging period (until 4/24)
5. **Extend beyond basics** — novel features and UX improvements score 30%
6. **Documentation matters** — 15% of score; keep README and docs clear

---

## Deliverables Checklist

- [ ] Planning document (service overview, page structure, system architecture, key feature specs, user flows, development plan)
- [ ] Working web application deployed on Vercel
- [ ] GitHub repository with clean code
- [ ] Solution PPT converted to PDF
- [ ] All features accessible without external API keys
