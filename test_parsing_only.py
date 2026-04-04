#!/usr/bin/env python3
"""파싱 로직만 테스트 (Gemini API 호출 안 함)"""
import sys
from pathlib import Path
from datetime import datetime

# 경로 설정
sys.path.insert(0, str(Path(__file__).parent / "lian_company"))

from core.insight_extractor import _extract_analysis_sections, INSIGHT_CATEGORIES

report_path = Path(__file__).parent / "보고사항들.md"
with open(report_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 파싱
sections = _extract_analysis_sections(content)
print(f"[파싱 결과] {len(sections)}개 섹션 추출됨\n")

for i, (url, analysis) in enumerate(sections, 1):
    print(f"[섹션 {i}]")
    print(f"  URL: {url}")
    print(f"  분석 길이: {len(analysis)}자")

    # Gemini API 호출 없이, 각 카테고리를 검토할 대상으로만 표시
    print(f"  추출할 카테고리:")
    for category in INSIGHT_CATEGORIES:
        print(f"    - {category}")
    print()

print("[결과]")
print(f"✓ 파싱 성공: {len(sections)}개 분석 섹션")
print(f"✓ 각 섹션당 {len(INSIGHT_CATEGORIES)}개 카테고리로 분석 가능")
print(f"✓ 최대 {len(sections) * len(INSIGHT_CATEGORIES)}개 인사이트 추출 가능")
