# BatonHub - 해커톤 통합 대시보드

해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드입니다.

## 서비스 개요

BatonHub는 DACON 해커톤 참가자를 위한 올인원 대시보드로, 해커톤 탐색/필터링, 팀 모집 및 관리, 결과물 제출, 리더보드 확인을 하나의 서비스에서 제공합니다.

## 주요 기능

### 기본 기능
- **해커톤 목록 & 필터링**: 상태(진행중/예정/종료), 태그, 정렬(최신순/마감임박순), 키워드 검색
- **해커톤 상세**: 8개 탭 (개요, 평가, 일정, 상금, 안내, 팀, 제출, 리더보드)
- **팀원 모집 (캠프)**: 팀 생성/조회/삭제, 해커톤별 필터링, 모집 상태 관리
- **글로벌 랭킹**: 전체/월별/연도별 기간 필터, 해커톤 간 통합 점수 집계
- **결과물 제출**: 임시 저장 & 최종 제출, 제출 진행률 표시, URL 유효성 검증

### 확장 기능
- **북마크 시스템**: 관심 해커톤을 즐겨찾기하여 메인 페이지에서 빠르게 확인
- **진행률 바**: 해커톤 마감까지의 시간 진행률을 시각적으로 표시
- **통계 대시보드**: 메인 페이지에서 해커톤/팀/제출 현황을 한눈에 확인
- **제출 진행률 트래커**: 제출 양식 작성 진행률을 실시간으로 표시
- **다크 모드**: 전체 페이지 다크 모드 지원
- **접근성**: Skip-to-content, ARIA 속성, 키보드 네비게이션, 포커스 트랩, aria-live 토스트

## 페이지 구조

| 경로 | 페이지 | 설명 |
|---|---|---|
| `/` | 메인 | 통계 대시보드, 해커톤/팀/랭킹 프리뷰, 북마크 |
| `/hackathons` | 해커톤 목록 | 필터링/정렬/검색이 가능한 해커톤 카드 목록 |
| `/hackathons/:slug` | 해커톤 상세 | 8개 탭으로 구성된 상세 정보, 제출 폼, 리더보드 |
| `/camp` | 팀원 모집 | 팀 생성/조회/관리, 해커톤별 필터링 |
| `/rankings` | 글로벌 랭킹 | 기간별 통합 랭킹, 팀 점수 집계 |

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Data**: localStorage (JSON 시드 데이터 기반)
- **Deployment**: Vercel

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버
npm start
```

## 데이터 구조

모든 데이터는 `localStorage`에 저장되며, 최초 접속 시 `data/` 디렉토리의 JSON 파일로부터 자동 시드됩니다.

```
localStorage
├── batonhub_hackathons   ← 해커톤 목록
├── batonhub_details      ← 해커톤 상세 정보
├── batonhub_leaderboards ← 리더보드 데이터
├── batonhub_teams        ← 팀 모집 정보
├── batonhub_submissions  ← 사용자 제출물
├── batonhub_bookmarks    ← 북마크 목록
└── batonhub_seeded       ← 시드 완료 플래그
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx          # 루트 레이아웃 (Navbar + Footer)
│   ├── page.tsx            # 메인 페이지
│   ├── globals.css         # 전역 스타일 + 다크 모드
│   ├── hackathons/         # 해커톤 관련 페이지
│   ├── camp/               # 팀 모집 페이지
│   └── rankings/           # 랭킹 페이지
├── components/ui/          # 재사용 UI 컴포넌트
│   ├── Navbar.tsx          # 네비게이션 바
│   ├── Footer.tsx          # 푸터
│   ├── Modal.tsx           # 접근성 모달
│   ├── Toast.tsx           # aria-live 토스트
│   ├── ErrorBoundary.tsx   # 에러 바운더리
│   ├── StatusBadge.tsx     # 상태 배지
│   ├── EmptyState.tsx      # 빈 상태 UI
│   └── LoadingSpinner.tsx  # 로딩 스피너
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티
│   ├── storage.ts          # localStorage CRUD
│   └── utils.ts            # 포맷팅, 유효성 검사
├── types/                  # TypeScript 타입 정의
└── data/                   # 시드 JSON 데이터
```

## 접근성

- Skip-to-content 링크
- 시맨틱 HTML (`<nav>`, `<main>`, `<footer>`, `<table>`)
- ARIA 속성 (`aria-label`, `aria-required`, `aria-pressed`, `aria-selected`, `aria-live`)
- 키보드 내비게이션 (Tab, Arrow keys, Escape)
- 모달 포커스 트랩
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 라이선스

DACON 월간 해커톤 출품작
