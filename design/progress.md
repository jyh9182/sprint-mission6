# 레슨커넥트AI 예약 CRUD — 진행 기록

최종 갱신: 2026-11-13 (Asia/Seoul)

## 현재 상태

- 1단계 Codex: 설계 문서 작성 완료. 로컬 구현 조사는 경로 불일치로 미확인.
- 1단계 Claude: **구현·검증 완료 (2026-11-11)**. 실제 앱 프로젝트 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`. 아래 "Claude 1단계 구현 기록" 참조.
- 2단계 Codex: Figma 공통 UI 컴포넌트 9종과 사용 예시 검수 완료, UX·동작 인계 문서 작성 완료.
- 2단계 Claude: **구현·검증 완료 (2026-11-12)**. 아래 "Claude 2단계 구현 기록" 참조.
- 3단계 Codex: `/bookings` 기본·0건·초기화·읽기 실패·긴 목록 5개 화면과 재사용 카드 1종 제작, 시각·구조 검수 완료.
- 3단계 Claude: **구현·검증 완료 (2026-11-12)**. `/bookings` 목록만 구현했다. 카드·CTA의 목적지(`/bookings/[id]`, `/bookings/new`)는 아직 없으며 4·5단계에서 구현 예정. 아래 "Claude 3단계 구현 기록" 참조.
- 4단계 Codex: 예약 상세 정상·메모 없음·긴 메모·취소됨·없는 ID·초기화·조회 실패 7개 Figma 화면과 상세 카드 2종 제작, 시각·구조 검수 완료.
- 4단계 Claude: **상세 조회·화면 상태 구현·검증 완료 (2026-11-12)**. `/bookings/detail?id={UUID}`. 예약 수정(6단계)·취소/기록 삭제(7단계)는 목적지·확인 흐름이 없어 **버튼을 만들지 않고 "준비 중" 안내만** 표시한다. 아래 "Claude 4단계 구현 기록" 참조.
- 5단계 Codex: **예약 생성 폼·핵심 오류·저장·이탈·성공 상세 8개 Figma 프레임과 폼 마스터 제작, 시각 검수·인계 문서 완료**.
- 5단계 Claude: **예약 생성 구현·검증 완료 (2026-11-12)**. `/bookings/new` 단일 스크롤 폼, 공통 `BookingForm`(6단계 수정 재사용), 저장 성공 후 상세 이동·성공 알림 1회, 저장 실패 시 입력 유지, 이탈 확인. 아래 "Claude 5단계 구현 기록" 참조.
- 6단계 Codex: **예약 수정의 변경 없음·편집·저장 실패·이탈·없는 ID·수정 불가·성공 상세 7개 Figma 프레임 제작, 시각 검수·인계 문서 완료**. 
- 6단계 Claude: **예약 수정 구현·검증 완료 (2026-11-12)**. `/bookings/edit?id={UUID}`, 상세 예정 예약 Footer Primary `예약 수정` 연결, 공통 `BookingForm(mode='edit')` 재사용, 의미 있는 변경만 저장 가능, CONFLICT 시 대상 재조회. 아래 "Claude 6단계 구현 기록" 참조.
- 7단계 Codex: **취소·삭제 확인/처리 중/실패와 완료 상세·목록 8개 Figma 프레임 제작, 시각 검수·인계 문서 완료**.
- 7단계 Claude: **예약 취소·기록 삭제 구현·검증 완료 (2026-11-12)**. 상세 `예약 관리`의 준비 중 안내를 `예약 취소`/`예약 기록 삭제` + 공통 `ConfirmDialog`로 교체. 취소는 status 변경·기록 유지, 삭제는 해당 ID 제거 후 목록 이동·성공 알림 1회, 0건 재시드 없음. 아래 "Claude 7단계 구현 기록" 참조.
- 8단계 Codex: **예약 목록 탐색의 기본·조건 적용·결과 없음 3개 Figma 프레임과 상태 칩 2종 제작, 시각 검수·URL/복귀 명세 완료**.
- 8단계 Claude: **목록 탐색 구현·검증 완료 (2026-11-12)**. `/bookings`에 검색·상태 칩·정렬·5개 단위 페이지, 조건은 URL 쿼리(`q→status→sort→page`)만 단일 출처, 잘못된 쿼리 정규 URL replace, 범위 밖 페이지 보정, 상세·수정·취소·삭제에서 목록 조건 유지. 아래 "Claude 8단계 구현 기록" 참조.
- 9단계 Codex: **선택·미리보기·교체·제거 예정·파일 오류·용량 초과·상세 이미지 Figma 상태와 v2 데이터/마이그레이션 계약 완료**.
- 9단계 Claude: **참고 이미지 첨부·v2 마이그레이션 구현·검증 완료 (2026-11-12)**. 공통 폼 메모 아래 `참고 이미지 (선택)`(선택·변환 미리보기·교체·제거 예정·되돌리기), 상세 메모 다음 이미지 카드, 활성 키 `lessonconnect:bookings:v2`(v1은 읽기 전용 원본), 원본 2 MiB·긴 변 1280px·WebP 500 KiB. 아래 "Claude 9단계 구현 기록" 참조.
- 10단계 Codex: **최종 화면·라우트·동작 인계와 통합 QA 문서 작성, Figma 필수 프로토타입 연결·시각 검수 완료 (2026-11-13)**. 실제 앱 1~9단계 구현과 대조하여 앱 홈/매칭/강사 진입의 미구현 범위를 분리했다. 아래 "10단계 인계 및 남은 이슈" 참조.
- 10단계 Claude: **통합 보정·자동 QA 완료 (2026-11-13)**. 앱 홈 `/home`(다가오는 레슨 = 실제 v2 데이터, 강사 예시 1명), `/bookings/new?offerId=&from=home` 사전 선택·진입 문맥별 뒤로가기, 잘못된 `offerId` 오류 안내, 생성/수정 용량 초과 문구 보정, BottomNav `홈`→`/home`, README 작성. 개발 서버 156/156·정적 `out/` 149 통과+7 skip. 실기기·배포 URL 확인은 미실행. 아래 "Claude 10단계 구현 기록" 참조.
- Figma: 기존 홈·음악 취향·예약 제품 화면과 1~9단계 화면을 유지하며 10단계 연결용 생성 상태 3개와 프로토타입 전환 53개를 추가. 9단계 이미지 제거 되돌리기 버튼만 실제 구현에 맞춰 보정.
- 배포: 수행하지 않음(GitHub push·Vercel·Figma Make 배포 모두 미실행, 승인 대기).

## 작업 경로와 인계 주의

현재 산출물 경로: `/Users/jeongyohan/Documents/Codex/2026-09-11/figma-mcp-figma-design-ai-hi/design`.

현재 디자인 작업 폴더에는 AGENTS.md, CLAUDE.md, design/README.md, design/brief.md와 앱 소스가 없다. 실제 앱 프로젝트는 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`로 확인했으며 4단계에서 `AGENTS.md`, `CLAUDE.md`, `next.config.ts`, `lib/bookings/routes.ts`를 읽었다. IDE 탭 자체의 내용은 읽지 못했다. 디자인 폴더와 앱 프로젝트의 파일은 자동 동기화되지 않는다.

Claude 10단계 전 [최종 인계](handoff.md)와 [통합 QA](qa-checklist.md), 필요한 1~9단계 계약과 이 진행 기록을 실제 앱 프로젝트에 전달하고 그 프로젝트의 작업 규칙·브리프와 대조해야 한다. 기존 같은 이름의 문서가 있다면 덮어쓰지 말고 내용을 비교·병합한다. 현재 폴더에서 새 Next.js 앱을 만들지 않는다.

## 산출물

- [데이터 계약](data-contract.md): 타입, 필수값, 상태, snapshot, LocalStorage 키/버전/초기화/오류, 저장소 함수 계약.
- [1단계 인계](steps/01-foundation.md): 현재 Figma 근거, UX·라우트, Claude 구현 범위, 완료 조건, 인계 프롬프트.
- [2단계 공통 UI 인계](steps/02-components.md): Figma 노드, 재사용 방법, 상태·문구·포커스·키보드 동작, Claude 완료 조건.
- [3단계 예약 목록 인계](steps/03-booking-list.md): 5개 Figma 프레임, 카드 데이터·상태, CTA·상세 이동, 스크롤·오류·빈 목록, Claude 완료 조건.
- [4단계 예약 상세 인계](steps/04-booking-detail.md): 7개 Figma 프레임, snapshot·메모·액션 조건, 정적 export URL 매핑, Claude 완료 조건.
- [5단계 예약 생성 인계](steps/05-booking-create.md): 단일 스크롤 폼·필드 연동·검증·저장·이탈·성공 이동, 8개 Figma 프레임, Claude 완료 조건.
- [6단계 예약 수정 인계](steps/06-booking-edit.md): 기존값·변경 여부·상태 제한·미저장 이탈·오류·수정 완료 상세, 7개 Figma 프레임, Claude 완료 조건.
- [7단계 취소·삭제 인계](steps/07-cancel-delete.md): 상태별 액션, 확인/처리/실패 Dialog, 취소 후 상세·삭제 후 목록, 8개 Figma 프레임, Claude 완료 조건.
- [8단계 예약 목록 탐색 인계](steps/08-list-discovery.md): 검색·상태·정렬·페이지, URL 쿼리·상세 복귀, 3개 Figma 프레임, Claude 완료 조건.
- [9단계 참고 이미지 인계](steps/09-booking-image.md): 파일 선택·미리보기·교체·제거, 오류·저장 실패·상세, v2 마이그레이션, Figma 영역과 Claude 완료 조건.
- [10단계 최종 인계](handoff.md): Figma 프로토타입·실제 라우트·컴포넌트·홈/강사/취향 연결 규칙·구현 차이·LocalStorage 대체 범위.
- [10단계 통합 QA](qa-checklist.md): CRUD·오류·탐색·이미지·새로고침·실환경 및 미구현 경계 검증.
- 이 진행 기록: Codex/Claude 단계별 상태와 재개 지점.

## 최신 Figma 근거

파일 `TnJzGfgFHX6R7OnZR6KeET`, Page 1 `0:1`.

- 홈 `23:67`, 음악 취향 `42:136`: 390×844, 스크린샷 검수.
- 기존 예약 흐름: 일정 `163:833` → 공간 `178:1041` → 확인 `186:1158` → 완료 `199:1279`.
- 기존 구조에서 12개 제품 화면을 확인했고, 3단계 목록 5개·4단계 상세 7개·5단계 생성 8개·6단계 수정 7개·7단계 취소/삭제 8개 화면을 추가했다.
- 과거 기록의 `7:2`, `16:94`, `7:5`는 조회되지 않음. `work/design-system-state-lessonconnect.json`을 최신 마스터로 사용하지 말 것.
- 현재 스타일은 검정 CTA·밝은 중립색·사진형 카드·Noto Sans KR. 기존 색상·스타일을 재설계하지 않음.
- 2단계 Figma 마스터 영역 `273:1454`, 상태 인스턴스 검수 보드 `279:1459`. 기존 Primary `188:1164`, Secondary 기본 `47:188`, 안내 기본 `188:1182`를 유지했다.
- 3단계 Card / LessonBooking `282:1584`, 기본 `283:1588`, 0건 `283:1659`, 초기화 `283:1716`, 읽기 실패 `283:1771`, 긴 목록 `283:1833`.
- 4단계 Information Card `285:1808`, Memo Card `285:1828`; 정상 `286:1807`, 메모 없음 `286:1869`, 긴 메모 `286:1931`, 취소됨 `286:1993`, 없는 ID `286:2055`, 초기화 `286:2090`, 조회 실패 `286:2123`.
- 5단계 Form / Fields `291:2603`; Initial `291:1950`, Ready `291:2020`, Ready Scrolled `291:2114`, Errors `291:2208`, Saving `291:2303`, Save Error `291:2399`, Leave Confirm `291:2500`, Success Detail `291:2647`.
- 6단계 기존값/변경 없음 `295:2272`, 편집 `295:2355`, 저장 실패 `295:2433`, 이탈 확인 `295:2518`, 없는 ID `295:2605`, 수정 불가 `295:2637`, 성공 상세 `295:2670`.
- 7단계 취소 확인 `299:2478`·처리 `299:2520`·오류 `299:2564`·완료 상세 `299:2748`; 삭제 확인 `299:2613`·처리 `299:2655`·오류 `299:2699`·완료 목록 `299:2792`.
- 8단계 기본 `302:2781`·조건 적용 `302:2896`·결과 없음 `302:3007`; 상태 칩 Default `302:2777`·Selected `302:2779`.
- 9단계 이미지 필드 상태 보드 `306:2964`, 컴포넌트 Empty `306:2936`·Selected `306:2944`·Error `306:2956`·Remove Pending `309:3225`; 생성 선택 `307:2961`·수정 기존 `307:3044`·파일 오류 `307:3129`·용량 초과 `307:3208`·상세 `307:3300`·상세 스크롤 `307:3388`.
- 10단계 연결용 생성 이미지 없음 `311:3234`, 강사 진입 생성 `312:3487`, 강사 진입 생성 이미지 선택 `312:3525`. 홈 `23:67`을 `Flow 1` 시작점으로 사용하고 22개 관련 화면에 53개 연결을 확인했다. Remove Pending `309:3225`의 되돌리기를 44px 버튼 `313:3363`으로 보정했다.

## 확정 설계 결정

1. `LessonBooking`은 로컬 데모 예약이며 실제 결제·강사/공간 확정 기능이 아님.
2. 5단계 최신 요청에 따라 `/bookings/new`는 단일 스크롤 폼이다. 기존 3단계 일정/공간/확인 화면은 유지하되 생성 경로로 연결하지 않는다. 데이터 계약은 그대로 재사용한다.
3. 1단계 최초 계약은 키 `lessonconnect:bookings:v1`, envelope schemaVersion=1이었다. **9단계 이후 활성 키는 `lessonconnect:bookings:v2`**다. v1은 읽기 전용 마이그레이션 원본이며 최초 null 키만 시드, 빈 배열은 재시드 금지.
4. 상태는 scheduled/cancelled. 진행 중/종료는 시간에서 파생. 취소는 기록 유지, 삭제는 제거.
5. 첫 상품은 김민준·기타·Rock/Blues·60분·동탄 스튜디오 A/B/C·예시 50,000원.
6. 사용자 입력과 기준 카탈로그를 구분하고 예약에 표시 snapshot 저장.
7. 손상/버전 불일치/저장 실패 시 원본 유지. 성공한 쓰기 이후에만 성공 UI.
8. 실제 앱 규칙·기존 카탈로그 ID와의 정합성은 Claude 착수 시 확인.
9. 정적 export를 유지한다. ID별 상세의 논리 범위는 `/bookings/[id]`지만 실제 URL은 `/bookings/detail?id={UUID}`로 매핑하고 `bookingDetailHref` 한 곳에서 생성한다.
10. 6단계 수정의 논리 범위는 `/bookings/[id]/edit`, 실제 URL은 `/bookings/edit?id={UUID}`다. 시작 전 scheduled만 수정 가능하며 변경 없음은 저장하지 않는다.
11. 7단계 취소는 시작 전 scheduled의 상태 변경·기록 유지, 삭제는 cancelled 또는 종료된 scheduled의 해당 레코드 제거다. 둘 다 확인 Dialog 뒤에만 실행하며 결제·환불 처리는 없다.
12. 8단계 목록 탐색은 LocalStorage 조회 결과의 파생 UI다. `q/status/sort/page`를 URL에서 관리하고, 조건 변경은 1페이지로 초기화한다. 상세·수정·취소·삭제 이후 유효한 목록 조건으로 복귀한다.
13. 9단계 참고 이미지는 예약당 선택적 1장이다. v2 키 `lessonconnect:bookings:v2`로 v1을 검증 후 원자적으로 마이그레이션한다. 원본 2 MiB·긴 변 1280px·변환 500 KiB 제한, JPEG/PNG/WebP만 허용한다. 저장 취소·실패는 기존 첨부를 유지한다.
14. 10단계 실제 앱 `/`는 소개 랜딩이고 Figma 앱 홈·매칭·추천·강사 상세는 데모다. 실제 CRUD만 구현 완료로 표시한다. 홈 예약 현황과 강사 상품 사전 선택은 [최종 인계](handoff.md)의 미구현 연결 계약을 따른다.

## 10단계 상태

| 단계 | 범위 | Codex | Claude |
|---|---|---|---|
| 1 | 데이터 계약·저장소 기반 | 문서 완료 / 앱 경로 미확인 | 구현·검증 완료 |
| 2 | 기존 공통 UI 조사·보강 | Figma·문서 완료 | 구현·검증 완료 |
| 3 | 예약 목록 | Figma·문서 완료 | 구현·검증 완료 (상세·새 예약 목적지는 4·5단계) |
| 4 | 예약 상세 | Figma·문서 완료 | 구현·검증 완료 (수정 진입은 6단계, 취소·삭제 실행은 7단계에서 연결) |
| 5 | 예약 생성 폼 | Figma·문서 완료 | 구현·검증 완료 (수정 화면 연결은 6단계) |
| 6 | 예약 수정 | Figma·문서 완료 | 구현·검증 완료 (취소·삭제 실행은 7단계) |
| 7 | 취소·삭제 | Figma·문서 완료 | 구현·검증 완료 |
| 8 | 검색·필터·정렬·페이지 | Figma·문서 완료 | 구현·검증 완료 |
| 9 | 이미지 첨부·계약 확장 | Figma·문서 완료 | 구현·검증 완료 |
| 10 | 통합·검수·최종 인계 | Figma 연결·문서 완료 | 통합 보정·자동 QA 완료 (실기기·배포 확인 남음) |

## 검증 기록

- 로컬 파일 목록과 요청 파일 존재 여부 확인 완료.
- Figma MCP의 최신 페이지·화면·선택 컴포넌트 속성 확인 완료.
- 홈·음악 취향 스크린샷 확인 완료.
- 명세의 라우트·상태·저장 함수·단계 범위 수동 일관성 검토 완료.
- 2단계 Figma 마스터 9종의 상태·속성 확인, 검수 보드 스크린샷 확인 완료.
- Secondary Disabled의 비정상적 희미함을 수정하고 검수 보드 재촬영 완료. 기존 예약 확인 화면 `186:1158` 회귀 스크린샷 확인 완료.
- 3단계 5개 프레임 스크린샷 확인 완료. 모두 390×844, Noto Sans KR, 편집 가능 노드/컴포넌트 인스턴스.
- 긴 목록 viewport `VERTICAL` 스크롤·클립 350×458, 내부 콘텐츠 756px, 하단 내비게이션 y=767 확인. 홈 `23:67`의 내비게이션 마스터·선택 색상 유지 확인.
- 4단계 7개 390×844 화면 스크린샷 검수. 긴 메모 viewport `VERTICAL` 스크롤·클립 350×636, 내부 콘텐츠 871px, Footer y=744 고정 확인. 모든 화면 Noto Sans KR·편집 가능 노드, 원본 홈·목록 유지.
- 5단계 8개 390×844 화면과 Form / Fields 마스터 제작. Initial·Ready 상하·Errors·Saving·Save Error·Leave Confirm·Success Detail 스크린샷 검수. 잘린 Auto Layout 높이를 1040px로 수정했고, 오류값·이탈 버튼 문구·성공 메모 예시를 바로잡았다. 본문 viewport 350×636·Footer y=744 고정. 홈·기존 화면은 수정하지 않았다.
- 6단계 7개 390×844 핵심 차이 화면 스크린샷 검수. 5단계 폼·2단계 필드/버튼/Dialog/Alert와 4단계 상세 상태를 재사용했다. 변경 없음 CTA 비활성, 편집값·확인 체크·수정 취소, 저장 실패, 이탈 Dialog, 없는 ID·수정 불가, 성공 상세가 겹침 없이 보인다. 원본 화면은 수정하지 않았다.
- 7단계 8개 390×844 화면 스크린샷 검수. 취소·삭제 각각 공통 Dialog Default/Processing/Error와 완료 상세·목록이 보인다. 처리 중 중복 입력 차단 상태, 실패 Alert, 삭제 복구 불가 문구, 취소 후 기록·삭제 후 0건 예시를 확인했다. 원본 화면은 수정하지 않았다.
- 8단계 3개 390×844 화면 스크린샷 검수. 기본 페이지 컨트롤, 조건 적용 칩·요약, 결과 없음·초기화 버튼 확인. 기존 Card/Header/CTA/Bottom Nav 인스턴스를 유지하고 새 상태 칩은 컴포넌트 인스턴스로 배치했다. 목록 viewport 350×238 세로 스크롤·클립, 하단 내비게이션 y=767 확인. 앱 코드는 수정하지 않았다.
- 9단계 공통 이미지 필드 상태 보드와 6개 390×844 생성·수정·오류·상세 프레임 스크린샷 검수. 메모 다음 이미지 영역, 상세 메모 다음 이미지 카드, 형식/크기/해석 오류, 저장 용량 초과 Alert, 제거 예정·되돌리기 상태를 확인했다. 기존 이미지 예시의 장식 가장자리를 크롭하고 자동 레이아웃 순서를 바로잡았다. 실제 파일 처리·저장은 미구현이다.
- 런타임 F01~F17: Claude가 실행, 전부 통과 (1단계 기록).
- 2단계 공통 UI·3단계 목록 런타임 검사: Claude가 실행, 전부 통과 (각 단계 기록).
- 4단계 상세·5단계 생성 런타임 검사: Claude가 실행, 전체 78/78 통과 (5단계 기록).
- 6단계 수정 런타임 검사: Claude가 실행, 전체 93/93 통과 (6단계 기록).
- 7단계 취소·삭제 런타임 검사: Claude가 실행, 전체 106/106 통과 (7단계 기록).
- 8단계 목록 탐색 런타임 검사: Claude가 실행, 전체 121/121 통과 (8단계 기록).
- 9단계 참고 이미지·v2 런타임 검사: Claude가 실행, 전체 142/142 통과 (9단계 기록).
- 10단계 Figma 화면 22개·프로토타입 연결 53개 구조 확인, 연결용 생성 3개와 되돌리기 버튼 시각 검수 완료. 앱 코드 수정·타입 검사·빌드·Playwright 재실행은 **이번 Codex 작업에서 하지 않았다**.
- 10단계 통합 런타임 검사: Claude가 실행. `npm run typecheck`·`npm run build` 통과, 개발 서버 Playwright 156/156 통과, 정적 `out/` 로컬 서빙 149 통과·7 skip(개발 전용 `/ui-check`). lint는 스크립트·설정이 없어 미실행 (10단계 기록).

