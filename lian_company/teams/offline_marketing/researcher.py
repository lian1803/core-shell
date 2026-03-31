import os
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
from core.models import SONAR_PRO

MODEL = SONAR_PRO

# 영업 전문가 자료 수집 쿼리 목록 (방대하게)
SALES_QUERIES = [
    "SPIN Selling 핵심 질문 기법 소상공인 B2SMB 영업 실전 적용법",
    "Challenger Sale 방법론 소규모 사업자 대상 인사이트 영업",
    "콜드 DM 문자 영업 오픈율 답장률 높이는 첫 문장 기법 한국 2025",
    "소상공인 사장님 구매 심리 결정 요인 신뢰 구축 방법",
    "네이버 플레이스 마케팅 대행 영업 성공 사례 실전 스크립트",
    "영업 클로징 기법 거절 반박 처리 소상공인 대상",
    "손실 회피 심리 앵커링 가격 제시 타이밍 영업 활용",
    "비대면 텍스트 클로징 카카오톡 DM 계약 성사 방법론",
    "Dan Kennedy 직접 반응 마케팅 소상공인 적용 카피라이팅",
    "영업 퍼널 전환율 최적화 소규모 B2B 실전 사례",
    "소상공인 플레이스 광고 마케팅 대행사 선택 기준 Pain Point",
    "한국 소상공인 디지털 마케팅 불신 극복 신뢰 영업 방법",
]


def _query_single(perplexity: OpenAI, query: str) -> str:
    try:
        resp = perplexity.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "영업/마케팅 전문 리서처야. 실전에서 바로 쓸 수 있는 구체적 인사이트만 뽑아. 이론 설명 최소화, 실전 사례와 수치 위주로."
                },
                {
                    "role": "user",
                    "content": f"다음 주제를 조사해서 핵심만 뽑아줘:\n\n{query}"
                }
            ],
            max_tokens=800,
        )
        return f"### {query}\n\n{resp.choices[0].message.content}\n"
    except Exception as e:
        return f"### {query}\n\n조사 실패: {e}\n"


def run(context: dict, client=None) -> str:
    print("\n" + "="*60)
    print("🔍 리서처 | 영업 전문가 자료 수집 (Perplexity x12)")
    print("="*60)

    industry = context.get("industry", context.get("idea", "소상공인 네이버 플레이스 대행"))

    perplexity = OpenAI(
        api_key=os.getenv("PERPLEXITY_API_KEY"),
        base_url="https://api.perplexity.ai",
        timeout=120.0,
    )

    # 업종별 추가 쿼리
    industry_queries = [
        f"{industry} 영업 성공 사례 전환율 높은 멘트 실전",
        f"{industry} 타겟 고객 Pain Point 구매 거절 이유 분석",
    ]
    all_queries = SALES_QUERIES + industry_queries

    print(f"총 {len(all_queries)}개 쿼리 병렬 수집 중...")

    results = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_query = {
            executor.submit(_query_single, perplexity, q): q
            for q in all_queries
        }
        for i, future in enumerate(as_completed(future_to_query), 1):
            q = future_to_query[future]
            result = future.result()
            results[q] = result
            print(f"  [{i}/{len(all_queries)}] 완료: {q[:40]}...")

    full_report = f"# 영업 전문가 자료 수집 보고서\n\n대상 업종: {industry}\n\n"
    for q in all_queries:
        full_report += results.get(q, "") + "\n"

    print("\n✅ 자료 수집 완료")
    return full_report
