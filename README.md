# BatonHub - 해커톤 통합 대시보드

DACON 월간 해커톤 "긴급 인수인계 해커톤" 출품작

## 서비스 소개

BatonHub은 해커톤 탐색, 팀 빌딩, 결과 제출, 랭킹 확인을 하나의 플랫폼에서 관리할 수 있는 해커톤 통합 대시보드입니다.

> **환경 요구사항**: Node.js 18 이상 필요. 외부 API 키나 환경 변수 없이 바로 실행 가능합니다.

### 핵심 기능

**기본 구현**
- **해커톤 목록 & 상세**: 필터(상태/태그/키워드), 정렬(최신/마감임박), 그리드/리스트 뷰, 북마크
- **팀원 모집 (캠프)**: 팀 생성/검색/필터/삭제, 해커톤별 필터링
- **결과물 제출**: 단계별 제출 양식, 임시저장/재제출, URL 유효성 검증
- **글로벌 랭킹**: 교차 해커톤 통합 랭킹, 기간별/해커톤별 필터, 컬럼 정렬, 페이지네이션

**확장 기능 (차별화 요소)**
- **실시간 카운트다운 타이머**: 초 단위 D-Day 타이머로 마감 시간 실시간 확인 (메인 + 상세 페이지)
- **통계 시각화 대시보드**: SVG 도넛 차트(해커톤/팀 현황), 바 차트(점수 분포), 참가 현황 차트
- **AI 팀 매칭 추천**: 역할 기반 팀 추천 시스템 - 내 스킬과 모집 포지션 매칭률 표시
- **드래그 & 드롭 파일 업로드**: 제출 탭에서 PDF 등 파일을 드래그하여 업로드
- **알림 센터**: 마감 임박 알림, 미완료 제출물, 팀 모집 알림을 벨 아이콘으로 확인
- **다크 모드**: 전체 페이지 다크 모드 지원 (WCAG AA 명도 대비 검증, FOUC 방지)
- **키보드 단축키**: Ctrl+K 검색, ? 도움말, 탭 화살표 탐색
- **북마크 시스템**: 관심 해커톤 즐겨찾기
- **마감 임박 알림 배너**: D-7 이내 해커톤 긴급 안내
- **CSV 내보내기**: 랭킹 데이터 다운로드
- **링크 공유**: 해커톤 상세 URL 클립보드 복사
- **스켈레톤 로딩**: 모든 페이지 스켈레톤 UI
- **온보딩 배너**: 첫 방문 시 서비스 안내
- **데이터 초기화**: 푸터에서 원클릭 리셋

## 주요 사용자 흐름

```
메인 페이지 → 해커톤 목록 → 해커톤 상세 → 팀 탭에서 팀 확인
              (필터/검색)   (8개 탭)       → 제출 탭에서 결과물 제출 (드래그&드롭)
                                           → 리더보드에서 순위 확인
           → 캠프에서 팀 생성/모집 → AI 팀 매칭으로 나에게 맞는 팀 찾기
           → 랭킹에서 전체 순위 확인 (점수 분포 차트 + CSV 내보내기)
```

## 심사 포인트 매핑

| 심사 기준 | 배점 | 구현 내용 |
|---|---|---|
| **기본 구현** | 30% | 5개 페이지 + 8개 탭, 필터/정렬/검색, 빈 상태 UI, CRUD, localStorage 시드 |
| **확장/아이디어** | 30% | 실시간 카운트다운, SVG 차트(도넛+바), AI 팀 매칭, 드래그&드롭 업로드, 알림 센터, 북마크, 다크모드, 통계 대시보드, CSV 내보내기, 온보딩, 링크 공유, 스켈레톤, 키보드 단축키 |
| **완성도** | 25% | ErrorBoundary, try/catch, 접근성(ARIA, 포커스 트랩, skip-link), 반응형, prefers-reduced-motion, useMemo 최적화, 입력 검증, XSS 방지(sanitizeUrl) |
| **문서화** | 15% | README, 프로젝트 구조, 데이터 구조, 사용자 흐름, 접근성 문서, 심사 매핑 |

## 페이지 구조

