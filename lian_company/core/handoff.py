"""
PipelineHandoff — 이사팀 산출물 + jihun PRD → UltraProduct 브리핑 문서 자동 생성

생성 파일:
  team/{프로젝트명}/CLAUDE.md  — /work가 읽는 메인 컨텍스트
  team/{프로젝트명}/PRD.md     — 지훈이 작성한 PRD 전문
"""

import os
from pathlib import Path
from datetime import datetime


class PipelineHandoff:
    def __init__(self, context: dict, output_dir: str):
        self.context = context
        self.output_dir = output_dir
        self.project_name = context.get("idea", "프로젝트")[:30].strip()
        self.safe_name = self.project_name.replace(" ", "_").replace("/", "_")

    def generate(self) -> str:
        """브리핑 문서 생성 후 프로젝트 폴더 경로 반환"""
        team_root = Path(__file__).parent.parent.parent.parent / "team"
        project_dir = team_root / self.safe_name
        project_dir.mkdir(parents=True, exist_ok=True)

        prd_path = project_dir / "PRD.md"
        claude_path = project_dir / "CLAUDE.md"

        # PRD.md 저장
        prd_path.write_text(self.context.get("prd", ""), encoding="utf-8")

        # CLAUDE.md 생성
        claude_content = self._build_claude_md()
        claude_path.write_text(claude_content, encoding="utf-8")

        return str(project_dir)

    def _build_claude_md(self) -> str:
        ctx = self.context
        verdict = ctx.get("verdict", "GO")
        score = ctx.get("score", "")
        is_commercial = ctx.get("is_commercial", False)

        taeho = ctx.get("taeho", "")[:400]
        seoyun = ctx.get("seoyun", "")[:600]
        minsu = ctx.get("minsu", "")[:600]
        haeun = ctx.get("haeun", "")[:400]
        junhyeok_text = ctx.get("junhyeok_text", "")[:400]

        date_str = datetime.now().strftime("%Y-%m-%d")
        project_type = "상용화" if is_commercial else "개인 툴"

        return f"""# {self.project_name} — UltraProduct 브리핑

> 생성일: {date_str}
> 이사팀 판정: {verdict} ({score}점)
> 프로젝트 유형: {project_type}

---

## 이 파일 사용법

`/work` 명령어 실행 시 이 파일과 `PRD.md`를 먼저 읽어라.
Wave 1~2 기획은 이미 완료됨. **Wave 3 (CTO 아키텍처)부터 시작**.

---

## 아이디어 원문

{ctx.get("clarified", ctx.get("idea", ""))}

---

## 이사팀 분석 요약

### 트렌드 (태호)
{taeho}

### 시장조사 (서윤)
{seoyun}

### 전략/수익모델 (민수)
{minsu}

### 검증/반론 (하은)
{haeun}

### 최종 판단 (준혁)
{junhyeok_text}

---

## PRD 요약

PRD 전문은 `PRD.md` 참조.

---

## UltraProduct 실행 지시

- **시작 Wave**: Wave 3 (CTO 아키텍처 + CDO Stitch 디자인)
- **프로젝트 유형**: {project_type}
- **Wave 5 마케팅**: {"실행" if is_commercial else "스킵 (개인 툴)"}
- **CDO 작업**: Stitch MCP로 디자인 생성 → DESIGN.md → 민준(FE) 핸드오프

---

## 핵심 원칙

- 리안은 비개발자 CEO. 개입 최소화.
- PRD.md의 Must Have 기능만 구현. 범위 확장 금지.
- Cloudflare Pages/Workers/D1/R2 스택 사용. Vercel/Supabase 금지.
"""
