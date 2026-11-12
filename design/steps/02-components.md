# 2/10단계 — 예약 CRUD 공통 UI 인계

작성일: 2026-11-12 · 담당: Codex 디자인·UX 명세 / Claude 앱 구현

## 범위와 확인 근거

기존 홈·음악 취향·예약 흐름의 Master Design System을 유지했다. Figma Page 1의 홈 `23:67`, 음악 취향 `42:136`, 기존 예약 확인 `186:1158`을 확인했다. 원래 예약 확인 화면은 재검수했고 정상 표시된다. 예약 목록·상세·수정 같은 개별 제품 화면은 만들지 않았다. [예약 데이터 계약](../data-contract.md)의 `LessonBooking` 상태와 오류를 사용한다.

Figma 파일: [레슨커넥트AI App Design](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=0-1). [컴포넌트 마스터 영역](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=273-1454)과 [인스턴스 사용 예시](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=279-1459)를 함께 본다. 사용 예시는 제품 화면이 아니라 상태 검수 보드다.

기존 Primary 기본·비활성 컴포넌트, 음악 취향 화면의 Secondary 기본 컴포넌트, 기존 예약 확인 화면의 안내 컴포넌트, 상세 화면의 뒤로가기 벡터를 재사용했다. 같은 기본 컴포넌트를 새로 만들지 않았다. Figma 마스터 이름의 `11 Final`, `13 Booking` 접두어는 이 파일의 기존 구조이며 앱 코드의 경로 이름을 의미하지 않는다.

## 기존 스타일과 추가 토큰

| 항목 | 현재 기준 | 적용 |
|---|---|---|
| 배경·표면 | white `#FFFFFF`, warm surface `#F6F4F0` | 필드·Dialog는 white, Secondary·안내는 surface |
| 문자 | ink `#0E0E0E`, muted `#5E6169` | 본문·레이블, 보조 문구 |
| 주요 버튼 | primary `#212121` | Primary fill, 진행 중 Badge |
| 선택·포커스 | 기존 selection `#3875C7` | 2px 바깥 포커스 링. 브랜드 메인 컬러로 승격하지 않음 |
| 선 | 기존 border `#E3E0DB` | Dialog·일반 카드 경계 |
| 오류 | 추가한 `color/error` `#B42318` | 오류 선·문구·아이콘에만 사용 |
| 글꼴 | 기존 Noto Sans KR | 버튼 Bold 18/26, 헤더 Medium 15/21; 나머지는 기존 텍스트 스타일 |
| 크기·간격 | 390px 화면, 좌우 20px → 콘텐츠 350px; 4·8·12·16·20·24px | 기존 간격 변수 재사용 |
| 모서리·그림자 | 버튼·필드 14px, Dialog 20px, Badge pill | 새 그림자 없음. 기존 미니멀 스타일 유지 |

추가 변수는 `LC / Booking UI` 컬렉션의 오류·포커스 alias·선 두께(1/2px)·비활성 기준(32%)뿐이다. Secondary Disabled는 시각 렌더링 오류를 바로잡기 위해 마스터에 실제 opacity 0.32를 적용했다. 코드에서도 `opacity: .32`를 사용한다. 실측 색상은 Figma 변수값을 반올림한 값이다.

## Figma 컴포넌트와 재사용 방법

