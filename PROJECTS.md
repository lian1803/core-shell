# 프로젝트 목록

> 리안 컴퍼니가 생성한 프로젝트들. 각 폴더에서 Claude Code 열고 `/work` 입력하면 개발 재개.

---

## 시스템

| 이름 | 폴더 | 뭐하는 거 |
|------|------|-----------|
| 리안 컴퍼니 | `lian_company/` | AI 기획 엔진. 아이디어 입력 → 시장조사/전략/PRD/설계서 자동 생성 → projects/ 저장 |

**리안 컴퍼니 실행법**: `cd lian_company && venv/Scripts/python.exe main.py "아이디어"`

---

## 개발된 프로젝트

### 1. 마케터-고객 실시간 채팅 + 결제 연동
- **폴더**: `projects/마케터-고객_실시간_채팅_MVP_채팅/`
- **뭐하는 거**: 마케터와 고객이 채팅하면서, 채팅창 안에서 결제 링크 전송/결제까지 가능
- **주요 기능**: 실시간 채팅, 채팅 내 결제 링크 생성, 결제 완료 알림
- **스택**: Node.js / Fastify / Next.js / Socket.io / PostgreSQL / Redis
- **상태**: 코드 있음 (chatpay/)

### 2. 소상공인 실연락처 수집 자동화
- **폴더**: `projects/소상공인_실연락처_수집_자동화_시스템/`
- **뭐하는 거**: 구글 비즈니스, 당근마켓, 네이버 블로그, 인스타에서 소상공인 실제 연락처 자동 수집 → CSV
- **주요 기능**: 멀티소스 크롤링, 안심번호(050) 자동 필터링, 업종별 분류, CSV 다운로드
- **스택**: Node.js / Next.js / Playwright / PostgreSQL / Redis / BullMQ
- **상태**: 코드 있음 (contact-collector/)

### 3. 네이버 플레이스 자동 진단 + PPT 제안서
- **폴더**: `projects/네이버_플레이스_자동_진단_+_PPT/`
- **뭐하는 거**: 네이버 플레이스 URL 입력 → 자동 진단 → PPT 제안서 생성
- **주요 기능**: 플레이스 크롤링, 경쟁사 비교, PPT 자동 생성, 다운로드
- **스택**: FastAPI / Python / Playwright / python-pptx / SQLite
- **상태**: 코드 있음 (src/)

### 4. 소상공인 인스타그램 자동화
- **폴더**: `projects/소상공인_사장님들(카페,_네일샵,_식/`
- **뭐하는 거**: 사진 업로드 → AI가 캡션/이미지 자동 생성 → 인스타 예약 발행
- **주요 기능**: GPT-4o 캡션 생성, DALL-E 이미지 생성, 예약 발행, 결제(토스페이먼츠), Meta Graph API 연동
- **스택**: Next.js / TypeScript / Supabase / OpenAI / Meta Graph API / Vercel
- **상태**: 코드 있음 (instauto/)

### 5. 포천 영업타겟 자동발굴
- **폴더**: `projects/포천_영업타겟_자동발굴/`
- **뭐하는 거**: 포천 지역 영업 타겟 자동 검색 → 엑셀 출력
- **주요 기능**: 지역 타겟 크롤링, 엑셀(.xlsx) 자동 저장
- **스택**: Python 스크립트 (단독 실행)
- **상태**: main.py, main_v2.py 있음

### 6. 마케터랑 고객 이어주는 플랫폼
- **폴더**: `projects/마케터랑 고객 이어주는 플랫폼/`
- **뭐하는 거**: 소상공인과 마케터를 매칭해주는 플랫폼
- **상태**: 설계서만 있음 (개발 미착수)

---

## 기타

- `projects/Marketingtool/` — 별도 마케팅 툴 (backend/frontend 구조)
- `projects/README.md` — 프로젝트 목록 간단 설명
