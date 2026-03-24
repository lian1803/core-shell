# CTO 통합 리뷰 - instauto

**리뷰 일시**: 2026-03-19
**리뷰어**: CTO (Claude Opus)
**대상**: 소상공인 인스타그램 자동화 서비스 MVP (Phase 1.0)

---

## 종합 판정: APPROVED (조건부)

> 핵심 기능 정상 작동 예상. Critical 문제 수정 완료. 배포 전 체크리스트 확인 필요.

---

## Engineering Rules 준수 현황

| Rule | 상태 | 비고 |
|------|------|------|
| RULE-01 (API 응답 형식) | PASS | 모든 API가 `{ success, data?, error? }` 형식 사용. `successResponse()`, `errorResponse()` 헬퍼 함수로 일관성 유지 |
| RULE-02 (인증 검증) | PASS | 모든 보호된 API에서 `supabase.auth.getUser()` 호출. 미들웨어에서 1차 검증, API에서 2차 검증 |
| RULE-03 (환경변수 구분) | PASS | `NEXT_PUBLIC_` 접두사가 클라이언트용 변수에만 사용됨 (SUPABASE_URL, SUPABASE_ANON_KEY, TOSS_CLIENT_KEY, APP_URL) |
| RULE-04 (외부 API try-catch) | PARTIAL | OpenAI, Toss API 호출에 try-catch 있음. **단, retry 로직 미구현 (권장 개선 사항)** |
| RULE-05 (Prisma 트랜잭션) | PASS | 온보딩(Shop+Subscription), 결제 확인(Payment+Subscription), 웹훅 처리에서 `$transaction` 사용 |
| RULE-06 (Token 암호화) | PASS | AES-256-GCM 암호화 함수 구현됨 (`encrypt`, `decrypt`). Phase 1.0이므로 IG 연동 미사용 |
| RULE-07 (재생성 횟수 제한) | PASS | BASIC 3회, PRO 10회 정확히 구현. 날짜 변경 시 카운트 리셋 로직 정상 |
| RULE-08 (Cron CRON_SECRET) | PASS | 미들웨어와 Cron API에서 이중 검증. `Bearer ${CRON_SECRET}` 형식 |
| RULE-09 (SC/CC 분리) | PASS | 페이지 컴포넌트에 `'use client'` 지시자 적절히 사용. Server Component는 지시자 없음 |
| RULE-10 (Zod 스키마 공유) | PASS | `types/index.ts`에 모든 Zod 스키마 중앙 집중. API와 클라이언트에서 동일 스키마 import |

---

## 발견된 문제 + 수정 내역

### Critical (즉시 수정 필요) - 수정 완료

#### 1. 환경변수 누락 - `.env.example`
**위치**: `.env.example`

**문제**: 코드에서 사용하는 환경변수가 .env.example에 누락됨
- `CRON_SECRET` - Cron Job 인증에 필수
- `ENCRYPTION_KEY` - Token 암호화에 필수
- `TOSS_WEBHOOK_SECRET` - 웹훅 시그니처 검증에 필수
- `RESEND_API_KEY` - 이메일 발송에 필수

**조치**: [수정 완료] `.env.example` 파일에 누락된 환경변수 추가됨

#### 2. 결제 확인 시 orderId 중복 체크 미구현
**위치**: `app/api/payment/confirm/route.ts`

**문제**: amount 검증만 하고 orderId 중복 체크 미구현. 동일한 orderId로 재요청 시 중복 결제 가능성

**조치**: [수정 완료] orderId 중복 검증 로직 추가됨 (line 40-50)

#### 3. Content Generate API - runtime 및 maxDuration 문제
**위치**: `app/api/content/generate/route.ts`

**문제**:
1. `runtime = 'edge'`로 설정되어 있었음 (Prisma, Sharp 사용 불가)
2. `maxDuration` 미설정 (Vercel 타임아웃 위험)

**조치**: [수정 완료]
- `runtime = 'nodejs'`로 변경
- `maxDuration = 60` 추가

### High (배포 전 수정 권장) - 미수정

#### 4. OpenAI API retry 로직 미구현
**위치**: `lib/openai/generateCaption.ts`, `lib/openai/generateImage.ts`

**문제**: API 호출 실패 시 즉시 에러 반환. Rate limit이나 일시적 장애 시 재시도 없음