| 요소 | 마스터 노드 | 상태·속성 | 재사용 규칙 |
|---|---|---|---|
| Button / Primary | [188:1164](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=188-1164) | `State=Default/Disabled/Loading/Focused`, `Label`, `Busy label` | 기존 Default `187:1184`·Disabled `187:1186` 유지. 생성·저장·확인 CTA에 인스턴스 사용 |
| Button / Secondary | [274:1459](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=274-1459) | 같은 4 상태, `Label`, `Busy label` | 기존 이전 버튼 `47:188`이 Default. 이전·Dialog의 유지하기에 사용 |
| Input | [275:1455](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1455) | `State=Default/Filled/Focused/Error`, `Label`, `Value`, `Help`, `Error message` | 350×52 control; 검색이나 단일행 입력이 필요한 화면에서 사용 |
| Select | [275:1476](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1476) | Input과 같은 상태·속성 | 공간 등 기준 카탈로그 선택에 사용. 실제 앱은 접근 가능한 네이티브 select 권장 |
| Textarea | [275:1505](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1505) | Input과 같은 상태·속성 | 예약 메모; 350×112 control, 줄바꿈 허용 |
| Badge / 예약 상태 | [275:1526](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1526) | `Status=Scheduled/InProgress/Ended/Cancelled` | 읽기 전용 표시. 필터 버튼으로 사용하지 않음 |
| 공통 알림 / Inline Alert | [275:1550](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1550) | `Tone=Info/Success/Error`, `Title`, `Message` | 기존 안내 `188:1182`가 Info. 공통 알림으로 사용; 별도 Toast는 추가하지 않음 |
| Header / Basic | [275:1551](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1551) | `Title`, `Show back` | 350×56, 뒤로가기 터치 영역 44px. 예약 목록에서 `Show back=false` 가능 |
| Confirmation Dialog | [276:1448](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=276-1448) | `State=Default/Processing/Error`, `Title`, `Description` | 중첩 Primary·Secondary·Error Alert 인스턴스 재사용. 버튼 문구는 중첩 인스턴스의 `Label`/`Busy label`에서 변경 |

Figma에서 마스터를 복제·분리하지 말고 **인스턴스를 배치**한다. 버튼은 `Label`을 실제 액션으로 바꾸고, 처리 중에는 `State=Loading`과 `Busy label`을 함께 설정한다. 필드의 `Value`는 Default에서 placeholder 예시, Filled/Focused/Error에서 현재 값 예시로 바꾼다. 오류 상태에서도 입력값을 지우지 않는다. 예약 상태 Badge는 저장된 `scheduled/cancelled`와 서울 시각에서 파생한 `InProgress/Ended`를 1단계 계약대로 매핑한다.

## 동작·문구 계약

### 버튼

- Primary 높이 56px. 기본 예약 CTA `예약하기`, 저장 중 `저장 중…`, 수정 CTA `변경사항 저장`, 삭제 CTA `삭제하기`. Secondary는 `이전` 또는 `유지하기`처럼 동작을 직접 설명한다.
- Disabled는 조건 미충족·허용되지 않은 전환에서 사용한다. 네이티브 `disabled`로 클릭과 탭 순서에서 제외한다. 흐릿한 버튼만 두지 말고 근처에 필요한 조건을 보이는 문구로 적는다. 기존 예약 확인의 체크 전 CTA는 `예약 내용을 확인해주세요.` 같은 안내를 제공한다.
- Loading은 실제 저장 Promise 동안만 사용한다. 중복 실행을 막되 현재 포커스는 유지한다. `aria-disabled=true`, `aria-busy=true`를 사용하고 이름은 `Busy label`로 바꾼다. 오류가 나면 원래 상태와 폼 값으로 돌아간다. 모션 감소 환경에서는 정지 스피너를 사용한다.
- 키보드: Tab/Shift+Tab으로 이동, Enter/Space 실행. 포커스는 2px 파란 바깥 링. 클릭·터치로 포커스 링이 불필요하게 남지 않게 `:focus-visible`을 기준으로 구현한다.

### Input · Select · Textarea

