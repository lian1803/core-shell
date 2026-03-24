# CTO 분석 - 소상공인 인스타그램 자동화 서비스 (instauto)

> Wave 1 CTO 기술 분석 문서
> 작성일: 2026-03-19

---

## 1. 기술 스택 검증

| 항목 | 선택 | 버전 | 검증 결과 |
|------|------|------|-----------|
| Frontend Framework | Next.js (App Router) | 14.2.x | **적합** - App Router의 Server Components로 초기 로딩 최적화 |
| Language | TypeScript | 5.4.x | **적합** - 타입 안전성 확보, Prisma와 완벽 호환 |
| Styling | Tailwind CSS | 3.4.x | **적합** - 빠른 UI 개발, shadcn/ui와 궁합 최적 |
| UI Components | shadcn/ui | latest | **적합** - 커스터마이징 가능, 번들 사이즈 최소화 |
| Backend | Next.js Route Handlers | 14.2.x | **적합** - 풀스택 단일 배포, API 분리 불필요 |
| Database | Supabase (PostgreSQL) | latest | **적합** - Auth 통합, 실시간 기능 대비 가능 |
| ORM | Prisma | 5.14.x | **적합** - 타입 안전 쿼리, 마이그레이션 관리 용이 |
| Auth | Supabase Auth | latest | **적합** - Google OAuth 기본 지원, Row Level Security |
| AI 캡션 | OpenAI GPT-4o | latest | **적합** - 한국어 품질 우수, 비용 효율적 |
| AI 이미지 | OpenAI DALL-E 3 | latest | **주의** - 비용 높음, 이미지당 $0.04~$0.12 |
| 결제 | 토스페이먼츠 SDK | latest | **적합** - 국내 결제 최적화, 빌링키 지원 |
| Instagram | Meta Graph API | v19.0 | **주의** - 비즈니스 계정 필수, 앱 검수 필요 |
| 스케줄러 | Vercel Cron Jobs | - | **적합** - 무료 티어로 충분 (일 1회) |
| 알림 | Resend | latest | **적합** - 개발자 친화적, 무료 100건/일 |
| 배포 | Vercel | - | **적합** - Next.js 최적화, Edge Functions |
| 상태 관리 | Zustand | 4.5.x | **적합** - 경량, 보일러플레이트 최소 |
| 폼 관리 | React Hook Form + Zod | 7.51.x / 3.23.x | **적합** - 타입 안전 검증, 성능 우수 |

### 스택 종합 평가: **승인**
상용화 SaaS에 적합한 안정적이고 검증된 스택. 과도하지 않으면서 확장 가능.

---

## 2. 시스템 아키텍처

```
                                    [Vercel Edge Network]
                                           |
                    +----------------------+----------------------+
                    |                      |                      |
              [Landing]              [Dashboard]            [Cron Jobs]
                    |                      |                      |
                    +----------+-----------+                      |
                               |                                  |
                    [Next.js App Router]                          |
                    (Server Components)                           |
                               |                                  |
          +--------------------+--------------------+             |
          |                    |                    |             |
    [Auth Routes]       [API Routes]         [Middleware]         |
          |                    |                    |             |
          v                    v                    v             |
    +-----------+    +-------------------+    +-----------+       |
    | Supabase  |    | Business Logic    |    | Session   |       |
    | Auth      |    | (lib/ functions)  |    | Validation|       |
    +-----------+    +-------------------+    +-----------+       |
          |                    |                                  |
          |     +--------------+--------------+                   |
          |     |              |              |                   |
          v     v              v              v                   v
    +----------+ +----------+ +----------+ +----------+ +------------+
    | Supabase | | OpenAI   | | Meta     | | Toss     | | Resend     |
    | Postgres | | API      | | Graph    | | Payments | | Email      |
    | (Prisma) | | GPT-4o   | | API      | |          | |            |
    |          | | DALL-E 3 | |          | |          | |            |
    +----------+ +----------+ +----------+ +----------+ +------------+
         |
         v
    [Row Level Security]
    - User can only access own data
    - Subscription status check
```

### 데이터 흐름

