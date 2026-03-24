# QA 테스트 결과 보고서
**역할**: QA Engineer
**검토 대상**: Wave 3 생성 코드 (BE: Fastify API + Socket.io / FE: Next.js 14)
**일자**: 2026-03-20

---

## 테스트 시나리오 및 결과

### 시나리오 1: 회원가입 → 워크스페이스 생성 → 위젯 설치

**테스트 흐름**
1. `POST /auth/signup` (이메일+비밀번호)
2. `POST /workspace` (워크스페이스 이름)
3. `GET /widget/:workspaceId/script` (embed 스크립트 조회)
4. 위젯 JS 로드 확인

**예상 결과**
- 회원가입 후 JWT 발급
- 워크스페이스 생성 → widgetToken 자동 발급
- embed script 태그 정상 생성

**코드 검토 결과**
- ✅ `auth.ts`: 이메일 중복 체크 (409), bcrypt 해시, 이메일 발송 비동기 처리
- ✅ `workspace.ts`: userId 유니크 제약 → 중복 생성 방지 (409)
- ✅ Widget embed script에 `widgetToken` 포함 확인
- ⚠️ **이슈**: `GET /widget/:workspaceId/script`는 인증 없이 접근 가능 — workspaceId 노출 위험. 마케터 authenticated route로 변경 권장.

---

### 시나리오 2: 실시간 채팅 (방문자 → 마케터)

**테스트 흐름**
1. 위젯 JS 로드 → Socket.io `/widget` 네임스페이스 연결
2. `widgetToken` 인증 → 채팅방 자동 생성 또는 복원
3. 방문자 메시지 전송 (`message:send`)
4. 마케터 대시보드 `/dashboard` 네임스페이스에서 `message:new` 수신
5. 마케터 응답 전송
6. 방문자 위젯에서 응답 수신 확인

**코드 검토 결과**
- ✅ `widget.ts`: widgetToken 검증 미들웨어 정상
- ✅ 방문자 localStorage visitorId로 세션 복원 로직 확인
- ✅ `dashboard.ts`: JWT 검증 미들웨어 정상
- ✅ Redis Adapter → 멀티 인스턴스 확장 가능
- ✅ `room:init` 이벤트로 초기 메시지+결제링크 한번에 전달
- ⚠️ **이슈**: `message:send` 이벤트에서 roomId를 socket에서 가져오는데, 위젯 socket에는 roomId를 저장하지만 race condition 가능. `socket.data`로 이관 권장.
- ✅ 타이핑 인디케이터 양방향 구현 확인

---

### 시나리오 3: 결제 링크 생성 → 결제 완료 → 실시간 상태 업데이트

**테스트 흐름**
1. 마케터: `POST /payment-link` (roomId, productName, amount, pgProvider)
2. 카카오페이 Ready API 호출 → tid 발급
3. 방문자: 위젯에서 결제 버블의 "결제하기" 클릭 → 카카오페이 결제창
4. 결제 완료 후 카카오페이 → `POST /webhook/kakaopay` 호출
5. DB 업데이트 → Socket.io `payment:updated` emit
6. 마케터/방문자 UI에서 "결제 완료" 상태 실시간 반영

**코드 검토 결과**
- ✅ `payment-link.ts`: Redis 멱등성 체크로 중복 웹훅 방지
- ✅ 카카오페이/토스 webhook 모두 구현
- ✅ `payment:updated` Socket.io emit 양쪽 네임스페이스로 전송
- ✅ FE `PaymentBubble`: status별 CSS transition 애니메이션
- ✅ 브라우저 Notification API + 탭 타이틀 변경 구현
- ⚠️ **이슈 (CRITICAL)**: 카카오페이 Webhook에서 `pg_token`을 body로 받지만, 실제 카카오페이 단건결제 Webhook은 `pg_token`을 보내지 않음. `pg_token`은 결제창 redirect URL 파라미터로만 오므로 `/payment-callback/kakaopay/approve` 별도 엔드포인트 필요.
- ⚠️ **이슈**: 토스 webhook 시그니처 검증 미구현 (보안 취약점)

---

## 버그 목록

| # | 심각도 | 위치 | 내용 |
|---|--------|------|------|
| BUG-01 | CRITICAL | `routes/payment-link.ts` L.webhook/kakaopay | 카카오페이 승인 흐름 수정 필요: webhook이 아닌 redirect URL에서 pg_token 받아야 함 |
| BUG-02 | HIGH | `routes/payment-link.ts` L.webhook/toss | 토스 webhook 시그니처 검증 미구현 |
| BUG-03 | MEDIUM | `socket/widget.ts` | `(socket as any).roomId` race condition → `socket.data` 사용 권장 |
| BUG-04 | MEDIUM | `routes/workspace.ts` | `/widget/:workspaceId/script` 비인증 접근 가능 |
| BUG-05 | LOW | `web/app/(dashboard)/chat/[roomId]/page.tsx` | 소켓 이벤트 중복 등록 가능성 (ChatPage와 ChatRoomPage 동시 마운트 시) |

---

## 테스트 커버리지 요약

| 영역 | 구현 완성도 | 비고 |
|------|------------|------|
| Auth (회원가입/로그인/이메일인증) | 95% | 이메일 인증 만료 TTL 미구현 |
| Workspace/Widget 설정 | 90% | Script 엔드포인트 인증 보강 필요 |
| 실시간 채팅 | 95% | 핵심 기능 정상 |
| 결제 링크 생성 | 80% | 카카오페이 승인 흐름 수정 필요 |
| Webhook 처리 | 70% | 시그니처 검증 필요 |
| 대시보드/통계 | 90% | 정상 구현 |
| 위젯 (Vanilla TS) | 90% | Shadow DOM, 결제 버블, 타이핑 정상 |

---

## 전체 평가

**코드 품질**: B+ (MVP 기준 충분)
**보안**: B- (PG Webhook 보안 보강 필요)
**실시간 성능**: A (Redis Adapter 기반, 확장 가능)
**무료 론칭 준비도**: ✅ (플랜/결제 구독 코드 없음 확인)
