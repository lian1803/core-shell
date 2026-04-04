# 시스템 이슈 트래커

> autopilot이 전체 시스템을 돌리면서 발견한 문제점들.
> 마지막 업데이트: 2026-04-04

---

## 버그 (코드 문제)

### [BUG-001] ✅ 수정됨 — launch_prep 함수 시그니처 불일치
- **위치**: `core/autopilot.py` → `core/launch_prep.py`
- **증상**: `run_launch_prep() missing 1 required positional argument: 'client'`
- **원인**: `run_launch_prep(context, client)` 인데 `run_launch_prep(project_name)` 으로 호출
- **수정**: autopilot에서 client 객체 생성 후 전달하도록 수정

### [BUG-002] 에스컬레이션 루프 — 매번 같은 것 물어봄
- **위치**: `core/escalation.py` + `core/daily_log.py`
- **증상**: outreach_dm, blog_post 등 승인해도 다음날 또 에스컬레이션 됨
- **원인**: `get_approval_count(project, category)` 에서 project가 빈 문자열이면 항상 0 반환. 팀 실행 태스크는 project가 없음
- **해결 방향**: category만으로도 승인 카운트 조회 가능하게 수정

### [BUG-003] 지식 저장 경로 오류 (한글 파일명)
- **위치**: `teams/education/team_generator.py` → `knowledge/manager.py`
- **증상**: `[Errno 2] No such file or directory: 'knowledge/base/네이버플레이스_PPT_자동화_SaaS팀_하은 (프론트엔드/UX 설계자).md'`
- **원인**: 파일명에 괄호 `()` 포함. Windows에서 일부 케이스 경로 생성 실패
- **해결 방향**: 파일명에서 괄호 제거하는 sanitize 추가

### [BUG-004] 팀 인터뷰에서 input() 대기 — 자동화 차단
- **위치**: `teams/온라인영업팀/pipeline.py`, `teams/온라인납품팀/pipeline.py`, `teams/온라인마케팅팀/pipeline.py`
- **증상**: CLI 인자로 태스크 넘겨도 인터뷰 단계에서 `input()` 대기 → autopilot에서 호출 시 빈 응답으로 넘어감
- **원인**: pipeline이 autopilot에서 subprocess로 호출될 때 stdin 없음. 현재는 EOFError 처리로 빈 값 넘어가지만, 인터뷰 결과가 비어 있으면 품질 저하
- **해결 방향**: CLI 인자가 있을 때 인터뷰 스킵하거나, 인자를 인터뷰 답변으로 직접 주입

### [BUG-005] index.html 없음 경고 — launch_prep 불필요 경고
- **위치**: `core/launch_prep.py`
- **증상**: `⚠️ index.html 없음 — Stitch 생성 필요 (Claude Code에서 실행)` 출력됨
- **원인**: launch_prep이 Stitch 연동을 기대하는데 현재 Claude Code CLI 환경에서는 Stitch MCP 없음
- **해결 방향**: Stitch 없으면 경고 대신 "UI 없이 계속" 로 넘어가도록

---

## 구조적 문제 (설계 이슈)

### [DESIGN-001] autopilot 에스컬레이션이 너무 많아 — 첫 실행에서 80%가 에스컬레이션
- **증상**: 5개 태스크 중 3개 에스컬레이션. 리안이 매번 승인해야 함
- **원인**: CONDITIONAL 임계값이 너무 낮음 (outreach_dm: 1회, blog_post: 3회). 근데 카운트가 제대로 안 쌓임 (BUG-002)
- **해결 방향**: 첫 실행 후 리안이 일괄 승인하는 방식 → 이후 자율로 전환

### [DESIGN-002] 팀 파이프라인이 autopilot과 독립적으로 설계됨
- **증상**: autopilot에서 팀 실행 시 subprocess로 감싸야 함. 결과를 파싱하기 어려움
- **원인**: 팀 pipeline.py들이 터미널 직접 실행을 전제로 만들어짐. stdout이 결과물
- **해결 방향**: 팀 pipeline.py에 `run(task) -> str` 표준 인터페이스 추가 (autopilot 직접 import 가능하게)

### [DESIGN-003] 프로젝트 상태가 폴더 구조에만 의존 — 실제 진행 상태 불명확
- **증상**: `team/` 폴더에 CLAUDE.md만 있으면 'planning', PRD.md 있으면 'ready'. 실제로 돌리고 있는지 모름
- **원인**: 실행 로그(daily_log.jsonl)와 프로젝트 상태가 연결 안 됨
- **해결 방향**: daily_log에서 프로젝트별 마지막 실행일 → 7일 이상 없으면 'stalled' 상태

### [DESIGN-004] Meta/Instagram API 미연결 — 콘텐츠 자동 발행 불가
- **증상**: 인스타 캡션은 생성되는데 보고사항들.md에만 저장됨. 실제 발행은 리안 수동
- **원인**: `.env`의 META_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID 미입력
- **해결 방향**: 리안이 Meta Business Suite에서 토큰 발급 → .env에 입력

