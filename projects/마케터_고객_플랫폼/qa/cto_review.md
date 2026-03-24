# CTO 통합 리뷰
**역할**: CTO (Claude Opus)
**기반**: Wave 3 전체 코드 + QA 결과 (test_results.md)
**일자**: 2026-03-20

---

## FE + BE 통합 검증

### 아키텍처 평가

**BE (Fastify + Socket.io + Redis)**
- Fastify plugin 구조로 잘 분리됨 (prisma, redis, auth, cors)
- Socket.io 네임스페이스 분리 (`/dashboard`, `/widget`) — 보안 및 관심사 분리 적절
- Redis Adapter 적용으로 수평 확장 가능
- Prisma schema에서 플랜/구독 관련 필드 완전 제거 확인 (리안 요구사항 충족)
- `PlanType` enum 제거, `monthChatCount`, `trialEndsAt` 등 제거 — CLEAN

**FE (Next.js 14 App Router)**
- `(auth)` / `(dashboard)` Route Groups로 레이아웃 분리 깔끔
- Zustand 스토어 분리 (auth, chat) 적절
- Socket.io 클라이언트 싱글톤 패턴 올바름
- `getDashboardSocket`에서 토큰 변경 시 재연결 처리 확인 필요

**Widget (Vanilla TS)**
- Shadow DOM으로 호스트 사이트 CSS 격리 올바름
- `visitorId` localStorage 세션 복원 로직 정상
- esbuild 번들 설정으로 단일 파일 배포 적합

---

## CRITICAL 이슈 상세 분석

### BUG-01: 카카오페이 결제 승인 흐름 수정 (CRITICAL)

**문제**: 현재 구현은 카카오페이 Webhook에서 `pg_token`을 받아 승인 처리하려 하지만, 카카오페이 온라인 단건결제의 실제 흐름은:

```
1. Ready API → next_redirect_pc_url 반환
2. 사용자가 결제창 완료
3. 카카오페이가 approval_url?pg_token=xxx로 redirect
4. 우리 서버가 pg_token 받아서 Approve API 호출
5. Webhook은 선택적으로 따로 옴 (pg_token 없음)
```

**수정 방향**: `/payment-callback/kakaopay/approve` 엔드포인트 추가

---

## HIGH 이슈 상세 분석

### BUG-02: 토스 Webhook 시그니처 검증

토스페이먼츠는 webhook 전송 시 `TossPayments-Signature` 헤더를 포함.
HMAC-SHA256으로 검증해야 함.

---

## 통합 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| BE ↔ FE CORS 설정 | ✅ | WEB_URL 환경변수로 분리 |
| JWT 토큰 헤더 자동 주입 | ✅ | axios interceptor |
| Socket.io 인증 | ✅ | JWT (dashboard) + widgetToken (widget) |
| 에러 응답 형식 일관성 | ✅ | `{ error: string }` 통일 |
| 플랜/구독 코드 제거 | ✅ | Workspace 모델에서 plan 필드 없음 |
| 구독 route 없음 | ✅ | subscription.ts 없음 확인 |
| 결제 링크 PG 연동 | 🔶 | CRITICAL 수정 후 정상 |
| 무료 론칭 준비 | ✅ | 가입 즉시 전체 기능 이용 가능 |

---

## 배포 준비도 평가

```
Backend (Railway):
  - Fastify + PostgreSQL + Redis: 즉시 배포 가능
  - prisma migrate deploy 필요

Frontend (Vercel):
  - Next.js 14 App Router: 즉시 배포 가능
  - NEXT_PUBLIC_API_URL 환경변수 설정 필요

Widget CDN:
  - esbuild dist/widget.js → API 서버에서 정적 파일 서빙
  - 또는 Vercel public 폴더 배포
```

---

## CTO 최종 의견

Wave 3 구현은 MVP 론칭 기준으로 충분한 품질을 갖추고 있습니다.

**즉시 배포 차단 이슈**: BUG-01 (카카오페이 승인 흐름) — Wave 6.5에서 자동 수정 예정

**다음 스프린트에서 처리**: BUG-02 (토스 시그니처), BUG-03, BUG-04

**리안 확인 필요**: 카카오페이/토스페이먼츠 가맹점 신청이 선행되어야 실결제 테스트 가능.

**무료 론칭 조건 충족**: 구독/플랜 관련 코드 전혀 없음. 회원가입 즉시 전체 기능 사용 가능.
