# Instauto - 소상공인 인스타그램 자동화 서비스

AI가 매일 카페/음식점에 최적화된 인스타그램 콘텐츠(이미지 + 캡션)를 자동으로 생성해주는 SaaS 서비스입니다.

## 핵심 가치

- **시간 절약**: 매일 콘텐츠 고민 없이 AI가 자동 생성
- **일관된 브랜딩**: 가게 분위기에 맞는 감성 이미지와 캡션
- **간편한 사용**: 복사/다운로드 후 인스타에 바로 업로드

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js (App Router) | 14.2.x |
| **Language** | TypeScript | 5.4.x |
| **Styling** | Tailwind CSS + shadcn/ui | 3.4.x |
| **State** | Zustand | 4.5.x |
| **Forms** | React Hook Form + Zod | 7.51.x / 3.23.x |
| **Backend** | Next.js Route Handlers | 14.2.x |
| **Database** | Supabase (PostgreSQL) | latest |
| **ORM** | Prisma | 5.14.x |
| **Auth** | Supabase Auth | latest |
| **AI (캡션)** | OpenAI GPT-4o | latest |
| **AI (이미지)** | OpenAI DALL-E 3 | latest |
| **결제** | 토스페이먼츠 | latest |
| **이메일** | Resend | latest |
| **배포** | Vercel | - |

---

## 프로젝트 구조

```
instauto/
├── app/
│   ├── (auth)/              # 인증 (로그인/회원가입)
│   ├── (dashboard)/         # 대시보드 (홈/히스토리/설정)
│   ├── landing/             # 랜딩 페이지
│   ├── onboarding/          # 온보딩 (가게정보 입력)
│   └── api/                 # API Route Handlers
│       ├── auth/            # Supabase Auth 콜백
│       ├── content/         # 콘텐츠 생성/수정/조회
│       ├── cron/            # Vercel Cron Jobs
│       ├── history/         # 발행 히스토리
│       ├── onboarding/      # 온보딩 데이터 저장
│       ├── payment/         # 토스페이먼츠 결제
│       ├── settings/        # 설정 변경
│       └── subscription/    # 구독 관리
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── common/              # 공통 컴포넌트
│   ├── content/             # 콘텐츠 카드/에디터
│   ├── history/             # 히스토리 리스트
│   ├── landing/             # 랜딩 페이지 섹션
│   └── onboarding/          # 온보딩 폼
├── hooks/                   # Custom React Hooks
├── lib/
│   ├── supabase/            # Supabase 클라이언트
│   ├── openai/              # GPT-4o, DALL-E 3 함수
│   ├── toss/                # 토스페이먼츠 헬퍼
│   ├── resend/              # 이메일 발송
│   └── storage/             # Supabase Storage 헬퍼
├── stores/                  # Zustand 상태 관리
├── types/                   # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma        # 데이터베이스 스키마
├── middleware.ts            # 인증 미들웨어
└── vercel.json              # Cron Job 설정
```

---

## 로컬 실행 방법

### 사전 요구사항

- Node.js 20.x 이상
- npm 또는 yarn
- Supabase 계정
- OpenAI API 키

### Step 1: 패키지 설치

```bash
cd instauto
npm install
```

### Step 2: 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 각 값을 입력합니다. (상세 내용은 아래 "환경변수 설명" 참조)

### Step 3: Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Settings > API에서 URL과 키 복사
3. Settings > Database에서 Connection String 복사
4. Storage에서 `contents` 버킷 생성 (public)