## 다음 작업 / 재개 지점

**10단계 Claude 통합 보정·자동 QA 완료(2026-11-13).** 남은 일은 아래 "Claude 10단계 구현 기록 › 남은 이슈"의 실기기·배포 URL 확인과, Codex의 `/home` 축소 구현 차이 확인이다. 아래는 10단계 착수 전 재개 지점(기록 보존). Claude 1~9단계 완료. 실제 앱 프로젝트 경로는 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`이다. **다음은 Claude의 10단계 앱 통합 보정·QA**다. [최종 인계](handoff.md)의 실제/데모 경계와 [통합 QA](qa-checklist.md)를 우선 읽는다. Figma 앱 홈·매칭·강사 상세는 현재 앱에 없으므로 필요한 추가 구현을 별도 범위로 결정하기 전에는 완료로 표시하지 않는다. 기존 CRUD의 용량 초과 생성 문구를 보정하고 정적 배포·모바일 실환경·이미지 EXIF/브라우저 호환을 검증한다. 9단계 이미지 계약 구현은 `lib/bookings/reference-image.ts`(순수 규칙·검증기), `lib/bookings/image-prepare.ts`(브라우저 변환), `components/bookings/reference-image-field.tsx`(폼 필드)에 있고, 저장 키는 `lessonconnect:bookings:v2`다(아래 "Claude 9단계 구현 기록").

## 10단계 인계 및 남은 이슈

- **완료:** Figma `Flow 1`에서 홈→취향 1~5/5→추천→김민준 상세→강사 진입 생성, 홈 예약 현황/탭→목록, 목록→생성/상세→수정·취소·삭제를 연결했다. 생성 진입 문맥별 뒤로가기를 나누고 이미지 제거 되돌리기 버튼을 보정했다. Figma 링크와 동작은 [handoff.md](handoff.md)에 있다.
- **실제 구현 완료:** LocalStorage v2 예약 CRUD·검색/필터/정렬/페이지·참고 이미지. 9단계 Claude 검증 142/142 통과 기록을 유지한다.
- **미구현 연결:** Figma 앱 홈, 실제 음악 취향 5단계, AI 추천, 강사 상세, 강사에서 `/bookings/new?offerId=` 사전 선택. 현재 `/`는 랜딩이고 체험 Dialog는 저장되지 않는 데모다. Figma 상호작용은 앱 기능으로 간주하지 않는다.
- **보정 필요:** 생성 저장 용량 초과 메시지의 `기존 이미지` 표현. 이지은·박도현 추천 카드의 활성처럼 보이는 행동은 앱으로 옮길 때 `준비 중` 처리하거나 유효한 카탈로그를 마련해야 한다. 현재 예약 상품은 김민준 1개뿐이다.
- **확인 대기:** 정적 배포의 상세/수정 직접 URL, 모바일 Safari/Chrome의 WebP·EXIF, 키보드/스크린 리더, 여러 이미지 저장 시 브라우저 총량. [QA 체크리스트](qa-checklist.md)에 실행 항목을 정리했다.
- **범위 제한:** Supabase DB/Storage/Auth/RLS와 Server Actions는 LocalStorage·Data URL·클라이언트 저장소로 대체했다. origin/브라우저 프로필별 저장이고 기기 간 공유·서버 동기화는 없다. 결제·로그인·서버·AI API는 추가하지 않는다.

**6단계 수정 구현 완료**: `components/bookings/booking-form.tsx`는 `mode: 'edit'`에서 의미 있는 예약 필드 변경만 dirty로 계산하고, 변경 없음 저장을 막는다. `lib/bookings/form.ts`의 검증·문구, `mapSaveError`, `setBookingFlash(id, 'update')`, `useLeaveGuard` + `ConfirmDialog`를 재사용한다. 정적 URL `/bookings/edit?id={UUID}`와 예정 상세 Footer `예약 수정`도 연결됐다. 자세한 검증은 아래 Claude 6단계 기록을 참조한다.

**7단계 취소·삭제 구현 완료**: `getDetailActions(phase)`에 따라 `예약 관리`에 Secondary `예약 취소`(+`레슨 시작 전까지 취소할 수 있어요.`) 또는 `예약 기록 삭제`(+오류색 `삭제한 기록은 복구할 수 없어요.`)를 표시한다. 버튼은 Dialog만 열고, 확인 버튼에서만 Dialog를 연 시점의 revision으로 `cancelBooking`/`deleteBooking`을 한 번 호출한다. 자세한 규칙·검증은 아래 Claude 7단계 기록을 참조한다.

**4단계 URL 결정**: 앱의 정적 export(`output: 'export'`)에서는 런타임에 생기는 예약 ID를 `generateStaticParams`로 열거할 수 없다. 서버 rewrite·서버 전환을 추가하지 않고, ID별 상세의 실제 URL을 `/bookings/detail?id={UUID}`로 매핑한다. Claude는 `lib/bookings/routes.ts`의 `bookingDetailHref`를 이 형식으로 변경해 3단계 목록 카드의 404 목적지도 함께 연결한다. `/bookings/[id]`는 논리적 화면 범위다. 6단계 수정 URL도 정적 export에 맞춰 별도 매핑한다.

참고: 2026-11-12 Codex가 이 문서를 갱신할 때마다 "Claude N단계 구현 기록" 섹션이 삭제되어 있었다(다른 경로의 사본으로 덮어쓰는 것으로 보인다). Claude가 커밋된 기록을 그대로 복원했다. Codex는 이 파일을 갱신할 때 기존 Claude 기록 섹션을 유지해야 한다.

Claude 기록 양식:

```text
실제 앱 프로젝트 절대 경로:
읽은 프로젝트 규칙/브리프:
변경 파일:
카탈로그·라우트 대응표 및 계약 조정 이유:
실행한 검증 명령과 결과:
F01~F17 통과/실패/미실행 항목:
알려진 제한/미해결 문제:
Claude 1단계 완료 여부:
```

---

## Claude 1단계 구현 기록 (2026-11-11)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 프로젝트 규칙/브리프: AGENTS.md, CLAUDE.md, design/brief.md, design/data-contract.md, design/steps/01-foundation.md, package.json, tsconfig.json, playwright.config.ts, app/page.tsx, components/ui/button.tsx, Next 문서 `static-exports.md`(Browser APIs), `single-page-applications.md`.

### 변경 파일 (모두 신규, 기존 코드 수정 없음)

| 파일 | 내용 |
|---|---|
| `lib/bookings/types.ts` | 계약 §2 타입 전체, `BookingRepository` 인터페이스, 파생 `BookingPhase` |
| `lib/bookings/catalog.ts` | 읽기 전용(deep freeze) v1 카탈로그, 시드 상수, `getBookingCatalog()` |
| `lib/bookings/time.ts` | 서울 기준 날짜·시각 검증/계산, 시작·종료 구간, 파생 상태 `getBookingPhase` |
| `lib/bookings/validation.ts` | 저장 데이터 읽기 검증(구조·타입·불변식·ID 중복)과 입력 검증(활성 카탈로그·미래 시각·메모·확인 체크) 분리, snapshot 생성 |
| `lib/bookings/messages.ts` | 계약 §6 오류·필드·성공 문구 |
| `lib/bookings/repository.ts` | LocalStorage 접근이 있는 유일한 모듈. initialize/CRUD/cancel, 시드, revision, 쓰기 직렬화, 오류 매핑, 공유 싱글톤 `getBookingRepository()` |
| `lib/bookings/use-bookings.ts` | `'use client'` 최소 어댑터 훅. `initializing / ready / error` 상태, 성공 쓰기 구독, 다른 탭 `storage` 이벤트 재조회, `retry` |
| `lib/bookings/index.ts` | 공개 export (훅 제외) |
| `tests/bookings-repository.spec.ts` | F01~F17 (Node 실행, 메모리 Storage 대역, 고정 now/ID 주입) |
| `tests/bookings-browser.spec.ts` | 실제 Chromium LocalStorage: 새로고침 유지·전체 삭제 후 재시드 없음·실제 용량 초과 |

### 카탈로그·라우트 대응표 및 계약 조정 이유

- 이 프로젝트는 랜딩페이지(`/` 하나)이며 기존 예약 카탈로그·라우트가 없다. 계약 §4 fixture ID를 **그대로** 사용했다 (대응표 변경 없음). 랜딩 체험 창의 악기 목록은 데모 선택 UI이며 예약 카탈로그로 사용하지 않았다.
- 파일 위치: 제안된 `src/features/bookings` 대신 `lib/bookings`. 프로젝트에 `src/`가 없고 공용 코드가 `lib/`에 있어 기존 구조를 따랐다.
- `/bookings` 등 라우트는 3단계 이후 범위로 만들지 않았다.

### 계약과 다르거나 보완한 부분 (Codex 확인 요청)

1. **UUID 생성 폴백**: `crypto.randomUUID`는 보안 컨텍스트(https·localhost)에서만 존재한다. 실제 브라우저 테스트에서 http 테스트 origin에서 시드가 실패(안전하게 오류 반환, 쓰기 없음)하는 것을 확인했다. `dev` 스크립트가 `0.0.0.0`으로 열려 LAN IP http 접속이 가능하므로, randomUUID가 없으면 `crypto.getRandomValues`로 같은 UUID v4 형식을 생성하도록 보완했다.
2. **`subscribe(listener)` 추가**: 계약 인터페이스에 없던 메서드. 성공한 `setItem` 이후에만 호출되어 "성공 후에만 상태 발행" 규칙을 어댑터에 연결한다.
3. **시계 역행 보호**: 수정·취소 시 `updatedAt = max(now, 기존 updatedAt)`. 장치 시간이 뒤로 가도 `createdAt ≤ updatedAt` 불변식이 깨져 다음 읽기가 CORRUPT_DATA가 되는 것을 막는다.
4. **초기화 실패 후 재시도**: 공유 Promise는 진행 중에만 공유하고, 실패하면 해제해 `retry`로 다시 읽을 수 있다. 성공 후 재호출은 쓰기 없는 `getBookings`.
5. **과거 시각 오류 위치**: 날짜·시각은 각각 형식이 맞아도 조합이 과거이면 `date`, `startTime` 두 필드에 같은 문구를 넣는다.
6. **읽기 검증 세부**: 저장된 memo가 trim되지 않았거나 500 code point를 넘으면 손상으로 본다. 알 수 없는 추가 필드는 거부하지 않고 보존한다. 예상하지 못한 내부 예외는 읽기 → `STORAGE_UNAVAILABLE`, 쓰기 → `WRITE_FAILED`로 반환한다(throw하지 않음).
7. **종료가 다음 날로 넘어가지 않음**: 24:00 정각 종료는 허용한다(현재 시작 시각 최대 21:00이라 실제 영향 없음).

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과 (`/`, `/_not-found` 정적 생성) |
| `npx playwright test tests/bookings-repository.spec.ts` (TZ=Asia/Seoul, America/Los_Angeles, Pacific/Kiritimati 각각) | 17/17 통과 ×3 |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test tests/bookings-browser.spec.ts` | 2/2 통과 |
| `LANDING_TEST_URL=http://localhost:3000 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test` | 23/23 통과 (기존 랜딩 4개 포함) |

참고: 포트 3100 개발 서버는 이미 실행 중인 3000번 서버 때문에 시작되지 않아, 기존 3000번 서버를 대상으로 전체 검사를 실행했다. 실행 중이던 서버는 종료하지 않았다.

### F01~F17

| ID | 결과 | 비고 |
|---|---|---|
| F01 | 통과 | 동시 2회 + 반복 + 새 인스턴스 초기화, setItem 1회, 같은 ID·시각 |
| F02 | 통과 | 새 repository 재조회, 서울 시작 오름차순, 반환값 변이 차단 |
| F03 | 통과 | id/createdAt/source 유지, 줄바꿈 메모 |
| F04 | 통과 | |
| F05 | 통과 | 예정 예약 삭제는 INVALID_TRANSITION |
| F06 | 통과 | Node 대역 + 실제 Chromium 새로고침 모두 확인 |
| F07 | 통과 | 파싱 실패·배열 루트·필드 누락·없는 날짜·상태 불변식·ID 중복·버전 누락·v2; 실행 중 손상, 실행 중 키 삭제 → CONFLICT |
| F08 | 통과 | 접근 차단(getStorage·getItem)·Quota·SecurityError·일반 예외; 시드 쓰기 실패 후 재시도. 실제 Chromium 용량 초과도 확인 |
| F09 | 통과 | 저장소 오류는 NOT_FOUND로 바뀌지 않음 |
| F10 | 통과 | window 없는 Node에서 기본 저장소 → NOT_READY, 쓰기 없음 |
| F11 | 통과 | 500 code point(이모지) 경계 허용, memo 누락은 "" |
| F12 | 통과 | 진행 중 수정·취소·삭제 불가, 정확히 종료 시점부터 삭제 가능 |
| F13 | 통과 | 맞닿음 허용, 자기 자신 제외, 취소 건 제외 |
| F14 | 통과 | 다른 인스턴스(탭) 변경 후 stale revision |
| F15 | 통과 | |
| F16 | 통과 | 비활성 상품·공간, 비허용 공간, 카탈로그 변경 후 snapshot 유지/재구성 |
| F17 | 통과 | 서울 자정 경계 시드 날짜·과거 판정·정렬·진행 중; 장치 TZ 3종 |

### 알려진 제한 / 미검증

- `useBookings` 훅은 아직 어떤 화면에도 연결하지 않았다. 타입 검사만 했고 React 렌더링·Strict Mode·하이드레이션 동작은 화면 단계(3단계~)에서 실제로 확인해야 한다. 중복 시드 방지는 저장소 수준에서 검증했다.
- 실제 브라우저의 접근 차단(SecurityError)은 Storage 대역으로만 확인했다.
- 실제 두 탭 간 `storage` 이벤트 재조회는 미검증. 편집 중 폼의 충돌 안내 UI는 해당 화면 단계 범위다.
- 계약대로 LocalStorage에는 탭 간 트랜잭션이 없어 동시 쓰기 무손실을 보장하지 않는다(단일 탭 순차 사용 기준).
- AGENTS.md·CLAUDE.md의 "예약·서비스 데이터 연결하지 않음" 문구는 이번 LocalStorage 데모 예약 범위와 표현이 어긋날 수 있다. 실제 예약은 발생하지 않으므로 충돌하지 않는다고 판단했으며 문서는 수정하지 않았다.

Claude 1단계 완료 여부: **완료**. 2단계는 시작하지 않았다.

---

## Claude 2단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 프로젝트 규칙/브리프와 근거: CLAUDE.md, AGENTS.md, design/steps/02-components.md, 이 진행 기록, 기존 `components/ui/button.tsx`·`app/page.tsx`·`app/globals.css`·`lib/bookings/*`, Next 문서 `next-config-js/index.md`(phase 함수)·`pageExtensions.md`. Figma MCP로 파일 `TnJzGfgFHX6R7OnZR6KeET`의 마스터 영역 `273:1454` 스크린샷·변수, 각 마스터(188:1164, 274:1459, 275:1476, 275:1454, 275:1526, 275:1550, 275:1551, 276:1447)의 design context를 직접 읽었다.

### 기존 UI 조사 결과

- 재사용 Button: `components/ui/button.tsx` 하나. 클라이언트 초기화 전 비활성화하는 동작이 있어 그대로 유지했다.
- Input·Select·Textarea·Badge·Alert·Header 공통 컴포넌트는 없었다. Dialog는 랜딩 `app/page.tsx` 안에 체험/FAQ 전용 네이티브 `<dialog>`가 있지만 재사용 가능한 컴포넌트가 아니라서, 같은 네이티브 `<dialog>` 방식으로 공통 컴포넌트를 새로 만들었다. 랜딩의 체험/FAQ 창은 수정하지 않았다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `components/ui/button.tsx` (확장) | `appPrimary`·`appSecondary` variant와 `app` 크기 추가. `loading`·`busyLabel` prop 추가: `aria-busy`·`aria-disabled`, 포커스 유지(native disabled 아님), 클릭·폼 제출 중복 차단, Figma 스피너. 기존 variant·초기화 전 비활성 동작은 그대로 |
| `components/ui/field.tsx` (신규) | `Input`·`Select`·`Textarea`와 `focusFirstInvalid()`. 항상 보이는 레이블 `(필수)/(선택)`, `htmlFor`/`id`, 도움말·오류 `aria-describedby`, 오류 시 `aria-invalid`, `aria-required`. Select는 네이티브 + 선택 불가 placeholder 옵션 |
| `components/ui/status-badge.tsx` (신규) | `StatusBadge` — 1단계 `BookingPhase`(upcoming/in-progress/ended/cancelled) → 예정/진행 중/종료/취소됨. 포커스 불가 텍스트 |
| `components/ui/inline-alert.tsx` (신규) | `InlineAlert` info/success/error. 정보·성공 `role=status`+`aria-live=polite`, 오류 `role=alert`. 자동으로 사라지지 않음 |
| `components/ui/page-header.tsx` (신규) | `PageHeader` — 44×44 `뒤로 가기`(기존 Button ghost/icon 재사용), `onBack`이 없으면 버튼을 DOM에서 제외하고 균형 영역 유지 |
| `components/ui/confirm-dialog.tsx` (신규) | `ConfirmDialog` — Default/Processing/Error. 열리면 `유지하기`로 포커스, Tab 가두기, Escape 닫기, 배경 클릭 무시, 닫힌 뒤 연 요소로 포커스 복귀(`returnFocusRef` 지정 가능). 처리 중 확인=Loading·취소=Disabled·Escape 차단. `onConfirm` 성공 후에만 닫고 `onSuccess` 호출. 실패·예외는 Error 상태와 재시도. `StoreResult`를 그대로 반환할 수 있음 |
| `app/globals.css` | 앱 토큰 `--lc-*` 추가(Figma 변수값) 및 `lc-` 공통 UI 스타일, 확인 화면 스타일. 랜딩 토큰과 스타일은 변경 없음 |
| `public/assets/ui/*.svg` (신규) | Figma에서 내려받은 아이콘 7개: 안내·성공·오류, 스피너(밝음/어두움), 뒤로 가기, Select chevron |
| `next.config.ts` | phase 함수로 변경. 개발 서버에서만 `dev.tsx` 페이지 확장자를 허용. 정적 export 등 기존 설정은 그대로 |
| `app/ui-check/page.dev.tsx` (신규) | 개발 서버 전용 공통 UI 확인 화면 `/ui-check`. production build(`out/`)에는 라우트가 없다. LocalStorage를 쓰지 않고 결과는 체크박스로 흉내 낸다 |
| `tests/ui-components.spec.ts` (신규) | 공통 UI Playwright 검사 7개. `/ui-check`가 404면 skip |

