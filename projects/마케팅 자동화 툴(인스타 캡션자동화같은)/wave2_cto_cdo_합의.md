# CTO-CDO 합의문 - instauto

> Wave 2 크로스 토론 결과 (2026-03-19)

---

## 토론 결과 요약

| 이슈 | CTO 입장 | CDO 입장 | 최종 합의 |
|------|----------|----------|-----------|
| AI 생성 로딩 UX | 비동기 처리 + 폴링 | 단계별 진행 표시 | **Server-Sent Events + 단계별 UI** |
| 이미지 저장 전략 | Supabase Storage | WebP 최적화 | **원본 PNG + WebP 썸네일 이중 저장** |
| 재생성 횟수 | BASIC 3회, PRO 무제한 | 5회 표시 제안 | **BASIC 3회, PRO 10회 (무제한은 과금 리스크)** |
| GPT-4o 스트리밍 | 기술적으로 가능 | 글자 하나씩 효과 원함 | **스트리밍 구현 (캡션만)** |
| 모바일 레이아웃 | Next.js Image 제약 | 스크롤 없이 모두 표시 | **vh 기반 동적 레이아웃 + aspect-square 고정** |

---

## 이슈별 합의 사항

### 이슈 1: AI 생성 로딩 UX (최대 30초 처리)

**문제 정의**
- DALL-E 3 이미지 생성: 5~30초 소요
- GPT-4o 캡션 생성: 2~5초 소요
- Vercel 서버리스 타임아웃: Free 10초, Pro 60초
- 사용자가 30초 동안 빈 화면만 보면 이탈률 급증

**CTO 기술 분석**
```
옵션 A: 동기 처리 (단순하지만 타임아웃 위험)
- Free 플랜에서 불가능 (10초 제한)
- Pro 플랜에서 가능하지만 경계선 (60초 제한)

옵션 B: 비동기 처리 + 폴링
- 요청 → 즉시 contentId 반환 → 클라이언트가 2초마다 폴링
- 구현 복잡도 높음, DB 부하 발생

옵션 C: Server-Sent Events (SSE)
- 단일 연결 유지, 서버가 단계별 이벤트 푸시
- Vercel Edge Functions에서 스트리밍 지원
- 타임아웃 문제 해결 + 실시간 진행 상황 전달
```

**CDO UX 요구사항**
```
1. 사용자가 "뭔가 일어나고 있다"는 것을 느껴야 함
2. 단계별 진행: "캡션 작성 중..." → "이미지 생성 중..." → "거의 완료!"
3. 예상 남은 시간 표시 (선택적)
4. 취소 버튼 제공
```

**합의안: Server-Sent Events + 3단계 진행 UI**

```typescript
// 진행 단계 정의
type GenerationStep =
  | { step: 'caption', progress: 0-33 }
  | { step: 'image', progress: 34-90 }
  | { step: 'saving', progress: 91-100 }
  | { step: 'complete', contentId: string }
  | { step: 'error', message: string }
```

**UI 명세**
```
┌─────────────────────────────────────┐
│                                     │
│     [로딩 애니메이션 - Lottie]       │
│                                     │
│     "캡션을 작성하고 있어요..."       │
│     ████████░░░░░░░░░░░░  33%       │
│                                     │
│     예상 시간: 약 20초               │
│                                     │
│     [ 취소하기 ]                     │
│                                     │
└─────────────────────────────────────┘
```

**기술 구현 방식**
- API Route: `app/api/content/generate/route.ts`를 Edge Runtime으로 변경
- ReadableStream으로 SSE 응답 반환
- 클라이언트: EventSource API 또는 fetch + ReadableStream 사용

---

### 이슈 2: 이미지 저장 전략

**문제 정의**
- DALL-E 3 출력: 1024x1024 PNG (약 2~4MB)
- Instagram 업로드: URL 기반 (Supabase Storage 필수)
- 클라이언트 미리보기: 빠른 로딩 필요
- 비용: Supabase Storage Free 1GB, Pro 100GB

**CTO 기술 분석**
```
저장 옵션:
A. 원본 PNG만 저장 → Instagram 호환, 로딩 느림
B. WebP 변환 저장 → 로딩 빠름, Instagram 호환성 확인 필요
C. 이중 저장 (원본 + 썸네일) → 최적, 용량 증가

Instagram Graph API 확인 결과:
- JPEG, PNG 지원 (WebP 미지원)
- 최소 150x150, 최대 1936x1936
- 파일 크기 8MB 이하
```

