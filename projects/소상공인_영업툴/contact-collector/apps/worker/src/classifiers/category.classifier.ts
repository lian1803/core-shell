// 업종 분류 키워드
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '음식점': ['식당', '레스토랑', '카페', '커피', '분식', '치킨', '피자', '햄버거', '일식', '중식', '한식', '양식', '베이커리', '빵', '디저트', '퓨전', '푸드'],
  '뷰티': ['미용실', '헤어', '네일', '속눈썹', '피부', '에스테틱', '마사지', '왁싱', '메이크업', '뷰티', '숍'],
  '의료': ['병원', '의원', '치과', '한의원', '약국', '피부과', '성형', '안과', '이비인후'],
  '교육': ['학원', '교습소', '유치원', '어린이집', '영어', '수학', '미술', '음악', '태권도', '체육'],
  '인테리어': ['인테리어', '리모델링', '도장', '필름', '장판', '타일', '주방', '욕실', '창호', '문'],
  '서비스': ['세탁', '청소', '이사', '용달', '렌터카', '주차', '택시'],
  '소매': ['편의점', '마트', '시장', '가게', '상점', '수퍼', '잡화', '의류', '옷'],
  '건강': ['헬스', '짐', '요가', '필라테스', '골프', '수영', '다이어트'],
  '반려동물': ['펫', '애견', '동물', '수의사', '미용', '분양'],
  '자동차': ['정비', '카센터', '세차', '타이어', '공업사', '정거장'],
}

/**
 * 업체명과 기존 카테고리를 기반으로 업종 분류
 */
export function classifyCategory(bizName: string, existingCategory?: string): string | null {
  // 이미 카테고리가 있으면 그대로 사용
  if (existingCategory) {
    return existingCategory
  }

  const text = bizName.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }

  return null
}