- 세 요소 모두 **항상 보이는 레이블**이 있다. 필수는 `레이블 (필수)`, 선택은 `레이블 (선택)`으로 표시한다. placeholder만으로 레이블을 대신하지 않는다. 컨트롤 높이는 Input/Select 52px, Textarea 112px이다.
- Default는 placeholder, Filled는 입력값, Focused는 파란 2px 바깥 링, Error는 빨간 선·오류 문구다. **오류와 포커스가 겹치면 빨간 선을 유지하고 파란 바깥 링도 보인다.** Figma variant 수를 늘리지 않고 앱에서 두 상태를 합성한다.
- 레이블은 `htmlFor`와 `id`로 연결한다. 도움말·오류 문구는 각 컨트롤의 `aria-describedby`로 연결한다. Error 때 `aria-invalid=true`. 오류 문구는 해당 항목 아래에 유지하고, 수정 후 유효해지면 제거한다. 제출 시 첫 오류 항목에 포커스하고 해당 문구를 읽을 수 있게 한다.
- Select는 기준 카탈로그의 활성 옵션만 표시한다. `공간을 선택해주세요`는 선택 불가능한 빈 값 placeholder다. 키보드 Space/Enter로 열고 방향키로 이동하며 Escape로 닫는 네이티브 동작을 따른다. 없는 ID/비활성 공간은 `이용할 공간을 선택해주세요.` 또는 `선택한 공간을 이용할 수 없어요. 다시 선택해주세요.`로 안내한다.
- Textarea 메모는 선택 입력이다. 줄바꿈과 앞뒤 공백 제거를 지원하며 저장 기준 최대 500 Unicode code point이다. 도움말은 `최대 500자`; 초과 시 `메모는 500자까지 입력할 수 있어요.`. 작성 중 입력값을 버리지 않는다. Enter는 줄바꿈, Ctrl/Cmd+Enter는 자동 제출하지 않는다.
- 날짜·시각은 1단계의 기존 일정 선택 UI가 우선이다. 이 Input 마스터 때문에 예약 날짜·시각을 임의 텍스트 입력으로 교체하지 않는다. 예약 폼의 필수값 누락, 과거 시각, 슬롯·공간 충돌, 저장소 실패 등 상세 문구는 해당 화면 단계에서 이 공통 오류 표시 패턴을 적용한다.

### 상태 Badge

| 저장·시간 조건 | 표시 | 의미 |
|---|---|---|
| `scheduled`, 시작 전 | 예정 | 수정·취소 가능 |
| `scheduled`, 시작부터 종료 전 | 진행 중 | 시간으로 파생, 수강 확인 아님 |
| `scheduled`, 종료 이후 | 종료 | 시간으로 파생, 완료 확정 아님 |
| `cancelled` | 취소됨 | 저장된 취소 상태 |

색만으로 구별하지 않고 텍스트를 항상 표시한다. Badge는 클릭·포커스 가능한 UI가 아니다.

### 확인 Dialog

- 기본 삭제 문구: 제목 `예약 기록을 삭제할까요?`, 설명 `삭제한 예약 기록은 복구할 수 없어요.\n이 브라우저의 기록만 삭제돼요.`, 버튼 `유지하기` / `삭제하기`. 삭제는 [데이터 계약](../data-contract.md)의 허용 상태에서만 노출한다. 예약 취소에는 같은 Dialog 인스턴스를 쓰되 제목 `예약을 취소할까요?`, 설명 `취소한 예약은 다시 예약해야 해요.`, 확인 버튼 `예약 취소`로 바꾼다. 취소는 기록 유지, 삭제는 제거다.
- 열릴 때 취소·유지 버튼에 먼저 포커스를 둔다. Tab 순환은 Dialog 안에서만, Escape는 닫기, 닫힌 후에는 실행 버튼으로 포커스를 복원한다. 배경 클릭으로 닫히지 않는다. 제목·설명과 `aria-labelledby`·`aria-describedby`를 연결하고 다른 화면 콘텐츠는 조작되지 않게 한다.
- Processing은 확인 버튼을 Loading으로, 취소 버튼을 Disabled로 바꾸며 Escape/닫기를 막는다. 저장 성공 이후에만 닫고 결과 알림을 보인다. 실패하면 Error variant로 전환하고 `삭제하지 못했어요. 기존 기록은 유지했어요. 다시 시도해주세요.` 같은 문구와 재시도 가능한 버튼을 제공한다.
- 390px 화면에서 좌우 20px 여백, 본체 350px, radius 20px. backdrop은 `rgba(14,14,14,.40)`. 새 그림자는 사용하지 않는다.