**권장안**: exponential backoff retry 로직 추가
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
}
```

**상태**: Phase 1.1에서 구현 권장

#### 5. 이미지 다운로드 시 CORS 이슈 가능성
**위치**: `components/content/ContentCard.tsx` (line 47-58)

**문제**: 클라이언트에서 직접 Supabase Storage URL fetch. CORS 설정에 따라 실패 가능

**권장안**: `app/api/content/[contentId]/download/route.ts` API를 통한 다운로드 처리

**상태**: Supabase Storage Public 버킷으로 설정 시 문제 없음. 모니터링 필요

### Low (개선 권장) - 미수정

#### 6. 오래된 콘텐츠 정리 로직 미구현
**문제**: FAILED 상태 콘텐츠나 오래된 콘텐츠 정리 Cron Job 없음

**권장**: 30일 이상 오래된 콘텐츠 자동 삭제 Cron 추가 (Phase 1.1)

#### 7. useEffect 의존성 배열 경고
**위치**: `app/(dashboard)/home/page.tsx` (line 16-25)

**문제**: `useEffect` 의존성 배열에 함수들 누락 가능성

**권장**: ESLint 경고 확인 후 수정

#### 8. 캡션 길이 불일치
**문제**: Prisma 스키마의 `caption`은 `String` (무제한), Zod 스키마의 `editedCaption`은 2200자 제한

**권장**: 일관성을 위해 생성 시에도 동일 제한 적용 권장

---

## 보안 점검 결과

| 항목 | 상태 | 조치 |
|------|------|------|
| SQL Injection | SAFE | Prisma ORM 사용으로 자동 방어 |
| XSS | SAFE | React/Next.js 기본 이스케이핑, `escapeHtml` 유틸 존재 |
| CSRF | SAFE | SameSite 쿠키 + API 인증 토큰 |
| 유저 간 데이터 격리 | SAFE | 모든 쿼리에 `userId` 필터링, 본인 데이터 접근 검증 |
| 환경변수 노출 | SAFE | 서버 전용 키에 NEXT_PUBLIC_ 미사용 |
| Cron 엔드포인트 보호 | SAFE | CRON_SECRET 헤더 검증 |
| 토스 웹훅 검증 | PASS | HMAC-SHA256 시그니처 검증 구현 |
| 민감 데이터 암호화 | PASS | AES-256-GCM 암호화 함수 준비됨 |
| 결제 중복 방지 | PASS | [수정 완료] orderId 중복 체크 추가됨 |

---

## 기술 리스크 확인

| 항목 | 상태 | 비고 |
|------|------|------|
| SSE Runtime | OK | [수정 완료] `export const runtime = 'nodejs'` 설정됨 |
| Vercel 타임아웃 | OK | [수정 완료] `maxDuration = 60` 설정됨 |
| Prisma 스키마 완전성 | OK | 모든 모델, enum, 인덱스 정의됨 |
| Sharp 버전 | OK | 0.33.4 - Vercel Node.js 18+ 호환 |
| Supabase Storage | OK | Admin 클라이언트로 서버에서 업로드 |

---

## 수정된 파일 목록

1. **`.env.example`** - 환경변수 목록 보완
   - TOSS_WEBHOOK_SECRET 추가
   - RESEND_API_KEY, FROM_EMAIL 추가
   - ENCRYPTION_KEY 추가
   - CRON_SECRET 추가

2. **`app/api/content/generate/route.ts`** - 런타임 및 타임아웃 설정
   - `runtime = 'edge'` -> `runtime = 'nodejs'` 변경
   - `maxDuration = 60` 추가

3. **`app/api/payment/confirm/route.ts`** - 중복 결제 방지
   - orderId 중복 검증 로직 추가 (step 3)

---

## 배포 전 필수 체크리스트

- [ ] `.env.local`에 모든 환경변수 설정
  - CRON_SECRET (랜덤 문자열: `openssl rand -hex 32`)
  - ENCRYPTION_KEY (랜덤 문자열: `openssl rand -base64 32`)
  - TOSS_WEBHOOK_SECRET (토스 대시보드에서 확인)
  - RESEND_API_KEY
- [ ] Supabase Storage 버킷 `contents` 생성 및 Public 설정
- [ ] Supabase Auth 설정 (Google OAuth 콜백 URL)
- [ ] Vercel 환경변수 설정
- [ ] Prisma 마이그레이션 실행 (`prisma migrate deploy`)
- [ ] 토스페이먼츠 웹훅 URL 등록

---

## 아키텍처 검토

```
[클라이언트] --(HTTPS)--> [Vercel Node.js]
                              |
                    +---------+---------+
                    |                   |
              [Supabase Auth]    [Prisma Client]
                    |                   |
              [JWT 검증]          [PostgreSQL]
                                        |
                              [Supabase Storage]

[OpenAI API] <-- generateCaption/generateImage
[Toss API] <-- 결제 확인/빌링
[Resend API] <-- 이메일 발송

[Vercel Cron] --> /api/cron/generate-daily (매일 8시 KST)
            --> /api/cron/trial-expiry-reminder (매일 9시 KST)
```

**평가**:
- MVP로서 적절한 복잡도
- 외부 서비스 의존도 관리 가능한 수준
- 확장성: Instagram Graph API 연동 시 별도 모듈로 분리 권장

---

## 다음 단계 권고사항

### Phase 1.1 (Instagram 자동 발행)
1. Instagram Graph API OAuth 연동 모듈 추가
2. Access Token 암호화 저장 (encrypt/decrypt 활용)
3. 자동 발행 스케줄러 구현
4. 발행 실패 시 알림 로직

### 기술 부채 해소
1. OpenAI API retry 로직 구현
2. 에러 모니터링 도구 연동 (Sentry 등)
3. 로깅 체계화 (structured logging)
4. E2E 테스트 추가

### 성능 최적화
1. 이미지 CDN 캐싱 최적화
2. API 응답 캐싱 (SWR/React Query stale-while-revalidate)
3. DB 쿼리 최적화 (N+1 문제 모니터링)

---

## 결론

instauto MVP 코드베이스는 전반적으로 Engineering Rules를 잘 준수하고 있으며, 보안 측면에서도 기본적인 방어가 구현되어 있다.

**수정 완료된 사항**:
1. `.env.example` 환경변수 목록 보완
2. `content/generate` API - runtime을 nodejs로 변경, maxDuration 설정
3. 결제 API - orderId 중복 검증 추가

**배포 조건**:
- 배포 전 체크리스트의 환경변수 설정 완료 시 배포 가능

**최종 판정: APPROVED (조건부)**

배포 전 체크리스트 완료 후 배포를 진행할 수 있다.

---

*CTO 리뷰 완료 - 2026-03-19*
