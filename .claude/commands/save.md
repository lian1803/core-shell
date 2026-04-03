---
name: save
description: 세션 자동 저장 — memory, STATUS.md, Git 커밋
---

다음을 순서대로 실행해:

1. **memory/ 업데이트** — 이번 대화에서 변경된 프로젝트 현황이나 새로운 결정사항이 있으면 해당 memory 파일 업데이트. 없으면 스킵.

2. **STATUS.md 업데이트** (`C:\Users\hkyou\Documents\work_youns\core-shell\STATUS.md`):
   - 오늘 날짜 + 한 작업 요약
   - 다음에 할 것
   - 변경한 파일 목록

3. **Git 커밋** — 변경된 파일 있으면 `auto: Claude 작업 저장` 메시지로 커밋.

완료 후 "저장 완료" 한 줄만 출력.