**CDO UX 요구사항**
```
1. 미리보기 이미지는 1초 이내 로딩
2. 이미지 품질 손상 최소화
3. "오늘의 콘텐츠" 화면에서 빠른 렌더링
```

**합의안: 이중 저장 전략**

```
저장 구조:
/contents/{userId}/{contentId}/
  ├── original.png      (1024x1024, Instagram 발행용)
  └── thumbnail.webp    (512x512, 미리보기용)
```

**기술 구현**
```typescript
// lib/storage/saveImage.ts
async function saveContentImage(
  imageUrl: string,  // DALL-E 3 임시 URL
  userId: string,
  contentId: string
): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  // 1. DALL-E URL에서 이미지 다운로드
  const originalBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());

  // 2. Sharp로 WebP 썸네일 생성
  const thumbnailBuffer = await sharp(originalBuffer)
    .resize(512, 512)
    .webp({ quality: 85 })
    .toBuffer();

  // 3. Supabase Storage 업로드
  const basePath = `contents/${userId}/${contentId}`;
  await supabase.storage.from('images').upload(`${basePath}/original.png`, originalBuffer);
  await supabase.storage.from('images').upload(`${basePath}/thumbnail.webp`, thumbnailBuffer);

  // 4. Public URL 반환
  return {
    originalUrl: getPublicUrl(`${basePath}/original.png`),
    thumbnailUrl: getPublicUrl(`${basePath}/thumbnail.webp`)
  };
}
```

**용량 예측**
- 원본 PNG: 평균 3MB
- 썸네일 WebP: 평균 50KB
- 월간 활성 사용자 100명, 일 1개 콘텐츠 기준: 100 x 30 x 3.05MB = 약 9GB/월
- Supabase Pro (100GB) 충분

**CDO 추가 요청 반영**
- 이미지 로딩 중 Skeleton UI 표시
- Next.js Image 컴포넌트의 `placeholder="blur"` 활용

---

### 이슈 3: 재생성 횟수 카운터

**문제 정의**
- CTO 제안: BASIC 3회/일, PRO 무제한
- CDO 제안: 5회 표시 기준

**비용 분석 (CTO)**
```
DALL-E 3 (1024x1024): $0.040/이미지
GPT-4o 캡션 (약 500 토큰): $0.0075/요청
총 재생성 비용: 약 $0.05/회

무제한 리스크:
- PRO 사용자가 하루 100번 재생성 → $5/일 = $150/월
- PRO 구독료 19,900원 (약 $15) → 적자
```

**CDO UX 분석**
```
사용자 심리:
- 3회는 너무 적게 느껴짐 → "이게 끝이야?" 불만
- 5회 정도면 "충분히 시도해봤다" 느낌
- 무제한은 오히려 선택 장애 유발 가능
```

**합의안: BASIC 3회, PRO 10회**

| 플랜 | 일일 재생성 횟수 | 월 최대 비용 (30일) |
|------|------------------|---------------------|
| TRIAL | 3회 | $4.5 (무료 체험) |
| BASIC | 3회 | $4.5 |
| PRO | 10회 | $15 |

**UI 표시 방식**
```
┌──────────────────────────────┐
│  [ 다시 만들기 ]  2/3        │
│                              │
│  (BASIC 기준)                │
└──────────────────────────────┘

┌──────────────────────────────┐
│  [ 다시 만들기 ]  7/10       │
│                              │
│  PRO 업그레이드로 더 많이!   │
└──────────────────────────────┘
```

**Prisma 스키마 수정**
```prisma
model Content {
  // ... 기존 필드
  regenerateCount   Int       @default(0)  // 오늘 재생성 횟수
  lastRegenerateAt  DateTime?              // 마지막 재생성 시간 (일일 리셋 기준)
}
```

**일일 리셋 로직**
```typescript
function canRegenerate(content: Content, plan: PlanType): boolean {
  const maxCount = plan === 'PRO' ? 10 : 3;
  const today = new Date().toDateString();
  const lastDate = content.lastRegenerateAt?.toDateString();

  // 날짜가 바뀌면 카운트 리셋
  if (today !== lastDate) return true;

  return content.regenerateCount < maxCount;
}
```

---

### 이슈 4: GPT-4o 스트리밍 캡션

