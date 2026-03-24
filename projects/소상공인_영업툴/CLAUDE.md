> **LAINCP 자동 생성 프로젝트**
> 이 폴더에서 Claude Code 열고 `/work` 입력하면 Wave 1~6 자동 실행돼.
>
> - **프로젝트 유형**: 상용화 서비스
> - **통합 프로젝트**: 네이버 플레이스 자동 진단 + PPT + 소상공인 실연락처 수집 자동화

---

# 소상공인 영업툴 — 통합 프로젝트

두 개의 서브프로젝트로 구성 (세트로 판매 가능):

## 1. naver-diagnosis/ — 네이버 플레이스 자동 진단 + PPT 제안서
네이버 플레이스 URL 입력 → 자동 진단 → PPT 제안서 생성. 마케터가 영업용으로 사용.
- **스택**: FastAPI / Python / Playwright / python-pptx / SQLite
- **상세**: CLAUDE_naver.md 참고

## 2. contact-collector/ — 소상공인 실연락처 수집 자동화
구글 비즈니스, 당근마켓, 네이버 블로그, 인스타에서 실제 연락처 자동 수집 → CSV.
- **스택**: Node.js / Next.js / Playwright / PostgreSQL / Redis / BullMQ
- **상세**: CLAUDE_contact.md 참고

---

## 전체 실행법
```bash
# 네이버 플레이스 진단 툴
cd naver-diagnosis && pip install -r requirements.txt && uvicorn main:app --reload

# 연락처 수집 툴
cd contact-collector && pnpm install && pnpm dev
```
