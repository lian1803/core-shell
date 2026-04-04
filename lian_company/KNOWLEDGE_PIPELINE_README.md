# 분석 결과 → 에이전트 학습 파이프라인

## 문제 인식
- 인스타 47개, 유튜브 14개, 자료 10개 분석 결과가 `보고사항들.md`에만 쌓여있음
- 온라인납품팀, 영업팀 등 에이전트들이 실행될 때 이 분석 결과를 모름
- 예: "한국 인스타 마케터들이 쓰는 카피 패턴"을 팀이 모르고 있음
- **분석 결과 ↔ 팀 실행이 단절되어 있음**

## 해결책: 자동 지식화 파이프라인

```
[분석 완료]
    ↓ (analyze_instagram.py에서 자동)
[인사이트 추출] — Gemini Flash로 "바로 써먹을 수 있는 것"만 추출
    ↓
[knowledge/base/insights_*.md 저장] — 5개 카테고리
    - insights_카피패턴.md
    - insights_콘텐츠구조.md
    - insights_광고자동화.md
    - insights_영업전략.md
    - insights_시스템설계.md
    ↓ (팀 실행 시)
[팀 에이전트들이 지식 주입] — get_team_system_prompt()
    ↓
[더 나은 결과물] — 분석 결과를 바탕으로 개선된 콘텐츠/영업 생성
```

---

## 🔧 구현 상세

### 1. `core/knowledge_injector.py` (신규)
**역할**: 팀별로 필요한 지식 자동 수집 및 주입

```python
def get_team_knowledge(team_name: str, max_tokens: int = 2000) -> str:
    """팀이 필요한 지식만 자동으로 반환"""
    # 예: "온라인납품팀" → ["카피패턴", "콘텐츠구조", "광고자동화"]
    # 각 카테고리에서 최신 인사이트 5개씩 로드

def inject_team_knowledge(system_prompt: str, team_name: str) -> str:
    """기존 프롬프트에 팀 지식 추가 주입"""
```

팀별 필요 지식 매핑:
| 팀 | 지식 |
|----|-----|
| 온라인납품팀 | 카피패턴, 콘텐츠구조, 광고자동화 |
| 온라인영업팀 | 영업전략, 카피패턴 |
| 온라인마케팅팀 | 영업전략, 광고자동화, 콘텐츠구조 |
| 오프라인마케팅팀 | 영업전략, 카피패턴 |

### 2. `core/insight_extractor.py` (신규)
**역할**: 분석 결과에서 실용적 인사이트만 추출

```python
def extract_and_save_single(url: str, analysis: str):
    """단건 분석 → 5개 카테고리로 인사이트 추출 + 저장"""
    # Gemini Flash로 분석 결과 파싱
    # 각 카테고리에서 "바로 써먹을 수 있는 것"만 추출
    # knowledge/base/insights_*.md에 누적

def extract_and_save():
    """배치: 보고사항들.md 전체 → 모든 분석에서 인사이트 추출"""

def categorize_insight(text: str, category: str, client) -> str:
    """특정 카테고리의 인사이트만 추출"""
    # 예: "카피패턴" → "숫자 포함 시 CTR 30% ↑"
    # 이론 제외, 실용성만 집중
```

### 3. `core/context_loader.py` (확장)
**기존 함수 유지 + 새 함수 추가**

```python
def inject_context(system_prompt: str, team_name: str = None) -> str:
    """기존 방식 유지하며 team_name 파라미터 추가 (선택)"""
    # 하위 호환성 100%

def get_team_system_prompt(base_prompt: str, team_name: str = None) -> str:
    """팀 에이전트용 헬퍼 함수"""
    # 팀 에이전트의 SYSTEM_PROMPT에 지식 추가
```

### 4. `analyze_instagram.py` (수정)
**분석 완료 후 자동으로 인사이트 추출**

```python
def save_report(url: str, analysis: str, caption: str):
    # ... 보고사항들.md 저장
    
    # 신규: 자동 인사이트 추출
    from core.insight_extractor import extract_and_save_single
    extract_and_save_single(url, analysis)  # 배경 작업
```

