# 팀 지식 주입 통합 가이드

## 개요
분석 결과(보고사항들.md)에서 추출한 "바로 써먹을 수 있는 인사이트"를 팀 에이전트들이 실행할 때 자동으로 활용하도록 구현했습니다.

## 파이프라인

```
분석 결과 (보고사항들.md)
    ↓ [analyze_instagram.py 분석 완료 후 자동]
인사이트 추출 (core/insight_extractor.py)
    ↓
knowledge/base/insights_*.md 저장
    - insights_카피패턴.md
    - insights_광고자동화.md
    - insights_콘텐츠구조.md
    - insights_영업전략.md
    - insights_시스템설계.md
    ↓ [팀 실행 시]
팀 에이전트들이 지식 주입해서 사용 (core/knowledge_injector.py)
    ↓
더 나은 결과물 생성
```

## 팀별 사용법

### 1. 온라인납품팀

각 팀원 에이전트의 run() 함수에서 다음처럼 수정:

**Before (기존)**
```python
def run(context: dict, client: anthropic.Anthropic) -> str:
    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT,  # ← 정적 프롬프트
    ) as stream:
        ...
```

**After (팀 지식 주입)**
```python
def run(context: dict, client: anthropic.Anthropic) -> str:
    # 팀 지식 자동 주입
    from core.context_loader import get_team_system_prompt
    team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
    
    full_response = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=3000,
        messages=[{"role": "user", "content": user_msg}],
        system=team_prompt,  # ← 지식이 포함된 프롬프트
    ) as stream:
        ...
```

### 2. 온라인영업팀, 온라인마케팅팀, 오프라인마케팅팀

동일하게 `get_team_system_prompt(SYSTEM_PROMPT, "팀이름")` 호출.

팀 이름 목록:
- `"온라인납품팀"`
- `"온라인영업팀"`
- `"온라인마케팅팀"`
- `"오프라인마케팅팀"`
- `"이사팀"`
- `"교육팀"`

## 각 팀이 필요한 지식 카테고리

| 팀 | 자동 로드 지식 |
|----|---------|
| 온라인납품팀 | 카피패턴, 콘텐츠구조, 광고자동화 |
| 온라인영업팀 | 영업전략, 카피패턴 |
| 온라인마케팅팀 | 영업전략, 광고자동화, 콘텐츠구조 |
| 오프라인마케팅팀 | 영업전략, 카피패턴 |
| 이사팀 | 시스템설계 |
| 교육팀 | 시스템설계, 영업전략 |

## 온라인납품팀 적용 예시

### 파일 수정 목록 (총 7개)

1. **서진호.py** (SEO 키워드 전략)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

2. **한서연.py** (네이버 블로그)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

3. **박지우.py** (인스타 콘텐츠)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

4. **최도현.py** (퍼포먼스 광고 카피)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

5. **윤하은.py** (상세페이지 카피)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

6. **정민재.py** (성과 분석·리포트)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

7. **김태리.py** (납품 총괄 PM)
   ```python
   team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
   system=team_prompt,
   ```

## 인사이트 생성 프로세스

### 자동 트리거
1. `python analyze_instagram.py "URL"` 실행
2. 분석 완료 → `save_report()` 호출
3. 자동으로 `extract_and_save_single()` 실행
4. 5개 카테고리 중 관련된 것 → `knowledge/base/insights_*.md` 저장

### 배치 처리 (이미 분석된 결과 있을 때)
```bash
cd lian_company
python -c "from core.insight_extractor import extract_and_save; extract_and_save()"
```

## 지식 파일 구조

```
knowledge/
├── base/
│   ├── insights_카피패턴.md          # 마케팅 카피 기법
│   ├── insights_콘텐츠구조.md        # 콘텐츠 구성 패턴
│   ├── insights_광고자동화.md        # 광고 자동화 방법론
│   ├── insights_영업전략.md          # 영업 기법
│   ├── insights_시스템설계.md        # AI 시스템 설계
│   └── (기타 기존 파일들)
├── teams/
│   ├── 온라인납품팀/                # (선택) 팀 전용 지식
│   ├── 온라인영업팀/
│   └── ...
└── index.json
```

## 지식 주입 활성화하기

### 단계 1: 인사이트 추출 활성화
✅ analyze_instagram.py 이미 수정됨 (save_report 후 자동 호출)

### 단계 2: 팀 에이전트에 지식 주입 적용
각 팀의 에이전트 run() 함수에서:
```python
from core.context_loader import get_team_system_prompt

def run(context: dict, client):
    team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
    with client.messages.stream(
        system=team_prompt,  # ← 이렇게 변경
        ...
    ):
        ...
```

### 단계 3: 팀 실행 후 결과 확인
```bash
cd lian_company
python run_온라인납품팀.py "업무 설명"
```
팀원들이 분석 결과 기반 지식을 활용해서 더 나은 결과물 생성

## 에러 처리

- 지식 파일이 없어도 에러 아님 (우아한 폴백)
- `get_team_system_prompt()` 호출 시 Exception 발생 → 원본 프롬프트 반환
- 프롬프트 길이 초과 방지 (max_tokens=1200 제한)

## FAQ

**Q: 어느 시점부터 지식이 생기나?**
A: 첫 분석 완료 후 자동으로 knowledge/base/insights_*.md 생성. 이후 run()할 때 주입됨.

**Q: 기존 팀들은 손을 안 거쳐도 되나?**
A: 지식 주입은 선택사항. run() 함수 수정 안 하면 원본 프롬프트 그대로 사용.

**Q: 지식이 틀리면 어떻게?**
A: insight_extractor가 Gemini Flash로 추출함. 이상하면 knowledge/base/insights_*.md 직접 수정 가능.

**Q: 프롬프트가 너무 길어지면?**
A: get_team_knowledge()의 max_tokens 파라미터로 조정 (기본값 1500).
