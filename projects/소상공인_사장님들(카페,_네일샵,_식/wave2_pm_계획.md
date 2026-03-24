# PM 계획 — 소상공인 인스타그램 자동화 서비스 (MVP Phase 1.0)

> 개발자가 바로 실행 가능한 구체적 태스크 분해 문서

---

## User Stories

| ID | As a... | I want to... | So that... | 우선순위 | 수락 기준 |
|----|---------|-------------|------------|---------|-----------|
| US-01 | 소상공인 사장님 | 이메일로 회원가입하고 로그인할 수 있다 | 서비스를 사용할 수 있다 | Must | Supabase Auth로 회원가입/로그인 성공, 세션 유지, `/home`으로 리다이렉트 |
| US-02 | 신규 가입 사장님 | 가게 정보(이름, 분위기 키워드 3개, 대표 메뉴 3개)를 입력할 수 있다 | AI가 우리 가게 맞춤 콘텐츠를 만들 수 있다 | Must | `/onboarding/shop`에서 폼 입력 후 Shop 레코드 생성, Subscription 레코드 자동 생성(TRIAL, +14일), `/home`으로 이동 |
| US-03 | 가입 완료 사장님 | 매일 오전 8시에 자동으로 생성된 인스타 콘텐츠(이미지+캡션)를 볼 수 있다 | 콘텐츠를 직접 만들 시간을 절약한다 | Must | Cron Job(UTC 23:00)이 `POST /api/content/generate` 호출, DALL-E 이미지 + GPT-4o 캡션 생성, Supabase Storage 저장, 이메일 발송, Content 레코드 생성 |
| US-04 | 사장님 | `/home`에서 오늘의 콘텐츠 미리보기(이미지+캡션)를 보고 복사/다운로드 버튼을 클릭한다 | 인스타 앱에서 수동으로 붙여넣기 후 발행한다 | Must | 캡션 복사 버튼 클릭 시 클립보드 복사, 이미지 다운로드 버튼 클릭 시 PNG 원본 다운로드, Content.status=PUBLISHED 업데이트 |
| US-05 | 사장님 | 생성된 캡션 텍스트를 직접 수정할 수 있다 | 우리 가게 목소리에 맞게 튜닝한다 | Must | CaptionEditor 컴포넌트에서 textarea 수정 후 저장 버튼 클릭, `PATCH /api/content/[contentId]` 호출, Content.editedCaption 업데이트 |
| US-06 | 사장님 | 생성된 이미지가 마음에 안 들면 재생성 버튼을 누른다 | 더 나은 이미지를 얻는다 | Must | 재생성 버튼 클릭 → `POST /api/content/regenerate` → DALL-E 재호출 → 남은 횟수 표시(BASIC 3회/일, PRO 10회/일), Content.regenerateCount++, 횟수 초과 시 토스트 메시지 |
| US-07 | 사장님 | 캡션이 마음에 안 들면 재생성 버튼을 누른다 | 더 나은 캡션을 얻는다 | Must | 재생성 버튼 클릭 → `POST /api/content/regenerate` → GPT-4o 재호출, Content.regenerateCount++, 횟수 제한 체크 |
| US-08 | 사장님 | 과거 발행한 콘텐츠 리스트를 날짜별로 확인한다 | 어떤 콘텐츠를 올렸는지 기록을 본다 | Must | `/history` 페이지에서 `GET /api/history` 호출, Content 리스트 표시(최신순, 페이지네이션 20개), contentDate + imageUrl + caption + status |
| US-09 | 사장님 | 무료 체험 종료 7일 전에 이메일 알림을 받는다 | 구독 결제를 결정할 시간이 있다 | Must | Cron Job에서 체험 종료 7일 전 사용자 체크, Resend로 이메일 발송 |
| US-10 | 사장님 | 무료 체험 종료 후 결제 페이지에서 BASIC 플랜(월 19,900원)을 선택하고 토스페이먼츠로 결제한다 | 계속 서비스를 이용한다 | Must | `/settings` → 구독 관리 → 플랜 선택 → 토스 결제창 → `POST /api/payment/confirm` → Subscription.status=ACTIVE, tossBillingKey 저장 |
| US-11 | 사장님 | 네이버 플레이스 리뷰 URL을 입력하면 체험 기간이 7일 연장된다 | 더 오래 무료로 써본다 | Should | `/settings` → 리뷰 연장 버튼 → URL 입력 모달 → `POST /api/trial/extend` → Subscription.trialExtended=true, trialEndAt+7일 |
| US-12 | 개발자/관리자 | Cron Job 실패 시 에러 로그를 Sentry에서 확인한다 | 장애를 빠르게 파악한다 | Should | Sentry SDK 설치, Cron Job try-catch 블록에서 captureException 호출 |
| US-13 | 사장님 | 랜딩 페이지에서 서비스 소개와 가격 정책을 본다 | 서비스를 이해하고 가입을 결정한다 | Must | `/landing` 페이지 — Hero, Features, Pricing 섹션, "14일 무료 체험" CTA 버튼 → `/signup` |
| US-14 | 사장님 | `/settings`에서 가게 정보(키워드, 메뉴)를 수정한다 | AI 생성 방향을 조정한다 | Should | 가게 정보 폼 표시 + `PATCH /api/settings/shop` → Shop 레코드 업데이트 |
| US-15 | 사장님 | 구독을 취소한다 | 자동 결제를 중단한다 | Should | `/settings` → 구독 취소 버튼 → `POST /api/subscription/cancel` → Subscription.status=CANCELED |

---

## 화면 목록 + 라우트

| 화면명 | 라우트 | 설명 | 인증 필요 | 비고 |
|--------|--------|------|-----------|------|
| 랜딩 페이지 | `/landing` | 서비스 소개 + 가격 + CTA | 아니오 | 공개 페이지 |
| 로그인 | `/login` | Supabase Auth 이메일 로그인 | 아니오 | - |
| 회원가입 | `/signup` | Supabase Auth 이메일 회원가입 | 아니오 | - |
| 온보딩 (가게 정보) | `/onboarding/shop` | 가게 이름, 분위기 키워드, 대표 메뉴 입력 | 예 | 신규 가입 후 최초 1회 |
| 온보딩 (인스타 연동) | `/onboarding/instagram` | Instagram OAuth (Phase 1.1용, 지금은 "나중에 연동" 버튼만) | 예 | Phase 1.0에서는 스킵 가능 |
| 대시보드 홈 | `/(dashboard)/home` | 오늘의 콘텐츠 카드(이미지+캡션), 복사/다운로드, 재생성 | 예 | 메인 화면 |
| 발행 히스토리 | `/(dashboard)/history` | 과거 콘텐츠 리스트 (날짜+이미지+캡션) | 예 | 페이지네이션 |
| 설정 | `/(dashboard)/settings` | 가게 정보 수정, 구독 관리, 리뷰 연장 | 예 | 탭 UI |

---

## API 엔드포인트

| Method | Path | 설명 | 인증 | Request Body | Response |
|--------|------|------|------|-------------|----------|
| POST | `/api/onboarding` | 가게 정보 저장 (Shop + Subscription 생성) | 예 | `{ name, industry, vibeKeywords[], representMenus[] }` | `{ success, shopId }` |
| GET | `/api/content/generate` | 오늘의 콘텐츠 생성 (SSE 스트리밍) | 예(Cron Secret) | - | SSE: `data: {step, message, imageUrl?, caption?}` |
| POST | `/api/content/regenerate` | 이미지 or 캡션 재생성 | 예 | `{ contentId, type: "image" or "caption" }` | `{ success, imageUrl?, caption?, regenerateCount }` |
| GET | `/api/content/[contentId]` | 특정 콘텐츠 조회 | 예 | - | `{ id, caption, imageUrl, ... }` |
| PATCH | `/api/content/[contentId]` | 캡션 편집 저장 | 예 | `{ editedCaption }` | `{ success }` |
| POST | `/api/content/[contentId]/download` | 다운로드 트래킹 (status=PUBLISHED) | 예 | - | `{ success }` |
| GET | `/api/history` | 발행 히스토리 조회 | 예 | query: `?page=1&limit=20` | `{ contents[], total }` |
| POST | `/api/trial/extend` | 리뷰 URL 인증 후 체험 연장 | 예 | `{ reviewUrl }` | `{ success, newTrialEndAt }` |
| POST | `/api/payment/confirm` | 토스 결제 확인 (빌링키 저장) | 예 | `{ paymentKey, orderId, amount }` | `{ success }` |
| POST | `/api/payment/webhook` | 토스 웹훅 (정기 결제 성공/실패) | Webhook Sig | 토스 웹훅 payload | `{ received: true }` |
| GET | `/api/cron/generate-daily` | 매일 콘텐츠 생성 (Cron Job) | CRON_SECRET | - | `{ success, generated: N }` |
| GET | `/api/cron/publish-scheduled` | 예약 발행 실행 (Phase 1.1) | CRON_SECRET | - | `{ success }` |
| PATCH | `/api/settings/shop` | 가게 정보 수정 | 예 | `{ name?, vibeKeywords?, representMenus? }` | `{ success }` |
| POST | `/api/subscription/cancel` | 구독 취소 | 예 | - | `{ success }` |

---

## 개발 태스크 (우선순위 순)

### Week 1: 기반 인프라 + 인증 + 온보딩

#### Backend
1. **프로젝트 초기 설정** (4시간)
   - `npx create-next-app@latest instauto --typescript --tailwind --app --src-dir --no`
   - Supabase 프로젝트 생성 (PostgreSQL + Auth + Storage)
   - Prisma 설치 + `schema.prisma` 작성 (User, Shop, Subscription, Content, Payment)
   - `prisma migrate dev` 실행
   - 환경변수 세팅 (`.env.local` — DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY 등)

2. **Supabase Auth 설정** (3시간)
   - `lib/supabase/client.ts`, `lib/supabase/server.ts` 작성
   - `middleware.ts` 작성 (비로그인 사용자 `/login`으로 리다이렉트, `/landing`, `/login`, `/signup`은 제외)
   - `app/api/auth/callback/route.ts` 작성 (OAuth 콜백 처리)

3. **온보딩 API** (4시간)
   - `POST /api/onboarding` 구현
     - Zod 스키마: `{ name: z.string().min(1), industry: z.literal("cafe"), vibeKeywords: z.array(z.string()).length(3), representMenus: z.array(z.string()).min(1).max(3) }`
     - Prisma로 Shop 생성 (userId = Supabase Auth UID)
     - Subscription 생성 (status=TRIAL, trialStartAt=now(), trialEndAt=now()+14일)
     - 에러 핸들링 (중복 가입, 유효성 검증)

#### Frontend
4. **UI 컴포넌트 설치** (2시간)
   - shadcn/ui 설치: `npx shadcn-ui@latest init`
   - 필요 컴포넌트 설치: `button`, `input`, `card`, `badge`, `textarea`, `toast`, `select`, `dialog`

5. **인증 페이지** (4시간)
   - `/login/page.tsx`: 이메일/비밀번호 폼 + Supabase Auth signInWithPassword
   - `/signup/page.tsx`: 회원가입 폼 + Supabase Auth signUp
   - React Hook Form + Zod 적용

6. **온보딩 화면** (6시간)
   - `/onboarding/shop/page.tsx`: 가게 정보 입력 폼 (이름, 키워드 3개 input, 메뉴 3개 input)
   - `components/onboarding/ShopForm.tsx`: React Hook Form + Zod, `POST /api/onboarding` 호출 후 `/home` 리다이렉트
   - `/onboarding/instagram/page.tsx`: "나중에 연동하기" 버튼만 표시 (Phase 1.1 대비 빈 페이지)

7. **랜딩 페이지** (6시간)
   - `/landing/page.tsx` 구현
   - `components/landing/Hero.tsx`: 메인 헤드라인 + "14일 무료 체험" CTA 버튼
   - `components/landing/Features.tsx`: 3개 기능 소개 카드
   - `components/landing/Pricing.tsx`: BASIC/PRO 플랜 가격표

---

### Week 2: AI 콘텐츠 생성 + 대시보드

#### Backend
8. **OpenAI 통합 라이브러리** (4시간)
   - `lib/openai/generateCaption.ts`: GPT-4o로 캡션 생성
     - 프롬프트: Shop 정보(name, vibeKeywords, representMenus) 기반 인스타 캡션 생성
     - 해시태그 10개 포함, 줄바꿈 포함, 200자 이내
   - `lib/openai/generateImage.ts`: DALL-E 3로 이미지 생성
     - 프롬프트: Shop 키워드 기반 "감성 카페 인테리어" 이미지 (1024x1024, PNG)

9. **이미지 저장 로직** (4시간)
   - Supabase Storage 버킷 생성 (`content-images`)
   - Sharp 라이브러리로 WebP 썸네일 생성 (800x800)
   - 원본 PNG + WebP 썸네일 둘 다 업로드
   - Public URL 반환

10. **콘텐츠 생성 API (SSE)** (8시간)
    - `GET /api/content/generate` 구현 (Edge Runtime)
    - SSE 스트리밍:
      1. `{ step: "generating_caption", message: "캡션 생성 중..." }`
      2. GPT-4o 호출 → `{ step: "caption_done", caption }`
      3. `{ step: "generating_image", message: "이미지 생성 중..." }`
      4. DALL-E 호출 → Supabase Storage 업로드 → `{ step: "image_done", imageUrl, thumbnailUrl }`
      5. `{ step: "complete" }`
    - Content 레코드 생성 (contentDate=오늘, status=PENDING)
    - 에러 처리 (OpenAI 429, 500 등)

11. **재생성 API** (4시간)
    - `POST /api/content/regenerate` 구현
    - body: `{ contentId, type: "image" | "caption" }`
    - 재생성 횟수 체크 (Subscription.plan에 따라 BASIC 3회/PRO 10회)
    - 초과 시 `{ error: "regenerate_limit_exceeded", limit: N }` 리턴
    - 성공 시 Content.regenerateCount++, lastRegenerateAt 업데이트

12. **히스토리 API** (2시간)
    - `GET /api/history` 구현
    - query: `?page=1&limit=20`
    - Prisma: `findMany({ where: { userId }, orderBy: { contentDate: 'desc' }, skip, take })`
    - 페이지네이션 메타데이터 포함

#### Frontend
13. **대시보드 레이아웃** (3시간)
    - `app/(dashboard)/layout.tsx`: 사이드바 + 네비게이션 바
    - `components/common/Navbar.tsx`: 로고 + 남은 체험 일수 배지 + 프로필 드롭다운

14. **홈 페이지 (오늘의 콘텐츠)** (8시간)
    - `/(dashboard)/home/page.tsx`
    - SSE 연결: `GET /api/content/generate` (페이지 로드 시 오늘 콘텐츠 없으면 생성 시작)
    - 로딩 상태: "캡션 생성 중..." → "이미지 생성 중..." → 완료
    - `components/content/ContentCard.tsx`: 이미지 + 캡션 미리보기
    - `components/content/CaptionEditor.tsx`: textarea + 저장 버튼 (`PATCH /api/content/[contentId]`)
    - `components/content/RegenerateButton.tsx`: 이미지/캡션 재생성 버튼 (남은 횟수 표시)
    - 복사 버튼: `navigator.clipboard.writeText(caption)` + 토스트
    - 다운로드 버튼: `<a href={imageUrl} download>` + `POST /api/content/[contentId]/download` (status=PUBLISHED)

15. **히스토리 페이지** (4시간)
    - `/(dashboard)/history/page.tsx`
    - `components/history/HistoryList.tsx`: 콘텐츠 카드 리스트 (날짜, 썸네일, 캡션 일부)
    - 페이지네이션 버튼
    - 빈 상태: "아직 발행한 콘텐츠가 없어요"

---

### Week 3: 결제 + 알림 + Cron Job

#### Backend
16. **토스페이먼츠 통합** (6시간)
    - `lib/toss/payment.ts`: 토스 SDK 초기화
    - `POST /api/payment/confirm` 구현
      - body: `{ paymentKey, orderId, amount }`
      - 토스 API로 결제 승인 요청
      - 빌링키 발급 요청 (`/v1/billing/authorizations/issue`)
      - Subscription 업데이트 (status=ACTIVE, tossBillingKey, currentPeriodStart=now(), currentPeriodEnd=+1개월)
      - Payment 레코드 생성 (status=DONE)
    - `POST /api/payment/webhook` 구현
      - 토스 웹훅 서명 검증
      - 정기 결제 성공 시 Payment 레코드 생성, Subscription.currentPeriodEnd 갱신
      - 실패 시 Subscription.status=PAST_DUE, 이메일 알림

17. **체험 연장 API** (3시간)
    - `POST /api/trial/extend` 구현
    - body: `{ reviewUrl }`
    - URL 간단 검증 (네이버 도메인 체크)
    - Subscription.trialExtended=true, trialExtendedAt=now(), trialEndAt+7일
    - 중복 연장 방지

18. **알림 시스템** (4시간)
    - Resend 설치 + API 키 설정
    - `lib/resend/sendNotification.ts`: 이메일 템플릿 함수
    - 알림 종류:
      - 콘텐츠 생성 완료 (매일 8시 후)
      - 체험 종료 7일 전
      - 결제 실패
    - HTML 템플릿 간단하게 작성

19. **Cron Job — 매일 콘텐츠 생성** (6시간)
    - `GET /api/cron/generate-daily` 구현
    - Authorization 헤더로 `CRON_SECRET` 검증
    - 모든 TRIAL/ACTIVE 구독 사용자 조회
    - 각 사용자마다 `GET /api/content/generate` 내부 로직 실행 (SSE 없이 동기 처리)
    - 성공 시 Resend로 알림 이메일 발송
    - 실패 시 Sentry 로깅
    - `vercel.json` 추가: `{ "crons": [{ "path": "/api/cron/generate-daily", "schedule": "0 23 * * *" }] }`

20. **Cron Job — 체험 만료 알림** (3시간)
    - `GET /api/cron/trial-expiry-reminder` 구현
    - 체험 종료 7일 전 사용자 조회 (`trialEndAt BETWEEN now() AND now()+7일`)
    - 이메일 발송
    - `vercel.json`에 추가: `"schedule": "0 1 * * *"` (매일 오전 10시 KST)

#### Frontend
21. **설정 페이지 (구독 관리)** (6시간)
    - `/(dashboard)/settings/page.tsx`
    - 탭 UI: "가게 정보", "구독 관리"
    - 구독 관리 섹션:
      - 현재 플랜 표시 (TRIAL / BASIC / PRO)
      - 남은 체험 일수 표시 (progressbar)
      - "리뷰 작성하고 7일 더 받기" 버튼 → 모달 (URL 입력) → `POST /api/trial/extend`
      - BASIC/PRO 플랜 선택 카드
      - "결제하기" 버튼 → 토스페이먼츠 SDK 호출 → `POST /api/payment/confirm`
      - "구독 취소" 버튼

22. **가게 정보 수정** (3시간)
    - `PATCH /api/settings/shop` 구현
    - `/settings` 페이지에 가게 정보 폼 추가 (온보딩과 동일 구조)
    - 저장 시 Shop 레코드 업데이트

---

### Week 4: QA + 최적화 + 배포

#### Backend
23. **에러 핸들링 강화** (4시간)
    - 모든 API Route에 try-catch + Zod 에러 처리
    - 공통 에러 응답 포맷: `{ error: "error_code", message: "..." }`
    - Sentry 설치 + 초기화

24. **이미지 최적화** (3시간)
    - Sharp 라이브러리로 WebP 변환 + 품질 80%
    - Supabase Storage CDN URL 사용
    - Next.js Image 컴포넌트 적용 (모든 이미지)

25. **API Rate Limiting** (2시간)
    - Vercel Edge Config로 간단한 IP 기반 Rate Limit (선택사항)
    - 재생성 API 횟수 제한 로직 강화

#### Frontend
26. **로딩/에러 상태 개선** (4시간)
    - SSE 연결 실패 시 에러 메시지 + 재시도 버튼
    - Skeleton UI 적용 (홈, 히스토리)
    - Toast 메시지 일관성 확보

27. **반응형 디자인** (4시간)
    - 모바일(375px), 태블릿(768px), 데스크탑(1280px) 브레이크포인트
    - 대시보드 사이드바 모바일에서 햄버거 메뉴로 전환

28. **SEO + 메타태그** (2시간)
    - `/landing` 페이지 메타태그 (OG 이미지, description)
    - `robots.txt`, `sitemap.xml` 생성

#### QA
29. **기능 테스트** (8시간)
    - 회원가입 → 온보딩 → 콘텐츠 생성 → 재생성 → 히스토리 → 결제 플로우 전체 테스트
    - 체험 만료 시뮬레이션 (DB에서 trialEndAt 수동 변경)
    - Cron Job 로컬 테스트 (`curl http://localhost:3000/api/cron/generate-daily -H "Authorization: Bearer CRON_SECRET"`)
    - 토스 결제 테스트 계정으로 결제/취소/실패 케이스 확인

30. **성능 테스트** (3시간)
    - Lighthouse 점수 확인 (Performance 80+ 목표)
    - 이미지 로딩 속도 확인
    - SSE 타임아웃 확인 (DALL-E 생성 시간 60초+)

31. **배포** (4시간)
    - Vercel 프로젝트 생성
    - 환경변수 설정 (Production)
    - `vercel.json` Cron Job 설정 확인
    - Supabase Production 환경 분리
    - 배포 후 Production 환경에서 전체 플로우 재검증

---

## 개발 순서 (4주 스케줄)

### Week 1 (5일 — 29시간)
**목표**: 인증 + 온보딩 + 랜딩 완성
- Day 1-2: Backend 초기 설정 + Auth + 온보딩 API (11시간)
- Day 3: 인증 페이지 + UI 컴포넌트 (6시간)
- Day 4: 온보딩 화면 (6시간)
- Day 5: 랜딩 페이지 (6시간)
- **완료 기준**: 회원가입 → 온보딩 → 빈 대시보드 진입 가능

### Week 2 (5일 — 37시간)
**목표**: 콘텐츠 생성 + 대시보드 완성
- Day 1-2: OpenAI 통합 + 이미지 저장 + SSE API (16시간)
- Day 3: 재생성 API + 히스토리 API (6시간)
- Day 4: 대시보드 레이아웃 + 홈 페이지 (11시간)
- Day 5: 히스토리 페이지 (4시간)
- **완료 기준**: 콘텐츠 생성 → 미리보기 → 편집 → 재생성 → 히스토리 확인 플로우 동작

### Week 3 (5일 — 35시간)
**목표**: 결제 + 알림 + Cron Job 완성
- Day 1-2: 토스페이먼츠 통합 + 체험 연장 API (9시간)
- Day 3: 알림 시스템 + Cron Job 콘텐츠 생성 (10시간)
- Day 4: Cron Job 체험 알림 + 설정 페이지 (9시간)
- Day 5: 가게 정보 수정 + 구독 관리 UI (3시간)
- **완료 기준**: 결제 플로우 동작 + Cron Job 실행 확인 + 이메일 발송 확인

### Week 4 (5일 — 34시간)
**목표**: QA + 최적화 + 배포
- Day 1: 에러 핸들링 + 이미지 최적화 + Rate Limiting (9시간)
- Day 2: 로딩/에러 상태 + 반응형 디자인 (8시간)
- Day 3: SEO + 기능 테스트 (10시간)
- Day 4: 성능 테스트 + 버그 수정 (3시간)
- Day 5: 배포 + Production 검증 (4시간)
- **완료 기준**: Production 배포 완료 + 전체 플로우 정상 동작

---

## 완료 기준 (Definition of Done)

### 기능 완료 기준
- [ ] 회원가입/로그인 (Supabase Auth) 정상 동작
- [ ] 온보딩 플로우 (가게 정보 입력) 완료 후 대시보드 진입
- [ ] 매일 오전 8시 Cron Job으로 콘텐츠 자동 생성 (UTC 23:00)
- [ ] 홈 페이지에서 오늘의 콘텐츠 미리보기 (이미지 + 캡션)
- [ ] 캡션 편집 기능 동작 (textarea 수정 + 저장)
- [ ] 이미지/캡션 재생성 버튼 동작 (횟수 제한 체크)
- [ ] 복사/다운로드 버튼 클릭 시 클립보드 복사 + 파일 다운로드
- [ ] 히스토리 페이지에서 과거 콘텐츠 리스트 표시 (페이지네이션)
- [ ] 무료 체험 14일 자동 설정 (회원가입 시)
- [ ] 리뷰 URL 입력 시 체험 기간 7일 연장 (1회 제한)
- [ ] BASIC 플랜 결제 (토스페이먼츠) 정상 처리 + 빌링키 저장
- [ ] 결제 성공 시 구독 상태 ACTIVE 전환
- [ ] 체험 종료 7일 전 이메일 알림 발송
- [ ] 콘텐츠 생성 완료 시 이메일 알림 발송
- [ ] 구독 취소 기능 동작
- [ ] 가게 정보 수정 기능 동작

### 기술 완료 기준
- [ ] TypeScript 타입 에러 0개
- [ ] Prisma 마이그레이션 Production 적용
- [ ] Supabase Storage 버킷 Public 접근 설정
- [ ] 환경변수 Production 환경에 모두 설정 (DATABASE_URL, OPENAI_API_KEY, TOSS_SECRET_KEY, RESEND_API_KEY 등)
- [ ] Vercel Cron Job `vercel.json` 설정 완료
- [ ] Sentry 에러 로깅 동작 확인
- [ ] Lighthouse Performance 점수 80+ (Mobile/Desktop)
- [ ] 모든 이미지 Next.js Image 컴포넌트 사용 + WebP 변환
- [ ] 반응형 디자인 (Mobile 375px / Tablet 768px / Desktop 1280px)
- [ ] SEO 메타태그 (랜딩 페이지)

### QA 완료 기준
- [ ] 전체 사용자 플로우 (회원가입 → 온보딩 → 콘텐츠 생성 → 재생성 → 결제) E2E 테스트 통과
- [ ] 재생성 횟수 제한 동작 확인 (BASIC 3회, PRO 10회)
- [ ] 체험 만료 후 구독 결제 유도 플로우 확인
- [ ] Cron Job 로컬 + Production 실행 확인
- [ ] 토스 결제 테스트 계정으로 결제/취소/실패 케이스 확인
- [ ] 이메일 알림 수신 확인 (Resend)
- [ ] 브라우저 호환성 확인 (Chrome, Safari, Firefox 최신 버전)
- [ ] 모바일 실기기 테스트 (iOS Safari, Android Chrome)

### 배포 완료 기준
- [ ] Vercel Production 배포 성공
- [ ] 커스텀 도메인 연결 (선택사항)
- [ ] Supabase Production DB 연결 확인
- [ ] Cron Job Production 환경에서 실행 확인 (최소 1회)
- [ ] Production 환경에서 전체 플로우 재검증
- [ ] 배포 후 24시간 모니터링 (Sentry 에러 체크)

---

## 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|-----------|
| DALL-E 생성 시간 60초+ 초과 (타임아웃) | 중 | 중 | SSE 타임아웃 120초로 연장, 에러 시 재시도 로직 |
| 토스페이먼츠 빌링키 발급 실패 | 중 | 고 | 결제 실패 시 사용자에게 재시도 안내, Sentry 알림 |
| Cron Job 실행 실패 (Vercel 제약) | 저 | 고 | Cron Job 실패 시 Sentry 알림, 수동 재실행 API 제공 |
| OpenAI API 비용 초과 | 중 | 중 | 사용자당 일일 생성 횟수 1회 제한, 재생성 횟수 제한 |
| Supabase Storage 용량 초과 | 저 | 중 | 이미지 WebP 압축, 90일 이상 콘텐츠 자동 삭제 정책 (Phase 1.1) |

---

## Phase 1.1 대비 사항 (출시 후 2~4주)

Meta 심사 완료 후 추가 개발:
- Instagram Graph API 연동 (`lib/instagram/auth.ts`, `lib/instagram/publish.ts`)
- `/api/instagram/connect` (OAuth URL)
- `/api/instagram/callback` (토큰 저장)
- `/api/publish/now` (즉시 발행)
- `/api/publish/schedule` (예약 발행)
- `GET /api/cron/publish-scheduled` (Cron Job)
- `Content.status` 상태 전환 (PENDING → SCHEDULED → PUBLISHING → PUBLISHED/FAILED)
- 홈 페이지에 "인스타 자동 발행" 버튼 추가

---

## 개발 원칙

1. **Server Component 우선**: 클라이언트 상태가 필요한 경우만 `"use client"`
2. **Zod 스키마 공유**: API Request/Response 스키마는 `types/index.ts`에서 export 후 FE/BE 공유
3. **에러 메시지 일관성**: 모든 에러는 `{ error: "error_code", message: "..." }` 포맷
4. **Git 커밋 단위**: 위 태스크 1개 = 1 커밋 (예: `feat: implement onboarding API`)
5. **환경변수 네이밍**: 모두 대문자 + 언더스코어 (예: `OPENAI_API_KEY`)
6. **TypeScript Strict Mode**: `tsconfig.json`에서 `"strict": true`

---

## 참고 문서

- Supabase Auth: https://supabase.com/docs/guides/auth
- Prisma: https://www.prisma.io/docs
- OpenAI API: https://platform.openai.com/docs/api-reference
- 토스페이먼츠: https://docs.tosspayments.com/
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Resend: https://resend.com/docs

---

**작성일**: 2026-03-19
**작성자**: PM Agent (Claude)
**버전**: v1.0
**다음 단계**: Backend Week 1 태스크 시작 → 프로젝트 초기 설정
