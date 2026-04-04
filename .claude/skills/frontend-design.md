# Frontend Design Skill — 서연 표준

웹 페이지/UI를 만들 때 자동으로 적용되는 디자인 원칙.
리안이 따로 말하지 않아도 이 기준 이상으로 출력한다.

## 1. 레이아웃 & 공간

- 여백은 항상 8px 배수 (8/16/24/32/48/64/80/96px)
- 섹션 간격 최소 80px — 답답하게 붙이지 마라
- 최대 너비: 콘텐츠 1200px, 텍스트 720px
- 그리드: 12컬럼 기준, gap 1px + 배경색으로 구분선 처리
- 모바일 first — clamp() 반응형 필수

## 2. 타이포그래피

- 헤드라인: `clamp(36px, 6vw, 100px)` — 절대 고정 px 쓰지 마라
- letter-spacing: 헤드라인 -2px~-4px / 레이블 +3px~+6px
- line-height: 헤드라인 0.9~1.0 / 본문 1.6~1.7
- font-weight: 900(히어로) / 700(제목) / 400(본문) — 중간값(500/600) 남발 금지
- 그라디언트 텍스트: background-clip: text + animation 필수

## 3. 색상 & 대비

- 배경은 #000 또는 #fff 중 하나로 확실히 — 어중간한 회색 금지
- 다크 테마: 텍스트 계층 #fff / #888 / #444 / #222
- 강조색: 프로젝트 톤에 맞게 — 억지로 퍼플/블루/그린 넣지 마라
- WCAG AA 최소 준수 — 배경 대비 4.5:1 이상

## 4. 애니메이션 & 모션

- 필수 3종: fadeUp(등장) + ScrollTrigger(스크롤) + 카운트업(숫자)
- GSAP 우선 — IntersectionObserver는 폴백용
- easing: `power3.out` / `power4.out` — ease-in-out 금지
- 지연: stagger 0.07~0.12s 순차 등장
- 호버: translateY(-3px) + box-shadow glow 동시

## 5. Three.js 파티클 — 표준 구현

**기본 구조 (항상 이걸 기준으로):**
```js
// 파티클 COUNT: 4000~6000
// blending: THREE.AdditiveBlending (글로우 필수)
// depthWrite: false
// 구형 분포로 시작
```

**GLSL 버텍스 셰이더 필수 요소:**
- `uTime` uniform — 웨이브 모션 `sin(t + pos.y * 2.0) * 0.08`
- `uMouse` uniform — 마우스 리펄전 (커서 가까이 도망)
- `uScroll` uniform — 스크롤에 반응하는 Y 드리프트
- `aScale` attribute — 파티클마다 다른 크기
- `aOffset` attribute — 각자 다른 위상 (동기화 금지)
- `gl_PointSize = aScale * (380.0 / -mvPos.z)` — 원근감

**모핑 (고급):**
- 3개 위치 배열 (aSpherePos / aTorusPos / aScatterPos)
- `mod(uTime * 0.15, 3.0)`으로 사이클
- `smoothstep` mix로 부드러운 전환

**파티클 색상:**
- 위치 기반 그라디언트 (vColor = mix(purple, blue, nx))
- AdditiveBlending으로 겹치면 자연스럽게 밝아짐
- alpha에 `sin(t + aOffset)` 적용 — 살아있는 느낌

**배경 디테일:**
- `THREE.TorusGeometry` 와이어링 2~3개 배경 배치
- 투명도 0.05~0.1 — 배경 장식만

## 6. 인터랙션

- 커스텀 커서: dot(4~6px) + lagging ring(40px)
  - `gsap.set(dot)` + `gsap.to(ring, {duration:.12})`
  - hover 시 ring 60px + 보라 border
- 마우스 → 카메라 시차: `camera.position.x += (mouseX*0.2 - camera.position.x)*0.04`
- 파티클 마우스 리펄전: `smoothstep(0.8, 0.0, dist) * 0.6`
- 버튼: gradient background + glow box-shadow on hover

## 7. 신뢰/퀄리티 체크

- 노이즈 텍스처: SVG fractalNoise `body::after` — opacity .2~.35
- 마퀴: `animation: marquee 18s linear infinite` — 2배 복제해서 끊김 없이
- 스크롤 인디케이터: scaleY 애니메이션 drip 효과
- 섹션 구분: `border-top: 1px solid #080808` — 컬러 구분선 금지
- 푸터: border-top + 좌우 split

## 7. SaaS 구조 기본값

- 마케팅/랜딩 페이지 → 위 모든 규칙 풀 적용
- 앱/대시보드 UI → Stitch 설계 + 클린/미니멀 (파티클 없음)
- 레퍼런스 수준: https://www.instagram.com/reel/DWswXHYDP-a/

## 출력 체크리스트

웹 페이지 뽑기 전 이것만 확인:
- [ ] Three.js 파티클 or 동급 배경 있나?
- [ ] 커스텀 커서 있나?
- [ ] clamp() 타이포 썼나?
- [ ] IntersectionObserver 스크롤 애니메이션 있나?
- [ ] 노이즈 텍스처 있나?
- [ ] 모바일 반응형 있나?
