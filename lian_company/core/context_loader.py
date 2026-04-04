"""
context_loader.py — 모든 에이전트에 회사 DNA + 프로젝트 현황 자동 주입

사용법:
    from core.context_loader import get_company_context, inject_context

    # 회사 DNA 텍스트 가져오기
    context = get_company_context()

    # 시스템 프롬프트에 주입
    full_prompt = inject_context(my_system_prompt)
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

    # 프로젝트 현황 (있으면)
    try:
        with open(_PROJECTS_PATH, encoding="utf-8") as f:
            content = f.read()
            if content.strip():
                parts.append(f"\n\n## 현재 프로젝트 현황\n{content[:1500]}")
    except FileNotFoundError:
        pass

    _CONTEXT_CACHE = "\n".join(parts)
    return _CONTEXT_CACHE


def inject_context(system_prompt: str) -> str:
    """시스템 프롬프트 앞에 회사 DNA를 주입한다.

    Args:
        system_prompt: 에이전트 고유 시스템 프롬프트

    Returns:
        회사 DNA + 원래 프롬프트가 합쳐진 전체 프롬프트
    """
    company = get_company_context()
    return f"""=== 회사 컨텍스트 (모든 업무의 기반) ===
{company}
=== 끝 ===

{system_prompt}"""


def reset_cache():
    """캐시 초기화 (company_context.md 수정 후 다시 읽을 때)."""
    global _CONTEXT_CACHE
    _CONTEXT_CACHE = None
