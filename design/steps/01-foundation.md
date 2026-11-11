# 1/10단계 — 예약 CRUD 기반 설계 및 Claude 인계

작성일: 2026-11-11 · Codex 설계 완료 / Claude 구현 대기

## 1. 확인한 자료와 한계

현재 접근·작성 폴더:

`/Users/jeongyohan/Documents/Codex/2026-09-11/figma-mcp-figma-design-ai-hi`

| 항목 | 확인 결과 |
|---|---|
| AGENTS.md, CLAUDE.md | 현재 작업 폴더에 없음. 상위 경로의 AGENTS.md도 확인되지 않음 |
| design/README.md, design/brief.md | IDE 탭 정보는 있으나 이 작업 폴더에서는 파일을 찾지 못함. 내용 미열람 |
| 앱 구현 | package.json·앱 소스·저장소 구현을 찾지 못함. 프레임워크 버전·기존 라우트·테스트 도구 미확인 |
| 로컬 기존 파일 | work/design-system-state-lessonconnect.json만 확인. 과거 Figma 기록이며 최신 상태가 아님 |
| Figma | MCP로 현재 페이지 구조·홈/음악 취향·강사 상세·예약 4개 화면 내용 확인. 홈/음악 취향은 스크린샷으로도 확인 |

문서는 대화의 승인된 범위와 현재 Figma를 근거로 작성했다. 앱 구현의 존재/부재를 프로젝트 전체에 대해 단정하지 않는다. Claude는 실제 앱 프로젝트에서 네 문서를 먼저 읽고 이 인계 문서와 충돌하는 규칙이 있으면 근거와 조정 내용을 progress에 남겨야 한다.

## 2. 최신 Figma 기준

파일: `TnJzGfgFHX6R7OnZR6KeET`, 페이지: `0:1` / Page 1.

과거 홈 `7:2`, 음악 취향 `16:94`, 마스터 섹션 `7:5`는 이번 조회에서 찾을 수 없었다. 삭제·교체 원인을 추정하지 않으며 아래 현재 노드를 사용한다.

| 화면 | 현재 노드 | 확인 수준 |
|---|---|---|
| 01_Home_Reference | [23:67](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=23-67) | 구조·텍스트·시각 |
| 02_Music_Taste | [42:136](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=42-136) | 구조·텍스트·시각 |
| 03_AI_Recommendation | 52:181 | 최상위 존재 확인 |
| 04_Instructor_Detail | 63:305 | 구조·텍스트 |
| 05_Instrument_Selection | 112:299 | 최상위 존재 확인 |
| 06_Lesson_Goal_Skill | 124:405 | 최상위 존재 확인 |
| 07_Lesson_Preferences | 136:537 | 최상위 존재 확인 |
| 08_AI_Matching_Loading | 145:687 | 최상위 존재 확인 |
| 09_Date_Time_Selection_Final | [163:833](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=163-833) | 구조·텍스트 |
| 10_Lesson_Space_Selection_Final | [178:1041](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=178-1041) | 구조·텍스트 |
| 11_Reservation_Confirmation_Final | [186:1158](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=186-1158) | 구조·텍스트 |
| 12_Reservation_Complete_Final | [199:1279](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET?node-id=199-1279) | 구조·텍스트 |

홈·음악 취향 및 내용까지 확인한 예약 화면은 모두 390×844다.

현재 디자인 조사에서 확인한 기준:

- 흰 배경, 검정/짙은 회색 CTA, 따뜻한 밝은 보조 표면, 사진형 강사·장르 카드.
- Noto Sans KR. 음악 취향 Next/Previous는 높이 56, radius 14, Bold 18/26. Next fill은 RGB 약 0.13/0.13/0.13이며 기존 변수 `VariableID:42:142`에 연결.
- Previous는 기존 변수 `VariableID:42:143`에 연결. Genre Card는 109×94, radius 9, 텍스트 Regular 12/18.
- 홈 CTA는 240×44, radius 22, Bold 14/22. 화면 문맥에 따른 기존 크기 차이를 유지한다.
- 하단 내비게이션은 홈/찾기/예약/마이, 기존 컴포넌트 390×77, 라벨 Medium 11/15.
- 사진 자산·선택 체크·아이콘 스타일을 재사용한다. 이전 대화의 보라색 칩을 현재 마스터로 사용하지 않는다.

| 재사용 대상 | 현재 컴포넌트 ID |
|---|---|
| Home / Button / AI 맞춤 강사 찾기 | 28:68 |
| Home / Card / Instructor set | 28:98 |
| Home / Navigation / Bottom | 30:126 |
| Music Taste / Genre Card set | 45:147 |
| Genre Card Default / Selected | 45:136 / 45:140 |
| Music Taste / Other Genre | 46:190 |
| Music Taste / Button / Next / Previous | 47:185 / 47:188 |

이번 단계는 읽기 전용 조사이며 Figma 화면·컴포넌트·스타일을 변경하지 않았다. 모든 토큰·효과를 재정의하는 전수 조사는 2단계에서 필요한 요소에 한정한다.