**문제 정의**
- CTO: OpenAI Streaming API 기술적으로 지원됨
- CDO: 글자가 하나씩 나타나는 효과로 "AI가 작성 중" 느낌 원함

**CTO 기술 분석**
```typescript
// OpenAI Streaming 예시
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  // SSE로 클라이언트에 전송
}
```

**CDO UX 목표**
```
1. 타자기 효과 (typewriter effect)
2. 캡션 영역이 점점 채워지는 느낌
3. 생성 완료 후 편집 가능
```

**합의안: 스트리밍 구현 (캡션만)**

**이유**
- 캡션 생성: 2~5초로 짧음 → 스트리밍 효과 극대화
- 이미지 생성: DALL-E 3는 스트리밍 미지원 (완료 후 URL 반환)

**구현 흐름**
```
1. 사용자 "콘텐츠 생성" 클릭
2. SSE 연결 시작
3. [단계 1] 캡션 스트리밍 → 화면에 실시간 표시
4. [단계 2] 이미지 생성 시작 → 로딩 스피너
5. [단계 3] 이미지 완료 → 화면에 표시
6. SSE 종료
```

**프론트엔드 UI**
```tsx
// components/content/CaptionStream.tsx
function CaptionStream({ isStreaming, text }: Props) {
  return (
    <div className="relative">
      <p className="whitespace-pre-wrap">{text}</p>
      {isStreaming && (
        <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
      )}
    </div>
  );
}
```

---

### 이슈 5: 대시보드 모바일 레이아웃

**문제 정의**
- CDO: 모바일에서 스크롤 없이 이미지 + 발행 버튼 모두 보여야 함
- CTO: Next.js Image의 동적 높이 조절 제약

**CTO 기술 분석**
```
모바일 뷰포트 (375x667 기준):
- 상단 네비게이션: 56px
- 하단 여백: 24px
- 사용 가능 높이: 667 - 56 - 24 = 587px

필요 요소:
- 이미지 (1:1 정사각형): 최대 375px
- 캡션 미리보기: 약 80px
- 발행 버튼: 48px
- 간격: 24px

총 필요: 375 + 80 + 48 + 24 = 527px (587px 이내 OK)
```

**합의안: vh 기반 동적 레이아웃**

**레이아웃 구조**
```
┌─────────────────────────────────────┐ ← 상단 고정
│  오늘의 콘텐츠    [설정]            │ 56px
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │ 이미지
│  │      AI 생성 이미지          │   │ min(50vh, 100vw)
│  │         1:1                 │   │ aspect-square
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  오늘 날씨가 좋아서 테라스에서...    │ 캡션 미리보기
│  더보기 >                           │ max 3줄
│                                     │
│  ┌─────────────────────────────┐   │
│  │     지금 발행하기            │   │ 48px
│  └─────────────────────────────┘   │
│                                     │
│  [ 예약 발행 ] [ 다시 만들기 2/3 ]  │ 보조 버튼
│                                     │
└─────────────────────────────────────┘
```

**Tailwind 구현**
```tsx
// app/(dashboard)/home/page.tsx
export default function HomePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] p-4">
      {/* 이미지 영역 - 유동적 크기 */}
      <div className="flex-shrink-0 w-full aspect-square max-h-[50vh] relative">
        <Image
          src={content.thumbnailUrl}
          alt="오늘의 콘텐츠"
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* 캡션 미리보기 - 고정 높이 */}
      <div className="flex-shrink-0 mt-4 h-20">
        <p className="line-clamp-3 text-sm">{content.caption}</p>
      </div>

      {/* 버튼 영역 - 하단 고정 */}
      <div className="mt-auto space-y-3">
        <Button className="w-full h-12">지금 발행하기</Button>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">예약 발행</Button>
          <Button variant="outline" className="flex-1">
            다시 만들기 <Badge>2/3</Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**데스크톱 레이아웃 (CDO 추가 요청)**
```
┌────────────────────────────────────────────────────────┐
│  사이드바  │  ┌──────────┐  ┌─────────────────────┐   │
│            │  │          │  │ 캡션               │   │
│  홈        │  │  이미지   │  │ 편집 가능 영역      │   │
│  히스토리  │  │  400x400 │  │                    │   │
│  설정      │  │          │  │ [지금 발행] [예약]  │   │
│            │  └──────────┘  │ [다시 만들기 2/3]   │   │
│            │                └─────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## 개발 구현 가이드

