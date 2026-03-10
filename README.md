# BatonHub - 해커톤 통합 대시보드

해커톤 탐색부터 팀 빌딩, 제출, 순위 확인까지 한곳에서 완결하는 해커톤 통합 대시보드입니다.

## 서비스 개요

BatonHub는 DACON 해커톤 참가자를 위한 올인원 대시보드로, 해커톤 탐색/필터링, 팀 모집 및 관리, 결과물 제출, 리더보드 확인을 하나의 서비스에서 제공합니다.

> **환경 요구사항**: Node.js 18 이상 필요. 외부 API 키나 환경 변수 없이 바로 실행 가능합니다.

## 주요 기능

### 기본 기능
- **해커톤 목록 & 필터링**: 상태(진행중/예정/종료), 태그, 정렬(최신순/마감임박순), 키워드 검색
- **해커톤 상세**: 8개 탭 (개요, 평가, 일정, 상금, 안내, 팀, 제출, 리더보드)
- **팀원 모집 (캠프)**: 팀 생성/조회/삭제, 해커톤별 필터링, 팀 검색, 모집 상태 관리
- **글로벌 랭킹**: 전체/월별/연도별 기간 필터, 해커톤별 필터, 컬럼 정렬, 페이지네이션
- **결과물 제출**: 임시 저장 & 최종 제출, 재제출 가능, URL 유효성 검증

### 확장 기능
- **북마크 시스템**: 관심 해커톤을 즐겨찾기하여 메인 페이지에서 빠르게 확인
- **마감 임박 알림**: D-7 이내 해커톤을 메인 페이지 상단에 긴급 안내
- **진행률 바**: 해커톤 마감까지의 시간 진행률을 시각적으로 표시
- **통계 대시보드**: 메인 페이지에서 해커톤/팀/제출 현황을 한눈에 확인
- **참가 현황 차트**: 해커톤별 참가 팀 수를 바 차트로 시각화
- **최근 본 해커톤**: 방문한 해커톤을 자동 추적하여 메인 페이지에 표시
- **제출 진행률 트래커**: 제출 양식 작성 진행률을 실시간으로 표시
- **재제출 기능**: 최종 제출 후에도 수정하여 다시 제출 가능
- **다크 모드**: 전체 페이지 다크 모드 지원 (FOUC 방지, 설정 유지)
- **브레드크럼 내비게이션**: 해커톤 상세 페이지에서 위치 파악 용이
- **글로벌 검색**: Ctrl+K / Cmd+K 키보드 단축키로 즉시 검색
- **그리드/리스트 보기**: 해커톤 목록 페이지에서 보기 모드 전환
- **CSV 내보내기**: 랭킹 데이터를 CSV 파일로 다운로드
- **링크 공유**: 해커톤 상세 페이지 URL을 클립보드에 복사
- **탭 카운트 배지**: 팀/리더보드 탭에 항목 수 표시
- **스크롤 투 탑**: 긴 페이지에서 맨 위로 빠르게 이동
- **스켈레톤 로딩**: 콘텐츠 로딩 시 스켈레톤 UI로 부드러운 전환
- **접근성**: Skip-to-content, ARIA, 키보드 내비게이션, 포커스 트랩, prefers-reduced-motion

## 주요 사용자 흐름

```
메인 페이지 → 해커톤 목록 → 해커톤 상세 → 팀 탭에서 팀 확인
                                        → 제출 탭에서 결과물 제출
                                        → 리더보드에서 순위 확인
           → 캠프에서 팀 생성/모집 (팀 검색 가능)
           → 랭킹에서 전체 순위 확인 (CSV 내보내기)
```

## 심사 포인트 매핑

| 심사 기준 | 배점 | 구현 내용 |
|---|---|---|
| **기본 구현** | 30% | 5개 페이지 + 8개 탭, 필터/정렬/검색, 빈 상태 UI, CRUD |
| **확장/아이디어** | 30% | 북마크, 다크모드, 통계차트, 최근본해커톤, 진행률바, 마감알림, 재제출, Ctrl+K검색, 그리드/리스트, CSV내보내기, 공유, 스켈레톤, 스크롤투탑, 토스트 |
| **완성도** | 25% | ErrorBoundary, try/catch, next/image, 접근성(aria-describedby, aria-invalid), 반응형, 키보드 내비게이션, 스켈레톤 로딩 |
| **문서화** | 15% | README, 프로젝트 구조, 데이터 구조, 사용자 흐름, 접근성 문서 |

## 페이지 구조

