> **LAINCP 자동 생성 프로젝트**
> 이 폴더에서 Claude Code 열고 `/work` 입력하면 Wave 1~6 자동 실행돼.
>
> - **프로젝트 유형**: 상용화 서비스
> - **통합 프로젝트**: 마케터-고객 채팅+결제 + 마케터-고객 매칭 플랫폼

---

# 마케터-고객 플랫폼 — 통합 프로젝트

두 개의 서브프로젝트로 구성:

## 1. chatpay/ — 실시간 채팅 + 채팅 내 결제 링크
마케터와 고객이 채팅하면서 결제 링크를 주고받는 MVP.
- **스택**: Node.js / Fastify / Next.js / Socket.io / PostgreSQL / Redis / 토스페이먼츠 / 카카오페이
- **상세**: CLAUDE_chatpay.md 참고

## 2. platform/ — 마케터-고객 매칭 플랫폼
소상공인과 마케터를 이어주는 플랫폼.
- **스택**: Next.js / TypeScript / Supabase
- **상세**: CLAUDE_platform.md 참고

---

## 전체 실행법
```bash
# chatpay 백엔드
cd chatpay && pnpm install && pnpm dev

# 매칭 플랫폼
cd platform && npm install && npm run dev
```
