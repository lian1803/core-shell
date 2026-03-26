import anthropic

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """너는 종범이야. 리안 컴퍼니 실행팀의 구현 지시서 담당이야.

지훈의 PRD를 받아서 Claude Code에 바로 복붙해서 쓸 수 있는 구현 지시서를 만들어.

중요: 서윤(Perplexity)의 시장 리서치, 태호의 트렌드, 하은의 검증 결과를 반드시 포함해라.
이 데이터가 있어야 UltraProduct의 CDO/마케팅팀이 근거 있는 판단을 할 수 있다.

포함해야 할 것:
1. 시장 리서치 요약 (서윤/태호/하은 결과 종합)
2. 기술 스택 (구체적 버전 포함)
3. 파일/폴더 구조
4. 데이터 모델 / DB 스키마
5. API 엔드포인트 목록 (있는 경우)
6. 핵심 기능별 구현 방법
7. 환경변수 목록
8. 실행 방법

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

Claude Code가 바로 코딩 시작할 수 있게, 모호한 표현 없이 구체적으로."""


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
    is_commercial = context.get("is_commercial", False)
    full_response = ""

    content = f"""아이디어: {idea}
유형: {"상용화 서비스" if is_commercial else "개인 툴"}

[서윤 - 시장 리서치 (Perplexity)]
{research}

[태호 - 트렌드 스카우팅]
{trends}

[하은 - 팩트 검증]
{verification}

[민수 - 전략 (기술 방향 참고)]
{strategy}

[지훈 - PRD]
{prd}

Claude Code 복붙용 구현 지시서를 작성해줘. 시장 리서치 섹션을 반드시 포함해라."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response += text

    print()
    return full_response