```
[사용자 요청 흐름]

1. 온보딩:
   User -> Signup -> Supabase Auth -> Create User/Shop/Subscription in DB
        -> Instagram OAuth -> Store Access Token (encrypted)

2. 일일 콘텐츠 생성 (Cron 8AM):
   Cron -> Fetch Active Users -> For Each User:
        -> Get Shop Info -> GPT-4o (Caption) -> DALL-E 3 (Image)
        -> Save Content -> Send Email Notification

3. 콘텐츠 발행:
   User -> Review Content -> Edit (optional) -> Publish Now / Schedule
        -> Meta Graph API -> Update Content Status -> Save to History

4. 결제:
   Trial End -> Show Payment Modal -> Toss Widget
             -> Billing Key -> Webhook -> Update Subscription
```

---

## 3. Engineering Rules (FE/BE 필수 준수)

### [RULE-01] API 응답 표준화
```typescript
// 모든 API Route Handler는 이 형식을 따른다
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;      // 예: "AUTH_REQUIRED", "SUBSCRIPTION_EXPIRED"
    message: string;   // 사용자에게 표시할 메시지
  };
};

// 성공: { success: true, data: {...} }
// 실패: { success: false, error: { code: "...", message: "..." } }
```

### [RULE-02] 인증 미들웨어 적용
```typescript
// middleware.ts에서 보호 경로 정의
const protectedPaths = ['/home', '/history', '/settings', '/onboarding'];
const publicPaths = ['/', '/landing', '/login', '/signup'];

// API Routes는 각각 Supabase 세션 검증 필수
// lib/supabase/server.ts의 getUser() 사용
```

### [RULE-03] 환경 변수 명명 규칙
```bash
# Public (브라우저 노출 가능)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TOSS_CLIENT_KEY=

# Private (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
META_APP_ID=
META_APP_SECRET=
TOSS_SECRET_KEY=
RESEND_API_KEY=
CRON_SECRET=           # Vercel Cron 인증용
```

### [RULE-04] 에러 처리 패턴
```typescript
// lib/에서 외부 API 호출 시 반드시 try-catch
// 사용자에게 친절한 한국어 메시지 반환

// 재시도 로직: OpenAI, Meta API는 최대 3회 재시도 (exponential backoff)
// 타임아웃: OpenAI 30초, Meta API 10초, Toss 10초
```

### [RULE-05] Prisma 트랜잭션 규칙
```typescript
// 여러 모델 동시 수정 시 반드시 트랜잭션 사용
await prisma.$transaction([
  prisma.content.update(...),
  prisma.subscription.update(...),
]);

// Supabase와 Prisma 동시 사용 금지 - Prisma만 사용
```

### [RULE-06] Instagram Access Token 보안
```typescript
// igAccessToken은 암호화 저장 필수
// lib/utils.ts에 encrypt/decrypt 함수 구현
// AES-256-GCM 사용, 키는 환경변수 TOKEN_ENCRYPTION_KEY
```

### [RULE-07] 콘텐츠 재생성 제한
```typescript
// Content.regenerateCount 기반 제한
// BASIC 플랜: 일 3회 재생성
// PRO 플랜: 일 무제한
// 프론트엔드에서 카운트 표시 필수
```

### [RULE-08] Cron Job 보안
```typescript
// /api/cron/* 엔드포인트는 CRON_SECRET 헤더 검증 필수
// vercel.json에서 schedule 정의
// 실패 시 Resend로 관리자 알림
```

### [RULE-09] 컴포넌트 구조 규칙
```typescript
// Server Component 기본, 'use client' 최소화
// Client Component 필요 케이스:
// - useState, useEffect 사용
// - 이벤트 핸들러 (onClick, onChange)
// - Zustand store 접근

// 데이터 페칭은 Server Component에서
// 인터랙션은 Client Component로 분리
```

### [RULE-10] Zod 스키마 공유
```typescript
// types/schemas.ts에 모든 Zod 스키마 정의
// API Route와 React Hook Form에서 동일 스키마 사용
// Prisma 타입과 일관성 유지

// 예시:
export const shopFormSchema = z.object({
  name: z.string().min(1, "가게 이름을 입력해주세요"),
  vibeKeywords: z.array(z.string()).length(3, "분위기 키워드 3개를 선택해주세요"),
  representMenus: z.array(z.string()).max(3, "대표 메뉴는 최대 3개까지"),
});
```

