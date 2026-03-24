> **LAINCP 자동 생성 프로젝트**
> 리안 컴퍼니 파이프라인이 생성한 구현 지시서야.
> 이 폴더에서 Claude Code 열고 `/work` 입력하면 Wave 1~6 자동 실행돼.
>
> - **프로젝트 유형**: 상용화 서비스
> - **아이디어**: 마케터-고객 실시간 채팅 MVP 채팅 안에 결제 링크 연동
> - **생성일**: 2026-03-20

---

# 구현 지시서 v1.0 — 마케터-고객 실시간 채팅 + 채팅 내 결제 링크 연동

**작성자**: 종범 (실행팀 구현 지시서)
**기반 PRD**: 지훈 PRD v1.1
**상태**: Claude Code 즉시 실행 가능

---

## 기술 스택

| 항목 | 선택 | 버전 |
|------|------|------|
| Runtime | Node.js | 20.x LTS |
| Framework (API) | Fastify | 4.26.x |
| Framework (Frontend) | Next.js | 14.2.x (App Router) |
| Language | TypeScript | 5.4.x |
| ORM | Prisma | 5.13.x |
| DB | PostgreSQL | 16.x |
| Realtime | Socket.io | 4.7.x |
| Cache / Session | Redis | 7.2.x |
| Auth | Jose (JWT) + bcrypt | jose 5.x / bcrypt 5.x |
| 구독 결제 PG | 토스페이먼츠 Billing API | v1 |
| 채팅 내 결제 | 카카오페이 단건결제 API / 토스페이먼츠 결제창 API | v1 |
| 이메일 발송 | Resend | 3.x |
| 스타일 | Tailwind CSS | 3.4.x |
| UI 컴포넌트 | shadcn/ui | latest |
| 상태관리 | Zustand | 4.5.x |
| 패키지 매니저 | pnpm | 9.x |
| 배포 (API) | Railway 또는 Render |  |
| 배포 (Frontend) | Vercel |  |
| 파일 저장 | 없음 (MVP 범위 외) |  |

---

## 폴더 구조

```
chatpay/
├── apps/
│   ├── api/                          # Fastify API 서버
│   │   ├── src/
│   │   │   ├── index.ts              # 서버 진입점 (Fastify 인스턴스, Socket.io 마운트)
│   │   │   ├── plugins/
│   │   │   │   ├── prisma.ts         # Prisma 플러그인
│   │   │   │   ├── redis.ts          # Redis 플러그인
│   │   │   │   ├── auth.ts           # JWT 검증 훅
│   │   │   │   └── cors.ts           # CORS 설정
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # POST /auth/signup, /auth/login, /auth/verify-email
│   │   │   │   ├── workspace.ts      # POST /workspace, GET /workspace/:id
│   │   │   │   ├── widget.ts         # GET /widget/:workspaceId/script, POST /widget/token
│   │   │   │   ├── chat.ts           # GET /chats, GET /chats/:roomId, PATCH /chats/:roomId/close
│   │   │   │   ├── payment-link.ts   # POST /payment-link, GET /payment-link/:id
│   │   │   │   ├── webhook.ts        # POST /webhook/kakaopay, POST /webhook/toss
│   │   │   │   ├── subscription.ts   # POST /subscription/checkout, POST /subscription/cancel, GET /subscription
│   │   │   │   └── dashboard.ts      # GET /dashboard/stats
│   │   │   ├── socket/
│   │   │   │   ├── index.ts          # Socket.io 네임스페이스 분리
│   │   │   │   ├── dashboard.ts      # 네임스페이스: /dashboard (마케터)
│   │   │   │   └── widget.ts         # 네임스페이스: /widget (고객)
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   ├── payment-link.service.ts
│   │   │   │   ├── kakaopay.service.ts
│   │   │   │   ├── toss.service.ts
│   │   │   │   ├── subscription.service.ts
│   │   │   │   └── quota.service.ts  # 플랜 한도 검증 로직
│   │   │   ├── lib/
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── email.ts          # Resend 래퍼
│   │   │   │   └── constants.ts      # 플랜 정의, 한도값
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Next.js 마케터 대시보드
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── signup/page.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── verify-email/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # 사이드바 + 상단 GNB
│   │   │   │   ├── onboarding/page.tsx   # 워크스페이스 생성 + 플랜 선택
│   │   │   │   ├── chat/
│   │   │   │   │   ├── page.tsx      # 채팅 목록
│   │   │   │   │   └── [roomId]/page.tsx  # 채팅 상세
│   │   │   │   ├── dashboard/page.tsx    # 전환 통계
│   │   │   │   ├── history/page.tsx      # 대화 히스토리
│   │   │   │   └── settings/
│   │   │   │       ├── widget/page.tsx   # 위젯 스크립트 발급
│   │   │   │       ├── pg/page.tsx       # PG API Key 설정
│   │   │   │       └── plan/page.tsx     # 플랜 및 결제 관리
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatList.tsx
│   │   │   │   ├── ChatRoom.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── PaymentBubble.tsx     # 결제 버블 (상태 뱃지 포함)
│   │   │   │   └── PaymentLinkModal.tsx  # 상품명·금액 입력 모달
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── DateRangePicker.tsx
│   │   │   └── ui/                   # shadcn/ui 컴포넌트
│   │   ├── lib/
│   │   │   ├── api.ts                # axios 인스턴스
│   │   │   ├── socket.ts             # Socket.io 클라이언트
│   │   │   └── utils.ts
│   │   ├── store/
│   │   │   ├── auth.store.ts
│   │   │   └── chat.store.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── widget/                       # 고객용 채팅 위젯 (Vanilla TS 번들)
│       ├── src/
│       │   ├── index.ts              # window.ChatPayWidget 전역 등록
│       │   ├── widget.ts             # 위젯 UI 렌더링 (Shadow DOM)
│       │   ├── socket.ts             # Socket.io 클라이언트 (widget 네임스페이스)
│       │   └── style.css
│       ├── dist/                     # 빌드 결과물 → CDN 또는 public 서빙
│       │   └── widget.js             # 단일 번들 파일
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                      # pnpm workspace 루트
├── pnpm-workspace.yaml
└── .env.example
```

---

## 데이터 모델

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 인증 / 계정 ────────────────────────────────────────────────

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  isEmailVerified   Boolean   @default(false)
  emailVerifyToken  String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  workspace         Workspace?
}

// ─── 워크스페이스 ────────────────────────────────────────────────

model Workspace {
  id            String    @id @default(cuid())
  name          String
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])

  widgetToken   String    @unique @default(cuid()) // embed script 식별자
  pgProvider    PgProvider?  @default(NONE)
  pgKeyEncrypted String?  // AES-256 암호화 저장

  plan          PlanType  @default(FREE_TRIAL)
  trialEndsAt   DateTime?
  subscriptionId String?  // 토스페이먼츠 billingKey 또는 구독 ID
  planStartedAt DateTime?
  planRenewsAt  DateTime?
  isActive      Boolean   @default(true)

  // 이번 달 사용량 (매월 1일 00:00 리셋)
  monthChatCount        Int @default(0)
  monthPaymentLinkCount Int @default(0)
  usageResetAt          DateTime @default(now())

  chatRooms     ChatRoom[]
  paymentLinks  PaymentLink[]
  subscription  Subscription[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum PgProvider {
  NONE
  KAKAOPAY
  TOSS
}

enum PlanType {
  FREE_TRIAL
  BASIC