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

### 1. 마케터-고객 플랫폼 (채팅+결제 + 매칭 플랫폼 통합)
- **폴더**: `projects/마케터_고객_플랫폼/`
- **서브**: `chatpay/` (채팅+결제) + `platform/` (마케터-고객 매칭)
- **뭐하는 거**: 마케터-고객 실시간 채팅 + 채팅 내 결제 링크 + 매칭 플랫폼
- **스택**: Node.js / Fastify / Next.js / Socket.io / PostgreSQL / Redis / Supabase
- **상태**: 코드 있음

### 2. 소상공인 영업툴 (네이버 진단 + 연락처 수집 통합)
- **폴더**: `projects/소상공인_영업툴/`
- **서브**: `naver-diagnosis/` (플레이스 진단+PPT) + `contact-collector/` (연락처 수집)
- **뭐하는 거**: 네이버 플레이스 진단 PPT 제안서 + 소상공인 실연락처 수집 자동화
- **스택**: FastAPI / Python + Node.js / Next.js / Playwright / BullMQ
- **상태**: 코드 있음

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


---

## 기타

- `projects/Marketingtool/` — 별도 마케팅 툴 (backend/frontend 구조)
- `projects/README.md` — 프로젝트 목록 간단 설명
