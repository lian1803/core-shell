"""
context_loader.py — 모든 에이전트에 회사 DNA + 팀 지식 자동 주입

사용법:
    from core.context_loader import get_company_context, inject_context

    # 회사 DNA 텍스트 가져오기
    context = get_company_context()

    # 시스템 프롬프트에 회사 DNA 주입
    full_prompt = inject_context(my_system_prompt)

    # 팀 지식까지 포함해서 주입 (선택)
    full_prompt = inject_context(my_system_prompt, team_name="온라인납품팀")
"""
import os

_CONTEXT_CACHE = None
_COMPANY_CONTEXT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "company_context.md")
_PROJECTS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "PROJECTS.md")


def get_company_context() -> str:
    """회사 DNA 문서를 읽어서 반환. 캐싱됨."""
    global _CONTEXT_CACHE
    if _CONTEXT_CACHE is not None:
        return _CONTEXT_CACHE

    parts = []

    # 회사 DNA
    try:
        with open(_COMPANY_CONTEXT_PATH, encoding="utf-8") as f:
            parts.append(f.read())
    except FileNotFoundError:
        parts.append("[회사 컨텍스트 파일 없음 — company_context.md 생성 필요]")
    except (UnicodeDecodeError, PermissionError) as e:
        parts.append(f"[회사 컨텍스트 파일 읽기 실패: {e}]")

    # 프로젝트 현황 (있으면)
    try:
        with open(_PROJECTS_PATH, encoding="utf-8") as f:
            content = f.read()
            if content.strip():
                parts.append(f"\n\n## 현재 프로젝트 현황\n{content[:1500]}")
    except FileNotFoundError:
        pass
    except (UnicodeDecodeError, PermissionError) as e:
        print(f"⚠️  프로젝트 파일 읽기 실패: {e}")

    _CONTEXT_CACHE = "\n".join(parts)
    return _CONTEXT_CACHE


def inject_context(system_prompt: str, team_name: str = None) -> str:
    """시스템 프롬프트에 회사 DNA + 팀 지식을 주입한다.

    Args:
        system_prompt: 에이전트 고유 시스템 프롬프트
        team_name: (선택) 팀 이름. 있으면 팀 관련 학습 지식도 함께 주입

    Returns:
        회사 DNA + (팀 지식) + 원래 프롬프트가 합쳐진 전체 프롬프트
    """
    company = get_company_context()
    result = f"""=== 회사 컨텍스트 (모든 업무의 기반) ===
{company}
=== 끝 ===

{system_prompt}"""

    # 팀 지식 주입 (선택적)
    if team_name:
        try:
            from core.knowledge_injector import get_team_knowledge
            knowledge = get_team_knowledge(team_name, max_tokens=1500)
            if knowledge:
                result += f"""

=== 학습된 지식 ({team_name} 팀) ===
{knowledge}
=== 끝 ===
"""
        except Exception as e:
            print(f"⚠️  팀 지식 주입 실패 ({team_name}): {e}")

    return result


def reset_cache():
    """캐시 초기화 (company_context.md 수정 후 다시 읽을 때)."""
    global _CONTEXT_CACHE
    _CONTEXT_CACHE = None


def get_team_system_prompt(base_prompt: str, team_name: str = None) -> str:
    """팀 에이전트용 시스템 프롬프트 생성.

    기존 SYSTEM_PROMPT에 팀 지식을 자동으로 주입합니다.

    Args:
        base_prompt: 에이전트의 기본 시스템 프롬프트 (SYSTEM_PROMPT)
        team_name: 팀 이름 (예: "온라인납품팀")

    Returns:
        팀 지식이 포함된 전체 시스템 프롬프트

    사용법:
        from core.context_loader import get_team_system_prompt

        def run(context: dict, client):
            system_prompt = get_team_system_prompt(SYSTEM_PROMPT, "온라인납품팀")
            client.messages.stream(
                model=MODEL,
                messages=[...],
                system=system_prompt,
            )
    """
    if not team_name:
        return base_prompt

    try:
        from core.knowledge_injector import get_team_knowledge
        knowledge = get_team_knowledge(team_name, max_tokens=1200)
        if knowledge:
            return f"""{base_prompt}

=== 팀 학습 지식 (최신 분석 결과 기반) ===
{knowledge}
==="""
    except Exception as e:
        print(f"⚠️  팀 지식 주입 실패 ({team_name}): {e}")

    return base_prompt