---

## 4. 데이터 모델 완성 제안

### Content 모델 (신규)
```prisma
// 일일 생성 콘텐츠
model Content {
  id              String          @id @default(uuid())
  userId          String
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // AI 생성 콘텐츠
  caption         String          // GPT-4o 생성 캡션 (최대 2200자)
  hashtags        String[]        // 추천 해시태그 배열
  imageUrl        String          // DALL-E 3 생성 이미지 URL (Supabase Storage)
  imagePrompt     String?         // 이미지 생성에 사용된 프롬프트 (디버깅용)

  // 편집 상태
  editedCaption   String?         // 사용자가 수정한 캡션 (null이면 원본 사용)
  regenerateCount Int             @default(0)  // 재생성 횟수

  // 발행 상태
  status          ContentStatus   @default(PENDING)
  scheduledAt     DateTime?       // 예약 발행 시간
  publishedAt     DateTime?       // 실제 발행 시간
  igMediaId       String?         // Instagram 게시물 ID (발행 후)

  // 날짜 (일일 1개 컨셉)
  contentDate     DateTime        // 이 콘텐츠가 대상으로 하는 날짜 (예: 2026-03-19)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([userId, contentDate])  // 유저별 날짜 조회 최적화
  @@unique([userId, contentDate]) // 유저당 하루 1개 콘텐츠 보장
}

enum ContentStatus {
  PENDING     // 생성됨, 검토 대기
  SCHEDULED   // 예약 발행 설정됨
  PUBLISHING  // 발행 중 (API 호출 중)
  PUBLISHED   // 발행 완료
  FAILED      // 발행 실패
  SKIPPED     // 사용자가 건너뜀
}
```

### Subscription 모델 (완성)
```prisma
model Subscription {
  id                  String              @id @default(uuid())
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan                PlanType            @default(BASIC)
  status              SubscriptionStatus  @default(TRIAL)

  // 체험 기간
  trialStartAt        DateTime            @default(now())
  trialEndAt          DateTime            // trialStartAt + 30일

  // 유료 구독 기간
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?

  // 토스페이먼츠 빌링
  tossBillingKey      String?             // 자동 결제용 빌링키 (암호화)
  tossCustomerKey     String?             @default(uuid())  // 토스 고객 식별자

  // 결제 이력은 Payment 모델로 분리
  payments            Payment[]

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

enum PlanType {
  BASIC   // 월 9,900원 - 일 1개 콘텐츠, 재생성 3회
  PRO     // 월 19,900원 - 일 1개 콘텐츠, 재생성 무제한, 우선 지원
}

enum SubscriptionStatus {
  TRIAL           // 무료 체험 중
  ACTIVE          // 유료 구독 활성
  PAST_DUE        // 결제 실패 (유예 기간)
  CANCELED        // 구독 취소됨
  EXPIRED         // 만료됨
}
```

### Payment 모델 (신규 - 결제 이력)
```prisma
model Payment {
  id              String          @id @default(uuid())
  subscriptionId  String
  subscription    Subscription    @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  amount          Int             // 결제 금액 (원)
  status          PaymentStatus   @default(PENDING)

  // 토스페이먼츠 응답 데이터
  tossPaymentKey  String?         // 토스 결제 키
  tossOrderId     String          @unique  // 주문 ID (우리가 생성)
  receiptUrl      String?         // 영수증 URL

  paidAt          DateTime?
  failedAt        DateTime?
  failReason      String?

  createdAt       DateTime        @default(now())
}

enum PaymentStatus {
  PENDING     // 결제 대기
  DONE        // 결제 완료
  FAILED      // 결제 실패
  CANCELED    // 결제 취소
}
```

---

## 5. 기술 리스크 및 해결 방법