### 공통 알림과 Header

- 별도 자동 소멸 Toast 대신 기존 안내 카드 확장인 **Inline Alert**를 사용한다. 정보·성공은 `role=status`와 `aria-live=polite`, 오류는 `role=alert`로 읽힌다. 내용은 문제 해결 또는 다음 성공 액션까지 유지한다. 저장 실패는 `저장하지 못했어요. 입력한 내용은 그대로예요. 다시 시도해주세요.`처럼 보존 사실과 다음 행동을 말한다.
- 성공 알림은 LocalStorage 쓰기 성공 이후에만 노출한다. 읽기 실패를 빈 목록으로 취급하거나 쓰기 실패를 성공으로 알리지 않는다. 같은 오류를 Dialog와 그 아래 알림에 동시에 중복 표시하지 않는다.
- Header 뒤로가기 이름은 `뒤로 가기`, 44×44px 터치 영역이다. Tab으로 접근하고 Enter/Space로 실행한다. `Show back=false`면 시각 아이콘뿐 아니라 인터랙티브 버튼도 DOM에서 제외한다. 제목은 가운데 정렬되며 브라우저 status bar는 컴포넌트에 포함하지 않는다.

## Claude 구현 인계와 완료 조건

현재 접근 가능한 폴더에는 실제 Next.js 앱 소스와 `AGENTS.md`·`CLAUDE.md`·`design/README.md`·`design/brief.md`가 없다. IDE 탭 내용은 읽지 못했다. Claude는 실제 앱 프로젝트에서 그 파일과 현재 컴포넌트 구현을 먼저 확인하고, 기존 요소가 있으면 이를 확장한다. 이 Figma 작업은 브라우저 동작 코드를 구현한 것이 아니다.

Claude에게 전달할 요청:

> `design/data-contract.md`, `design/steps/01-foundation.md`, `design/steps/02-components.md`를 읽고 실제 앱의 공통 UI를 구현해줘. 기존 Figma Master Design System과 위 노드를 기준으로 기존 컴포넌트를 재사용·확장하고, 필요 없는 variant와 새 화면은 만들지 마. Primary/Secondary의 Disabled·Loading, 필드 레이블/오류, 상태 Badge, 확인 Dialog, Inline Alert, Header를 구현해줘. 키보드·포커스·aria와 저장 성공 후 알림 규칙을 지켜줘. LocalStorage는 1단계 계약만 사용하고 Supabase는 추가하지 마. 변경 파일과 검증 결과를 progress에 기록해줘.`

완료 조건: (1) Figma 인스턴스의 기본·비활성·포커스·처리 중/오류 상태를 코드에서 재현, (2) 390px에서 350px 콘텐츠와 안전 여백 유지, (3) 모든 입력에 연결된 레이블·오류 메시지, (4) 키보드만으로 Dialog·필드·버튼 사용 가능, (5) 성공 UI는 실제 저장 성공 이후에만 표시, (6) 기존 홈·음악 취향·예약 확인 화면 회귀 없음. 구현 테스트는 실제 앱 프로젝트에서 Claude가 수행해야 한다.

## 검수 기록과 제한

- Figma 마스터 9종 및 인스턴스 검수 보드 1개 생성·확인. 기존 Primary·Secondary·안내 기본 컴포넌트는 ID 유지.
- Secondary Disabled가 지나치게 희미하게 렌더링되던 문제를 32% opacity로 수정하고 검수 보드를 재촬영했다.
- 기존 예약 확인 `186:1158` 스크린샷을 재확인해 기존 요소가 정상 표시되는 것을 확인했다.
- Figma 인스턴스는 시각·속성 명세다. 실제 `input`, `select`, Dialog 포커스 트랩, 저장 Promise, 스크린 리더 동작은 앱 코드에서 검증해야 한다.