## 3. UX 흐름과 라우트 계약

아래 라우트는 목표 계약이다. 실제 앱의 기존 라우트가 확인되면 의미를 유지하며 매핑하고 중복 페이지를 만들지 않는다.

| 화면/경로 | 진입·주요 행동 | 결과 |
|---|---|---|
| `/bookings` | 하단 예약 탭, 홈 예약 영역, 완료 화면에서 진입 | 저장된 예약 목록 |
| `/bookings/new?offerId=...` | 강사 CTA 또는 목록의 새 레슨 예약 | 유효 상품 선택 → 일정 → 공간 → 확인 |
| new 내부 `step=date`, `space`, `confirm` | 현재 Figma의 1/3, 2/3, 3/3 유지. 이전은 앞 단계 | 입력 draft만 변경, LocalStorage 예약 생성 없음 |
| `/bookings/[id]/complete` | 확인 화면에서 ‘예약하기’ 성공 후 replace 이동 | 기존 완료 디자인 재사용. 이 경로의 새로고침은 재생성하지 않음 |
| `/bookings/[id]` | 목록 카드·홈의 해당 예약 | snapshot·시각·상태·메모 조회 |
| `/bookings/[id]/edit` | 상세의 수정 | 저장 성공 시 상세로 replace. 취소 시 원본 유지 |
| 상세 취소 액션 | 확인 Dialog → 취소 실행 | 레코드 유지, 취소됨 상태·피드백 |
| 상세 삭제 액션 | 삭제 가능 조건에서 확인 Dialog → 삭제 | 레코드 제거 → 목록으로 replace |

offerId가 없으면 기존 강사/레슨 선택 진입점을 사용한다. 임의 상품으로 자동 예약하지 않는다. 유효하지 않은 offerId는 선택 오류와 다시 선택하기를 제공한다. 새 화면의 필요 여부와 구체적 선택 UI는 5단계에서 확정한다.

일정·공간·확인 draft는 해당 생성 흐름의 메모리 상태에 둔다. 단계 이동은 유지하지만 새로고침·탭 종료 후 복원을 보장하지 않는다. 필수 draft 없이 후속 step으로 직접 접근하면 첫 유효 단계로 이동한다. 확정 예약은 마지막 확인에서만 저장한다. 수정도 저장 전에는 원본을 변경하지 않는다.

일반 흐름은 ‘등록 → 완료 → 목록 → 상세 → 수정 또는 취소/삭제’다. 제출 CTA는 저장이 성공한 뒤에만 화면을 이동한다. 조회 초기화 전 빈 목록이나 ‘예약 없음’을 순간 노출하지 않는다. 데이터 오류와 없는 예약을 구분한다.

### 버튼 동작 기본 규칙

| 행동 | 저장 조건 | 성공 | 실패/중단 |
|---|---|---|---|
| 일정·공간 다음 | 현재 단계 필수 선택 유효 | 다음 단계 | 필드 오류, 입력 유지 |
| 확인 ‘예약하기’ | 전체 검증·확인 체크·revision 일치 | createBooking → 완료 | 오류 표시, 동일 폼 유지 |
| 수정 ‘저장’ | 미래 예정 예약·전체 검증 | updateBooking → 상세 | 원본/입력 유지 |
| 수정 ‘취소’/이탈 | 미저장 변경 시 확인 | 저장하지 않고 상세 | 계속 편집 선택 시 폼 유지 |
| ‘예약 취소’ | 시작 전 예정 | 확인 후 cancelBooking | Dialog 닫기는 무변경 |
| ‘예약 기록 삭제’ | 취소됨 또는 종료 | 확인 후 deleteBooking | 실패 시 상세 유지 |
| ‘예약 내역 보기’ | 저장된 ID 존재 | 목록 이동 | 존재하지 않는 ID는 찾을 수 없음 안내 |

처리 중에는 해당 변경 버튼을 비활성화해 중복 실행을 막는다. 같은 작업을 기다리는 동안 다른 변경 액션도 허용하지 않는다. 성공 메시지는 ‘예약을 저장했어요’, ‘예약을 수정했어요’, ‘예약을 취소했어요’, ‘예약 기록을 삭제했어요’를 기본값으로 한다.

현재 Figma의 ‘실제 예약이 아닌 화면 예시’ 안내는 구현 후 ‘이 브라우저에 저장되는 데모 예약이며 실제 예약·결제는 발생하지 않아요’ 의미로 조정한다. 문구 반영은 후속 디자인 단계에서 수행한다. 홈의 과거 예시 날짜나 Figma의 2026년 9월 날짜를 런타임 데이터로 고정하지 않는다.

## 4. Claude의 1단계 구현 범위