### [DESIGN-005] 결제 시스템 없음 — 돈 받는 경로가 없음
- **증상**: 영업 DM 보내서 고객이 "할게요" 해도 결제 받을 수단이 없음
- **원인**: 아직 설계 안 됨
- **해결 방향**: 단기 — 카카오페이/토스 링크 수동 발송. 중장기 — SaaS면 Stripe or 토스페이먼츠

---

## 실행 결과 요약

| 시스템 | 결과 | 비고 |
|--------|------|------|
| `autopilot status` | ✅ 정상 | 자산 스캔 완벽 |
| `autopilot daily --dry` | ✅ 정상 | Claude가 태스크 5개 생성 |
| `autopilot daily` | ✅ 부분 성공 | 5개 중 1개 실행, 2개 에스컬레이션, 2개 에스컬레이션 |
| `이사팀 (main.py)` | ✅ 완주 | GO 판정 + 팀 자동 생성까지 |
| `온라인영업팀` | ✅ 완주 | DM 5개 생성 완료 |
| `온라인납품팀` | ✅ 완주 | 인스타 캡션 3개 + 블로그 3개 완료 |
| `온라인마케팅팀` | ✅ 완주 | 전략 수립 + 지식 저장까지 |
| `ops_loop daily` | ✅ 완주 | 인스타 캡션 + 블로그 + 영업 DM 생성 |
| `launch_prep` | ✅ 완주 | 혜경님 프로젝트 런칭 준비 완료 |
| `오프라인마케팅팀` | 미실행 | 레퍼런스 클라이언트 대기 중이라 스킵 |
| `교육팀` | 미실행 | 새 팀 필요할 때 실행 |

---

## 리안이 해야 할 것 (사람만 할 수 있는 것)

| 항목 | 우선순위 | 어디서 |
|------|---------|--------|
| Meta/Instagram API 토큰 발급 | ★★★ | Meta Business Suite |
| 영업 DM 첫 번째 승인 (보고사항들.md 확인) | ★★★ | 보고사항들.md |
| 블로그 초안 3개 수동 업로드 (생성됨) | ★★☆ | 보고사항들.md에서 복붙 |
| 결제 수단 준비 (카카오페이 or 토스 링크) | ★★☆ | 카카오 or 토스 앱 |
| 혜경님 프로젝트 방향 확인 (런칭준비.md 확인) | ★☆☆ | team/[혜경님]... |

---

### [BUG-008] ✅ 수정됨 — 교육팀 생성 파일명 괄호/슬래시 오류
- **위치**: `teams/education/team_generator.py` line 215
- **증상**: `FileNotFoundError: 하은 (프론트엔드/UX 설계자)_결과.md`
- **원인**: 팀원 이름에 괄호·슬래시 포함된 채로 파일명 생성
- **수정**: safe_name 변환 로직 추가 (괄호/슬래시 → 제거/언더스코어) ✅

### [BUG-009] outreach 타입 태스크 — `'NoneType' object is not subscriptable`
- **위치**: `core/autopilot.py` → `_execute_task()` → outreach 분기
- **증상**: outreach 태스크가 매번 실패. `None`이 subscript 됨
- **원인**: outreach 분기에서 `team` 변수가 None인데 `_run_team_script(team)` 호출
- **해결 방향**: outreach 태스크에 `target_team` 명시적으로 설정하거나, team이 None이면 온라인영업팀 기본값으로

### [BUG-006] offline_sales.py — research 변수 미바인딩
- **위치**: `offline_sales.py` 마지막 보고/저장 단계
- **증상**: `cannot access local variable 'research' where it is not associated with a value`
- **원인**: research 변수가 조건부로만 할당되는데 항상 참조됨
- **심각도**: LOW (팀은 완주됨, 저장만 일부 실패)

### [BUG-007] run_offline_marketing.py 없음 — 팀명 매핑 불일치
- **위치**: `core/autopilot.py` → `_run_team_script()`
- **증상**: autopilot에서 `offline_marketing` 팀 실행 시 `run_offline_marketing.py` 찾아서 실패
- **원인**: 실제 스크립트는 `offline_sales.py`인데 규칙이 달랐음
- **수정**: SCRIPT_MAP에 매핑 추가 완료 ✅

---

## 신규 생성된 것들

| 항목 | 경로 |
|------|------|
| 네이버플레이스 PPT 자동화 SaaS팀 | `teams/네이버플레이스_PPT_자동화_SaaS팀/` |
| 혜경님 프로젝트 런칭 준비서 | `team/[혜경님] .../런칭준비.md` |
| 오늘의 콘텐츠 (인스타+블로그+DM) | `보고사항들.md` |
| 영업 DM 5종 세트 | `team/온라인영업팀/` |
| autopilot 실행 로그 | `knowledge/daily_log.jsonl` |
| 스마트스토어 상품설명 SaaS — 이사팀 CONDITIONAL_GO | `outputs/2026-04-04_.../` |
| 소상공인 영업 자료 (오프라인) | `team/[진행중] 오프라인 마케팅/소상공인_영업툴/` |

---

## BUG-002 수정 이력
- 에스컬레이션 무한 루프 → `.autopilot_approvals.json` 도입으로 해결 ✅
- 이제 리안이 한 번 승인한 카테고리는 다시 안 물어봄
- 테스트 결과: `에스컬레이션 0` 달성