### Step 4: 데이터베이스 마이그레이션

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 스키마를 데이터베이스에 반영
npx prisma db push
```

### Step 5: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 환경변수 설명

| 변수명 | 설명 | 발급 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase Dashboard](https://supabase.com/dashboard) > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (공개용) | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버용) | Supabase Dashboard > Settings > API |
| `DATABASE_URL` | PostgreSQL 연결 문자열 (Pooling) | Supabase Dashboard > Settings > Database > Connection String |
| `DIRECT_URL` | PostgreSQL 직접 연결 문자열 | Supabase Dashboard > Settings > Database > Connection String |
| `OPENAI_API_KEY` | OpenAI API 키 | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 | [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) |
| `TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 | 토스페이먼츠 개발자센터 |
| `TOSS_WEBHOOK_SECRET` | 토스페이먼츠 웹훅 시크릿 | 토스페이먼츠 개발자센터 > 웹훅 설정 |
| `RESEND_API_KEY` | Resend 이메일 API 키 | [Resend](https://resend.com/api-keys) |
| `FROM_EMAIL` | 발신 이메일 주소 | Resend에서 도메인 인증 후 설정 |
| `ENCRYPTION_KEY` | 민감 데이터 암호화 키 (32자+) | `openssl rand -base64 32` 명령어로 생성 |
| `CRON_SECRET` | Cron Job 인증 시크릿 | `openssl rand -hex 32` 명령어로 생성 |
| `NEXT_PUBLIC_APP_URL` | 앱 기본 URL | 로컬: `http://localhost:3000` / 프로덕션: 실제 도메인 |

---

## 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# 데이터베이스 스키마 반영
npx prisma db push

# 데이터베이스 마이그레이션 (프로덕션)
npx prisma migrate deploy

# Prisma Studio (DB GUI)
npx prisma studio
```

---

## 기능 구분

### Phase 1.0 (현재 구현됨)

| 기능 | 상태 | 설명 |
|------|------|------|
| AI 콘텐츠 생성 | 완료 | GPT-4o 캡션 + DALL-E 3 이미지 |
| 캡션 수정 | 완료 | 생성된 캡션 자유롭게 편집 |
| 이미지/캡션 재생성 | 완료 | 일일 제한 (Basic 3회, Pro 10회) |
| 복사/다운로드 | 완료 | 클립보드 복사 및 이미지 다운로드 |
| 발행 히스토리 | 완료 | 과거 콘텐츠 조회 |
| 14일 무료 체험 | 완료 | 회원가입 시 자동 적용 |
| 리뷰 연장 (+7일) | 완료 | 리뷰 URL 제출 시 체험 연장 |
| 이메일 알림 | 완료 | 체험 만료 전 알림 발송 |
| 회원가입/로그인 | 완료 | 이메일 + Google OAuth |
| 온보딩 | 완료 | 가게 정보 입력 |
| 가게 설정 변경 | 완료 | 이름, 분위기, 대표메뉴 수정 |

### Phase 1.1 (예정)

| 기능 | 상태 | 설명 |
|------|------|------|
| 토스페이먼츠 결제 | UI만 완료 | 실제 결제 연동 필요 |
| 인스타그램 자동 발행 | 미구현 | Meta Graph API 연동 예정 |
| 예약 발행 | 미구현 | 지정 시간에 자동 발행 |
| 정기 결제 (빌링) | 미구현 | 월 자동 결제 |

---

## 배포

자세한 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참조하세요.

### 빠른 배포 (Vercel)

1. GitHub에 코드 push
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경변수 모두 입력
4. Deploy 클릭

---

## 데이터 모델

### 주요 테이블

- **User**: 사용자 정보 (Supabase Auth와 연동)
- **Shop**: 가게 정보 (이름, 분위기, 대표메뉴)
- **Subscription**: 구독 정보 (플랜, 상태, 체험 기간)
- **Content**: 생성된 콘텐츠 (캡션, 이미지 URL, 상태)
- **Payment**: 결제 내역

### Enum 값

```
PlanType: BASIC, PRO
SubscriptionStatus: TRIAL, ACTIVE, PAST_DUE, CANCELED, EXPIRED
ContentStatus: GENERATING, READY, PUBLISHED, FAILED
PaymentStatus: PENDING, DONE, CANCELED, FAILED
```

---

## Cron Jobs

| 경로 | 스케줄 | 설명 |
|------|--------|------|
| `/api/cron/generate-daily` | 매일 08:00 KST | 전체 활성 유저 콘텐츠 자동 생성 |
| `/api/cron/trial-expiry-reminder` | 매일 09:00 KST | 체험 만료 D-3, D-1 이메일 알림 |

(vercel.json에 UTC 기준 설정됨: 23:00, 00:00)

---

## 트러블슈팅

### Prisma 관련 에러

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 스키마 변경 후 DB 동기화
npx prisma db push
```

### Supabase 연결 실패

- `.env.local` 파일의 URL과 키가 정확한지 확인
- Supabase 프로젝트가 Paused 상태가 아닌지 확인
- Connection String에서 `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 변경

### 이미지 로딩 오류

- `next.config.mjs`에 Supabase Storage 도메인이 추가되어 있는지 확인
- Supabase Storage `contents` 버킷이 public인지 확인

### OpenAI API 에러

- API 키가 유효한지 확인
- 사용량 한도(Rate Limit)에 도달하지 않았는지 확인
- GPT-4o 및 DALL-E 3 모델 접근 권한이 있는지 확인

---

## 라이선스

MIT License

---

## 문의

문제가 발생하면 GitHub Issues에 등록해주세요.