| 리스크 | 심각도 | 해결 방법 |
|--------|--------|-----------|
| **Meta App Review 지연** | 높음 | MVP는 개발 모드(자신의 계정만)로 진행. 앱 검수는 병행. 검수 통과 전까지 테스터 25명 제한. |
| **DALL-E 3 비용 폭증** | 중간 | 1024x1024 표준 품질 고정 ($0.04/장). 일일 생성 1회 제한. 비용 모니터링 대시보드 필수. |
| **Instagram Token 만료** | 중간 | Long-lived token(60일) 사용. 만료 7일 전 갱신 Cron 추가. 실패 시 재연동 요청 이메일. |
| **Vercel Cold Start** | 낮음 | Edge Runtime 사용 권장. 크리티컬 API는 Streaming 응답. |
| **OpenAI Rate Limit** | 낮음 | Cron에서 순차 처리 + 지수 백오프. 동시 요청 제한. |
| **한국어 해시태그 품질** | 중간 | 프롬프트에 업종별 인기 해시태그 예시 포함. 사용자 피드백으로 개선. |

---

## 6. CDO에게 요청 (디자인 조정 필요)

1. **Instagram 미리보기 UI**
   - 정사각형(1:1) 이미지 비율 고정 필요. DALL-E 3 출력이 1024x1024.
   - 캡션 미리보기는 2200자 제한 표시 필요 (Instagram 최대 길이).

2. **로딩 상태 디자인**
   - AI 이미지 생성 15~30초 소요. 스켈레톤 + 프로그레스 표시 필요.
   - "캡션 생성 중..." -> "이미지 생성 중..." 단계별 표시.

3. **에러 상태 UI**
   - Instagram 토큰 만료 시 재연동 유도 배너.
   - 결제 실패 시 업그레이드 유도 모달.
   - 재생성 한도 도달 시 PRO 플랜 안내.

4. **모바일 우선 설계**
   - 소상공인 대부분 모바일 사용. 반응형 필수.
   - 터치 친화적 버튼 크기 (최소 44px).

---

## 7. CPO에게 피드백 (비즈니스 요구사항 검토)

1. **Meta 앱 검수 일정 고려**
   - Instagram Graph API 사용을 위해 Meta 앱 검수 필요 (2~4주).
   - MVP 출시 전 검수 통과 필요. 검수 신청은 개발 완료 직후 즉시 진행.
   - **대안**: 검수 전까지는 "수동 복사" 모드로 운영 가능 (캡션/이미지 생성만, 발행은 사용자가 직접).

2. **DALL-E 3 비용 모델 재검토**
   - 이미지 1장당 $0.04 (약 60원). 월 1000명 사용자 기준 월 180만원 예상.
   - BASIC 9,900원에서 마진 확보 어려움.
   - **제안**: 이미지 생성은 PRO 전용 또는 추가 과금 검토.

3. **무료 체험 30일 재검토**
   - 30일은 과도하게 길 수 있음. 14일 또는 7일 + 크레딧 방식 제안.
   - 이유: AI 비용이 체험 기간 동안 지속 발생.

4. **업종 확장 로드맵**
   - MVP는 카페 고정이지만, DB 스키마는 업종 확장 고려됨.
   - industry 필드와 프롬프트 템플릿 분리 구조 확인 필요.

---

## 8. 필수 환경 변수 목록

```bash
# .env.local 템플릿

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Prisma)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Meta (Instagram)
META_APP_ID=123456789
META_APP_SECRET=abc123...
META_REDIRECT_URI=https://your-domain.vercel.app/api/instagram/callback

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@your-domain.com

# Security
TOKEN_ENCRYPTION_KEY=32-byte-random-string
CRON_SECRET=your-cron-secret

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 9. 개발 우선순위 제안

### Phase 1 (Week 1) - 기반
1. 프로젝트 초기화 (Next.js, Prisma, Supabase)
2. 인증 플로우 (회원가입, 로그인, 미들웨어)
3. 온보딩 (가게 정보 입력)

### Phase 2 (Week 2) - 핵심 기능
4. AI 콘텐츠 생성 (GPT-4o 캡션, DALL-E 3 이미지)
5. 대시보드 홈 (오늘의 콘텐츠 조회/편집)
6. Cron Job (일일 자동 생성)

### Phase 3 (Week 3) - 발행
7. Instagram OAuth 연동
8. Instagram 발행 (즉시/예약)
9. 발행 히스토리

### Phase 4 (Week 4) - 수익화
10. 토스페이먼츠 결제
11. 구독 관리
12. 랜딩 페이지

---

**CTO 서명**: Claude Opus (CTO Agent)
**검토 상태**: Wave 1 완료, Wave 2 크로스 토론 대기
