# Instauto 배포 가이드

Vercel을 이용한 완전한 배포 가이드입니다.

---

## 목차

1. [Supabase 설정](#step-1-supabase-설정)
2. [외부 서비스 API 키 발급](#step-2-외부-서비스-api-키-발급)
3. [Prisma 마이그레이션](#step-3-prisma-마이그레이션)
4. [Vercel 배포](#step-4-vercel-배포)
5. [배포 후 체크리스트](#step-5-배포-후-체크리스트)

---

## Step 1: Supabase 설정

### 1.1 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. **New Project** 클릭
3. Organization 선택 (없으면 새로 생성)
4. 프로젝트 정보 입력:
   - **Name**: `instauto` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (꼭 메모해두세요)
   - **Region**: `Northeast Asia (Seoul)` 권장
5. **Create new project** 클릭
6. 프로젝트 생성 완료까지 약 2분 대기

### 1.2 API 키 수집

1. 좌측 메뉴 **Settings** (톱니바퀴) > **API**
2. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (Project API keys) → `SUPABASE_SERVICE_ROLE_KEY`

> service_role 키는 절대 클라이언트에 노출되면 안 됩니다.

### 1.3 Database 연결 문자열 수집

1. **Settings** > **Database**
2. **Connection string** 섹션에서:
   - **URI** 탭 선택
   - **Mode: Transaction** (pgBouncer) → `DATABASE_URL`
   - **Mode: Session** (Direct) → `DIRECT_URL`

3. 복사한 문자열에서 `[YOUR-PASSWORD]` 부분을 1.1에서 설정한 비밀번호로 변경

예시:
```
DATABASE_URL=postgresql://postgres.xxxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 1.4 Authentication 설정

#### 이메일 인증 활성화 (기본)

1. **Authentication** > **Providers**
2. **Email** 확인 (기본 활성화)
3. 필요시 **Confirm email** 옵션 비활성화 (개발 시 편의용)

#### Google OAuth 설정 (선택)

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** > **Credentials**
4. **Create Credentials** > **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs 추가:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
7. Client ID와 Client Secret 복사

8. Supabase로 돌아가서:
   - **Authentication** > **Providers** > **Google**
   - Google Client ID 입력
   - Google Client Secret 입력
   - **Save**

### 1.5 Storage 버킷 생성

1. **Storage** 메뉴 클릭
2. **New bucket** 클릭
3. 버킷 설정:
   - **Name**: `contents`
   - **Public bucket**: 체크 (ON)
4. **Create bucket** 클릭

### 1.6 Storage RLS 정책 설정

`contents` 버킷 클릭 후 **Policies** 탭:

#### 정책 1: 본인 파일 읽기 (SELECT)

```sql
-- Policy name: Users can read own content images
CREATE POLICY "Users can read own content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 정책 2: 본인 파일 업로드 (INSERT)

```sql
-- Policy name: Users can upload own content images
CREATE POLICY "Users can upload own content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 정책 3: 본인 파일 삭제 (DELETE)

```sql
-- Policy name: Users can delete own content images
CREATE POLICY "Users can delete own content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 정책 4: Public 읽기 (모든 사용자)

```sql
-- Policy name: Public can read content images
CREATE POLICY "Public can read content images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contents');
```

> 또는 버킷을 Public으로 설정했다면 위 정책 없이도 읽기 가능합니다.

---

## Step 2: 외부 서비스 API 키 발급

### 2.1 OpenAI API 키

1. [OpenAI Platform](https://platform.openai.com) 로그인
2. 우측 상단 프로필 > **View API keys**
3. **Create new secret key** 클릭
4. 키 이름 입력 (예: `instauto-production`)
5. 생성된 키 복사 → `OPENAI_API_KEY`

> GPT-4o 및 DALL-E 3 접근 권한이 있는 계정이어야 합니다.
> 신규 계정은 일정 금액 결제 후 사용 가능할 수 있습니다.

**예상 비용 (유저 1명 기준)**:
- GPT-4o 캡션 생성: ~$0.01/요청
- DALL-E 3 이미지 생성: ~$0.04/요청 (1024x1024)
- 일일 총: ~$0.05/유저

### 2.2 토스페이먼츠 키 (결제 연동 시)

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com) 회원가입/로그인
2. **내 개발정보** 클릭
3. 테스트 키 확인:
   - **클라이언트 키** → `TOSS_CLIENT_KEY` (test_ck_...)
   - **시크릿 키** → `TOSS_SECRET_KEY` (test_sk_...)

4. 웹훅 설정 (선택):
   - **개발자센터** > **웹훅** > **웹훅 등록**
   - URL: `https://your-domain.com/api/payment/webhook`
   - 이벤트: `PAYMENT_STATUS_CHANGED` 선택
   - 생성된 웹훅 시크릿 → `TOSS_WEBHOOK_SECRET`

**실제 결제 전환 시**:
- 사업자 인증 완료 후 **라이브 키**로 교체
- `test_ck_...` → `live_ck_...`
- `test_sk_...` → `live_sk_...`

### 2.3 Resend API 키 (이메일 발송)

1. [Resend](https://resend.com) 회원가입/로그인
2. **API Keys** 메뉴
3. **Create API Key** 클릭
4. 키 이름 입력 후 생성
5. 생성된 키 복사 → `RESEND_API_KEY`

**발신 도메인 설정**:
1. **Domains** 메뉴 > **Add Domain**
2. 도메인 입력 (예: `instauto.kr`)
3. DNS 레코드 추가 안내에 따라 설정
4. 인증 완료 후 → `FROM_EMAIL=Instauto <noreply@instauto.kr>`

> 도메인 인증 없이는 `onboarding@resend.dev`만 사용 가능 (테스트용)

### 2.4 암호화 키 및 Cron Secret 생성

터미널에서 실행:

```bash
# ENCRYPTION_KEY (Instagram 토큰 등 암호화용)
openssl rand -base64 32
# 결과 예: K7xP9mN2qR5tY8wZ1aB4cD7fG0hJ3kL6=

# CRON_SECRET (Cron Job 인증용)
openssl rand -hex 32
# 결과 예: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Windows (PowerShell):
```powershell
# ENCRYPTION_KEY
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# CRON_SECRET
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

---

## Step 3: Prisma 마이그레이션

### 로컬에서 먼저 테스트

```bash
# 1. 환경변수 설정 확인
cat .env.local

# 2. Prisma 클라이언트 생성
npx prisma generate

# 3. 스키마를 데이터베이스에 반영 (개발용)
npx prisma db push

# 4. (선택) Prisma Studio로 테이블 확인
npx prisma studio
```

### 프로덕션 마이그레이션

처음 배포 시에만 마이그레이션 파일 생성:

```bash
# 마이그레이션 생성 (로컬)
npx prisma migrate dev --name init

# 프로덕션 적용
npx prisma migrate deploy
```

> Vercel 배포 시 `postinstall` 스크립트가 `prisma generate`를 자동 실행합니다.

---

## Step 4: Vercel 배포

### 4.1 GitHub 준비

```bash
# 1. Git 초기화 (아직 안 했다면)
git init

# 2. .gitignore 확인 (.env.local이 포함되어 있는지)
cat .gitignore

# 3. 커밋
git add .
git commit -m "Initial commit"

# 4. GitHub 리포지토리 생성 후 push
git remote add origin https://github.com/your-username/instauto.git
git branch -M main
git push -u origin main
```

### 4.2 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 로그인
2. **Add New** > **Project**
3. GitHub 리포지토리 선택 (`instauto`)
4. **Import**

### 4.3 환경변수 설정

**Configure Project** 화면에서 **Environment Variables** 섹션:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGc... | All |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... | All |
| `DATABASE_URL` | postgresql://... (Transaction) | All |
| `DIRECT_URL` | postgresql://... (Session) | All |
| `OPENAI_API_KEY` | sk-... | All |
| `TOSS_SECRET_KEY` | test_sk_... | All |
| `TOSS_CLIENT_KEY` | test_ck_... | All |
| `TOSS_WEBHOOK_SECRET` | (웹훅 시크릿) | All |
| `RESEND_API_KEY` | re_... | All |
| `FROM_EMAIL` | Instauto <noreply@instauto.kr> | All |
| `ENCRYPTION_KEY` | (32자 랜덤 문자열) | All |
| `CRON_SECRET` | (64자 랜덤 hex) | All |
| `NEXT_PUBLIC_APP_URL` | https://instauto.vercel.app | All |

> `NEXT_PUBLIC_APP_URL`은 배포 후 실제 도메인으로 업데이트

### 4.4 빌드 설정 확인

기본 설정 그대로 사용:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (자동 감지)
- **Output Directory**: `.next` (자동 감지)

### 4.5 배포

**Deploy** 클릭 후 빌드 완료 대기 (약 2-3분)

### 4.6 Cron Job 확인

배포 완료 후:
1. Vercel Dashboard > 프로젝트 > **Settings** > **Crons**
2. `vercel.json`에 정의된 Cron Job 확인:
   - `/api/cron/generate-daily` - 매일 23:00 UTC (08:00 KST)
   - `/api/cron/trial-expiry-reminder` - 매일 00:00 UTC (09:00 KST)

### 4.7 커스텀 도메인 연결 (선택)

1. **Settings** > **Domains**
2. 도메인 입력 (예: `instauto.kr`)
3. DNS 설정 안내에 따라 A 레코드 또는 CNAME 추가
4. SSL 인증서 자동 발급 대기

---

## Step 5: 배포 후 체크리스트

### 필수 테스트

#### 1. 회원가입 플로우
- [ ] `/signup`에서 이메일/비밀번호 회원가입
- [ ] 이메일 확인 (Confirm email 설정 시)
- [ ] Google OAuth 로그인 (설정한 경우)

#### 2. 온보딩 플로우
- [ ] 가게 이름 입력
- [ ] 분위기 키워드 3개 선택
- [ ] 대표 메뉴 입력
- [ ] 온보딩 완료 후 홈으로 이동

#### 3. 콘텐츠 생성
- [ ] 홈 화면에서 AI 콘텐츠 자동 생성 시작
- [ ] 이미지 생성 완료 확인
- [ ] 캡션 생성 완료 확인
- [ ] 캡션 수정 기능 작동
- [ ] 이미지/캡션 재생성 버튼 작동
- [ ] 재생성 횟수 제한 확인

#### 4. 복사/다운로드
- [ ] 캡션 복사 버튼
- [ ] 이미지 다운로드 버튼
- [ ] "발행 완료" 상태 변경

#### 5. 히스토리
- [ ] 과거 콘텐츠 목록 조회
- [ ] 과거 콘텐츠 상세 보기

#### 6. 설정
- [ ] 가게 정보 수정
- [ ] 구독 정보 표시 (체험 남은 일수)

### Cron Job 수동 테스트

```bash
# 콘텐츠 자동 생성 테스트
curl -X GET "https://your-domain.com/api/cron/generate-daily" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 체험 만료 알림 테스트
curl -X GET "https://your-domain.com/api/cron/trial-expiry-reminder" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 결제 테스트 (Phase 1.1)

토스페이먼츠 테스트 카드:
- 카드번호: `4330000000000001`
- 유효기간: 미래 아무 날짜
- CVC: 아무 3자리
- 비밀번호: 아무 2자리

---

## 환경별 설정 요약

| 환경 | Supabase | Toss | URL |
|------|----------|------|-----|
| 개발 (Local) | 테스트 프로젝트 | test_sk_... | localhost:3000 |
| 스테이징 | 테스트 프로젝트 | test_sk_... | staging.instauto.kr |
| 프로덕션 | 실제 프로젝트 | live_sk_... | instauto.kr |

---

## 문제 해결

### 빌드 실패

```
Error: Cannot find module '@prisma/client'
```
해결: `postinstall` 스크립트 확인 (`"postinstall": "prisma generate"`)

### Supabase 연결 실패

```
Error: Connection refused
```
해결:
1. `DATABASE_URL`의 비밀번호 확인
2. Supabase 프로젝트가 Paused 상태인지 확인 (무료 플랜 7일 미사용 시)

### Cron Job 실행 안 됨

해결:
1. `vercel.json` 파일이 루트에 있는지 확인
2. Vercel Pro 플랜 필요 (무료 플랜은 일 1회 제한)
3. `CRON_SECRET` 환경변수 설정 확인

### 이미지 생성 실패

```
Error: OpenAI API rate limit exceeded
```
해결:
1. OpenAI 계정 결제 정보 확인
2. Rate Limit 대기 후 재시도
3. 필요시 Tier 업그레이드

---

## 비용 예상

### 월간 비용 (100명 유저 기준)

| 항목 | 예상 비용 |
|------|-----------|
| Vercel (Pro) | $20/월 |
| Supabase (Free → Pro) | $0 ~ $25/월 |
| OpenAI API | ~$150/월 (100명 x 30일 x $0.05) |
| Resend | $0 (월 3,000건 무료) |
| **총합** | ~$170 ~ $195/월 |

### 수익 시뮬레이션

- 유료 전환율 10%: 10명 x 19,900원 = 199,000원/월
- 유료 전환율 20%: 20명 x 19,900원 = 398,000원/월

---

## 다음 단계

1. 실사용자 피드백 수집
2. Phase 1.1 기능 개발 (인스타 자동 발행)
3. 마케팅 시작
4. 프로덕션 결제 연동

---

배포 관련 문의는 GitHub Issues에 등록해주세요.
