# 연락처 수집기

소상공인 실연락처 수집 자동화 시스템

## 기능

- 구글 비즈니스 프로필 수집
- 네이버 블로그 연락처 수집
- 당근마켓 업체 프로필 수집
- 인스타그램 비즈니스 계정 수집 (제한적)
- 안심번호(050) 자동 필터링
- 중복 제거
- CSV 다운로드

## 개발 환경 설정

### 요구사항

- Node.js 20+
- pnpm
- Docker & Docker Compose
- Playwright 브라우저

### 설치

```bash
# 의존성 설치
pnpm install

# Playwright 브라우저 설치
pnpm exec playwright install chromium

# 환경변수 설정
cp .env.example .env
```

### 실행

```bash
# Docker로 DB/Redis 실행
docker-compose up -d postgres redis

# DB 마이그레이션
pnpm --filter @contact-collector/web db:push

# 시드 사용자 생성
pnpm --filter @contact-collector/web db:seed

# 개발 서버 실행 (웹 + 워커)
pnpm dev
```

### 접속

- 웹: http://localhost:3000
- 기본 로그인: admin@example.com / admin123

## Docker로 전체 실행

```bash
docker-compose up -d
```

## 폴더 구조

```
contact-collector/
├── apps/
│   ├── web/          # Next.js 프론트엔드
│   └── worker/       # BullMQ 워커
├── packages/
│   └── shared/       # 공유 타입
├── prisma/           # DB 스키마
└── docker-compose.yml
```

## 주의사항

- 인스타그램은 로그인 없이 공개 프로필만 수집 가능
- 수집 간격은 플랫폼별로 다름 (Google 2초, Naver 3초, Daangn 2초, Instagram 5초)
- 최대 수집 건수는 500건
- 안심번호(050, 070, 1577 등)는 자동 제거