### 5. 팀 에이전트들에 지식 주입 (선택적)
**각 팀의 에이전트 run() 함수 수정**

```python
# Before
with client.messages.stream(
    system=SYSTEM_PROMPT,  # 정적 프롬프트
    ...
):

# After
from core.context_loader import get_team_system_prompt

team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
with client.messages.stream(
    system=team_prompt,  # 지식이 포함된 프롬프트
    ...
):
```

---

## 📚 사용법

### 1단계: 분석 실행 (자동 인사이트 추출)
```bash
cd lian_company
python analyze_instagram.py "https://www.instagram.com/p/..."
```

출력:
```
[분석] Gemini 분석 중...
[완료] 보고사항들.md에 저장됨
[인사이트] 3개 카테고리 저장됨  ← 자동!
```

### 2단계: 인사이트 파일 생성 확인
```bash
ls knowledge/base/insights_*.md
```

파일 예:
```
knowledge/base/insights_카피패턴.md
knowledge/base/insights_콘텐츠구조.md
knowledge/base/insights_광고자동화.md
```

### 3단계: 팀 에이전트에 지식 주입 적용 (선택)

**한 팀만 적용:**
```bash
python apply_team_knowledge.py 온라인납품팀
```

**또는 수동으로:**
각 에이전트의 run() 함수에서 `get_team_system_prompt()` 호출

### 4단계: 팀 실행 (지식 기반)
```bash
python run_온라인납품팀.py "블로그 포스팅 3개, 인스타 캐러셀 2개"
```

팀원들이 분석 결과를 바탕으로 더 나은 콘텐츠 생성!

---

## 🧪 테스트

```bash
python test_knowledge_pipeline.py
```

확인 항목:
1. ✅ 각 팀의 지식 로딩 여부
2. ✅ 프롬프트 주입 작동 여부
3. ✅ 인사이트 파일 생성 여부
4. ✅ 호환성 유지 여부

---

## 📂 파일 구조

```
lian_company/
├── core/
│   ├── context_loader.py          ← [수정] team_name 파라미터 추가
│   ├── knowledge_injector.py       ← [신규] 팀 지식 주입
│   ├── insight_extractor.py        ← [신규] 인사이트 추출
│   └── TEAM_KNOWLEDGE_INTEGRATION.md  ← [신규] 통합 가이드
├── teams/
│   ├── 온라인납품팀/
│   │   ├── 한서연.py              ← [수정 예시] get_team_system_prompt 호출
│   │   ├── 박지우.py
│   │   ├── ...
│   │   └── pipeline.py
│   ├── 온라인영업팀/
│   └── ...
├── analyze_instagram.py           ← [수정] 분석 후 자동 인사이트 추출
├── apply_team_knowledge.py        ← [신규] 팀 에이전트 배치 수정 스크립트
├── test_knowledge_pipeline.py     ← [신규] 파이프라인 테스트
└── knowledge/
    └── base/
        ├── insights_카피패턴.md       ← [자동 생성] 분석 결과 기반
        ├── insights_콘텐츠구조.md
        ├── insights_광고자동화.md
        ├── insights_영업전략.md
        ├── insights_시스템설계.md
        └── (기존 파일들)
```

---

## 🎯 동작 원리

### 인사이트 추출 프롬프트
Gemini Flash가 분석 결과를 이렇게 파싱:

```
[분석 결과]
"이 인스타 포스트는 캡션에 숫자를 3개 포함했고, 
이모지를 5개 썼으며, 첫 문장이 질문 형태였다. 
그래서 높은 상호작용률을 기록했다..."

↓

[추출 결과 — "카피패턴" 카테고리]
"- 캡션에 숫자 3-5개 포함 → CTR 30% ↑
 - 이모지 5-8개 적절 배치 → 해시태그 클릭 40% ↑
 - 도입 문장을 질문형으로 → 댓글 유도 효과"

↓ 저장

knowledge/base/insights_카피패턴.md 에 누적
```

### 팀 지식 주입 프로세스

