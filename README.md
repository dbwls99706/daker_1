# BatonHub - 해커톤 통합 대시보드

DACON 월간 해커톤 "긴급 인수인계 해커톤" 출품작

---

## 서비스 소개

**BatonHub**은 해커톤 탐색, 팀 빌딩, 결과 제출, 랭킹 확인을 하나의 플랫폼에서 관리할 수 있는 **해커톤 통합 대시보드**입니다.

> **실행 요구사항**: Node.js 18 이상. 외부 API 키나 환경 변수 **없이** 바로 실행 가능합니다.

### 핵심 가치

- **원스톱 해커톤 관리**: 탐색 → 팀 빌딩 → 제출 → 랭킹까지 한 곳에서
- **실시간 정보**: 초 단위 카운트다운, 마감 알림, 통계 대시보드
- **접근성 우선**: WCAG AA 준수, 키보드 네비게이션, 스크린리더 지원, 다크모드

---

## 주요 사용자 흐름

```
[메인 페이지] ──→ [해커톤 목록] ──→ [해커톤 상세]
   │                (필터/검색)        ├─ 개요/평가/일정/상금/안내 탭
   │                                   ├─ 팀 탭 → 팀 확인 → 캠프 이동
   │                                   ├─ 제출 탭 → 드래그&드롭 업로드
   │                                   └─ 리더보드 → 순위 확인
   │
   ├──→ [캠프] ──→ 팀 생성/검색 → AI 팀 매칭 추천
   │
   └──→ [랭킹] ──→ 점수 분포 차트 + CSV 내보내기
```

---

## 심사 포인트 매핑

| 심사 기준 | 배점 | 구현 내용 |
|---|---|---|
| **기본 구현** | 30% | 5개 페이지 + 8개 탭 완전 구현, 필터/정렬/검색/뷰 토글, 빈 상태 UI (5종 SVG 아이콘), CRUD, localStorage 시드 |
| **확장/아이디어** | 30% | 실시간 카운트다운(긴급도 색상변화), SVG 차트(도넛+바), AI 팀 매칭, 드래그&드롭 업로드(10MB 제한), 알림 센터, 북마크, 다크모드, 통계 대시보드, CSV 내보내기, 온보딩, 링크 공유, 스켈레톤 로딩, 키보드 단축키, URL 상태 동기화, 스크롤 진행률 표시 |
| **완성도** | 25% | error.tsx/loading.tsx/not-found.tsx, ErrorBoundary, 입력 검증(URL/파일크기/팀인원), XSS 방지(sanitizeUrl), 접근성(ARIA/포커스트랩/skip-link), 반응형(모바일/태블릿/데스크톱), WCAG AA 명도 대비, prefers-reduced-motion, useMemo/useCallback 최적화, 스티키 필터바 |
| **문서화** | 15% | README(구조/흐름/접근성/에러처리), 테스트 70개 통과, 원클릭 실행, 재현 가능성 |

---

## 기본 구현 상세

### 페이지 구조

| 경로 | 페이지 | 주요 기능 |
|---|---|---|
| `/` | 메인 | 히어로, 통계 대시보드(도넛 차트), 실시간 카운트다운, 마감 알림, 참가 현황 차트, 북마크, 최근 본, 프리뷰 |
| `/hackathons` | 해커톤 목록 | 상태/태그/키워드 필터, 최신/마감임박 정렬, 그리드/리스트 뷰, 북마크, 진행률 바, URL 필터 동기화 |
| `/hackathons/:slug` | 해커톤 상세 | 8개 탭(아이콘 포함), 실시간 카운트다운, 브레드크럼, 공유, 드래그&드롭 제출, URL 탭 동기화 |
| `/camp` | 팀원 모집 | 팀 CRUD, 해커톤별 필터(상태 표시), 검색/정렬, AI 팀 매칭 추천, 인원 제한(5명), 페이지 번호 |
| `/rankings` | 글로벌 랭킹 | 기간/해커톤 필터, 컬럼 정렬, 점수 분포 바 차트, 포디움, CSV 내보내기, 점수 바, 페이지 번호 |

### 필터/정렬 기능

- **해커톤 목록**: 상태(전체/진행중/예정/종료) + 태그 + 키워드 + 정렬(최신/마감임박) + 활성 필터 카운트 + 초기화
- **캠프**: 해커톤별 필터(상태 뱃지 포함) + 팀명/포지션 검색 + 정렬(최신/팀명/인원)
- **랭킹**: 기간(전체/월별/연도별) + 해커톤별 + 컬럼 정렬(순위/팀명/점수/참가횟수)

### 빈 상태 UI