| 경로 | 페이지 | 주요 기능 |
|---|---|---|
| `/` | 메인 | 히어로, 통계 대시보드(도넛 차트), **실시간 카운트다운**, 마감 알림, 참가 현황 차트, 북마크, 최근 본, 프리뷰 |
| `/hackathons` | 해커톤 목록 | 상태/태그/키워드 필터, 최신/마감임박 정렬, 그리드/리스트 뷰, 북마크, 진행률 바 |
| `/hackathons/:slug` | 해커톤 상세 | 8개 탭, **실시간 카운트다운**, 브레드크럼, 공유, **드래그&드롭 제출**, 리더보드 |
| `/camp` | 팀원 모집 | 팀 CRUD, 해커톤별 필터, 검색/정렬, **AI 팀 매칭 추천** |
| `/rankings` | 글로벌 랭킹 | 기간/해커톤 필터, 컬럼 정렬, **점수 분포 바 차트**, 포디움, CSV, 페이지네이션 |

## 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (Strict) |
| Styling | Tailwind CSS 4 + CSS Custom Properties |
| Font | Pretendard Variable |
| Data | localStorage (JSON seed) |
| Deployment | Vercel |

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

> 최초 접속 시 `data/` 디렉토리의 JSON 시드 데이터가 자동으로 localStorage에 저장됩니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx          # 루트 레이아웃 (Navbar + Footer + ErrorBoundary)
│   ├── page.tsx            # 메인 페이지 (히어로, 통계, 차트, 카운트다운)
│   ├── globals.css         # 전역 스타일 + 다크 모드 + 애니메이션
│   ├── hackathons/         # 해커톤 (목록 + 상세)
│   ├── camp/               # 팀 모집 + AI 매칭
│   └── rankings/           # 랭킹 + 점수 분포 차트
├── components/
│   ├── ui/                 # 범용 UI (Navbar, Modal, Toast, StatusBadge...)
│   └── features/           # 기능 컴포넌트
│       ├── CountdownTimer  # 실시간 D-Day 카운트다운
│       ├── DonutChart      # SVG 도넛 차트
│       ├── BarChart        # SVG 바 차트
│       ├── TeamMatcher     # AI 팀 매칭 추천
│       ├── DragDropZone    # 드래그&드롭 파일 업로드
│       ├── NotificationCenter # 알림 센터
│       └── SubmitTab       # 제출 탭
├── hooks/                  # 커스텀 훅 (useSeedData, useCountUp, useCountdown)
├── lib/                    # 유틸리티 (storage.ts, utils.ts)
├── types/                  # TypeScript 타입 정의
└── data/                   # 시드 JSON 데이터
```

## 데이터 구조

```
localStorage
├── batonhub_hackathons   ← 해커톤 목록 (3개)
├── batonhub_details      ← 해커톤 상세 (탭별 섹션)
├── batonhub_leaderboards ← 리더보드 (순위, 점수)
├── batonhub_teams        ← 팀 모집 (4개 팀)
├── batonhub_submissions  ← 사용자 제출물
├── batonhub_bookmarks    ← 북마크
├── batonhub_recent       ← 최근 본 해커톤
├── batonhub_notif_read   ← 읽은 알림 목록
└── batonhub_seeded       ← 시드 완료 플래그
```

## 접근성 (A11y)

- Skip-to-content 링크
- 시맨틱 HTML (`<nav>`, `<main>`, `<footer>`, `<table>`)
- ARIA 속성 (`aria-label`, `aria-required`, `aria-pressed`, `aria-selected`, `aria-live`, `aria-hidden`, `aria-describedby`, `aria-invalid`, `aria-expanded`, `aria-sort`, `role="tablist"`, `role="timer"`)
- 키보드 내비게이션 (Tab, Arrow keys, Escape, Ctrl+K)
- 모달 포커스 트랩 (Shift+Tab 순환)
- `prefers-reduced-motion` 지원
- `:focus-visible` 아웃라인
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 폼 유효성 검증 피드백 (`aria-invalid`, `role="alert"`)

## 키보드 단축키

| 단축키 | 기능 |
|---|---|
| `Ctrl+K` / `Cmd+K` | 글로벌 검색 열기/닫기 |
| `Escape` | 검색/모달 닫기 |
| `Tab` / `Shift+Tab` | 요소 간 이동 |
| `←` / `→` | 해커톤 상세 탭 전환 |
| `?` | 키보드 단축키 도움말 |

## 라이선스

DACON 월간 해커톤 출품작. MIT License.