1. 실제 앱 폴더에서 AGENTS.md·CLAUDE.md·브리프·패키지·현재 저장소 구조를 읽는다. 이 설계 폴더에서 새 앱을 임의 생성하지 않는다.
2. [데이터 계약](../data-contract.md)에 따라 타입, 최소 카탈로그, 시드, 저장소 인터페이스를 구현한다.
3. 초기화/오류/ready 상태를 UI에서 구분할 수 있는 최소 어댑터를 마련한다. 기존 상태 관리 도구를 우선 사용한다.
4. 카탈로그 ID를 실제 앱에 맞춰 조정했다면 대응표와 이유를 이 문서 또는 progress에 남긴다.
5. 아래 검증을 수행하고 실행한 것만 결과로 기록한다. 컴포넌트·화면 제작·파일 첨부·배포는 1단계에 포함하지 않는다.

파일 배치 예시는 `src/features/bookings/{types,catalog,repository,validation}`이다. 실제 프로젝트 규칙에 맞춰 결정하며 신규 프레임워크·Supabase·서버 API를 도입하지 않는다.

### 완료 조건과 검증 시나리오

| ID | 검증 | 기대 결과 |
|---|---|---|
| F01 | 빈 저장소 초기화 후 반복 초기화 | 시드 1건, 같은 ID·시각 유지 |
| F02 | 정상 생성 후 새 repository에서 재조회 | 입력·snapshot 유지, 고유 UUID, revision 증가 |
| F03 | 기존 예약 수정 | id/createdAt/source 유지, 새 값·updatedAt 저장 |
| F04 | 시작 전 예약 취소 | cancelled/cancelledAt 기록, 목록에서 사라지지 않음 |
| F05 | 취소된 예약 삭제 | 대상만 제거, 다른 예약 유지 |
| F06 | 마지막 예약 삭제 → 초기화/새로고침 | 빈 배열 유지, 시드 재생성 없음 |
| F07 | 파싱 실패·필드 손상·ID 중복·미지원 버전 | 명시적 오류, 원본 문자열 무변경, 재시드 없음 |
| F08 | 접근 차단·용량 초과·쓰기 예외 | 오류 반환, 원본 무변경, 성공 이벤트 없음 |
| F09 | 없는/잘못된 예약 ID | NOT_FOUND; 저장소 자체 오류와 구분 |
| F10 | SSR/import 및 초기화 전 호출 | window 접근으로 크래시 없음, NOT_READY |
| F11 | 잘못된 날짜·과거 시작·메모 초과·확인 누락 | VALIDATION_ERROR와 필드별 문구 |
| F12 | 진행 중/종료 예약 수정·취소 | INVALID_TRANSITION; 종료 데이터는 정상 조회 |
| F13 | 겹치는 시간 / 맞닿은 시간 / 취소 예약 | 겹침 거부, 맞닿음 허용, 취소 건 제외 |
| F14 | stale revision으로 변경 | CONFLICT, 원본 유지 |
| F15 | 무변경 수정·이미 취소된 예약 재취소 | 쓰기 없음, revision/updatedAt 유지 |
| F16 | 상품·공간 활성/호환 검증 및 snapshot 유지 | 잘못된 조합 거부, 기준 데이터 변경이 과거 표시를 덮어쓰지 않음 |
| F17 | 서울 자정 경계·다른 장치 시간대 | 날짜/정렬/상태/시드가 Asia/Seoul 기준으로 일관 |

F01~F17은 테스트 계획이며 아직 실행되지 않았다. 시간 의존 검증에는 고정 now를 주입한다. 저장소 오류는 테스트용 Storage 대역으로 재현하고 실제 사용자 데이터를 파괴해 시험하지 않는다. 브라우저 재로드 지속성은 가능하면 실제 브라우저에서도 확인한다. 앱 환경이 없으면 런타임 미검증이라고 기록한다.

## 5. Claude에게 전달할 프롬프트

```text
레슨커넥트AI 예약 CRUD 1/10단계를 구현해줘.
실제 앱 프로젝트 루트를 먼저 확인하고 AGENTS.md, CLAUDE.md,
design/README.md, design/brief.md를 읽어줘.
Codex 조사 폴더에는 앱 소스가 없었으므로 그 폴더에서 새 앱을 만들지 마.

design/data-contract.md와 design/steps/01-foundation.md를 읽고,
현재 프로젝트에 맞춰 예약 타입·읽기 전용 카탈로그·LocalStorage 저장소를 구현해줘.
최초 시드, 빈 배열 유지, 상태 전이, 날짜 검증, snapshot,
revision 충돌 감지, 손상 데이터·저장 실패 보호를 계약대로 적용해줘.
Supabase·서버 API·새 화면·이미지 첨부는 이번 범위에 포함하지 않아.

F01~F17 검증 항목을 수행하고, 실행한 검사와 미검증 항목을 구분해줘.
실제 변경 파일, 명세와의 차이, 테스트 명령과 결과,
남은 문제를 design/progress.md에 기록해줘.
Codex 설계 완료와 Claude 구현 완료를 별도로 표시하고 2단계는 시작하지 마.
```
