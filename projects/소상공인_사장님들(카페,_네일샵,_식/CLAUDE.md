# 구현 지시서 v1.0 — 소상공인 인스타그램 자동화 서비스 (MVP)

> Claude Code에 전체 복붙 후 바로 코딩 시작용

---

## 기술 스택

| 항목 | 선택 | 버전 |
|------|------|------|
| Frontend Framework | Next.js (App Router) | 14.2.x |
| Language | TypeScript | 5.4.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui | latest |
| Backend | Next.js Route Handlers (API Routes) | 14.2.x |
| Database | Supabase (PostgreSQL) | latest |
| ORM | Prisma | 5.14.x |
| Auth | Supabase Auth (이메일 + Google OAuth) | latest |
| AI 캡션 생성 | OpenAI API (GPT-4o) | latest |
| AI 이미지 생성 | OpenAI API (DALL-E 3) | latest |
| 결제 | 토스페이먼츠 SDK | latest |
| Instagram 연동 | Meta Graph API | v19.0 |
| 스케줄러 | Vercel Cron Jobs | - |
| 푸시/이메일 알림 | Resend | latest |
| 배포 | Vercel | - |
| 상태 관리 | Zustand | 4.5.x |
| 폼 관리 | React Hook Form + Zod | 7.51.x / 3.23.x |

---

## 폴더 구조

```
instauto/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # 대시보드 공통 레이아웃 (사이드바, 네브)
│   │   ├── home/
│   │   │   └── page.tsx                # 홈 - 오늘의 콘텐츠
│   │   ├── history/
│   │   │   └── page.tsx                # 발행 히스토리
│   │   └── settings/
│   │       └── page.tsx                # 가게 설정 / 인스타 연동 / 구독 관리
│   ├── onboarding/
│   │   ├── layout.tsx
│   │   ├── shop/
│   │   │   └── page.tsx                # 가게 정보 입력
│   │   └── instagram/
│   │       └── page.tsx                # 인스타 OAuth 연동
│   ├── landing/
│   │   └── page.tsx                    # 랜딩 페이지
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts            # Supabase Auth 콜백
│   │   ├── onboarding/
│   │   │   └── route.ts                # POST /api/onboarding - 가게 정보 저장
│   │   ├── instagram/
│   │   │   ├── connect/
│   │   │   │   └── route.ts            # GET /api/instagram/connect - OAuth URL 반환
│   │   │   ├── callback/
│   │   │   │   └── route.ts            # GET /api/instagram/callback - OAuth 처리
│   │   │   └── disconnect/
│   │   │       └── route.ts            # POST /api/instagram/disconnect
│   │   ├── content/
│   │   │   ├── generate/
│   │   │   │   └── route.ts            # POST /api/content/generate - AI 생성
│   │   │   ├── regenerate/
│   │   │   │   └── route.ts            # POST /api/content/regenerate - 재생성
│   │   │   └── [contentId]/
│   │   │       └── route.ts            # GET/PATCH /api/content/[contentId]
│   │   ├── publish/
│   │   │   ├── now/
│   │   │   │   └── route.ts            # POST /api/publish/now - 즉시 발행
│   │   │   └── schedule/
│   │   │       └── route.ts            # POST /api/publish/schedule - 예약 발행
│   │   ├── history/
│   │   │   └── route.ts                # GET /api/history
│   │   ├── payment/
│   │   │   ├── confirm/
│   │   │   │   └── route.ts            # POST /api/payment/confirm - 결제 확인
│   │   │   └── webhook/
│   │   │       └── route.ts            # POST /api/payment/webhook - 토스 웹훅
│   │   └── cron/
│   │       ├── generate-daily/
│   │       │   └── route.ts            # GET /api/cron/generate-daily - 매일 8시 콘텐츠 생성
│   │       └── publish-scheduled/
│   │           └── route.ts            # GET /api/cron/publish-scheduled - 예약 발행 실행
│   ├── layout.tsx
│   └── page.tsx                        # / → /landing 리다이렉트
├── components/
│   ├── ui/                             # shadcn/ui 컴포넌트 (자동 생성)
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── Pricing.tsx
│   ├── onboarding/
│   │   ├── ShopForm.tsx
│   │   └── InstagramConnect.tsx
│   ├── content/
│   │   ├── ContentCard.tsx             # 이미지 + 캡션 미리보기 카드
│   │   ├── CaptionEditor.tsx           # 캡션 텍스트 편집기
│   │   ├── ImagePreview.tsx            # 생성된 이미지 표시
│   │   └── RegenerateButton.tsx        # 재생성 버튼 (횟수 카운팅)
│   ├── publish/
│   │   ├── PublishButton.tsx           # 즉시 발행 버튼
│   │   └── SchedulePicker.tsx          # 예약 시간 선택
│   ├── history/
│   │   └── HistoryList.tsx
│   └── common/
│       ├── TrialBadge.tsx              # 남은 무료 체험 일수 배지
│       └── Navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # 브라우저용 Supabase 클라이언트
│   │   └── server.ts                   # 서버용 Supabase 클라이언트
│   ├── openai/
│   │   ├── generateCaption.ts          # GPT-4o 캡션 생성 함수
│   │   └── generateImage.ts            # DALL-E 3 이미지 생성 함수
│   ├── instagram/
│   │   ├── auth.ts                     # Meta OAuth 헬퍼
│   │   └── publish.ts                  # Instagram Graph API 발행 함수
│   ├── toss/
│   │   └── payment.ts                  # 토스페이먼츠 결제 헬퍼
│   ├── resend/
│   │   └── sendNotification.ts         # 알림 이메일 발송
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── stores/
│   └── contentStore.ts                 # Zustand - 오늘의 콘텐츠 상태
├── hooks/
│   ├── useContent.ts
│   └── useSubscription.ts
├── types/
│   └── index.ts                        # 공통 타입 정의
├── middleware.ts                        # 인증 미들웨어 (비로그인 → /login 리다이렉트)
├── vercel.json                          # Cron Job 설정
├── .env.local
└── package.json
```

---

## 데이터 모델

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// 유저 (Supabase Auth와 1:1 매핑)
model User {
  id            String        @id @default(uuid())  // Supabase Auth uid와 동일값 사용
  email         String        @unique
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  shop          Shop?
  subscription  Subscription?
  contents      Content[]
}

// 가게 정보 (온보딩에서 수집)
model Shop {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  name            String                          // 가게 이름
  industry        String    @default("cafe")      // MVP: "cafe" 고정
  vibeKeywords    String[]                        // 분위기 키워드 3개 배열. 예: ["아늑한", "감성적", "모던"]
  representMenus  String[]                        // 대표 메뉴 최대 3개. 예: ["아메리카노", "크로플"]

  // Instagram 연동 정보
  igUserId        String?                         // Instagram 비즈니스 계정 ID
  igUsername      String?                         // @계정명
  igAccessToken   String?                         // 장기 액세스 토큰 (암호화 저장)
  igTokenExpiry   DateTime?                       // 토큰 만료일

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 구독 정보
model Subscription {
  id                  String              @id @default(uuid())
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan                PlanType            @default(BASIC)
  status              SubscriptionStatus  @default(TRIAL)

  trialStartAt        DateTime            @default(now())
  trialEndAt          DateTime            // trialStartAt + 30일
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?

  // 토스페이먼츠 빌링 키
  tossBillingKey      String?
  tossCustomerKey     String?             // 토스 고객 키 (uuid 생성)