5종의 SVG 아이콘으로 맥락에 맞는 빈 상태를 표시합니다:
- `search`: 검색 결과 없음
- `team`: 팀 없음
- `trophy`: 랭킹 데이터 없음
- `document`: 문서/제출 없음
- `inbox`: 기본 빈 상태

---

## 확장 기능 상세 (16+ 고유 기능)

| 기능 | 설명 |
|---|---|
| **실시간 카운트다운** | 초 단위 D-Day 타이머, 긴급도에 따라 색상 자동 변화 (초록→노랑→빨강), 24시간 이내 펄스 효과 |
| **통계 시각화** | SVG 도넛 차트(해커톤/팀 현황), 바 차트(점수 분포), 참가 현황 프로그레스 바, 스크린리더 대응 |
| **AI 팀 매칭** | 10가지 역할 기반 매칭률 계산, 상위 5팀 추천, 매칭 포지션 하이라이트 |
| **드래그&드롭 업로드** | PDF 등 파일 드래그 업로드, 10MB 크기 제한, 에러 상태 표시, 키보드 접근 가능 |
| **알림 센터** | 마감 임박(14일), 미완료 제출물, 팀 모집 알림, 읽음 상태 관리 |
| **다크 모드** | 전체 UI 다크 모드, View Transitions API, FOUC 방지, WCAG AA 명도 대비 |
| **URL 상태 동기화** | 필터/탭 상태가 URL에 반영 → 공유 가능한 링크 생성 |
| **키보드 단축키** | Ctrl+K 검색, ? 도움말, ←→ 탭 이동, Home/End 첫/끝 탭 |
| **스크롤 진행률** | ScrollToTop 버튼에 원형 프로그레스 링 표시 |
| **북마크** | 해커톤 즐겨찾기, 메인 페이지 북마크 섹션 |
| **CSV 내보내기** | 랭킹 데이터를 CSV로 다운로드 (BOM 포함, Excel 호환) |
| **온보딩 배너** | 첫 방문 시 4단계 서비스 안내, 닫기 가능 |
| **토스트 알림** | 4종 타입(성공/정보/경고/에러), 자동 해제 프로그레스 바 |
| **스켈레톤 로딩** | 모든 페이지 스켈레톤 UI, Suspense 기반 |
| **마감 임박 배너** | D-7 이내 해커톤 긴급 안내, 펄스 글로우 효과 |
| **최근 본 해커톤** | 최대 5개 최근 조회 해커톤 추적 |

---

## 완성도 상세

### 에러 처리 전략

| 계층 | 구현 |
|---|---|
| **전역 에러** | `error.tsx` - 런타임 에러 자동 포착, 재시도/새로고침 버튼 제공 |
| **전역 로딩** | `loading.tsx` - 루트 레벨 로딩 스피너 |
| **404** | `not-found.tsx` - 다중 네비게이션 링크(홈/해커톤/캠프) |
| **React 에러** | `ErrorBoundary` 컴포넌트 - 렌더링 에러 격리 |
| **Storage** | try/catch + QuotaExceeded 자동 정리 (최근 본 항목 삭제) |
| **입력 검증** | URL 형식 검증, 파일 크기 제한(10MB), 팀 인원 제한(5명), 텍스트 길이 제한 |
| **보안** | sanitizeUrl(XSS 방지), sanitizeText(HTML 이스케이프), noopener/noreferrer |

### 접근성 (A11y)

- **구조**: Skip-to-content 링크, 시맨틱 HTML(`<nav>`, `<main>`, `<footer>`, `<table>`)
- **ARIA**: aria-label, aria-required, aria-pressed, aria-selected, aria-live, aria-hidden, aria-describedby, aria-invalid, aria-expanded, aria-sort, role="tablist/tab/tabpanel/figure/timer/progressbar/alert/dialog/list/listitem"
- **키보드**: Tab/Shift+Tab, Arrow keys, Escape, Ctrl+K, Home/End, 모달 포커스 트랩
- **시각**: focus-visible 아웃라인, WCAG AA 명도 대비, 다크모드, prefers-reduced-motion
- **차트**: 스크린리더용 sr-only 텍스트 설명, role="figure", 범례 role="list"
- **반응형**: 모바일(375px) → 태블릿(768px) → 데스크톱(1440px)

### 성능 최적화

- `useMemo`/`useCallback` 모든 계산/핸들러 메모이제이션
- `React.memo` 카운트다운 타이머 (초당 리렌더 격리)
- `IntersectionObserver` 스크롤 기반 지연 애니메이션
- `Suspense` 비동기 컴포넌트 코드 스플리팅
- 스켈레톤 로더로 레이아웃 시프트 방지
- 디바운스 드래프트 자동저장 (1초)

---