### 명세와 다르거나 보완한 부분 (Codex 확인 요청)

1. **앱 토큰 분리**: Figma 앱 파일의 ink `#0E0E0E`·muted `#5E6169`·surface `#F6F4F0`가 랜딩 토큰(`--ink #20201e` 등)과 다르다. 랜딩 화면이 바뀌지 않도록 `--lc-*`로 따로 두었다. 두 체계를 합칠지는 디자인 결정이 필요하다.
2. **필드 포커스 표현**: Figma Focused는 2px 파란 테두리. 코드는 테두리 색 + 안쪽 1px 그림자로 같은 2px 파란 선을 만든다. 오류+포커스는 빨간 1px 테두리를 유지하고 2px 파란 outline을 2px 바깥에 그린다(명세의 합성 규칙).
3. **버튼 포커스 링**: 2px 파란 outline, offset 2px, `:focus-visible` 기준. Figma Focused variant의 안쪽 테두리 대신 바깥 링으로 구현했다(명세 문구 "2px 파란 바깥 링" 우선).
4. **오류 문구가 도움말을 대신함**: Figma처럼 오류 상태에서는 도움말 자리에 오류만 표시하고 `aria-describedby`도 오류만 가리킨다.
5. **Textarea 높이 조절**: 기본 112px, 세로로만 늘릴 수 있게 했다(`resize: vertical`). 500자 제한은 컴포넌트가 아니라 화면 검증(1단계 `validation.ts`와 같은 code point 기준)에서 처리한다. native `maxLength`는 UTF-16 기준이라 쓰지 않았다.
6. **필수 표시**: native `required`는 브라우저 기본 말풍선을 띄워 `aria-required`만 사용했다. 폼은 `noValidate`로 쓰고 `focusFirstInvalid()`로 첫 오류에 포커스한다.
7. **Dialog Escape 처리**: Chrome의 반복 Escape 강제 닫기를 피하려고 keydown 단계에서 Escape를 직접 처리한다. 동작은 명세와 같다.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 라우트 `/`, `/_not-found`만 생성되고 `out/ui-check`는 없음 확인. `out/assets/ui/*.svg` 포함 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | 30/30 통과(build 전후 각 1회). 기존 랜딩 4 + 저장소 F01~F17·브라우저 2 + 공통 UI 7 |

공통 UI 검사 항목 (`tests/ui-components.spec.ts`, 실제 동작 검증):

- Button: 조건 전 Disabled와 근처 안내 문구 → 조건 충족 후 활성. 키보드 포커스 시 2px `#3875C7` outline. Enter 실행 후 이름 `저장 중…`, `aria-busy`/`aria-disabled`, 포커스 유지, 중복 Enter 무시. 성공 알림은 처리가 끝난 뒤 1개만 표시. 실패 시 오류 알림, 성공 알림 없음, 버튼 원상 복귀. Secondary Disabled opacity 0.32.
- 필드: 레이블로 찾기, 도움말 accessible description, 높이 52/112px, placeholder 옵션 선택 불가. 빈 제출 → 첫 오류 항목 포커스·`aria-invalid`·오류 문구. 오류+포커스 = 빨간 테두리 + 파란 outline. 수정하면 오류 제거. 메모 501자(이모지)는 오류지만 입력값 유지, 500자로 줄이면 해제. Enter는 줄바꿈.
- Badge 4종 텍스트·포커스 불가. Alert role/aria-live. Header 뒤로 가기 44×44, Space 실행, `Show back=false`이면 버튼 없음.
- Dialog: 이름·설명 연결, 폭 350px(390 화면), `유지하기` 초기 포커스, Tab/Shift+Tab 순환, 배경 클릭 무시, Escape 닫기·여는 버튼으로 포커스 복귀. 처리 중 Escape 무시·유지 Disabled·확인 Loading 포커스 유지. 실패 시 `role=alert`의 `삭제하지 못했어요 / 기존 기록은 유지했어요. 다시 시도해주세요.`, 성공 알림 없음, 재시도 가능. 성공 시에만 닫히고 결과 알림 표시. 같은 컴포넌트로 `예약을 취소할까요?` 문구 재사용.
- 320/390px 가로 넘침 없음, 390px에서 필드·알림·헤더 폭 350px, 이미지 로드·alt. 콘솔 오류 없음. `prefers-reduced-motion: reduce`에서 스피너 animation `none`.

디자인 확인(시각): 390px 확인 화면 전체, 필드 오류+포커스, Dialog Processing 스크린샷을 Figma 마스터 `273:1454` 스크린샷과 나란히 비교했다. 버튼·필드·Badge·Alert·Header·Dialog의 색·크기·모서리·문구가 일치했다. 화면 판독 기준이며 픽셀 단위 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 실제 스크린 리더(VoiceOver 등)로 읽어 보지는 않았다. role·aria 속성과 accessible name/description은 Playwright로 확인했다.
- `role=status` 알림은 처음 렌더링될 때 문구가 함께 들어가므로, 일부 스크린 리더는 읽지 않을 수 있다. 화면 단계에서 알림 영역을 미리 두고 내용만 바꾸는 방식이 필요한지 확인한다.
- `/ui-check`는 개발 서버 전용이라 Figma 미리보기나 정적 `out/` 검사에서는 이 공통 UI 검사가 skip된다.
- 예약 목록·상세·폼 화면과 `useBookings` 연결은 범위 밖이라 구현하지 않았다(3단계 이후).

Claude 2단계 완료 여부: **완료**. 3단계는 시작하지 않았다.

---

