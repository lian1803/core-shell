# 시스템 이슈 트래커

> autopilot이 전체 시스템을 돌리면서 발견한 문제점들.
> 리안이 돌아오면 확인.

마지막 업데이트: 2026-04-04

---

## 발견된 버그

### [BUG-001] launch_prep 함수 시그니처 불일치
- **위치**: `core/autopilot.py` → `core/launch_prep.py`
- **증상**: `run_launch_prep() missing 1 required positional argument: 'client'`
- **원인**: `launch_prep.run_launch_prep(context, client)` 인데 autopilot에서 `run_launch_prep(project_name)` 으로 호출
- **상태**: 수정 예정

---

## 시스템 실행 로그