| 경로 | 페이지 | 설명 |
|---|---|---|
| `/` | 메인 | 히어로, 통계 대시보드, 참가현황 차트, 마감 임박 알림, 북마크, 최근 본 해커톤, 해커톤/팀/랭킹 프리뷰 |
| `/hackathons` | 해커톤 목록 | 필터링/정렬/검색, 그리드/리스트 보기 전환, 북마크 토글 |
| `/hackathons/:slug` | 해커톤 상세 | 8개 탭(카운트 배지), 진행률 바, 브레드크럼, 공유 버튼, 제출 폼, 리더보드 |
| `/camp` | 팀원 모집 | 팀 생성/조회/관리, 해커톤별 필터링, 팀명/포지션 검색 |
| `/rankings` | 글로벌 랭킹 | 기간별/해커톤별 필터, 컬럼 정렬, 페이지네이션, CSV 내보내기 |

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + CSS Custom Properties
- **Image**: next/image (최적화 이미지 로딩)
- **Data**: localStorage (JSON 시드 데이터 기반, 외부 DB/API 불필요)
- **Deployment**: Vercel

## 실행 방법

```bash
# 사전 요구사항: Node.js >= 18

# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버
npm start
```

> 최초 접속 시 `data/` 디렉토리의 JSON 시드 데이터가 자동으로 localStorage에 저장됩니다. 별도의 설정 없이 바로 모든 기능을 사용할 수 있습니다.

## 데이터 구조

모든 데이터는 `localStorage`에 저장되며, 최초 접속 시 `data/` 디렉토리의 JSON 파일로부터 자동 시드됩니다.

```
localStorage
├── batonhub_hackathons   ← 해커톤 목록 (3개 해커톤)
├── batonhub_details      ← 해커톤 상세 정보 (탭별 섹션 데이터)
├── batonhub_leaderboards ← 리더보드 데이터 (순위, 점수, 채점 내역)
├── batonhub_teams        ← 팀 모집 정보 (4개 팀, 해커톤별 연결)
├── batonhub_submissions  ← 사용자 제출물 (임시저장/최종제출)
├── batonhub_bookmarks    ← 북마크 목록
├── batonhub_recent       ← 최근 본 해커톤 (최대 5개)
└── batonhub_seeded       ← 시드 완료 플래그
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx          # 루트 레이아웃 (Navbar + Footer + ErrorBoundary + ScrollToTop)
│   ├── page.tsx            # 메인 페이지 (히어로, 통계, 차트, 알림, 프리뷰)
│   ├── globals.css         # 전역 스타일 + 다크 모드 + 애니메이션
│   ├── hackathons/         # 해커톤 관련 페이지 (목록 + 상세)
│   ├── camp/               # 팀 모집 페이지
│   └── rankings/           # 랭킹 페이지
├── components/ui/          # 재사용 UI 컴포넌트
│   ├── Navbar.tsx          # 네비게이션 바 (검색, Ctrl+K, 다크모드, 모바일 메뉴)
│   ├── Footer.tsx          # 푸터 (내비게이션 링크 포함)
│   ├── Modal.tsx           # 접근성 모달 (포커스 트랩)
│   ├── Toast.tsx           # aria-live 토스트 알림
│   ├── ErrorBoundary.tsx   # 에러 바운더리 (에러 로깅)
│   ├── StatusBadge.tsx     # 상태 배지 (진행중/예정/종료)
│   ├── EmptyState.tsx      # 빈 상태 UI (액션 버튼 포함)
│   ├── LoadingSpinner.tsx  # 로딩 스피너 (role="status")
│   ├── SkeletonLoader.tsx  # 스켈레톤 로딩 (카드, 테이블, 페이지)
│   └── ScrollToTop.tsx     # 맨 위로 스크롤 버튼
├── hooks/                  # 커스텀 훅
│   └── useSeedData.ts      # 데이터 시드 + 준비 상태 관리
├── lib/                    # 유틸리티
│   ├── storage.ts          # localStorage CRUD (try/catch, 최근 본 기능 포함)
│   └── utils.ts            # 포맷팅, URL 검증, D-day 계산
├── types/                  # TypeScript 타입 정의
└── data/                   # 시드 JSON 데이터
```

## 접근성

- Skip-to-content 링크 (`Tab` 키로 접근)
- 시맨틱 HTML (`<nav>`, `<main>`, `<footer>`, `<table>`)
- ARIA 속성 (`aria-label`, `aria-required`, `aria-pressed`, `aria-selected`, `aria-live`, `aria-hidden`, `aria-describedby`, `aria-invalid`, `aria-expanded`)
- 키보드 내비게이션 (Tab, Arrow keys, Escape, Ctrl+K)
- 모달 포커스 트랩 (Shift+Tab 순환)
- `prefers-reduced-motion` 지원 (애니메이션 비활성화)
- `:focus-visible` 아웃라인 (키보드 사용자용)
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 브레드크럼 내비게이션 (해커톤 상세 페이지)
- 폼 유효성 검증 피드백 (`aria-invalid`, `aria-describedby`, `role="alert"`)

## 키보드 단축키

| 단축키 | 기능 |
|---|---|
| `Ctrl+K` / `Cmd+K` | 글로벌 검색 열기/닫기 |
| `Escape` | 검색 닫기, 모달 닫기 |
| `Tab` / `Shift+Tab` | 요소 간 이동 (모달 내 포커스 트랩) |
| `←` / `→` | 해커톤 상세 탭 전환 |

## 라이선스

DACON 월간 해커톤 출품작
