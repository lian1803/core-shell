import re
import anthropic
from core.models import CLAUDE_SONNET

MODEL = CLAUDE_SONNET


def _safe(text: str) -> str:
    return re.sub(r'[\ud800-\udfff]', '', str(text))

SYSTEM_PROMPT = """너는 종범이야. 리안 컴퍼니 실행팀의 구현 지시서 담당이야.

지훈의 PRD를 받아서 Claude Code에 바로 복붙해서 쓸 수 있는 구현 지시서를 만들어.

중요: 서윤(Perplexity)의 시장 리서치, 태호의 트렌드, 하은의 검증 결과를 반드시 포함해라.
이 데이터가 있어야 UltraProduct의 CDO/마케팅팀이 근거 있는 판단을 할 수 있다.

포함해야 할 것:
1. 시장 리서치 요약 (서윤/태호/하은 결과 종합)
2. 디자인 방향 (CDO가 바로 사용할 브랜드/비주얼 방향)
3. 기술 스택 (구체적 버전 포함)
4. 파일/폴더 구조
5. 데이터 모델 / DB 스키마
6. API 엔드포인트 목록 (있는 경우)
7. 핵심 기능별 구현 방법
8. 환경변수 목록
9. 실행 방법

출력 형식:
## 시장 리서치 (CDO/마케팅팀 참고용)

### 타겟 사용자
- 누구: [구체적 인물상]
- 행동 패턴: [온라인에서 어디에 시간을 쓰는지, 어떤 채널을 주로 보는지]
- 핵심 Pain: [가장 아픈 문제 3개]

### 경쟁사 분석
| 경쟁사 | 강점 | 약점 | UI/UX 특징 |
|--------|------|------|-----------|

### 시장 트렌드
- [서윤/태호가 발견한 트렌드 키워드 3~5개]
- [이 시장에서 지금 뜨는 접근법]

### 검증 결과 (하은)
- [팩트 체크된 숫자/데이터]
- [주의해야 할 리스크]

---

## 디자인 방향 (CDO 전달용)

### 브랜드 포지셔닝
- 톤/무드: [예: 신뢰감 있는 전문적 / 트렌디하고 젊은 / 따뜻하고 친근한]
- 핵심 감성 키워드: [3개, 예: minimal, clean, professional]
- 차별화 포인트: [경쟁사 대비 우리 브랜드가 달라야 하는 이유]

### 타겟 비주얼 방향
- 주요 레퍼런스 UI 스타일: [경쟁사/레퍼런스에서 뽑은 방향]
- 선호 색감 계열: [예: 딥네이비+화이트 / 파스텔+아이보리 / 다크+네온]
- 폰트 분위기: [예: 모던 산세리프 / 클래식 세리프 / 기하학적]
- 피해야 할 방향: [경쟁사가 다 하는 것 / 타겟이 싫어하는 스타일]

### 마케팅 채널 힌트
- 타겟이 주로 쓰는 채널: [예: 인스타그램 / 네이버 블로그 / 유튜브]
- 채널 특성 반영: [예: 인스타 → 비주얼 강조, 고채도 / 블로그 → 가독성 우선]

---

## 기술 스택
| 항목 | 선택 | 버전 |
|------|------|------|

## 폴더 구조
```
프로젝트명/
├── ...
```

## 데이터 모델
```
[스키마 또는 타입 정의]
```

## API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|

## 핵심 구현 포인트
1. [기능]: [구체적 방법]
2. [기능]: [구체적 방법]

## 환경변수
```
[VAR_NAME]=설명
```

## 실행 방법
```bash
[명령어]
```

Claude Code가 바로 코딩 시작할 수 있게, 모호한 표현 없이 구체적으로.

디자인 방향 섹션 작성 규칙:
- 서윤의 시장 리서치에서 경쟁사 UI/UX 특징을 읽어라
- 태호의 트렌드에서 현재 뜨는 비주얼 스타일을 읽어라
- 아이디어의 타겟 사용자 특성(연령, 성별, 라이프스타일)을 반영해라
- CDO가 /theme-factory 호출 시 이 섹션을 그대로 붙여넣을 수 있게 써라
- 막연한 표현 금지 ("예쁘게", "트렌디하게") — 구체적 방향 제시"""


def run(context: dict, client: anthropic.Anthropic) -> str:
    print("\n" + "="*60)
    print("⚙️  종범 | 구현 지시서")
    print("="*60)

    idea = context.get("clarified", context.get("idea", ""))
    prd = context.get("jihun", "")
    strategy = context.get("minsu", "")
    research = context.get("seoyun", "")
    trends = context.get("taeho", "")
    verification = context.get("haeun", "")
    judgment = context.get("junhyeok_text", "")
    verdict = context.get("verdict", "GO")
    score = context.get("score", 7.0)
    is_commercial = context.get("is_commercial", False)
    transcript = context.get("discussion_transcript", [])
    full_response = ""

    idea = _safe(idea)
    prd = _safe(prd)
    strategy = _safe(strategy)
    research = _safe(research)
    trends = _safe(trends)
    verification = _safe(verification)
    judgment = _safe(judgment)

    transcript_note = ""
    if transcript:
        transcript_note = f"\n\n[토론 결과 — {len(transcript)}라운드 진행]\n" + "\n".join([
            f"라운드 {t['round']}: {t['analysis'][:300]}..." for t in transcript
        ])

    content = f"""아이디어: {idea}
유형: {"상용화 서비스" if is_commercial else "개인 툴"}

[준혁 - 최종 판단: {verdict} ({score}점)]
{judgment}

[서윤 - 시장 리서치 (Perplexity)]
{research}

[태호 - 트렌드 스카우팅]
{trends}

[하은 - 팩트 검증 (토론 후 최종)]
{verification}

[민수 - 전략 (토론 후 최종)]
{strategy}{transcript_note}

[지훈 - PRD]
{prd}

Claude Code 복붙용 구현 지시서를 작성해줘.
- 시장 리서치 섹션을 반드시 포함해라
- 디자인 방향 섹션을 반드시 포함해라 (서윤 리서치 + 태호 트렌드 + 타겟 분석 기반)
- 준혁의 조건/주의사항을 "구현 주의사항" 섹션에 반드시 포함해라"""

    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
        temperature=0,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
