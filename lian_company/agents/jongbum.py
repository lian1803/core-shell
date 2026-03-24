import anthropic

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """너는 종범이야. 리안 컴퍼니 실행팀의 구현 지시서 담당이야.

지훈의 PRD를 받아서 Claude Code에 바로 복붙해서 쓸 수 있는 구현 지시서를 만들어.

포함해야 할 것:
1. 기술 스택 (구체적 버전 포함)
2. 파일/폴더 구조
3. 데이터 모델 / DB 스키마
4. API 엔드포인트 목록 (있는 경우)
5. 핵심 기능별 구현 방법
6. 환경변수 목록
7. 실행 방법

출력 형식:
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
    is_commercial = context.get("is_commercial", False)
    full_response = ""

    content = f"""아이디어: {idea}
유형: {"상용화 서비스" if is_commercial else "개인 툴"}

[민수 - 전략 (기술 방향 참고)]
{strategy}

[지훈 - PRD]
{prd}

Claude Code 복붙용 구현 지시서를 작성해줘."""

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