## 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (Strict) |
| Styling | Tailwind CSS 4 + CSS Custom Properties |
| Font | Pretendard Variable (한글 최적화) |
| Data | localStorage (JSON seed, 버전 관리) |
| Testing | Vitest + @testing-library/react (70 tests) |
| Deployment | Vercel |

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:3000)
npm run dev

# 프로덕션 빌드 확인
npm run build

# 테스트 실행
npm run test

# 프로덕션 서버
npm start
```

> 최초 접속 시 `data/` 디렉토리의 JSON 시드 데이터가 자동으로 localStorage에 저장됩니다.
> 데이터 초기화: 푸터의 저작권 텍스트를 5번 빠르게 클릭하면 초기화 모달이 표시됩니다.

### 검증 체크리스트

- [ ] `npm run dev` 후 http://localhost:3000 접속
- [ ] 메인 페이지: 카운트다운 실시간 작동, 도넛 차트 표시
- [ ] 해커톤 목록: 필터(진행중/예정/종료) 전환, 키워드 검색
- [ ] 해커톤 상세: 8개 탭 전환 (← → 키보드), URL ?tab= 변경 확인
- [ ] 캠프: 팀 생성 → AI 팀 매칭 → 참여하기
- [ ] 랭킹: 기간 필터 전환, CSV 내보내기 버튼
- [ ] 다크 모드: 우상단 토글 클릭
- [ ] 모바일: 브라우저 너비 375px에서 확인
- [ ] 키보드: Tab 이동, Ctrl+K 검색, ? 단축키 도움말

---

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (Navbar + Footer + ErrorBoundary)
│   ├── page.tsx                # 메인 (히어로, 통계, 차트, 카운트다운)
│   ├── globals.css             # 전역 스타일 + 다크 모드 + 20+ 애니메이션
│   ├── error.tsx               # 전역 에러 바운더리
│   ├── loading.tsx             # 전역 로딩 상태
│   ├── not-found.tsx           # 404 페이지
│   ├── hackathons/             # 해커톤 (목록 + 상세)
│   ├── camp/                   # 팀 모집 + AI 매칭
│   └── rankings/               # 랭킹 + 점수 분포 차트
├── components/
│   ├── ui/                     # 범용 UI (Navbar, Modal, Toast, StatusBadge, EmptyState...)
│   └── features/               # 기능 컴포넌트
│       ├── CountdownTimer      # 실시간 D-Day 카운트다운 (긴급도 색상)
│       ├── DonutChart          # SVG 도넛 차트 (접근성 지원)
│       ├── BarChart            # SVG 바 차트 (접근성 지원)
│       ├── TeamMatcher         # AI 팀 매칭 추천
│       ├── DragDropZone        # 드래그&드롭 파일 업로드 (에러 처리)
│       ├── NotificationCenter  # 알림 센터
│       ├── SubmitTab           # 제출 탭
│       └── tabs/               # 해커톤 상세 탭 컴포넌트 (7개)
├── hooks/                      # 커스텀 훅 (useSeedData, useCountUp, useCountdown)
├── lib/                        # 유틸리티 (storage.ts, utils.ts)
├── types/                      # TypeScript 타입 정의
├── data/                       # 시드 JSON 데이터
└── __tests__/                  # 테스트 (70개)
```

## 데이터 구조

```
localStorage
├── batonhub_hackathons     ← 해커톤 목록 (3개)
├── batonhub_details        ← 해커톤 상세 (8개 탭 섹션)
├── batonhub_leaderboards   ← 리더보드 (순위, 점수, 아티팩트)
├── batonhub_teams          ← 팀 모집 (4개 초기 팀, CRUD)
├── batonhub_submissions    ← 사용자 제출물 (draft/submitted)
├── batonhub_bookmarks      ← 북마크 해커톤
├── batonhub_recent         ← 최근 본 해커톤 (최대 5개)
├── batonhub_my_teams       ← 내가 만든 팀
├── batonhub_joined_teams   ← 참여한 팀
├── batonhub_notif_read     ← 읽은 알림
├── batonhub_dark           ← 다크 모드 설정
├── batonhub_onboarded      ← 온보딩 완료 플래그
└── batonhub_seeded         ← 시드 버전 플래그
```

## 키보드 단축키

| 단축키 | 기능 |
|---|---|
| `Ctrl+K` / `Cmd+K` | 글로벌 검색 열기/닫기 |
| `Escape` | 검색/모달 닫기 |
| `Tab` / `Shift+Tab` | 요소 간 이동 |
| `←` / `→` | 해커톤 상세 탭 전환 |
| `Home` / `End` | 첫 번째/마지막 탭 |
| `?` | 키보드 단축키 도움말 |

---

## 라이선스

DACON 월간 해커톤 출품작. MIT License.