### FE 필수 준수 사항

1. **Server Component 기본 원칙**
   - `'use client'` 선언은 최소화
   - 인터랙션 필요한 컴포넌트만 Client Component
   - 데이터 페칭은 Server Component에서

2. **이미지 최적화**
   - 항상 Next.js Image 컴포넌트 사용
   - `placeholder="blur"` + `blurDataURL` 적용
   - 썸네일(WebP) 우선 로드, 원본은 Instagram 발행 시만

3. **로딩 상태 관리**
   - AI 생성 중: Zustand store의 `generationStatus` 사용
   - Skeleton UI: shadcn/ui의 Skeleton 컴포넌트

4. **반응형 레이아웃**
   - Mobile First 접근
   - Breakpoint: `sm:640px`, `md:768px`, `lg:1024px`
   - 이미지 영역: `max-h-[50vh]` + `aspect-square`

### BE 필수 준수 사항

1. **API Route 런타임**
   - `/api/content/generate`: Edge Runtime (SSE 지원)
   - 나머지: Node.js Runtime

2. **타임아웃 방지**
   - AI 생성 API: SSE 스트리밍 응답
   - maxDuration 설정 (vercel.json)

3. **에러 핸들링**
   - OpenAI API 실패 시 3회 재시도 (exponential backoff)
   - 실패 시 SSE로 에러 이벤트 전송

4. **이미지 처리**
   - Sharp 라이브러리로 WebP 변환
   - Supabase Storage에 이중 저장 (원본 + 썸네일)

5. **재생성 카운트**
   - 요청마다 `regenerateCount` 증가
   - 일일 리셋: `lastRegenerateAt` 날짜 비교

---

## 컴포넌트별 기술 스펙

### ContentCard.tsx
```typescript
interface ContentCardProps {
  content: {
    id: string;
    thumbnailUrl: string;
    caption: string;
    status: 'draft' | 'scheduled' | 'published';
    regenerateCount: number;
  };
  maxRegenerate: number;  // 플랜에 따라 3 또는 10
  onRegenerate: () => void;
  onPublish: () => void;
  onSchedule: () => void;
}
```

**상태별 UI**
| status | 이미지 | 캡션 | 버튼 |
|--------|--------|------|------|
| draft | 썸네일 | 편집 가능 | 발행/예약/재생성 |
| scheduled | 썸네일 + "예약됨" 배지 | 읽기 전용 | 예약 취소 |
| published | 썸네일 + "발행됨" 배지 | 읽기 전용 | 히스토리로 이동 |

### GenerationProgress.tsx
```typescript
interface GenerationProgressProps {
  step: 'caption' | 'image' | 'saving' | 'complete' | 'error';
  progress: number;  // 0-100
  streamedCaption?: string;  // 스트리밍 중인 캡션 텍스트
  onCancel: () => void;
}
```

**구현 노트**
- Lottie 애니메이션: 단계별 다른 애니메이션
- 진행률 바: shadcn/ui Progress 컴포넌트
- 예상 시간: 과거 생성 기록 기반 평균값 표시

### RegenerateButton.tsx
```typescript
interface RegenerateButtonProps {
  currentCount: number;
  maxCount: number;
  isLoading: boolean;
  onRegenerate: () => void;
}
```

**동작**
- `currentCount >= maxCount`: 버튼 비활성화 + "오늘 횟수 초과" 툴팁
- 클릭 시 확인 모달: "새로운 콘텐츠로 교체됩니다. 계속할까요?"

---

## 추가 합의 사항

### Vercel Cron Jobs 설정
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily",
      "schedule": "0 23 * * *"  // UTC 23:00 = KST 08:00
    },
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/5 * * * *"  // 5분마다 예약 발행 체크
    },
    {
      "path": "/api/cron/refresh-ig-tokens",
      "schedule": "0 0 * * 0"  // 매주 일요일 자정 (토큰 갱신)
    }
  ]
}
```

### 환경 변수 목록
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Instagram (Meta)
META_APP_ID=
META_APP_SECRET=

# 토스페이먼츠
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Resend
RESEND_API_KEY=

# Cron 보안
CRON_SECRET=
```

---

## 서명

- **CTO**: 기술적 실현 가능성 검증 완료
- **CDO**: UX 요구사항 반영 확인

합의일: 2026-03-19