## Claude 3단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/03-booking-list.md, 이 진행 기록, 기존 `lib/bookings/*`(저장소·훅·시간·검증), 2단계 공통 UI, Next 문서 `static-exports.md`. Figma MCP로 `283:1588`(기본)·`283:1659`(0건)·`283:1716`(초기화)·`283:1771`(읽기 실패)의 design context와 `283:1833`(긴 목록) 스크린샷을 직접 읽었다. 카드 `282:1584`는 기본 프레임 안의 인스턴스로 확인했다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `app/bookings/page.tsx` (신규) | `/bookings` 정적 페이지. 메타데이터만 서버에서 두고 화면은 클라이언트 컴포넌트 |
| `components/bookings/booking-list-screen.tsx` (신규) | 목록 화면. `useBookings()`로 LocalStorage 저장소에서만 읽는다(화면 내 하드코딩 목록 없음). 상태별 화면: 초기화 중 / 읽기 실패·재시도 / 정상 0건 / 기본·긴 목록. 1분마다 현재 시각을 갱신해 파생 상태 반영. 같은 탭 세션의 목록 스크롤 위치를 sessionStorage에 저장·복원 |
| `components/bookings/booking-card.tsx` (신규) | Card / LessonBooking. 카드 전체가 상세 링크 1개. snapshot만 표시. 강사·악기·공간 2줄 말줄임, 링크 이름에는 강사·날짜·시간·상태·악기·공간 전체 문자열 |
| `components/app/bottom-nav.tsx` (신규) | 하단 내비게이션(예약 선택). 예약 `aria-current=page` |
| `lib/bookings/format.ts` (신규) | 표시용 순수 함수: `선생님` 호칭(중복 방지), 서울 날짜+요일, 시작–종료, 악기·길이, 스튜디오·방 |
| `lib/bookings/routes.ts` (신규) | `BOOKINGS_HREF`, `NEW_BOOKING_HREF`, `bookingDetailHref(id)` — 예약 경로를 만드는 유일한 곳 |
| `lib/bookings/use-bookings.ts` | `retrying` 추가. 다시 시도 중에는 오류 화면을 유지하고 결과가 나오면 전환(초기화 리셋·쓰기 없음) |
| `app/globals.css` | 목록·카드·하단 내비 스타일, 토큰 `--lc-space-6`·`--lc-radius-card`·`--lc-nav-border`(#EDEBE3, Figma 내비 선)·`--lc-nav-height`·`--lc-app-width` 추가 |
| `public/assets/ui/` | Figma 아이콘 7개 추가: calendar, location, loading, nav-home/search/booking-active/my |
| `tests/booking-list.spec.ts` (신규) | 목록 Playwright 검사 13개 |

### 아직 없는 목적지 (다음 단계 구현 예정)

| 링크 | 연결한 경로 | 현재 동작 | 구현 예정 |
|---|---|---|---|
| 예약 카드 | `/bookings/{저장된 예약 ID}` | 목적지 화면이 없어 Next.js 404 페이지가 열린다. 뒤로 가면 목록과 스크롤 위치가 복원된다 | 4단계 예약 상세. 단, 정적 export 때문에 URL 형태 결정 필요(위 "다음 작업" 참고) |
| 새 레슨 예약 CTA | `/bookings/new` | 404. 목록에서 임의 상품을 기본 선택하지 않는다 | 5단계 생성 흐름 연결 |
| 하단 홈 탭 | `/` | 현재 서비스 홈인 랜딩페이지로 이동 | 앱 홈 화면이 생기면 교체 |
| 하단 찾기·마이 탭 | 없음 | 링크가 아닌 표시만(스크린 리더 "준비 중"). 눌러도 동작 없음 | 해당 화면 단계에서 연결 |

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **기기 상태 표시줄·홈 인디케이터 제외**: 브라우저 화면이므로 Figma의 `9:41` 상태 표시줄(44px)과 홈 인디케이터를 그리지 않았다. 그만큼 모든 요소가 44px 위에서 시작하며 간격은 Figma와 같다.
2. **목록 스크롤 영역**: Figma처럼 헤더~건수는 고정, 그 아래 목록만 세로 스크롤, 하단 내비는 화면 아래 고정. 높이는 고정 458px 대신 `100dvh`에서 남는 높이를 쓴다(390×844에서는 502px — 상태 표시줄 44px만큼 큼). 목록 끝 안전 여백 24px.
3. **하단 탭 터치 영역**: Figma 탭 폭 36px을 44px로 넓히고 좌우 여백을 4px씩 줄여 아이콘 위치는 Figma와 같다.
4. **읽기 실패 문구**: 알림 제목은 Figma `예약을 불러오지 못했어요`, 메시지는 명세대로 1단계 계약의 코드별 문구(`ERROR_MESSAGES`)를 그대로 쓴다. 예: CORRUPT_DATA → `저장된 예약 정보를 읽을 수 없어요. 기존 데이터는 변경하지 않았어요.` Figma 예시 문구(`기존 데이터는 변경하지 않았어요.\n다시 시도해주세요.`)와 다르다.
5. **다시 시도 중 표시**: Figma에 없는 상태. 오류 화면을 유지하고 버튼을 Loading(`다시 불러오는 중…`)으로 바꾼다.
6. **카드 접근 가능한 이름 순서**: `강사, 날짜 시간, 상태, 악기·길이, 공간, 예약 상세 보기`. 화면 문구 `예약 상세 보기 ›`는 장식으로 숨겼다.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings` 생성. `out/bookings.html` 있음, `ui-check` 없음 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | 43/43 통과. 기존 30 + 목록 13 |

목록 검사 항목 (`tests/booking-list.spec.ts`, 실제 동작 검증 — 데이터는 실제 LocalStorage envelope v1로 넣음):

- 최초 실행(키 없음): 시드 1건을 저장소에서 읽어 `예약 1건`, 카드 강사·악기·서울 날짜(오늘+7일)·`19:00–20:00`·공간·`예정`, 카드 href가 저장된 ID와 일치, CTA href `/bookings/new`, 새로고침해도 재시드 없음.
- 정상 0건: 빈 상태 문구, CTA 활성, 새로고침 후에도 원시 저장값 동일(재시드 없음).
- 초기화 중: 서버 HTML이 `예약을 불러오는 중이에요`·`예약 확인 중`·`aria-busy=true`이고 빈 상태·건수·CTA 링크가 없음(하이드레이션 전 빈 목록 노출 없음).
- 읽기 실패(손상 JSON): 오류 알림·계약 문구, 건수 자리 `예약을 불러올 수 없어요`, CTA 비활성, 카드·빈 상태 없음. 다시 시도해도 손상이면 오류 유지·원본 문자열 그대로. 데이터 복구 후 다시 시도 → 목록 표시. 버전 2 → `앱 버전을 확인해주세요` 문구. 알림 왼쪽 정렬·폭 350px.
- 파생 상태·정렬: 종료/진행 중/예정/취소됨 4건이 서울 시작 오름차순, 취소 포함 `예약 4건`.
- 390×844, 12건 + 긴 강사명·긴 공간명·긴 악기명: 페이지 자체는 넘치지 않고 목록만 스크롤. 카드 폭 350, 강사명 2줄에서 실제로 잘리고 링크 이름에는 전체 문자열. Badge와 강사명이 겹치지 않음. 날짜·시간은 잘리지 않음. 끝까지 스크롤하면 마지막 카드와 안내문이 하단 내비 위에 완전히 보임.
- 키보드: CTA 다음 Tab으로 첫 카드, 2px 파란 포커스 링. 6번째 카드 Enter → `/bookings/{그 ID}`. 뒤로 가기 → 목록 스크롤 위치 복원.
- 하단 내비: 예약 `aria-current=page`·`/bookings`, 홈 `/`, 링크는 2개뿐(찾기·마이는 표시만).
- 다른 탭에서 저장값 변경 → `storage` 이벤트로 다시 읽어 `예약 2건`·상태 갱신.
- 320/390px 가로 넘침 없음, 모든 이미지 로드·`alt=""`(장식), 콘솔 오류 없음.

디자인 확인(시각): 390×844 기본·긴 목록(위/끝)·0건·읽기 실패 스크린샷을 Figma 5개 프레임과 나란히 비교했다. 상태 표시줄을 뺀 것 외에는 헤더·문구·CTA·카드·Badge·아이콘·하단 내비 배치가 일치했다. 비교 중 읽기 실패 알림 문구가 가운데 정렬되던 문제를 찾아 고쳤다. 초기화 중 화면은 실제 저장소가 즉시 응답해 스크린샷으로 남기지 않았고, 서버 HTML 검사로 확인했다. 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 상세(`/bookings/{id}`)·새 예약(`/bookings/new`) 화면이 없어 현재 링크를 누르면 404다(위 표).
- 정적 export에서 상세 URL을 어떻게 제공할지 4단계 전에 결정해야 한다.
- 실제 모바일 기기(iOS Safari 주소창 높이 변화, safe-area)는 확인하지 않았다. Chromium 390×844·320×844에서만 확인했다.
- 실제 스크린 리더로 읽어 보지는 않았다. 접근 가능한 이름·role·aria 속성은 Playwright로 확인했다.
- 초기화 중 화면은 저장소가 동기 LocalStorage라 실제 브라우저에서 아주 짧게만 보인다.
- 검색·필터·정렬 조작·페이지네이션은 8단계 범위라 구현하지 않았다.

Claude 3단계 완료 여부: **완료**. 4단계는 시작하지 않았다.

---

## Claude 4단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/04-booking-detail.md, 이 진행 기록, 기존 `lib/bookings/*`·2단계 공통 UI·3단계 목록, Next 16.4.3 문서 `use-search-params.md`(정적 페이지에서 `useSearchParams`는 Suspense 경계 필요). Figma MCP로 정상 `286:1807`의 메타데이터와 본문 `286:1829`의 design context(Information `285:1808`·Memo `285:1828` 포함)를 읽고, 취소됨 `286:1993`·없는 ID `286:2055`·초기화 `286:2090`·조회 실패 `286:2123`·메모 없음 `286:1869` 스크린샷을 직접 확인했다. 긴 메모 `286:1931`은 명세의 수치(viewport 350×636, Footer y=744)로 대조했다.

progress 확인: 이번 단계 시작 시 Codex 갱신으로 Claude 1~3단계 기록 섹션이 삭제되지 않았다(추가·수정만 있음). 복원 작업은 필요 없었다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `app/bookings/detail/page.tsx` (신규) | 정적 페이지 `/bookings/detail`. `Suspense` fallback이 초기화 화면이며 정적 HTML에는 이것만 들어간다 |
| `components/bookings/booking-detail-screen.tsx` (신규) | 상세 화면. `useSearchParams`로 `id`를 읽어 저장소 조회. 상태: 초기화 중 / 정상(예정·진행 중·종료·취소됨) / 없는 ID / 조회 실패·다시 시도. Header 뒤로가기·Footer `예약 목록으로`는 항상 `/bookings` |
| `components/bookings/booking-detail-cards.tsx` (신규) | 재사용 카드 `BookingInfoCard`(Card / Information, `dl` 구조)·`BookingMemoCard`(Card / Memo, `pre-wrap`, 빈 메모 안내) |
| `lib/bookings/use-booking-detail.ts` (신규) | `initialize()` 후 `getBooking(id)`. NOT_FOUND·잘못된 UUID·ID 없음 → `not-found`, 그 외 저장소 오류 → `error`(NOT_FOUND로 바꾸지 않음). 성공 쓰기 구독·다른 탭 `storage` 이벤트 재조회, `retry` |
| `lib/bookings/detail-actions.ts` (신규) | `getDetailActions(phase)` — 상태별 수정·취소·삭제 허용 조건(저장소 전이 규칙과 동일) |
| `lib/bookings/use-now.ts` (신규) | 목록에 있던 1분 갱신 `useNow`를 공용 훅으로 분리 |
| `lib/bookings/routes.ts` | `bookingDetailHref(id)` → `/bookings/detail?id={UUID}`. `BOOKING_DETAIL_PATH`, `BOOKING_ID_PARAM` 추가. 목록 카드는 이 헬퍼를 그대로 사용하므로 카드 코드 수정 없음 |
| `lib/bookings/catalog.ts` | `GENRE_LABELS`(장르 ID → `Rock`, `R&B`, `K-Pop`, `New Age` 등) 추가 |
| `lib/bookings/format.ts` | `formatGenres`(순서 유지, ` · ` 구분), `lessonTitle`(`김민준 선생님과의 레슨`) 추가 |
| `components/bookings/booking-list-screen.tsx` | `useNow`를 공용 훅 import로 교체(동작 변경 없음) |
| `app/globals.css` | `lc-detail-*` 스타일. 기존 `--lc-*` 토큰만 사용 |
| `tests/booking-detail.spec.ts` (신규) | 상세 Playwright 검사 11개 |
| `tests/booking-list.spec.ts` | 카드 href 기대값을 `/bookings/detail?id=…`로 갱신 |

### 액션 현재 상태 (성공한 것처럼 처리하지 않음)

| 예약 상태 | 허용 액션(명세) | 현재 화면 | 연결 단계 |
|---|---|---|---|
| 예정(시작 전) | Footer `예약 수정`, 본문 `예약 취소` | Footer Secondary `예약 목록으로`. `예약 관리`에 정보 알림 `예약 수정·취소는 준비 중이에요` / `레슨 시작 전까지 수정하거나 취소할 수 있어요.` | 수정 6단계, 취소 7단계 |
| 진행 중 | 없음 | `예약 관리` 영역 없음 | — |
| 종료·취소됨 | 본문 `예약 기록 삭제` | 정보 알림 `예약 기록 삭제는 준비 중이에요` / 연결 후 복구 불가 안내 | 7단계 |

수정·취소·삭제 버튼은 DOM에 없다(비활성 버튼으로도 남기지 않음). 화면의 조작 요소는 Header 뒤로가기와 `예약 목록으로` 링크 2개뿐이며, 상세 조회 중 LocalStorage 원시값이 바뀌지 않음을 검사로 확인했다.

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **액션 자리 표시**: Figma는 최종 배치(`예약 수정` Primary, `예약 취소`/`예약 기록 삭제` Secondary)를 보여주지만, 명세 규칙(404로 가는 활성 버튼·확인 핸들러 없는 버튼 금지)에 따라 위 표처럼 정보 알림으로 대체했다. Footer도 예정 상태에서 `예약 목록으로`다.
2. **예정 상태 설명 문구**: Figma `예약 내용을 확인하고 변경할 수 있어요.` → 변경 기능이 아직 없어 `예약 내용을 확인할 수 있어요.`로 표시. 6단계에서 수정이 연결되면 Figma 문구로 되돌린다.
3. **진행 중·종료 설명 문구**: Figma 프레임이 없어 `지금 진행 중인 레슨이에요.` / `종료된 레슨이에요.`로 정했다.
4. **조회 실패 알림 문구**: 제목은 Figma `예약 정보를 읽지 못했어요`, 메시지는 명세대로 1단계 코드별 문구(`ERROR_MESSAGES`). 예: CORRUPT_DATA → `저장된 예약 정보를 읽을 수 없어요. 기존 데이터는 변경하지 않았어요.` 다시 시도 중에는 `다시 불러오는 중…`(Figma에 없는 상태, 3단계와 동일).
5. **상태 표시줄·홈 인디케이터 제외**: 3단계와 같이 브라우저에서는 그리지 않아 모든 요소가 44px 위에서 시작한다. Footer 높이 100px(12+56+32)은 유지했다. 본문 영역은 고정 636px이 아니라 `100dvh`에서 남는 높이(390×844에서 680px).
6. **장르 레이블**: 카탈로그에 레이블이 없어 `GENRE_LABELS`를 새로 정의했다(`rnb`→`R&B`, `k-pop`→`K-Pop`, `new-age`→`New Age`, `edm`→`EDM`, 나머지는 첫 글자 대문자). Figma 예시 `Rock · Blues`와 일치한다.
7. **Header 뒤로가기 접근 가능한 이름**: `예약 목록으로 돌아가기`(실제 동작이 항상 목록 이동이므로).

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail` 생성. `out/bookings/detail.html`에는 초기화 화면(`예약을 불러오는 중이에요`, `aria-busy="true"`, Disabled `예약 확인 중`)만 있음 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | 54/54 통과. 기존 43 + 상세 11 |

상세 검사 항목 (`tests/booking-detail.spec.ts`, 실제 동작 검증 — 데이터는 실제 LocalStorage envelope v1로 넣음):

- 목록 카드 클릭 → `/bookings/detail?id={시드 ID}`. 강사·악기·장르·서울 날짜(오늘+7일)·`19:00–20:00`·공간·`예정`·빈 메모 안내가 저장값과 일치. **새로고침해도 같은 URL·같은 예약**. 상세 URL 직접 접속도 모든 검사에서 사용. 조회 후 저장 원시값 변화 없음.
- 예정: `예약 관리`에 준비 중 안내, 수정·취소·삭제 버튼/링크 0개, 화면 조작 요소 2개, 저장값 변화 없음.
- 진행 중(서울 현재 시각 포함): `진행 중`, `예약 관리` 영역 없음. 종료(어제): `종료` + 삭제 준비 중 안내. 취소됨: `취소됨`·`이 예약은 취소되었어요.`·`20:00–21:00` + 삭제 준비 중 안내.
- **긴 메모 결과**: 줄바꿈·120자 연속 영문 단어·이모지 20개·`<b>` 문자열을 포함한 정확히 500 code point 메모 → 표시 텍스트가 저장값과 완전히 같음(잘림 없음), `<b>`는 요소로 해석되지 않음, `white-space: pre-wrap`, 메모 단락 가로 넘침 없음. 긴 강사명·공간명·장르 3개는 전체값으로 줄바꿈. 카드 폭 350px. 본문만 스크롤되고 Footer 위치는 스크롤 전후 동일, 끝까지 스크롤하면 `예약 관리` 알림이 Footer 위에 완전히 보임. 페이지 가로 넘침 없음.
- **없는 ID 결과**: 저장소에 없는 UUID, `not-a-uuid`, 빈 `id=`, 쿼리 없음 모두 `예약을 찾을 수 없어요` / `삭제되었거나 주소가 잘못됐을 수 있어요.`. 예약 데이터·조회 실패 알림·액션 없음, Footer 링크 `/bookings`, 저장값 변화 없음. Header 뒤로가기(직접 접속, 방문 기록 없음) → `/bookings`.
- 조회 실패: 손상 JSON → `role=alert` `예약 정보를 읽지 못했어요` + CORRUPT_DATA 문구, 없는 ID 화면 아님, 예약 데이터·액션 없음, `예약 목록으로` 사용 가능. 다시 시도해도 손상이면 오류 유지·원본 문자열 그대로. 데이터 복구 후 다시 시도 → 상세 전환.
- 필수 필드 누락(`snapshot.instructorName` 삭제) → `미정` 없이 CORRUPT_DATA 조회 실패. `schemaVersion: 2` → UNSUPPORTED_VERSION 문구, 원본 유지.
- 초기화 중: 정적 HTML에 로딩 상태만 있고 없는 ID·빈 메모·오류 문구 없음(깜빡임 없음).
- 다른 탭에서 해당 예약이 삭제되면(`storage` 이벤트) 없는 ID 화면으로 전환.
- 키보드: Tab 순서 뒤로가기(44px) → `예약 목록으로`, 2px `#3875C7` 포커스 링, Enter로 `/bookings` 이동.
- 320/390px 가로 넘침 없음(정상·없는 ID), 이미지 로드·장식 `alt=""`, 콘솔 오류 없음.

디자인 확인(시각): 390×844 정상·취소됨·긴 메모(끝까지 스크롤)·없는 ID·조회 실패 스크린샷을 Figma 프레임과 나란히 비교했다. 상태 표시줄 제외와 위 "다르게 구현한 부분" 1·2·4 외에는 Badge·제목·정보 카드(레이블 62px 열·구분선)·메모 카드·Footer·빈 상태 아이콘·오류 알림 배치가 일치했다. 초기화 화면은 정적 HTML 검사로 확인했다. 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 수정·취소·삭제 실행은 연결하지 않았다(6·7단계). 현재 안내 문구는 임시이며 연결 시 교체한다.
- 정적 호스팅에서 `/bookings/detail`이 `out/bookings/detail.html`로 제공되는지는 호스팅 설정에 따른다(Next 기본 export 구조). 실제 배포는 하지 않았다.
- 실제 모바일 기기·실제 스크린 리더는 확인하지 않았다(Chromium 320/390과 Playwright 접근성 이름·role 검사만).
- 상세 화면을 연 채 레슨 시작 시각이 지나면 1분 안에 상태(예정→진행 중)와 `예약 관리` 영역이 바뀐다. 이 전환 자체는 자동 검사에서 시간을 진행시켜 보지 않았다.

Claude 4단계 완료 여부: **완료**. 5단계는 시작하지 않았다.

---

## Claude 5단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/05-booking-create.md, design/data-contract.md, 이 진행 기록, 기존 `lib/bookings/*`·2단계 공통 UI·3단계 목록·4단계 상세 코드, Next 16.4.3 문서 `linking-and-navigating.md`(네이티브 `window.history.pushState`가 라우터와 통합됨). Figma MCP로 Initial `291:1950`·Ready `291:2020`·Ready Scrolled `291:2114`·Errors `291:2208`·Save Error `291:2399`·Success Detail `291:2647` 스크린샷을 직접 확인했다. Saving `291:2303`·Leave Confirm `291:2500`은 명세 문구와 2단계 Loading 버튼·Confirmation Dialog 마스터로 대조했다.

progress 확인: 이번 단계 시작 시 Claude 1~4단계 기록 섹션은 삭제되지 않았다(Codex가 5단계 항목만 추가). 복원 작업은 필요 없었다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `app/bookings/new/page.tsx` (신규) | 정적 페이지 `/bookings/new` |
| `components/bookings/booking-create-screen.tsx` (신규) | 생성 화면. 마운트 후 `initialize()`로 최신 revision 확보 → 폼 활성화. `createBooking(input, revision)` 성공(`StoreResult.ok`) 뒤에만 성공 알림을 넘기고 `bookingDetailHref(id)`로 이동. CONFLICT면 최신 revision만 다시 읽고 사용자가 확인 후 재시도. 초기화 실패는 폼 없이 오류·`다시 시도`. Header 뒤로가기·이탈 Dialog |
| `components/bookings/booking-form.tsx` (신규) | **생성·수정 공통 `BookingForm`**. `mode`, `catalog`, `initialValues`, `onSubmit`, 문구 props. 본문 스크롤 + 고정 Footer CTA. 상품 → 읽기 전용 요약, 상품 변경 시 날짜·시간·공간 초기화와 안내, blur/제출 시점 오류, 첫 오류 포커스, 중복 제출 차단, 실패 시 입력 유지·고정 알림 |
| `lib/bookings/form.ts` (신규) | 폼 값 타입, 5단계 필드 문구, 카탈로그 옵션(활성 상품·강사, 허용 활성 공간, 카탈로그 시각), `validateBookingForm`(서울 기준), `toBookingInput`, `changeOffer`, `mapSaveError`(저장소 오류 → 필드 오류/알림) |
| `lib/bookings/flash.ts` (신규) | 저장 성공 알림 1회 전달. 같은 탭 메모리 값만 사용(URL·LocalStorage·sessionStorage에 남기지 않음) |
| `lib/bookings/use-leave-guard.ts` (신규) | dirty일 때 `beforeunload`(브라우저 기본 확인) + 브라우저 뒤로가기 가드(같은 URL 기록 1개 추가 → popstate에서 앱 Dialog) |
| `components/bookings/booking-detail-screen.tsx` | 생성 직후 도착한 경우에만 성공 Inline Alert `예약을 저장했어요` 1회 표시 |
| `components/ui/confirm-dialog.tsx` | **2단계 공통 컴포넌트 버그 수정**: 이전에 닫힐 때의 `close` 이벤트가 비동기로 늦게 도착하면 다시 연 Dialog를 바로 닫던 경쟁 상태. 코드가 닫은 경우와 브라우저가 직접 닫은 경우를 구분하고, 다시 열린 상태의 지연 이벤트는 무시한다(동작·API 변경 없음) |
| `app/globals.css` | `lc-form-*`, `lc-detail-flash` 스타일. 기존 `--lc-*` 토큰만 사용 |
| `tests/booking-form.spec.ts` (신규) | 폼 검증 순수 함수 10개(Node) |
| `tests/booking-create.spec.ts` (신규) | 생성 화면 브라우저 검사 14개 |

### 동작 순서와 규칙 (구현 결과)

1. **입력값 검증 → 저장소 생성 → 성공 시 상세 이동.** 제출 시 전체 필드를 검증하고 오류가 있으면 저장소를 호출하지 않는다. 통과하면 CTA를 즉시 `저장 중…`(`aria-busy=true`)으로 바꾸고 `createBooking`을 한 번만 호출한다. 인위적 지연 없음.
2. **성공 메시지**: `createBooking`이 `ok`를 반환한 뒤(=`setItem` 성공 후)에만 `setBookingFlash` → 상세 이동. 상세에서 `예약을 저장했어요` / `이 브라우저에 예약 내용이 저장됐어요. 실제 강사·공간 예약은 확정되지 않아요.`를 한 번 보이고, 새로고침·직접 방문에서는 보이지 않는다.
3. **실제 서버처럼 처리하지 않음**: 저장소는 1단계 LocalStorage repository뿐이다. 화면 안내는 `표시된 일정·공간은 데모 선택 항목이며 실제 예약 가능 여부를 확인하지 않아요.`, `이 기기의 이 브라우저에 예약 내용이 저장돼요. 실제 강사·공간 예약은 확정되지 않아요.` `예약 가능`·`공간 확보 완료`·`강사 확정` 문구가 없음을 검사로 확인했다. 시간 겹침 오류는 같은 브라우저의 로컬 기록 충돌로만 설명한다.
4. **중복 제출 방지**: `submittingRef`(동기 플래그) + Loading 버튼의 클릭 차단. 성공 후 이동이 끝날 때까지 Loading 유지.
5. **저장 실패 시 입력 유지**: 필드 값·메모·확인 체크·스크롤 위치 유지, Loading 해제, 같은 버튼으로 재시도. 문구: QUOTA_EXCEEDED `저장 공간이 부족해요. 입력 내용은 유지했어요.`, STORAGE_UNAVAILABLE/WRITE_FAILED `입력 내용은 유지했어요. 다시 시도해주세요.`(제목 `예약을 저장하지 못했어요`), LOCAL_TIME_CONFLICT는 시작 시간 필드 오류+포커스, VALIDATION_ERROR(경계 시각 등)는 저장 시점 시각으로 다시 검증해 필드 오류, CONFLICT는 `다른 화면에서 예약 정보가 변경됐어요` 알림 후 최신 revision만 다시 읽음(오래된 revision으로 조용히 다시 쓰지 않음).
6. **오류 필드 안내**: 최초 진입엔 오류 없음. 값을 바꾸고 떠난(blur) 필드, 또는 제출 시도 후 전체 필드에 표시. 이후 값을 고치면 즉시 갱신·제거. 오류 컨트롤은 빨간 선, `aria-invalid=true`, `aria-describedby`로 문구 연결(확인 체크박스 포함). 제출 실패 시 화면 순서상 첫 오류 필드로 포커스.
7. **이탈 처리**: 변경 없음 → Header 뒤로가기는 바로 `/bookings`. dirty → `예약 작성을 그만둘까요?` / `작성 중인 내용은 저장되지 않아요.` / `계속 작성`·`나가기`(초점 트랩·Escape 닫기·초점 복원은 2단계 `ConfirmDialog`). 브라우저 뒤로가기도 같은 Dialog. 새로고침·탭 닫기는 브라우저 기본 `beforeunload` 확인만. 저장 중에는 Header 뒤로가기를 무시. draft는 따로 저장하지 않는다.

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **상품 미선택 시 CTA 비활성**: Figma Initial대로 상품 선택 전에는 `예약하기`가 native `disabled`이고 본문에 `레슨을 선택하면 악기·장르·길이와 가능한 공간을 볼 수 있어요.`를 보인다. 따라서 생성 화면에서 `강사와 레슨을 선택해주세요.` 문구가 화면에 나올 경로는 없다(상품 Select에 빈 값으로 되돌리는 옵션도 없음). 문구는 검증 함수에 있고 수정 화면 등에서 쓸 수 있다.
2. **추가 문구**(명세 표에 없음): 비활성/삭제 상품 `선택한 레슨을 이용할 수 없어요. 다시 선택해주세요.`, 상품 변경 시 `레슨을 바꿔서 날짜·시작 시간·공간 선택을 지웠어요. 다시 선택해주세요.`(role=status), CONFLICT 메시지 `최신 예약 정보를 다시 불러왔어요. 입력 내용은 유지했어요. 내용을 확인한 뒤 다시 시도해주세요.`, 초기화 실패 화면 `예약 정보를 준비하지 못했어요` / `지금은 새 예약을 작성할 수 없어요`, 카탈로그 밖 기존 값용 비활성 옵션 `현재 선택할 수 없는 레슨/공간`.
3. **과거 오류 위치**: 지난 날짜는 날짜 필드(`미래의 날짜와 시작 시간을 선택해주세요.`, Figma Errors와 동일), 오늘 날짜에서 이미 지난 시각은 시작 시간 필드에 같은 문구. 오늘 날짜를 고르면 지난 시각 옵션은 `18:00 (지난 시간)`처럼 비활성 표시.
4. **공간 옵션 표기**: 명세의 "스튜디오·방 이름과 장비를 옵션에서 구별"에 따라 `동탄 스튜디오 · A 레슨실 (기타·앰프)`로 표시. Figma 선택값은 `동탄 스튜디오 · A 레슨실`(장비 없음).
5. **저장 실패 알림 위치**: Figma Save Error처럼 본문 맨 위에 두되 `position: sticky`로 고정했다. 사용자가 아래(메모·체크)까지 스크롤한 상태에서 실패해도 스크롤 위치를 바꾸지 않고 알림이 보이게 하기 위해서다. 알림이 들어오면 브라우저 스크롤 앵커링이 기존 입력의 화면 위치를 유지한다.
6. **날짜 컨트롤**: native `type="date"`라 비어 있을 때 `날짜를 선택해주세요` 대신 브라우저 형식(영문 Chromium `mm/dd/yyyy`, 한국어 환경 `연도-월-일`)이 보인다. `min`은 서울 오늘. 브라우저가 해석하지 못한 입력은 `올바른 날짜를 선택해주세요.`
7. **메모 글자 수**: `N/500자`는 저장 규칙과 같게 앞뒤 공백을 제외한 code point 수다. `maxLength`를 두지 않아 초과 입력도 남기고 오류로 저장만 막는다. 오류가 있으면 Field 규칙상 도움말 자리에 오류 문구가 대신 보인다.
8. **성공 상세 설명 문구**: 4단계 결정대로 `예약 내용을 확인할 수 있어요.` 유지(Figma `…변경할 수 있어요.`는 6단계 수정 연결 후). 성공 상세에는 4단계의 `예약 관리` 준비 중 안내도 그대로 보인다.
9. **상태 표시줄·홈 인디케이터 제외**: 3·4단계와 같다. 본문은 고정 636px이 아니라 `100dvh`에서 남는 높이.
10. **브라우저 뒤로가기 가드의 부작용**: dirty가 되면 같은 URL 기록을 하나 더 쌓는다. `나가기`로 목록에 간 뒤 브라우저 뒤로가기를 누르면 빈 생성 폼으로 한 번 돌아온다. 작성 중 값을 원래대로 되돌린 뒤 뒤로가기를 누르면 가드 기록을 지나 원래 이전 화면으로 이동한다.
11. **데이터 계약 오류 문구와의 관계**: 폼은 5단계 명세의 구체적 필드 문구를 쓴다. 저장소 `FIELD_MESSAGES`(1단계 계약 기본값)는 변경하지 않았고 폼에 직접 표시하지 않는다.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/new` 생성. `out/bookings/new.html`에 LocalStorage 접근 코드·저장값 없음 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | **78/78 통과**. 기존 54 + 폼 검증 10 + 생성 화면 14 |
| 이탈·저장 실패 검사 `--repeat-each 5` | 10/10 통과(타이밍 의존 여부 확인) |

생성 검사 결과 (`tests/booking-create.spec.ts`, 실제 브라우저 LocalStorage 사용 — 실제 동작 검증):

- **정상 생성**: 상품·미래 날짜·20:00·B 레슨실·앞뒤 공백 있는 2줄 메모·확인 체크 → `/bookings/detail?id={UUID v4}` 이동, 성공 알림 1회. 저장값: revision +1, 2건, `source: 'user'`, `status: 'scheduled'`, 메모 trim·줄바꿈 유지, snapshot B 레슨실·60분, `acknowledged` 필드 없음. 상세 시간 `20:00–21:00`.
- **새로고침 후 유지**: 상세 새로고침 → 같은 예약·메모 표시, 성공 알림 사라짐. 목록 → 카드 2건, 새로고침해도 2건, 새 카드 링크 `/bookings/detail?id={새 ID}`. 목록 CTA → 생성 → 상세 → `예약 목록으로` 클라이언트 이동 흐름도 확인.
- **잘못된 입력**: 상품만 고르고 제출 → 날짜 필드 포커스·`aria-invalid`·`aria-describedby`가 `날짜를 선택해주세요.`를 가리킴, `시작 시간을 선택해주세요.`·`레슨 공간을 선택해주세요.`·`예약 내용을 확인해주세요.` 표시(체크박스도 `aria-invalid`). 과거 날짜 → `미래의 날짜와 시작 시간을 선택해주세요.`, 미래로 고치면 즉시 해제. 메모 이모지 501개 → 제출 시 메모 포커스·`메모는 500자까지 입력할 수 있어요.`·입력값 그대로·저장 0건, 1자 지우면 오류 사라짐 `500/500자`, 저장 시 이모지 500개 저장. blur 전에는 오류 없음. 오늘 날짜에서 서울 현재 시각 이전 옵션 비활성.
- **검증 함수**(Node): 빈 폼 문구, 달력에 없는 `2026-02-30`·형식 오류·브라우저 해석 불가, 오늘 지난 시각, 카탈로그 밖 `17:30`, 서울 자정 경계(UTC 15:00), 비허용·비활성 공간, 비활성 상품·강사, 메모 500/501 code point(앞뒤 공백 제외), 확인 체크 누락, 상품 변경 시 종속 값 초기화, 요약 `기타 · Rock / Blues` / `레슨 길이 60분 · 예시 50,000원`, 저장 오류 매핑.
- **저장 실패**: `setItem`이 `QuotaExceededError` → 용량 문구, 일반 오류 → 재시도 문구. 두 경우 모두 URL 그대로, 저장 0건, 메모·공간·체크 유지, 보던 입력 위치 유지(±1px), 알림이 화면 안에 보임, CTA 다시 활성·`aria-busy` 해제, 성공 알림 없음. `setItem` 복구 후 같은 버튼 → 성공 이동·1건.
- **중복 제출**: 같은 틱에 버튼 클릭 2번 + `requestSubmit()` → 1건만 생성, revision 1 → 2.
- **시간 겹침**: 같은 날 20:00 기존 예약 → 시작 시간 포커스·`같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.`, 21:00(맞닿은 경계)으로 바꾸면 해제·저장 성공.
- **CONFLICT**: 폼 준비 후 다른 탭처럼 저장소를 revision 4로 교체 → 저장 없이 안내, 다시 누르면 revision 5로 저장되고 다른 탭 예약 유지.
- **이탈**: 깨끗한 상태 뒤로가기 → 바로 `/bookings`. 메모 입력 후 → Dialog, `계속 작성` 초기 포커스, Escape 닫기 후 뒤로가기 버튼으로 초점 복귀·메모 유지, `계속 작성` 유지, 브라우저 뒤로가기 → 같은 Dialog(URL 유지), `나가기` → `/bookings`, 저장 0건. 탭 닫기 → `beforeunload` 기본 확인창 발생.
- **초기화 실패**: 손상 JSON → 폼 없이 CORRUPT_DATA 알림·`다시 시도`, 원본 그대로.
- **레이아웃**: 390×844 오류 문구가 모두 보이는 상태에서 Footer 하단 ≤ 844, CTA 350px, 본문만 스크롤, 끝까지 스크롤하면 마지막 안내가 Footer 위에 완전히 보이고 Header 유지. 320/390/768/1440 가로 넘침 없음. 콘솔 오류 없음.

디자인 확인(시각): 390×844 Initial·Ready·Ready Scrolled·Errors·Save Error·Leave Confirm·Success Detail을 직접 촬영해 Figma와 나란히 비교했다. 위 "다르게 구현한 부분" 4·5·6·9 외에는 제목·설명, 상품 Select, 요약 카드(surface 배경), 필드 순서·도움말, 데모 안내, 메모·카운터, 체크박스, 고정 Footer CTA, 오류 빨간 선·문구, 성공 상세 알림 배치가 일치했다. Initial의 비활성 필드 도움말은 Figma처럼 흐리게 하지 않았다(컨트롤만 native disabled 표현). 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 저장 중 상태(Loading)는 LocalStorage가 동기라 실제로는 한 프레임 수준이다. 별도 지연으로 촬영·검사하지 않았고, 중복 제출 차단으로 간접 확인했다.
- 브라우저 뒤로가기 가드는 Chromium에서만 검사했다. Safari·Firefox의 기록 처리, 모바일 제스처 뒤로가기는 확인하지 않았다. `beforeunload` 확인창은 브라우저 정책상 사용자의 실제 입력이 있었던 페이지에서만 뜬다.
- 저장 경계 시각(제출 직전 레슨 시작 시각 도달)은 검증 함수·매핑 단위 검사로만 확인했고 브라우저 시계를 진행시켜 보지는 않았다.
- 실제 모바일 기기·스크린 리더는 확인하지 않았다(Chromium과 Playwright role·이름·aria 검사만).
- production `out/` 정적 파일을 별도 서버로 띄운 브라우저 검사는 하지 않았다(개발 서버 검사 + build 성공 확인). 배포하지 않았다.

Claude 5단계 완료 여부: **완료**. 6단계는 시작하지 않았다.

## Claude 6단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/06-booking-edit.md, 이 진행 기록, 5단계 `BookingForm`·`lib/bookings/form.ts`·`useLeaveGuard`·`ConfirmDialog`·`flash`, 4단계 상세 조회 훅, 저장소 `updateBooking`. Figma MCP로 Edit Unchanged `295:2272`·Edit Changed `295:2355`·Edit Save Error `295:2433`·Edit Not Found `295:2605`·Edit Unavailable `295:2637`·Edit Success Detail `295:2670` 스크린샷을 직접 확인했다. Leave Confirm `295:2518`은 명세 문구와 5단계 Dialog로 대조했다.

progress 확인: 이번 단계 시작 시 Claude 1~5단계 기록 섹션은 삭제되지 않았다(Codex가 6단계 항목만 추가). 복원 작업은 필요 없었다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `app/bookings/edit/page.tsx` (신규) | 정적 페이지 `/bookings/edit`. `Suspense` 아래에서 `useSearchParams()`로 `id`를 읽는다 |
| `components/bookings/booking-edit-screen.tsx` (신규) | 수정 화면. 마운트 후 `initialize()` → `getBooking(id)`(4단계 `loadBookingDetail` 재사용) → 시작 전 예정이면 폼, 아니면 수정 불가. 없는 ID·수정 불가·조회 실패·불러오는 중 상태. `updateBooking(id, input, revision)` 1회 호출, 성공 시 `setBookingFlash(id,'update')` → 같은 ID 상세. CONFLICT·INVALID_TRANSITION·NOT_FOUND 처리, 이탈 Dialog |
| `components/bookings/booking-form.tsx` | **최소 확장**(복제 없음): edit 모드 dirty를 의미 있는 변경으로 계산, 변경 없음 문구·CTA 비활성(Enter 제출도 차단), Secondary `수정 취소`(`onCancel`), 호출 화면의 저장 차단(`submitBlocked`)·상단 안내(`notice`), 카탈로그에서 사라진 기존 상품·공간의 비활성 옵션 이름(`unavailableLabels`, snapshot 기준), 수정 진입 시 사용할 수 없는 기존 상품·시간·공간은 처음부터 필드 오류. 생성 모드 동작은 그대로 |
| `lib/bookings/form.ts` | `bookingToFormValues`(확인 체크 false), `hasMeaningfulChange`(offerId·date·startTime·spaceId·trim 메모), `EDIT_MESSAGES`, `mapSaveError(error, mode)` — 수정 모드 문구 `변경 내용을 저장하지 못했어요` / `편집 중인 내용은 유지했어요.` |
| `lib/bookings/routes.ts` | `BOOKING_EDIT_PATH`, `bookingEditHref(id)` → `/bookings/edit?id={UUID}`(`BOOKING_ID_PARAM` 재사용) |
| `lib/bookings/use-booking-detail.ts` | 조회 함수 `loadBookingDetail`을 export(동작 변경 없음) |
| `components/bookings/booking-detail-screen.tsx` | 시작 전 예정 예약에만 Footer Primary `예약 수정` 링크. 예정 설명 `예약 내용을 확인하고 변경할 수 있어요.`(Figma 295:2670). 예약 관리 안내를 `예약 취소는 준비 중이에요`로 변경 |
| `app/globals.css` | 빈 상태 문구 숨김, CONFLICT 알림 안 최신 내용·확인 버튼 스타일. 기존 토큰만 사용 |
| `tests/booking-edit.spec.ts` (신규) | 수정 화면 브라우저 검사 15개 |
| `tests/booking-detail.spec.ts`, `tests/booking-create.spec.ts` | 예정 예약 Footer가 `예약 목록으로` → `예약 수정`으로 바뀐 의도된 변경에 맞춰 3곳 갱신(키보드 검사는 목록 링크가 있는 종료 예약으로, 생성 흐름은 Header 뒤로가기로 목록 이동) |

### 동작 규칙 (구현 결과)

1. **초기값**: 저장된 `offerId`·`date`·`startTime`·`spaceId`·`memo`로 채우고 확인 체크는 항상 빈 상태. 불러오는 동안 빈 폼을 보이지 않는다(정적 HTML은 불러오는 중 화면만).
2. **저장 필드**: 폼은 `BookingInput`만 보낸다. `id`·`createdAt`·`source`·`status`는 저장소 `updateBooking`이 유지하고 `updatedAt`만 갱신한다(상품·공간이 같으면 snapshot도 유지).
3. **변경 없음**: 확인 체크만 바꾸거나 메모 앞뒤 공백만 바꾸거나 바꿨다가 되돌리면 `변경한 내용이 없어요. 내용을 바꾸면 저장할 수 있어요.` + `변경사항 저장` native disabled. 저장소를 호출하지 않고 성공 알림도 없다. 이탈 판단(dirty)도 같은 기준.
4. **입력 검증**: 5단계 규칙 그대로(blur·제출 시점, `aria-invalid`·`aria-describedby`, 첫 오류 포커스, 500 code point). 확인 체크는 변경이 있을 때 제출 시 오류+포커스로 요구한다(체크 전 CTA를 미리 막지는 않음 — 명세가 허용한 두 방식 중 생성과 같은 쪽).
5. **저장 실패**: 편집값·메모·확인 체크·스크롤 위치 유지, Loading 해제, 같은 버튼으로 재시도. LOCAL_TIME_CONFLICT는 시작 시간 필드 오류(자기 예약은 저장소가 제외).
6. **CONFLICT**: revision만 바꿔 재시도하지 않고 `getBooking(id)`로 대상을 재조회한다. 대상 `updatedAt`이 바뀌었으면 `다른 화면에서 이 예약이 변경됐어요. 새 내용을 확인해주세요.` + 저장된 최신 날짜·시간·공간·메모를 보이고, draft는 폼에 유지한 채 저장을 막는다. `최신 내용 확인했어요`를 누르면 최신 예약을 비교 기준·revision으로 삼고 저장을 다시 허용한다. 대상이 없어졌으면 없는 ID, 취소·시간 경과면 수정 불가 상태로 전환. 다른 예약만 바뀌었으면 최신 revision으로 바꾸고 안내 후 사용자가 다시 누르면 저장.
7. **INVALID_TRANSITION·시간 경과**: draft는 유지하고 `이 예약은 이제 수정할 수 없어요.` 알림, CTA 비활성. 화면을 열어 둔 사이 시작 시각이 지나면(`useNow` 1분 갱신) 같은 상태.
8. **이탈**: Header 뒤로가기·`수정 취소`·브라우저 뒤로가기 모두 항상 해당 예약 상세로. 변경 없음이면 바로 이동, 변경 있으면 `수정을 그만둘까요?` / `변경한 내용은 저장되지 않아요.` / `계속 작성`·`나가기`. 새로고침·탭 닫기는 브라우저 기본 `beforeunload`. draft 저장 키 없음.

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **상세의 예약 관리 안내**: Figma Success Detail(295:2670)에는 `예약 관리` 영역이 없지만, 7단계 전까지 취소 기능이 없음을 알리기 위해 `예약 취소는 준비 중이에요` / `레슨 시작 전까지 아래 예약 수정 버튼으로 내용을 바꿀 수 있어요. 취소 기능은 아직 연결되지 않았어요.` 정보 알림을 유지했다. 예정 예약 Footer는 Figma대로 Primary `예약 수정` 하나이고, 목록으로는 Header 뒤로가기로 간다.
2. **CONFLICT 안내 구성**(명세에 시각 프레임 없음): 오류 Inline Alert 안에 `저장된 최신 내용: {날짜} {시간} · {공간}`, `메모: …`/`메모 없음`, `편집 중인 내용은 유지했어요. 확인한 뒤 다시 저장해주세요.`와 Secondary `최신 내용 확인했어요` 버튼. 필드별 나란히 비교 UI는 만들지 않았다.
3. **추가 문구**: 수정 불가 안내 본문 `시작 전 예정 예약만 수정할 수 있어요. 편집 중인 내용은 저장되지 않았어요.`, 조회 실패 화면 제목 `지금은 예약을 수정할 수 없어요`, 사라진 상품·공간 옵션 `{snapshot 이름} (현재 선택할 수 없음)`.
4. **5단계와 같은 차이 유지**: 공간 옵션에 장비 표기 `(기타·앰프)`, native date 표시 형식(`11/19/2026`), 저장 실패 알림 sticky, 상태 표시줄·홈 인디케이터 제외.
5. **상품 변경 검증 범위**: 현재 카탈로그에 활성 상품이 1개뿐이라 "다른 상품으로 바꾸기"는 카탈로그에서 사라진 상품의 예약을 현재 상품으로 다시 고르는 경우로 검사했다. 가짜 상품은 만들지 않았다.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/edit`, `/bookings/new`. `out/bookings/edit.html`에 LocalStorage 접근 코드 없음 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | **93/93 통과**. 기존 78 + 수정 화면 15 |
| 수정 검사 `--repeat-each 3` | 45/45 통과 |

수정 검사 결과 (`tests/booking-edit.spec.ts`, 실제 브라우저 LocalStorage — 실제 동작 검증):

- **진입·초기값**: 상세 `예약 수정` → `/bookings/edit?id={같은 ID}`, 상품·날짜·20:00·B 레슨실·메모가 저장값 그대로, 확인 체크만 비어 있음, 요약 `기타 · Rock / Blues`. 변경 없음 문구·저장 비활성, `수정 취소` 활성, 오류 없음. 체크만·메모 공백만 변경 → 비활성 유지, 시간 변경 → 활성, 되돌림 → 비활성, Enter 제출 → 이동·쓰기 없음(원시값 동일).
- **정상 수정·반영·유지**: 시간 21:00·C 레슨실·앞뒤 공백 있는 2줄 메모 → 같은 ID 상세, `예약을 수정했어요` 1회, 상세 `21:00–22:00`·C 레슨실·trim 메모. 저장값: revision +1, 2건 그대로, `id`·`createdAt`·`source:'seed'`·`status` 유지, `updatedAt` 증가, snapshot C 레슨실, `acknowledged` 없음. **다른 예약은 원본과 완전히 같음**(deep equal, 목록 새로고침 후에도). 상세 새로고침 → 수정값 유지·알림 없음. 목록 → 카드 2건·해당 카드 21:00, 새로고침 후 유지.
- **중복 제출**: 클릭 2번 + `requestSubmit()` → revision 3 → 4(1회).
- **입력 검증**: 체크 누락 → 체크박스 포커스·`aria-invalid`·`예약 내용을 확인해주세요.`, 과거 날짜 → 날짜 포커스·`미래의 날짜와 시작 시간을 선택해주세요.`, 메모 501자 → 메모 포커스·`메모는 500자까지 입력할 수 있어요.`, 저장소 원시값 그대로.
- **사라진 상품**: 기존 값 `김민준 선생님 · 기타 (현재 선택할 수 없음)` 비활성 옵션·필드 오류 `선택한 레슨을 이용할 수 없어요. 다시 선택해주세요.`, 현재 상품 선택 → 날짜·시간·공간만 비워짐·메모 유지·초기화 안내, 다시 고르면 저장(같은 ID·createdAt).
- **저장 실패**: `QuotaExceededError` → `변경 내용을 저장하지 못했어요` / `저장 공간이 부족해요. 편집 중인 내용은 유지했어요.`, 일반 오류 → `편집 중인 내용은 유지했어요. 다시 시도해주세요.`. URL 그대로, 메모·공간·체크 유지, 저장소 원본 그대로, 성공 알림 없음. 복구 후 재시도 → 성공.
- **시간 겹침**: 같은 날 20:00 다른 예약 → 시작 시간 포커스·겹침 문구. 자기 시간 19:00 유지 + 메모만 변경 → 저장 성공(자기 예약 제외), 다른 예약 불변.
- **CONFLICT(같은 예약)**: 다른 탭처럼 대상 시간·메모 변경(revision 5) → 저장 안 함·최신 `18:00–19:00`·`메모: 다른 탭 메모` 안내, draft 유지, 저장 비활성. `최신 내용 확인했어요` → 저장 → revision 6, draft 값으로 저장.
- **CONFLICT(다른 예약만)**: 안내 후 다시 누르면 revision 8로 저장, 추가된 예약 그대로.
- **편집 중 취소·삭제**: 저장 시 수정 불가/없는 ID 화면으로 전환, 폼 사라짐.
- **없는 ID·수정 불가·조회 실패**: 없는 UUID·`not-a-uuid` → `수정할 예약을 찾을 수 없어요` + `예약 목록으로`, 폼 없음, 저장값 그대로. 취소됨·종료 → `이 예약은 수정할 수 없어요` + `예약 상세로`, 저장 버튼 없음, 종료 예약 상세에는 `예약 수정` 없음. 손상 JSON → 조회 실패 알림·원본 유지, 복구 후 `다시 시도` → 폼.
- **이탈**: 체크만 바꾼 상태 뒤로가기 → 바로 상세, `수정 취소`(변경 없음) → 바로 상세. 메모 변경 후 → Dialog·`계속 작성` 초기 포커스, Escape 후 뒤로가기 버튼 포커스 복귀·값 유지, `수정 취소` → Dialog → `계속 작성` 후 `수정 취소` 포커스 복귀, 브라우저 뒤로가기 → 같은 Dialog(URL 유지), `나가기` → 상세에 원래 메모, 저장소 원본 그대로. 탭 닫기 → `beforeunload` 기본 확인창.
- **레이아웃**: 390×844 Footer 하단 ≤ 844, CTA 350px, 본문만 스크롤, 끝까지 스크롤하면 `수정 취소`(350px) 보임, 하단 내비 없음. 320/390/768/1440 가로 넘침 없음. 콘솔 오류 없음.

디자인 확인(시각): 390×844 Unchanged·Changed(하단 스크롤)·Save Error·Not Found를 직접 촬영해 Figma와 나란히 비교했다. 제목·설명·변경 없음 문구 위치, 필드 순서, 요약 카드, 비활성 CTA, 체크·`수정 취소`·마지막 안내 순서, 오류 알림 문구·위치, 없는 ID 아이콘·문구·Secondary 버튼이 일치했다. 차이는 위 "다르게 구현한 부분" 4와 같다. 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 저장 중 Loading은 LocalStorage가 동기라 한 프레임 수준이며 중복 제출 차단으로만 간접 확인했다.
- 화면을 열어 둔 사이의 시간 경과(1분 주기 갱신)와 저장소 INVALID_TRANSITION 직접 응답은 브라우저 시계를 진행시켜 검사하지 않았다. 대신 다른 화면 취소 → CONFLICT 재조회 → 수정 불가 전환 경로를 검사했다.
- `useLeaveGuard`의 같은 URL 기록 추가 부작용(5단계 기록 10)은 수정 화면에도 같다: 변경 후 `나가기`로 상세에 간 뒤 브라우저 뒤로가기를 누르면 수정 화면으로 한 번 돌아온다(그때는 저장값으로 다시 채워짐). Chromium에서만 확인했다.
- LocalStorage에는 탭 간 원자 트랜잭션이 없어 완전한 동시 쓰기 보장은 하지 않는다(revision 비교로 감지만).
- 실제 모바일 기기·스크린 리더, production `out/` 정적 서버 브라우저 검사는 하지 않았다. 배포하지 않았다.

Claude 6단계 완료 여부: **완료**. 7단계는 시작하지 않았다.

---

## Claude 7단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/07-cancel-delete.md, 04-booking-detail.md(상태별 액션 조건), 이 진행 기록, 저장소 `cancelBooking`·`deleteBooking`(1단계 구현 — 이번 단계에서 수정하지 않음), 2단계 `ConfirmDialog`·`InlineAlert`·`Button`, 4~6단계 상세·목록·flash. Figma MCP로 예정 상세 `286:1807`, 취소됨 상세 `286:1993`, Cancel Success Detail `299:2748`, Delete Error `299:2699`, Delete Success List `299:2792` 스크린샷을 직접 확인했다. Cancel Default/Processing/Error·Delete Default/Processing은 명세 문구표와 Delete Error 프레임(같은 공통 Dialog)으로 대조했다.

progress 확인: 이번 단계 시작 시 Claude 1~6단계 기록 섹션은 삭제되지 않았다(Codex가 7단계 항목만 추가). 복원 작업은 필요 없었다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `components/bookings/booking-detail-screen.tsx` | 준비 중 안내 제거. `예약 관리`에 `예약 취소`/`예약 기록 삭제` Secondary 버튼 + 안내 문구. 화면 단위 `ConfirmDialog` 1개(취소·삭제 문구 전환). 취소 성공 → 같은 ID 재조회·`예약을 취소했어요` 1회·제목 포커스. 삭제 성공(`deletedId` 일치) → `setListFlash('delete')` 후 `/bookings`. 실패 코드별 처리(아래 규칙) |
| `components/ui/confirm-dialog.tsx` | **최소 확장**: (1) 결과 `{ ok:false, close:true }` = 성공 없이 닫기(onSuccess 미호출), (2) `runningRef`로 상태 반영 전 같은 틱의 두 번째 클릭·Enter 차단, (3) `resolveReturnFocus` — 닫힌 시점에 포커스 대상을 계산. 기존 사용처 동작은 그대로 |
| `components/bookings/booking-list-screen.tsx` | 삭제 성공 직후에만 `내 레슨` 위 성공 Alert `예약 기록을 삭제했어요` / `삭제한 기록은 복구할 수 없어요.`, 마운트 시 Alert로 포커스 |
| `lib/bookings/flash.ts` | 목록용 1회 알림 `setListFlash`/`peekListFlash`/`clearListFlash`(메모리 전달, URL·저장소에 남기지 않음) |
| `lib/bookings/use-booking-detail.ts` | `reload()`(재조회 후 상태 반영·반환)와 `repository` 반환, `pageshow`(bfcache 복귀) 시 재조회 |
| `lib/bookings/use-now.ts` | `useNowClock()` → `[now, refresh]` 추가. 재조회 직후 진행 중·종료를 즉시 다시 판정. 기존 `useNow()`는 그대로 |
| `lib/bookings/detail-actions.ts` | 주석만 현재 단계로 갱신(규칙 변경 없음) |
| `app/globals.css` | `.lc-detail-manage__hint`(12px muted)·`--danger`(`--lc-error`), 제목 프로그램 포커스 외곽선 제거, `.lc-list-flash`. 기존 토큰만 사용 |
| `tests/booking-cancel-delete.spec.ts` (신규) | 취소·삭제 브라우저 검사 13개 |
| `tests/booking-detail.spec.ts` | 준비 중 안내 검사 3곳을 실제 액션 검사로 갱신, 종료 예약 키보드 순서에 `예약 기록 삭제` 추가(의도된 변경) |

### 동작 규칙 (구현 결과)

1. **노출**: 시작 전 예정=`예약 취소`만, 종료·취소됨=`예약 기록 삭제`만, 진행 중=`예약 관리` 영역 없음. 비활성 버튼으로 남기지 않는다. 불러오는 중·없는 ID·조회 실패에는 액션 없음.
2. **확인 전 쓰기 없음**: 상세 버튼은 Dialog만 연다. 이때 대상 ID·revision을 확보하고, 확인 버튼에서만 그 revision으로 저장 함수를 1회 호출한다. Dialog를 연 사이 다른 탭 변경·시간 경과는 저장소가 CONFLICT/INVALID_TRANSITION으로 거절한다.
3. **Dialog**: 명세 문구 그대로. 열리면 `유지하기` 포커스, Tab/Shift+Tab 순환, Escape·`유지하기`로 닫고 원래 버튼 포커스 복귀, 배경 클릭 무시, `aria-labelledby`/`aria-describedby`. 처리 중 확인 버튼 Loading(`취소 중…`/`삭제 중…`, `aria-busy`)·`유지하기` disabled·Escape 차단. 인위적 지연 없음.
4. **취소 성공**: 저장값은 `status:'cancelled'`, `cancelledAt = updatedAt = 실행 시각`, revision +1. ID·예약 정보·메모·`createdAt`·`source`·snapshot·envelope 유지. 상세 재조회 → `취소됨` Badge·`이 예약은 취소되었어요.`·기존 정보, `예약 수정`·`예약 취소` 제거, `예약 기록 삭제` 표시, Footer `예약 목록으로`. 성공 Alert는 같은 화면에서 1회(새로고침하면 없음). 원래 버튼이 사라지므로 포커스는 상세 제목.
5. **이미 취소(무변경 성공, revision 동일)**: 성공 Alert 없이 재조회하고 정보 Alert `이미 취소된 예약이에요.`를 보인다.
6. **삭제 성공**: 해당 ID만 배열에서 제거(revision +1, `initializedAt`·`seedVersion` 유지). `deletedId`가 요청 ID와 같을 때만 목록 이동·성공 Alert 1회·Alert 포커스. 남은 카드·건수 재계산, 0건이면 빈 상태. 키가 null일 때만 시드하므로 0건 저장소는 재시드되지 않는다. 이전 상세 URL·브라우저 뒤로가기 → `예약을 찾을 수 없어요`.
7. **쓰기 실패**(`QUOTA_EXCEEDED`·`STORAGE_UNAVAILABLE`·`WRITE_FAILED`): Dialog Error(`role=alert`), 처리 중 해제, 확인 버튼 재활성. 화면·LocalStorage 원본 유지, 이동·성공 Alert 없음, Dialog 밖 중복 오류 없음. 재시도는 같은 revision으로 다시 실행하며 저장소가 최신 revision·상태를 다시 판정한다.
8. **최신 상태 재조회**(`CONFLICT`·`INVALID_TRANSITION`·`NOT_FOUND`): 자동 재실행 없이 Dialog를 닫고 `getBooking(id)` 재조회 + 현재 시각 재판정. 상세가 남으면 정보 Alert `예약 정보를 다시 불러왔어요` + 오류 문구, 없어졌으면 없는 ID 화면. 다른 탭이 먼저 삭제한 경우에도 목록으로 보내거나 성공 안내를 하지 않는다. 포커스는 같은 동작 버튼이 남아 있으면 그 버튼, 아니면 상세 제목.
9. **읽기 문제**(`CORRUPT_DATA`·`UNSUPPORTED_VERSION`): Dialog를 닫고 상세의 조회 실패 화면·`다시 시도`(읽기 전용)로 전환. 자동 초기화·시드·삭제 없음.

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **재조회 안내 문구**(명세에 시각 프레임·문구 없음): CONFLICT/INVALID_TRANSITION 뒤 상세 상단 정보 Alert 제목 `예약 정보를 다시 불러왔어요`, 본문은 기존 `ERROR_MESSAGES`(예: `다른 화면에서 예약 정보가 변경됐어요. 새 정보를 확인한 뒤 다시 시도해주세요.`). 성공 Alert와 같은 자리.
2. **이미 취소 안내 본문**: 명세 제목 `이미 취소된 예약이에요.`에 본문 `예약 기록은 이 브라우저에 남아 있어요.`를 붙였다. 현재 저장소에서는 같은 revision으로 이미 취소된 예약에 취소 버튼이 보이는 경로가 없어 브라우저 검사로는 재현하지 않았다.
3. **취소 성공 Alert 줄바꿈**: 명세 한 줄 문구를 Figma 299:2748처럼 `…남아 있어요.` 뒤에서 줄바꿈했다.
4. **포커스 대상**: 취소 성공은 새 `예약 기록 삭제`가 아니라 상세 제목으로 보낸다(명세가 허용한 두 방식 중, Badge·성공 Alert를 이어 읽을 수 있는 쪽). 삭제 성공은 목록 성공 Alert.
5. **목록 성공 Alert 간격**: Figma 299:2792에 맞춰 Header 아래 16px, `내 레슨`까지 24px(+기존 14px).
6. **상태 표시줄·홈 인디케이터**는 이전 단계와 같이 앱 화면에서 제외.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/edit`, `/bookings/new` (서버 기능 추가 없음) |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | **106/106 통과**. 기존 93 + 취소·삭제 13 |

취소·삭제 검사 결과 (`tests/booking-cancel-delete.spec.ts`, 실제 브라우저 LocalStorage — 실제 동작 검증):

- **Dialog 열기·닫기**: `예약 취소` → Dialog 이름·설명 일치, `유지하기` 포커스, 원시값 그대로(확인 전 쓰기 없음). Tab/Shift+Tab 순환, 배경 클릭 무시, Escape·`유지하기` → 닫힘·`예약 취소` 포커스 복귀·예정 유지. 삭제 Dialog도 문구·`유지하기` 포커스·Escape 후 `예약 기록 삭제` 포커스 복귀.
- **취소 성공**: 2건 중 대상만 `status`·`cancelledAt`·`updatedAt` 변경(나머지 필드 deep equal), `cancelledAt === updatedAt`, revision 3→4, `initializedAt` 유지, 다른 예약 불변. 취소됨·메모 유지·수정/취소 없음·삭제 표시·`예약 목록으로`, 성공 Alert 1개, 제목 포커스. 새로고침 → 취소됨 유지·Alert 없음. 목록 카드 `취소됨`, 2건 유지.
- **중복 실행 방지**: 확인 버튼 동기 클릭 3회 + Enter keydown → revision +1(1회), 성공 Alert 1개.
- **취소 저장 실패**: `QuotaExceededError`·일반 오류 → Dialog `취소하지 못했어요` / `기존 예약은 유지했어요. 다시 시도해주세요.`, 확인 버튼 활성·`aria-busy` 없음, `유지하기` 활성, 오류 Alert 1개, 원시값 그대로. 닫으면 예정 유지·성공 없음. 복구 후 다시 열면 Default 상태, 확인 → 취소 성공.
- **삭제 실패**: 일반 오류 → `삭제하지 못했어요` / `기록은 그대로예요. 다시 시도해주세요.`, URL·원시값 그대로.
- **삭제 성공**: 취소됨 + 예정 2건 → `/bookings`, 성공 Alert 1개·포커스, 카드 1개·`예약 1건`, 저장값 `bookings`가 남은 예약과 deep equal, envelope 유지. 브라우저 뒤로가기 → 이전 상세 URL에서 `예약을 찾을 수 없어요`·삭제 버튼 없음. 목록 재방문 → Alert 없음.
- **종료된 예정 예약 삭제**: 종료 Badge·취소 없음, 같은 삭제 Dialog로 삭제.
- **전체 삭제 후 재시드 없음**: 2건을 차례로 삭제 → `아직 예약한 레슨이 없어요`·`예약 0건`. 새로고침·목록 재방문·홈 경유 재방문 모두 0건, 저장값 `{schemaVersion:1, revision:5, initializedAt 유지, seedVersion:1, bookings:[]}`.
- **CONFLICT(같은 예약이 다른 화면에서 취소됨)**: Dialog 닫힘, 취소됨 표시, 성공 Alert 없음, 재조회 안내, 제목 포커스, 저장값은 다른 화면 값 그대로(덮어쓰지 않음).
- **CONFLICT(다른 예약만 변경)**: 자동 재실행 없음(revision 7 그대로), `예약 취소` 포커스 복귀. 다시 누르면 revision 8로 취소, 추가된 예약 불변.
- **NOT_FOUND(다른 화면에서 이미 삭제)**: 없는 ID 화면, URL 그대로, 삭제 성공 Alert·목록 이동 없음.
- **INVALID_TRANSITION(Dialog 연 사이 레슨 시작)**: `page.clock`으로 시작 30초 전에 열고 시각만 시작+60초로 이동 → 취소되지 않음, 진행 중 Badge·관리 영역 없음, 제목 포커스, 원시값 그대로.
- **손상된 저장값에서 실행**: 조회 실패 화면·`다시 시도`, 원본 `{broken` 유지.
- **회귀**: 홈·생성·수정·상세·목록·공통 UI 기존 93개 모두 통과(상세 검사는 의도된 변경 2건 갱신). 콘솔 오류 없음.

디자인 확인(시각): 390×844로 예정 상세·취소 Dialog·취소 Error·취소 완료 상세·삭제 Dialog·삭제 완료 목록(0건)을 직접 촬영해 Figma 286:1807·299:2748·299:2699·299:2792와 비교했다. 예약 관리 버튼·안내 문구 색과 위치, Dialog 제목·설명·오류 Alert·버튼 배치, 성공 Alert 위치(Badge 위 / `내 레슨` 위), 0건 빈 상태가 일치한다. 차이는 위 "다르게 구현한 부분" 5·6. 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- Processing 상태(`취소 중…`/`삭제 중…`)는 LocalStorage 쓰기가 동기라 한 프레임 수준이다. 실제 화면 촬영은 하지 않았고, 중복 실행 차단과 2단계 공통 Dialog 검사(처리 중 잠금)로 간접 확인했다.
- `useNow` 1분 주기 때문에 Dialog 없이 화면만 열어 둔 경우 시작 시각이 지나도 최대 1분간 `예약 취소`가 보일 수 있다. 눌러도 저장소가 INVALID_TRANSITION으로 거절하고 화면을 다시 판정한다.
- LocalStorage에는 탭 간 원자 트랜잭션이 없어 완전한 동시 쓰기 보장은 하지 않는다(revision 비교로 감지만).
- 실제 모바일 기기·스크린 리더, production `out/` 정적 서버 브라우저 검사는 하지 않았다. 배포하지 않았다.

Claude 7단계 완료 여부: **완료**. 8단계는 시작하지 않았다.

---

## Claude 8단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/08-list-discovery.md, 03-booking-list.md·04-booking-detail.md·07-cancel-delete.md(재사용 규칙), 이 진행 기록, 기존 목록·카드·상세·수정 화면과 `lib/bookings/routes.ts`·`flash.ts`·`use-bookings.ts`. Next.js 16.4.3 문서 `node_modules/next/dist/docs/`의 `use-search-params.md`(정적 페이지는 Suspense 필요)와 `linking-and-navigating.md`(`window.history.pushState/replaceState`가 라우터·`useSearchParams`와 연동)를 확인했다. Figma MCP로 `302:2781`(기본·페이지), `302:2896`(조건 적용, design context 포함), `302:3007`(결과 없음) 스크린샷과 `302:2781` 메타데이터(위치·크기)를 직접 확인했다.

progress 확인: 이번 단계 시작 시 Claude 1~7단계 기록 섹션은 그대로 있었다(Codex가 8단계 항목만 추가). 복원 작업은 필요 없었다. 저장소 `BookingRepository`와 LocalStorage 스키마는 수정하지 않았다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `lib/bookings/discovery.ts` (신규) | 순수 함수: `parseListQuery`(throw 없음, 중복·허용 외 값·음수/소수/지수형/0/앞자리 0/7자리 이상 페이지·80 code point 초과 검색어 무시), `serializeListQuery`(기본값 생략, `q→status→sort→page`, `URLSearchParams`), `isCanonicalListSearch`(알 수 없는 파라미터 포함 여부), `normalizeSearchText`(NFC·trim·연속 공백 축약)·비교용 소문자화, `clampSearchInput`(code point 기준), `applyDiscovery`(검색→상태→정렬→페이지, 동률 id 오름차순, `pageCount=max(1,ceil(n/5))`, 범위 보정 페이지 반환), `describeListQuery`(조건 요약) |
| `lib/bookings/routes.ts` | `bookingListHref(context?)` 추가. `bookingDetailHref(id, context?)`·`bookingEditHref(id, context?)`가 목록 조건을 **선택적으로** 보존(기본 조건이면 기존과 같은 `?id=`만). 임의 `returnTo`는 받지 않음 |
| `components/bookings/booking-list-screen.tsx` | `useSearchParams` 기반 탐색 화면으로 재구성(`BookingListFromQuery`/`BookingListLoading`). 검색 필드·상태 칩 그룹·정렬 select·결과 수(`aria-live`)·조건 요약·`초기화`·결과 없음 상태·페이지 nav. 기존 초기화·읽기 실패·진짜 0건·삭제 성공 Alert·CTA 유지 |
| `app/bookings/page.tsx` | 목록을 `Suspense`로 감쌈(정적 HTML에는 초기화 화면만, 쿼리는 클라이언트에서 읽음) |
| `components/bookings/booking-card.tsx` | 선택적 `context` prop → 상세 링크에 목록 조건 보존 |
| `components/bookings/booking-detail-screen.tsx` | 상세 URL에서 허용된 목록 파라미터만 읽어 `목록으로 돌아가기`·Footer `예약 목록으로`·`예약 수정` 링크·삭제 성공 이동에 사용. 직접 진입은 `/bookings` |
| `components/bookings/booking-edit-screen.tsx` | 같은 방식으로 컨텍스트를 읽어 상세 복귀(뒤로·수정 취소·저장 성공·수정 불가)·목록 복귀에 유지 |
| `app/globals.css` | 8단계 토큰(`--lc-chip-height`·`--lc-compact-height`·`--lc-compact-action-height`·`--lc-radius-compact`·`--lc-pagination-button-width`)과 `.lc-search*`·`.lc-chip`·`.lc-discovery*`·`.lc-sort`·`.lc-pagination*`·`.lc-button--outline`·`.lc-app--list`. 다른 화면 스타일은 변경 없음 |
| `tests/booking-list-discovery.spec.ts` (신규) | 8단계 브라우저 검사 15개 |
| `tests/booking-list.spec.ts` | 3단계 검사 중 "12건·8건 카드가 한 화면에 모두 보임"을 전제로 한 2개를 5개 단위 페이지 기준으로 갱신(의도된 변경), 이미지 로드 검사를 `expect.poll`로 대기(검색 아이콘 추가로 타이밍 의존 제거) |

### 동작 규칙 (구현 결과)

1. **URL 단일 출처**: 조건은 `/bookings?q=…&status=…&sort=…&page=…`에만 있다. 화면 조작은 Next.js와 연동되는 `window.history.pushState/replaceState`로 반영한다. 잘못된 쿼리는 첫 렌더 직후 정규 URL로 `replace`(초기화 중·읽기 실패에도 조건은 URL에 유지), 범위 밖 양의 정수 페이지는 조회 성공 뒤 마지막 유효 페이지로 `replace`.
2. **검색**: 입력은 즉시 표시, 결과·URL은 입력이 멈춘 뒤 300ms에 `replace`. Enter(IME 조합 중 제외)는 즉시. ×(`검색어 지우기`, 빈 값이면 숨김)·Escape는 검색어만 즉시 지우고 `replace`, 빈 상태 Escape는 무동작. 정규화 결과가 빈 값이면 `q` 제거. 입력은 80 code point로 자른다(UTF-16 `maxLength`는 쓰지 않음).
3. **칩·정렬·초기화·페이지**: `push`. 검색·상태·정렬이 바뀌면 `page=1`, 목록 viewport 맨 위. 칩·정렬을 바꿀 때 300ms 대기 중인 검색어도 함께 반영한다. `초기화`(텍스트 버튼)와 결과 없음의 `조건 초기화`는 `/bookings`로 `push`, 기본 상태면 `초기화`를 숨긴다.
4. **결과 수·상태 구분**: 검색어·상태 필터가 없으면 `예약 N건`(저장 전체 수), 있으면 `검색 결과 N건`(조건 통과 전체 수). 저장 예약 0건은 조건과 무관하게 3단계 빈 상태·`예약 0건`, 조건 결과 0건은 `검색 결과가 없어요`. 읽기 실패는 결과 0건으로 표시하지 않고 컨트롤을 비활성화한다.
5. **자동 보정**: 시간 경과(1분 `useNow`)·다른 탭 변경·삭제로 결과가 줄어 현재 페이지가 사라지면 같은 순서로 다시 계산해 마지막 유효 페이지로 `replace`.
6. **상세·수정 복귀**: 카드 링크 `/bookings/detail?id={UUID}&q=…&status=…&sort=…&page=…`(현재 보정된 페이지). 상세→수정→상세, 취소 후 상세 갱신에도 URL 컨텍스트 유지. 삭제 성공은 7단계 일회성 Alert를 유지한 채 원래 조건 목록으로 이동하고, 비거나 사라진 페이지는 목록이 보정한다. 상세 URL의 허용되지 않은 값·`returnTo` 등은 무시.
7. **스크롤 복원**: sessionStorage 키 `lessonconnect:bookings:list-scroll:{정규 쿼리}`(기본 조건은 `…list-scroll:`)로 조건 조합별 저장. 조회 성공 직후 한 번만 같은 키의 위치를 복원(브라우저 뒤로·`목록으로 돌아가기` 모두), 그 뒤 조건·페이지 변경은 맨 위. 읽을 수 없으면 0. 예약 데이터 키와 분리. 3단계의 단일 키 `lessonconnect:bookings:list-scroll`은 더 이상 쓰지 않는다.
8. **라우터 반영 지연 처리**: Next 라우터가 `useSearchParams`를 갱신하기 전에 이어지는 조작(× 직후 입력·칩 직후 정렬 등)이 늦게 도착한 중간 URL에 덮이지 않도록, 화면이 쓴 최신 조건을 기준으로 계산하고 자체 변경의 반영은 입력값을 바꾸지 않는다. 브라우저 뒤로/앞으로(popstate)만 외부 변경으로 보고 입력값을 URL에 맞춘다. (부하 상태 전체 검사에서 재현된 경쟁 조건을 고친 것)

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **상태 표시줄 제외**: 이전 단계와 같이 앱에는 상태 표시줄이 없어 모든 요소가 Figma보다 32px 위에 있고, 그만큼 목록 viewport가 238px보다 크다(390×844 실측: 페이지 영역이 있으면 280px, 없으면 344px). 그 외 간격(CTA→레이블 16, 레이블→검색 6, 검색→칩 12, 칩→결과 행 10, 결과 행→요약 13, 요약→목록 10, 페이지 영역 상 7·하 13)은 Figma 메타데이터를 따랐다.
2. **검색·정렬 필드**: 공통 `Input`/`Select`는 레이블에 `(필수)/(선택)`을 붙이고 아이콘·지우기 버튼 자리가 없어 그대로 쓰면 Figma(`예약 검색`)와 달라진다. 컴포넌트를 바꾸지 않고 같은 CSS(`lc-field__label`·`lc-control`·`lc-select`)를 재사용한 네이티브 `<input type=search>`·`<select>`로 만들었다. 검색 border는 Figma대로 중립 `--lc-border`, 정렬 레이블은 숨김 `정렬`.
3. **돋보기 아이콘**: Figma는 텍스트 글리프 `⌕`다. 기존 자산 `/assets/ui/nav-search.svg`를 18px 장식 이미지(`alt=""`)로 썼다. ×는 Figma와 같은 텍스트 글리프.
4. **페이지 버튼 이름**: 보이는 문구는 Figma `이전`/`다음`, 접근 가능한 이름은 명세 `이전 페이지`/`다음 페이지`. 현재 `1 / 3` 앞에 숨김 `현재 페이지`. 누른 버튼이 끝에 닿아 비활성되면 포커스를 반대쪽 버튼으로 옮긴다. 비활성은 Figma처럼 surface 배경·muted 글자(투명도 없음).
5. **조건 요약 문구**: 결과 없음 프레임은 `날짜순`, 기본 프레임은 `레슨 날짜순`이라 정렬 select와 같은 `레슨 날짜순`으로 통일했다. 검색어만 있고 상태가 전체이면 `“기타” · 전체 · 레슨 날짜순`(Figma에 없는 조합). 한 줄 말줄임, 앞에 숨김 `적용 조건:`.
6. **URL 경계값 해석**: 80 code point를 넘는 `q`는 자르지 않고 무시(제거)한다. 깨진 퍼센트 인코딩(`%E0%A4%A`)은 브라우저 `URLSearchParams`가 대체 문자로 해석해 일반 검색어로 처리된다(오류·리다이렉트 없음). 페이지는 1~999999만 허용.
7. **×·Escape**: 명세에 방식이 없어 검색 입력과 같은 `replace`로 처리했다.
8. **칩 터치 영역**: 시각 36px(Figma) + `::after`로 위아래 확장해 44px. 칩 폭은 Figma 60px 대신 남는 폭을 5등분(390에서 약 60px, 320에서도 한 줄).
9. **결과 없음 상태**: Figma처럼 아이콘 없이 제목·설명·200px `조건 초기화`(흰 배경·중립 테두리 `lc-button--outline`).

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/edit`, `/bookings/new`. `out/bookings.html`에 초기화 화면 포함(서버 기능 추가 없음) |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test` | **121/121 통과**. 기존 106 + 8단계 15 |
| 8단계 검사 `--repeat-each=3` | 45/45 통과(경쟁 조건 수정 후 안정성 확인) |

8단계 검사 결과 (`tests/booking-list-discovery.spec.ts`, 실제 브라우저 LocalStorage — 실제 동작 검증):

- **검색 대상·정규화**: 강사·악기·스튜디오·방·`스튜디오 + 방`(영문 대소문자 무시), 앞뒤·연속 공백, NFD 입력의 NFC 비교 일치. 메모·ID·표시용 `선생님`은 검색되지 않음.
- **필터·정렬 순서**: 예정·진행 중·종료·취소됨이 파생 상태로 걸러짐(취소는 날짜와 무관하게 취소됨). 날짜순은 취소 예약도 레슨 날짜 기준, 같은 시각은 id 오름차순. 최근 생성순도 같은 createdAt은 id 오름차순. 검색+상태+정렬 조합과 요약 `“동률” · 예정 · 최근 생성순`.
- **페이지**: 12건 → 5개씩 `1 / 3`, 첫 페이지 이전 비활성, `다음` 2회 → `page=3`·2건·다음 비활성·이전에 포커스, history 2 증가(push). `page=9` 직접 접속 → `page=3`으로 replace. 결과 1페이지면 nav 없음.
- **조건 변경·뒤로/앞으로**: `page=2`에서 스크롤 후 `예정` → `?status=upcoming`, 스크롤 0. 정렬 변경 후 뒤로 2회 → 칩·정렬·`2 / 3` 복원, 앞으로 → 다시 복원. `초기화` → `/bookings`, 입력·정렬·칩 기본, 초기화 버튼 숨김, 뒤로 → 이전 검색어 복원.
- **검색 입력**: 입력 즉시 표시·URL은 그대로 → 멈춘 뒤 `?q=기타`(page 제거)·history 길이 동일(replace). ×(포커스 유지)·Enter·Escape·빈 Escape·공백만 입력·이모지 85개 → 80 code point.
- **잘못된 쿼리 12종**: 허용 외 enum·알 수 없는 파라미터·`page=-1/1.5/1e2/0/01/20자리`·중복 status·기본값 명시·81자 q → `/bookings`, 순서·공백 정규화 → 정규 URL. 깨진 인코딩도 오류 없이 `검색 결과 0건`. 콘솔 오류 없음.
- **0건 구분**: 저장 0건 + `q` → `아직 예약한 레슨이 없어요`·`예약 0건`. 저장 1건 + 결과 0 → `검색 결과가 없어요`, nav 없음, `조건 초기화` → `/bookings`.
- **초기화 중·읽기 실패**: 서버 HTML은 로딩 상태(`검색 결과` 없음). 손상 저장값 → 오류 Alert, 검색·칩·정렬 비활성, 입력값·URL 유지, 결과 없음 미표시. 복구 후 `다시 시도` → URL 조건 적용(`검색 결과 1건`).
- **상세 복귀**: `?q=강사&sort=created-desc&page=2`에서 마지막 카드 href에 조건 보존. 브라우저 뒤로·`목록으로 돌아가기` 모두 같은 URL과 같은 스크롤 위치. 1페이지(다른 키)는 스크롤 0. 상세 URL의 `status=bogus`·`returnTo` 무시 → `/bookings?sort=created-desc`. 직접 상세 진입 → `/bookings`.
- **수정·취소**: 상세→`예약 수정`(href에 조건)→`예약 상세로 돌아가기` → 같은 컨텍스트. 취소 후에도 URL 유지, `예약 목록으로` → 원래 조건(예정 필터라 결과 없음).
- **삭제 후 보정**: 종료 6건 `page=2`의 1건 삭제 → `/bookings?status=ended`(replace), 성공 Alert 1회·포커스, `검색 결과 5건`, nav 없음. 검색 결과 1건 삭제 → 같은 조건·결과 없음, 새로고침 시 Alert 없음.
- **다른 탭 변경**: `page=2`에서 다른 탭이 1건 줄임 → `/bookings`로 replace(history 길이 동일).
- **데이터 분리**: 칩·검색·페이지·스크롤 후 LocalStorage 원시값 그대로, 키는 `lessonconnect:bookings:v1` 하나.
- **390×844 배치·접근성**: 레이블 `예약 검색`, placeholder, `type=search`, `inputmode=search`, 결과 수 `aria-live=polite`, 정렬 옵션 2개. 칩 5개 한 줄·370px 안·터치 44px 이상. 검색→칩→결과 행→요약→목록→페이지→내비 순서로 겹침 없음, 내비는 844 안·목록 스크롤 중 고정, 페이지 가로/세로 넘침 없음. 칩 Enter·Space 선택, 칩 다음 Tab이 정렬 select.
- **320 폭**: 긴 검색어 조건 요약이 한 줄로 줄고 가로 넘침 없음(그리드 열 `minmax(0,1fr)`로 수정).
- **회귀**: 홈·생성·수정·상세·취소/삭제·목록·공통 UI 기존 106개 통과(목록 2개는 의도된 갱신). 콘솔 오류 없음.

디자인 확인(시각): 390×844로 기본(12건, 1/3)·조건 적용(`기타`·예정·최근 생성순)·결과 없음(`재즈`·취소됨)을 직접 촬영해 Figma 302:2781·302:2896·302:3007과 비교했다. 검색 필드·칩 선택 색·결과 행·요약/초기화·카드·페이지 버튼(이전 비활성 surface, 다음 흰 배경 테두리)·결과 없음 배치가 일치한다. 차이는 위 "다르게 구현한 부분". 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 상단(헤더~조건 요약)이 고정 영역이라 세로가 짧은 화면에서는 목록 viewport가 좁아진다(390×667 실측: 페이지 영역이 있으면 약 103px, 없으면 167px). 명세 기준 844 높이에서는 문제없다. 짧은 화면에서 상단을 함께 스크롤할지는 Codex 판단이 필요하다.
- 시간 경과에 따른 상태 이동(예정→진행 중→종료)은 `useNow` 1분 주기로 다시 계산된다(최대 1분 지연). `page.clock`으로 별도 검사하지는 않았고, 같은 재계산 경로를 다른 탭 변경·삭제 검사로 확인했다.
- 300ms 디바운스는 "즉시 반영되지 않고 멈춘 뒤 반영됨"만 확인했고 정확한 시간 측정은 하지 않았다. `aria-live` 발표 빈도는 실제 스크린 리더로 확인하지 않았다.
- 같은 세션에서 같은 조건 목록으로 다시 들어오면(하단 내비 `예약` 등) 마지막 저장 위치가 복원된다(3단계와 같은 방식, 조건별로만 분리).
- 실제 모바일 기기·스크린 리더, production `out/` 정적 서버 브라우저 검사는 하지 않았다. 배포하지 않았다.

Claude 8단계 완료 여부: **완료**. 9단계는 시작하지 않았다.

---

## Claude 9단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 근거: CLAUDE.md, design/steps/09-booking-image.md, design/data-contract.md(갱신된 §1·§8 v2 계약), 이 진행 기록, 기존 `booking-form.tsx`·`booking-create-screen.tsx`·`booking-edit-screen.tsx`·`booking-detail-screen.tsx`·`booking-detail-cards.tsx`, `lib/bookings/types.ts`·`validation.ts`·`repository.ts`·`form.ts`·`messages.ts`, `components/ui/field.tsx`·`button.tsx`. Figma MCP로 `306:2964`(이미지 필드 상태 보드)와 `307:3300`(상세, 첨부 있음) 스크린샷을 직접 확인했다. 나머지 프레임(`307:2961`·`307:3044`·`307:3129`·`307:3208`·`307:3388`)은 이번에 열지 않고 명세 문구로 대조했다.

progress 확인: 이번 단계 시작 시 Claude 1~8단계 기록 섹션은 그대로 있었다(Codex가 9단계 항목만 추가). 복원 작업은 필요 없었다. `design/` 문서는 이 기록 외에 수정하지 않았다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `lib/bookings/types.ts` | `ReferenceImage`·`ReferenceImageSourceMime`·`ReferenceImageChange`, `LessonBooking.referenceImage: ReferenceImage \| null`(v2 필수 키), `LessonBookingV1`, `BookingStoreV2`, `BookingInput.referenceImageChange?`(→ `BookingField`에 자동 포함) |
| `lib/bookings/reference-image.ts` (신규) | 순수 규칙: 상수(2 MiB·1280px·500 KiB·120 code point·Data URL 최대 길이), `sniffImageMime`(JPEG/PNG/WebP 시그니처), `sanitizeFileName`(경로·제어/방향 제어 문자 제거·120 code point·빈 값은 `참고 이미지`), `isValidReferenceImage`(키 집합 일치·메타데이터 범위·prefix·디코딩 전 길이 상한·base64 형식·실제 바이트 수=`sizeBytes`·RIFF/WEBP 시그니처·RIFF 크기+8=`sizeBytes`), `normalizeImageChange`, `sameReferenceImage`, `formatImageBytes` |
| `lib/bookings/image-prepare.ts` (신규) | 브라우저 변환: 선언 MIME → 빈 파일 → 2 MiB(디코딩 전 중단) → 시그니처·선언 MIME 일치 → `createImageBitmap(file,{imageOrientation:'from-image'})`(없으면 `<img>`+object URL, 디코딩 후 즉시 해제) → 긴 변 1280px 축소(확대 없음) → Canvas WebP 품질 0.86→0.46 5단계, 초과 시 픽셀 0.8배 최대 5회(긴 변 320px 미만으로는 줄이지 않음) → 500 KiB 이하 Blob만 Data URL → 저장소와 같은 검증기로 최종 확인. WebP 미지원(다른 MIME 반환)·제한 미달성은 `encode` 실패 |
| `lib/bookings/validation.ts` | `parseStoreValueV1`(v1 원본 검증 전용), `parseStoreValue`(v2: 기존 필드 검증 + `referenceImage` 키 필수·null 또는 유효 이미지, 손상 이미지는 레코드 전체 손상). `validateBookingInput`이 `referenceImageChange`를 재검증해 `fieldErrors.referenceImageChange` 반환 |
| `lib/bookings/repository.ts` | `BOOKING_STORAGE_KEY='lessonconnect:bookings:v2'`, `LEGACY_BOOKING_STORAGE_KEY='lessonconnect:bookings:v1'`. `initialize()`: v2 있으면 v2만(손상·미지원은 그대로 오류) → 없고 v1 있으면 v1 검증 후 `referenceImage:null`만 추가해 `setItem(v2)` 1회(revision·initializedAt·seedVersion·ID·시각 유지, 빈 배열 그대로, 실패 시 준비 안 됨·v1 유지·재시도 가능, v1 삭제 안 함) → 둘 다 없을 때만 v2 시드. 생성: replace면 이미지, 아니면 null. 수정: keep 유지·replace 교체·remove null, 같은 이미지·필드면 쓰기 없음, 이미지 변경만으로도 revision +1·`updatedAt` 갱신. 취소는 이미지 유지, 삭제는 레코드와 함께 제거 |
| `lib/bookings/messages.ts` | `FIELD_MESSAGES.referenceImageChange` |
| `lib/bookings/form.ts` | `QUOTA_MESSAGE`(`브라우저 저장 공간이 부족해요. 입력과 기존 이미지는 유지했어요.`)를 생성·수정 공통 `QUOTA_EXCEEDED` 문구로 사용. 저장소가 이미지 값을 거절하면 상단 저장 실패 알림으로 안내 |
| `lib/bookings/index.ts` | `LEGACY_BOOKING_STORAGE_KEY` 내보내기 |
| `components/bookings/reference-image-field.tsx` (신규) | `참고 이미지 (선택)` 필드: Empty(`참고 이미지 선택`)·Selected(변환 결과 썸네일·파일명 2줄·`변환 완료 · NKB`·`교체`/`제거`)·Error(`다른 이미지 선택`)·Remove Pending(`이미지 제거 예정` + `제거 되돌리기`), `이미지 준비 중…` 상태, 필드 아래 `role=alert` 오류 |
| `components/bookings/booking-form.tsx` | 이미지 draft(`keep/replace/remove`)·준비 중·오류 상태. 메모 다음·확인 체크 앞에 필드 배치. draft 변경을 dirty에 포함(이탈 확인·수정 저장 활성화). 준비 중에는 저장 버튼·Enter 제출·교체/제거 차단. 제출 입력에 `referenceImageChange` 포함. `initialImage` prop |
| `components/bookings/booking-edit-screen.tsx` | `initialImage={baseline.referenceImage}` 전달(최신 내용 확인 시 기준도 갱신) |
| `components/bookings/booking-detail-cards.tsx` | `BookingReferenceImageCard`(152px 썸네일·파일명·`변환 후 NKB`, 표시 실패 시 오류 문구, 저장값 변경 없음). 이 파일에 `'use client'` 추가 |
| `components/bookings/booking-detail-screen.tsx` | 메모 다음·예약 관리 전에 `referenceImage !== null`일 때만 카드 렌더 |
| `components/bookings/booking-list-screen.tsx` | 주석의 저장 키 표기만 v2로 |
| `app/globals.css` | 토큰 `--lc-image-thumb:88px`·`--lc-image-detail:152px`, `.lc-image-field`·`.lc-image-card*`·`.lc-detail-image*`. 기존 스타일 변경 없음 |
| `tests/booking-image-repository.spec.ts` (신규) | Node 단위 13개(마이그레이션 6·저장 6·순수 규칙 1) |
| `tests/booking-image.spec.ts` (신규) | 실제 브라우저 E2E 8개 |
| 기존 테스트 7개 파일 | 시드·조회 키를 v2로, 픽스처에 `referenceImage:null`, `schemaVersion:2`. "미지원 버전" 픽스처를 v2→v3으로. 용량 초과 문구 기대값 3곳 갱신. `bookings-browser.spec.ts` 모듈 목록에 `reference-image` 추가. 검사 의미는 바꾸지 않았다 |

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 요청)

1. **용량 초과 문구 범위**: 명세의 `브라우저 저장 공간이 부족해요. 입력과 기존 이미지는 유지했어요.`를 수정뿐 아니라 **생성 화면에도** 적용했다(이미지 없는 저장 포함). 5·6단계의 `저장 공간이 부족해요. 입력 내용은 유지했어요.`/`… 편집 중인 내용은 유지했어요.`는 더 이상 표시되지 않는다. 생성에서 "기존 이미지"가 어색하면 생성용 문구를 정해주길 바란다.
2. **`aria-invalid` 위치**: 실제 file input은 숨김(`sr-only`, `tabIndex=-1`)이고 보이는 레이블 `참고 이미지 (선택)`과 `for`로 연결했다. 사용자가 조작하는 **보이는 트리거 버튼**(`참고 이미지 선택`/`다른 이미지 선택`/`교체`)에 `aria-invalid`와 `aria-describedby`(도움말·오류·준비 중)를 붙였다. 숨긴 input에 붙이면 제출 시 첫 오류 포커스가 보이지 않는 요소로 갈 수 있어서다. 숨긴 input도 `aria-describedby`는 갖는다. 접근성 트리에는 숨긴 input이 이름 `참고 이미지 (선택)`의 버튼으로 남는다(탭 순서에는 없음).
3. **`제거 되돌리기`**: Figma는 카드 아래 텍스트 링크 형태다. 명세의 44px 터치 영역을 맞추려고 같은 위치에 흰 배경·중립 테두리 44px 버튼으로 만들었다.
4. **제거 예정 상태에서 새 파일 선택**: 시안에 버튼이 없어 제공하지 않는다. 되돌리기 후 `교체`로 바꿀 수 있다.
5. **수정 화면 기존 이미지 대체 텍스트**: 폼 안에서는 기존 첨부도 `선택한 참고 이미지: {fileName}`을 쓴다(상세만 `예약 참고 이미지:`).
6. **준비 중 표시 위치**: `이미지 준비 중…`(`role=status`)은 카드 아래 필드 도움말 자리에 둔다. 준비 중에는 필드에 `aria-busy`.
7. **상세 이미지 표시 실패**: `<img>` `onError` 시 카드 안에 `이미지를 표시할 수 없어요. 저장된 예약 정보는 변경하지 않았어요.`(`role=alert`)로 바꾼다(문구는 명세에 없어 새로 정함). 저장값 읽기 검증 실패는 기존대로 상세 전체 조회 실패(`CORRUPT_DATA`).
8. **폼 검증 우회 이미지**: 저장소 `VALIDATION_ERROR`의 `referenceImageChange`는 필드 아래가 아니라 상단 저장 실패 알림 `참고 이미지를 저장할 수 없어요. 이미지를 다시 선택해주세요.`로 보인다(파일 형식 오류 문구와 섞지 않기 위해). 정상 UI에서는 생기지 않는다.
9. **상세 썸네일**: Figma 비율대로 152px 정사각 `object-fit: cover`(원본 비율 이미지는 잘려 보임). 폼 썸네일 88px도 같다.
10. **압축 하한**: 픽셀 축소는 긴 변 320px 미만으로 내려가지 않는다(명세는 "무한 반복·0px 금지"만 정함). 이 이하로도 500 KiB를 못 맞추면 `이미지를 준비하지 못했어요…`.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 정적 라우트 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/edit`, `/bookings/new`(서버 기능 추가 없음) |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test` | **142/142 통과**. 기존 121 + 9단계 21(단위 13·E2E 8) |

v2 전환 직후 기존 검사 중 31개가 실패했다. 모두 테스트가 v1 키를 직접 읽고 쓰거나 `schemaVersion:2`를 "미지원 버전" 예시로 쓰던 부분이었고, 픽스처를 v2로 옮긴 뒤 31개 모두 통과했다(앱 동작 수정 없음).

실제 동작 검증 — 저장소 단위(`tests/booking-image-repository.spec.ts`, 메모리 저장소):

- **마이그레이션**: v1 2건(예정·취소됨) → `setItem` 1회, v2 `schemaVersion:2`·revision 7·initializedAt·seedVersion 유지, 각 예약은 v1 값 + `referenceImage:null`과 완전히 같음, v1 원본 문자열 그대로. 이후 v1을 바꿔도 v2만 읽고 다시 쓰지 않음. 빈 v1 → 빈 v2(재시드 없음). 손상 v1 → `CORRUPT_DATA`, `schemaVersion:5` v1 → `UNSUPPORTED_VERSION`, 둘 다 v2 미작성. 마이그레이션 `QuotaExceededError` → `QUOTA_EXCEEDED`, `NOT_READY` 유지, v2 없음·v1 유지, 재시도 성공. v2 손상 + v1 정상 → `CORRUPT_DATA`(v1으로 되돌아가지 않음). 키 없음 → v2 시드(`referenceImage:null`), v1 미작성.
- **저장**: 생성 replace → 이미지 그대로 저장, 새 인스턴스(새로고침)에서 동일. 생략은 null. 수정 keep 유지 / 같은 이미지 replace는 쓰기·revision 변화 없음 / 다른 이미지 replace 교체(revision +1) / remove → null. 취소 후 이미지 유지, 삭제 후 저장값에 Data URL 없음. 수정 중 용량 초과 → 원본 문자열·기존 이미지 유지.
- **입력 재검증 11종**: 바이트 수 불일치·`mimeType` png·png Data URL·최대 길이 초과(디코딩 전)·폭 1281·원본 2 MiB+1·원본 SVG·경로 포함 파일명·추가 키·알 수 없는 kind·문자열 → 모두 `VALIDATION_ERROR` + `fieldErrors.referenceImageChange`, 쓰기 0회.
- **저장값 손상 3종**(잘린 WebP·height 0·문자열) → `CORRUPT_DATA`, 원본 유지.

실제 동작 검증 — 브라우저 E2E(`tests/booking-image.spec.ts`, 개발 서버·실제 LocalStorage·Canvas로 만든 실제 JPEG/PNG/WebP 바이트):

- **첨부·저장·새로고침**: 2400×1600 JPEG → `참고 이미지 선택`이 실제 파일 선택 창(단일 선택)을 연다 → 변환 미리보기(`data:image/webp`, alt `선택한 참고 이미지: guitar-reference.jpg`, `변환 완료 · NKB`), `교체`/`제거` 높이 44px 이상, 저장 전 LocalStorage 무변경. 저장 후 상세: `originalMimeType:image/jpeg`·`originalSizeBytes`=원본 바이트·`mimeType:image/webp`·1280×853·Data URL 디코딩 바이트 수=`sizeBytes`≤500 KiB·`RIFF…WEBP`. 상세 이미지 alt `예약 참고 이미지: …`, `naturalWidth` 1280, 카드 순서 정보→메모→참고 이미지→예약 관리. 새로고침 후에도 표시.
- **잘못된 형식·초과 용량·해석 실패 7종**: 텍스트·SVG·PNG로 위장한 PDF·PNG MIME의 JPEG 바이트 → `JPEG, PNG, WebP 이미지만 첨부할 수 있어요.`, PNG 헤더 + 2 MiB+1 → `원본 이미지는 2MB 이하만 첨부할 수 있어요.`, 0바이트·깨진 PNG → `이미지를 열 수 없어요. 다른 파일을 선택해주세요.`. 매번 직전 미리보기(alt·src) 유지, `교체`에 `aria-invalid=true`·오류 ID가 `aria-describedby`에 포함. 이미지 없음 상태의 오류는 `다른 이미지 선택`으로 바뀌고 정상 파일을 고르면 오류 해제. 300×200 PNG는 확대 없이 300×200 저장.
- **단계적 압축**: 1100×1100 무작위 노이즈 JPEG(원본 540,860B) — 첫 품질 WebP 873,024B(500 KiB 초과) → 저장 476,972B·880×880(비율 유지). 품질·픽셀 축소 경로가 실제로 실행됨을 확인.
- **준비 중 차단**: 디코딩을 붙잡은 상태에서 `이미지 준비 중…`, `예약하기`·`교체`·`제거` 비활성, Enter 제출 무동작 → 풀면 새 미리보기·저장 활성.
- **수정 흐름**: 기존 첨부 표시·변경 없음 저장 비활성 → `교체`(이미지만 바꿔도 저장 활성) → `수정 취소`→`계속 작성`이면 새 미리보기 유지 → `나가기`면 상세에 기존 이미지, LocalStorage 원본 문자열 그대로. `제거` → `이미지 제거 예정`·`저장 전에는 기존 이미지가 유지돼요` → `제거 되돌리기` → 기존 미리보기·변경 없음. 교체 후 제거 → 제거 예정 → 저장 → 성공 알림, 상세 이미지 카드 없음, `referenceImage:null`, 메모 유지, revision +1, 새로고침 후에도 카드 없음.
- **저장 실패**: 새 이미지·메모·체크 후 실제 origin 저장 공간을 다른 키로 채움 → 상단 알림 `변경 내용을 저장하지 못했어요` + 용량 초과 문구, URL 유지, 준비한 미리보기·메모·체크 유지, 원본 문자열 그대로, 이미지 필드 오류 없음(혼합 안 함). 일반 쓰기 예외 → 공통 실패 문구, 동일하게 보존. 복구 후 재시도 → 새 이미지(1280×960)·메모 저장.
- **첨부 없는 v1 예약**: v1 키만 시드 → 상세 정상(메모 표시, 이미지 카드 없음), v2에 `{...v1, referenceImage:null}`, v1 원본 유지. 수정에서 WebP 400×300만 추가해도 저장 → 상세 표시.
- **390×844·접근성**: 메모에서 Tab → `참고 이미지 선택` 포커스, Enter로 선택 창. 216자 파일명 → `title`·alt에 120 code point 안전 이름, 표시 2줄 이하, 가로 넘침 없음. 이미지 필드를 스크롤해도 `제거` 버튼 하단 ≤ 고정 Footer 상단. 상세 카드도 Footer와 겹치지 않고 390 안. 전 검사 콘솔 오류 없음.

디자인 확인(시각): 390×844로 빈 상태·형식 오류·선택됨·제거 예정(수정)·상세를 직접 촬영해 Figma `306:2964`·`307:3300`과 비교했다. 필드 위치(메모 다음·확인 체크 앞), 상시 `JPEG · PNG · WebP · 원본 최대 2MB`, 선택됨 카드 구성, 오류 시 `다른 이미지 선택`/`파일을 선택해 다시 시도해주세요` + 아래 빨간 문구, `긴 변 1280px · 변환 후 최대 500KB`/`이 브라우저에만 저장돼요.` 보조 문구, 상세의 메모 다음 카드·Footer 고정이 일치한다. 차이는 위 "다르게 구현한 부분". 픽셀 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- **EXIF 회전**: `createImageBitmap(…, {imageOrientation:'from-image'})`로 브라우저 해석 방향을 쓰도록 구현했지만, EXIF 방향 태그가 있는 실제 사진으로는 검사하지 않았다.
- **WebP 인코딩 미지원 브라우저**(구형 Safari 등)는 `toBlob`이 PNG를 돌려줘 `이미지를 준비하지 못했어요…`가 된다. Chromium(headless shell)에서만 검사했다.
- **LocalStorage 총량**: 이미지 1장의 Data URL은 최대 약 68만 문자라, 브라우저 한도(보통 origin당 약 5M 문자)에서는 이미지가 있는 예약을 대략 7건 안팎만 저장할 수 있다. 넘으면 `QUOTA_EXCEEDED`로 안내하며 기존 첨부를 자동으로 지우지 않는다. 마이그레이션 후 v1 원본을 지우지 않으므로 그 크기도 계속 차지한다.
- **구버전 탭 새로고침 안내**: 계약은 "마이그레이션 후 열린 기존 탭은 새로고침하도록 안내"라고 했지만, 구버전 탭은 구버전 코드로 동작해 새 코드가 안내를 띄울 수 없다. 별도 안내 UI는 만들지 않았다. 구버전 탭은 v1 키만 계속 쓰며, 그 변경은 v2에 병합되지 않는다(계약대로).
- 매 조회마다 저장된 모든 이미지의 base64 형식을 정규식으로 검사한다. 7건 정도에서는 체감 지연이 없었지만 측정하지 않았다.
- 실제 모바일 기기·스크린 리더, production `out/` 정적 서버 브라우저 검사는 하지 않았다. 배포하지 않았다.

Claude 9단계 완료 여부: **완료**.

## Claude 10단계 구현 기록 (2026-11-13)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6` (브랜치 `feat/booking-storage`)

읽은 자료: `CLAUDE.md`, `AGENTS.md`, `design/handoff.md`, `design/qa-checklist.md`, 이 진행 기록, Figma `01_Home_Reference`(23:67)·김민준 강사 상세(63:305) 스크린샷(Figma MCP로 읽기만 함, 수정 없음). 이번에는 Codex가 Claude 1~9단계 기록을 지우지 않았다.

### 변경 파일

- 신규: `app/home/page.tsx`, `components/app/app-home-screen.tsx`, `lib/bookings/home.ts`, `public/assets/ui/nav-home-active.svg`, `public/assets/ui/nav-booking.svg`, `tests/app-integration.spec.ts`, `README.md`
- 수정: `lib/bookings/routes.ts`(`HOME_HREF`, `newBookingHref`, `parseNewBookingEntry`), `components/bookings/booking-create-screen.tsx`(쿼리 진입·사전 선택·뒤로가기 목적지), `app/bookings/new/page.tsx`(Suspense), `components/app/bottom-nav.tsx`(홈 `/home`·탭별 선택 아이콘), `lib/bookings/form.ts`(`QUOTA_MESSAGES`), `app/globals.css`(홈 스타일, 토큰 `--lc-mint`·`--lc-mint-ink`·`--lc-home-photo-*` 추가)
- 테스트 문구 갱신: `tests/booking-create.spec.ts`, `tests/booking-edit.spec.ts`, `tests/booking-image.spec.ts`, `tests/booking-form.spec.ts`(용량 초과 문구), `tests/booking-list.spec.ts`(홈 탭 href)
- `design/` 안에서는 이 파일만 수정했다(handoff·qa-checklist는 읽기만 함).

### 구현 내용

- **홈 예약 현황**(`/home`): `useBookings()`의 검증된 v2 데이터에서 `selectUpcomingBooking`으로 `scheduled`이면서 시작이 현재보다 늦은 예약 중 가장 이른 1건을 고른다(시작 시각이 같으면 먼저 만든 예약). 서울 날짜·시각·snapshot의 강사·악기·공간을 표시하고, 다른 예정 레슨 수(`예정 레슨 N건 더`)도 보여준다. 초기화 중에는 로딩, 읽기 실패에는 오류 Alert와 `다시 시도`(쓰기 없이 다시 읽기), 0건에는 `예정된 레슨이 없어요`와 `/bookings` 링크를 보여준다. 카드·`예약 전체보기`·예약 탭은 모두 `/bookings`로 간다. 다른 탭에서 바뀌면 `storage` 이벤트로 다시 읽고, 1분마다 현재 시각을 갱신한다. Figma 고정 날짜는 쓰지 않는다.
- **강사에서 생성 진입**: 홈의 `강사 예시` 카드(김민준, 활성 카탈로그 상품이 있을 때만 활성)의 `이 강사와 레슨하기` → `/bookings/new?offerId=offer-kim-guitar-60&from=home`. 생성 화면은 활성 상품이면 **상품만** 사전 선택하고 날짜·시각·공간·확인 체크는 비워 둔다. 사전 선택만으로는 미저장 변경으로 보지 않는다. 없는 ID·빈 값·비활성 ID면 다른 상품으로 대체하지 않고 빈 선택과 오류 Alert `선택한 강사 레슨을 찾을 수 없어요`를 보여준다(사용자가 값을 바꾸면 사라짐). `from=home`이면 뒤로가기·이탈 확인 후 이동 목적지가 `/home`(`홈으로 돌아가기`), 그 밖의 값은 목록이다. 임의 복귀 URL은 받지 않는다.
- **용량 초과 문구 보정**(handoff §5): 생성 `브라우저 저장 공간이 부족해요. 작성한 내용은 유지했어요.` / 선택 이미지가 있으면 `… 작성한 내용과 선택한 이미지는 유지했어요.` / 수정 `… 기존 예약과 편집 중인 내용은 유지했어요.`
- **하단 내비**: `홈`은 `/home`(handoff §3 "앱 홈은 별도 `/home`"), 선택된 탭만 진한 아이콘. `찾기`·`마이`는 그대로 준비 중(링크 아님).

### 명세·Figma와 다르게 구현한 부분 (Codex 확인 필요)

1. **`/home`은 Figma 홈의 축소판이다.** Figma의 히어로·`AI 맞춤 강사 찾기`·4개 기능 아이콘·`찜한 강사`·알림 아이콘, 추천 강사 3명의 `AI 매칭 94/92/89%`·별점·후기 수·태그는 넣지 않았다. 실제 근거 데이터가 없고 CLAUDE.md가 허위 후기·운영 실적을 금지하기 때문이다. 대신 `다가오는 레슨`과 `강사 예시` 1명(배지 `예시 강사`, 안내 `AI 매칭 결과·후기·검증 내역이 아니에요`)만 있다.
2. **강사 상세 화면은 만들지 않았다.** Figma 상세(63:305)의 검증 배지·후기·매칭 이유가 같은 이유로 근거가 없다. 그래서 강사 진입 생성의 뒤로가기는 Figma(강사 상세)와 달리 `/home`으로 간다.
3. 이지은·박도현 카드는 예약 상품이 없어 홈에 넣지 않았다(handoff §3: 김민준 상품으로 연결 금지).
4. 랜딩 `/`에는 `/home` 링크를 추가하지 않았다(승인된 랜딩 시안 유지). 홈 하단 안내의 `서비스 소개 보기`가 `/`로 간다.
5. 앱 토큰에 민트가 없어 `--lc-mint`(#ddf8ef)·`--lc-mint-ink`(#08795e)를 랜딩 `--mint`·`--green`과 같은 값으로 추가했다.

### 실행한 검증 명령과 결과

- `npm run typecheck`: 통과
- `npm run build`: 통과. 정적 생성 `/`, `/_not-found`, `/bookings`, `/bookings/detail`, `/bookings/edit`, `/bookings/new`, `/home`. 빌드가 자동으로 바꾼 `next-env.d.ts`는 되돌렸다.
- `npm run dev -- --port 3100` + `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test`: **156/156 통과**(1.4분). 기존 142건 + 신규 `tests/app-integration.spec.ts` 14건.
- 정적 `out/`을 scratchpad의 로컬 Node 서버로 서빙(`/path` → `path.html`, 포트 3200) + `LANDING_TEST_URL=http://localhost:3200 npm test`: **149 통과, 7 skip**. skip은 개발 서버 전용 `/ui-check` 테스트다(빌드 결과에 경로 없음, 의도대로). 정적 파일에서도 상세·수정 `?id=` 직접 진입·새로고침이 동작한다.
- lint: **미실행**. `package.json`에 lint 스크립트가 없고 ESLint 의존성·설정도 없다.
- 디자인 확인(시각): 390×844로 `/home`(예약 있음·0건), 강사 진입 생성, 잘못된 `offerId` 생성 화면을 촬영해 직접 확인했다. 겹침·가로 넘침은 없었다. 픽셀 비교 도구는 쓰지 않았다.

신규 14건(`tests/app-integration.spec.ts`)이 확인하는 실제 동작: 키 없음 → 시드 1건이 홈에 표시되고 카드는 `/bookings`로 이동, 고정 날짜 미표시 / 예정 중 가장 이른 1건만 표시하고 취소·진행 중·종료 제외 / 0건은 빈 상태이고 새로고침해도 재시드하지 않음 / 손상 저장소는 오류·다시 시도, 원본 그대로 / 다른 탭에서 취소하면 홈 갱신 / 강사 예시 → 상품만 사전 선택, 나머지 필드 비어 있음, 매칭률·별점 미표시, 변경 없이 뒤로가면 `/home` / 입력 후 뒤로가면 이탈 확인 → `계속 작성`이면 값 유지 → 저장하면 상세로 이동하고 홈 현황이 새 예약으로 바뀜 / 잘못된 `offerId` 3종(없는 ID·빈 값·`<script>`) → 대체하지 않고 오류 안내, 뒤로가기는 목록 / 목록 진입 생성은 선택 없음 / 생성 + 선택 이미지 + 용량 초과 → 새 문구, `기존 이미지` 미포함, 미리보기·상품 유지, 저장소 무변경 / 390·320 가로 넘침 없음, 홈 탭 `aria-current`, 링크 2개(찾기·마이 비링크), 사진 로드·대체 텍스트, Tab으로 CTA에 포커스 후 Enter로 이동 / `/home`·상세·수정 직접 진입과 새로고침, 없는 ID. 모든 검사에서 콘솔 오류 0건.

### QA 체크리스트 대응 (design/qa-checklist.md)

- A: `/`는 랜딩 유지. BottomNav `예약`→`/bookings`, `홈`→`/home`(체크리스트 작성 시점의 `/`에서 handoff 규칙대로 변경), `찾기`·`마이`는 비링크. 목록→생성/상세→수정·새로고침·직접 URL 통과. 홈 예약 현황·강사 `offerId` 진입은 **이번에 구현·자동 검증**했다. Figma 프로토타입 `Flow 1` 클릭 검증은 Codex 범위라 실행하지 않았다.
- B·C·D·E: 기존 142건 회귀 + 신규 14건으로 자동 검증, 전부 통과. 용량 초과 문구 보정 완료.
- F: 390×844·320 레이아웃, 라벨·`aria-invalid`·Dialog 포커스·Escape·Enter는 자동 검증. **실기기(모바일 Safari/Chrome)·스크린 리더 낭독·EXIF 방향·배포 URL은 미실행.**

### 배포 준비 상태

- 정적 export(`out/`)라 서버·환경 변수 없이 호스팅할 수 있다. 로컬 정적 서빙에서 전체 흐름 통과.
- Figma Make: `.figma/make/deploy`(production)·`deploy-preview`가 있다. **실행하지 않았다(승인 필요).**
- Vercel: `vercel.json`·`.vercel` 연결 없음. 필요 시 Framework Next.js, `npm ci`, `npm run build`, Node 24, 환경 변수 없음. 배포 후 배포 URL에서 직접 URL 새로고침·이미지 CRUD를 다시 확인해야 한다. **실행하지 않았다.**
- GitHub: 원격 `origin`이 `jyh9182/sprint-mission5.git`이라 폴더 이름(mission6)과 다르다. push 전에 대상 저장소 확인이 필요하다. **push·커밋 모두 하지 않았다.**

### 남은 이슈

- 실기기 모바일 Safari/Chrome(회전·모바일 키보드·WebP 인코딩·EXIF), 스크린 리더, Firefox/WebKit 미검사.
- Figma 앱 홈 전체·음악 취향 1~5/5·AI 추천·강사 상세는 미구현. 구현하려면 근거 있는 데이터(또는 `예시`·`준비 중` 표기 기준)를 Codex와 먼저 정해야 한다.
- LocalStorage 총량 한계(이미지 있는 예약 대략 7건 안팎)와 origin별 분리(preview·production 데이터가 따로 저장됨).
- `design/qa-checklist.md` A항의 "`홈`은 현재 `/`로 이동" 문구는 이번 변경과 맞지 않는다. Codex 쪽에서 갱신이 필요하다.

Claude 10단계 완료 여부: **앱 통합 보정·자동 QA 완료.** 실기기·배포 URL 확인은 남아 있으며 통과로 기록하지 않는다.