```python
# 1. 온라인납품팀의 한서연이 실행될 때
from core.context_loader import get_team_system_prompt

# 2. 기존 프롬프트
SYSTEM_PROMPT = "너는 한서연이야. 네이버 블로그..."

# 3. 팀 지식 주입
team_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
# → knowledge/base/insights_카피패턴.md, 
#   knowledge/base/insights_콘텐츠구조.md,
#   knowledge/base/insights_광고자동화.md 자동 로드

# 4. API 호출
client.messages.stream(
    system=team_prompt,  # "너는 한서연이야... [학습된 지식]"
    ...
)
```

---

## 💡 핵심 특징

### 1. 자동화
- ✅ 분석 직후 자동 인사이트 추출
- ✅ 팀 실행 시 자동 지식 로드
- ✅ 프롬프트 오버플로우 자동 방지

### 2. 유연성
- ✅ 팀별로 필요한 지식만 로드
- ✅ 지식 파일을 수동으로 수정 가능
- ✅ 팀 에이전트가 지식 주입을 안 해도 작동 (폴백)

### 3. 확장성
- ✅ 새 카테고리 추가 가능 (INSIGHT_CATEGORIES)
- ✅ 새 팀 추가 가능 (TEAM_KNOWLEDGE_MAP)
- ✅ 다른 분석 소스 연결 가능 (유튜브, 블로그 등)

### 4. 하위 호환성
- ✅ 기존 코드는 그대로 작동
- ✅ `inject_context()` 호출 방식 안 바뀜
- ✅ 기존 팀들은 수정 안 해도 됨 (선택사항)

---

## 🚀 다음 단계 (선택)

### Level 1: 기본 (지금 상태)
- ✅ 분석 → 인사이트 추출 (자동)
- ⬜ 팀들이 지식 사용 (수동 적용)

### Level 2: 팀 연결 (선택)
```bash
python apply_team_knowledge.py 온라인납품팀
```
→ 온라인납품팀 에이전트들이 자동으로 지식 활용

### Level 3: 피드백 루프 (나중)
- 팀이 만든 결과물의 성과 측정
- 성과 기반 인사이트 가중치 조정
- "이 인사이트가 실제로 도움 됐나?" 검증

---

## ⚙️ 환경변수

`.env`에 필요한 것:
- ✅ `GOOGLE_API_KEY` — Gemini Flash API (인사이트 추출용)
- ✅ `ANTHROPIC_API_KEY` — Claude API (팀 에이전트용)

---

## 🐛 트러블슈팅

### "insights_*.md 파일이 안 만들어져"
→ `analyze_instagram.py` 실행 후 분석이 완료돼야 함
→ GOOGLE_API_KEY 확인

### "팀 에이전트가 지식을 못 읽음"
→ `core/knowledge_injector.py` import 확인
→ `get_team_system_prompt()` 호출 확인
→ `test_knowledge_pipeline.py` 실행해서 진단

### "프롬프트가 너무 길어"
→ `max_tokens` 파라미터 감소
  ```python
  get_team_knowledge(team_name, max_tokens=500)  # 기본 2000
  ```

---

## 📊 모니터링

### 인사이트 생성 현황
```bash
ls -lh knowledge/base/insights_*.md
```

### 분석 결과
```bash
tail -n 50 ../보고사항들.md
```

### 팀 실행 로그
```bash
tail -f team/온라인납품팀/*.md
```

---

## 🔗 관련 파일

| 파일 | 역할 | 수정 여부 |
|------|------|----------|
| `core/knowledge_injector.py` | 팀 지식 주입 | [신규] |
| `core/insight_extractor.py` | 인사이트 추출 | [신규] |
| `core/context_loader.py` | 지식 통합 로더 | [수정] |
| `analyze_instagram.py` | 분석 자동화 | [수정] |
| `apply_team_knowledge.py` | 팀별 자동 적용 | [신규] |
| `test_knowledge_pipeline.py` | 테스트 | [신규] |

---

## 📝 라이선스

리안 컴퍼니 내부 시스템
