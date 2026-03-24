# InstaAuto 설치 및 실행 가이드

## 1. 사전 준비

### 필수 도구
- Node.js 20.x 이상
- npm 또는 yarn
- Git

### 필수 서비스
- Supabase 계정 (데이터베이스 + 인증)
- OpenAI API 키 (GPT-4o + DALL-E 3)

## 2. 프로젝트 클론 (선택)

```bash
git clone [repository-url]
cd instauto
```

## 3. 패키지 설치

```bash
npm install
```

## 4. Supabase 설정

### 4.1 프로젝트 생성
1. https://supabase.com 접속
2. New Project 클릭
3. 프로젝트 이름 입력 및 생성

### 4.2 환경변수 수집
- Settings > API
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

- Settings > Database
  - Connection String (Direct) → `DIRECT_URL`
  - Connection Pooling String → `DATABASE_URL`

### 4.3 Google OAuth 설정 (선택)
1. Settings > Authentication > Providers
2. Google 활성화
3. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
4. Redirect URL: `https://[your-project].supabase.co/auth/v1/callback`

## 5. 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_connection_pooling_string
DIRECT_URL=your_direct_connection_string

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. 데이터베이스 초기화

```bash
# Prisma 스키마를 Supabase에 푸시
npx prisma db push

# (선택) Prisma Studio로 데이터 확인
npx prisma studio
```

## 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 8. 첫 사용자 생성

1. /signup 페이지 접속
2. 이메일/비밀번호로 회원가입
3. 가게 정보 입력 (온보딩)
4. 홈 화면에서 AI 콘텐츠 자동 생성 시작

## 9. 주요 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm start

# 데이터베이스 마이그레이션
npx prisma db push

# Prisma Studio (DB GUI)
npx prisma studio

# Lint
npm run lint
```

## 10. 배포 (Vercel)

### 10.1 Vercel 프로젝트 생성
```bash
npm install -g vercel
vercel
```

### 10.2 환경변수 설정
Vercel Dashboard > Settings > Environment Variables에서 모든 환경변수 입력

### 10.3 배포
```bash
vercel --prod
```

## 트러블슈팅

### Prisma 에러
```bash
# Prisma 클라이언트 재생성
npx prisma generate
```

### Supabase 연결 오류
- `.env.local` 파일의 환경변수 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 이미지 로딩 오류
- `next.config.mjs`에 이미지 도메인 추가 확인
- Supabase Storage 설정 확인

## 문의

문제가 발생하면 GitHub Issues에 등록해주세요.
