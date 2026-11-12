# 레슨커넥트AI — 10/10 최종 디자인·동작 인계

작성일: 2026-11-13 · Codex 디자인/UX 계약 · Claude 앱 구현

## 1. 인계 범위와 현재 사실

이 문서는 [예약 데이터 계약](data-contract.md)과 [1~9단계 명세](steps/)를 다시 쓰지 않고 **화면 간 연결과 구현 차이**를 정리한다. 실제 앱 프로젝트는 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`이며, 이 디자인 폴더와 자동 동기화되지 않는다. Claude는 9단계까지 구현하고 `npm run typecheck`, `npm run build`, Playwright **142/142 통과**를 [진행 기록](progress.md#claude-9단계-구현-기록-2026-11-12)에 남겼다. Codex는 이번 단계에서 앱 소스를 수정하거나 그 검사를 다시 실행하지 않았다.

**실제 앱:** `/`는 서비스 소개 랜딩이다. `/bookings` 목록, `/bookings/new` 생성, `/bookings/detail?id={UUID}` 상세, `/bookings/edit?id={UUID}` 수정은 구현되어 있다. 정적 export라 런타임 UUID 경로(`/bookings/[id]`) 대신 `?id=`를 사용한다. 예약과 선택적 참고 이미지는 LocalStorage v2에 저장된다.

**Figma 전용 데모:** [앱 홈](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=23-67), 음악 취향·조건 1~5/5, AI 추천, 강사 상세는 앱 라우트나 데이터 연결이 아직 없다. `AI 매칭 94%`, 강사 검증·후기·다른 강사 상품·홈의 예정 레슨 날짜는 Figma 시각 예시다. 실제 AI 추천, 강사/공간 실시간 가용성, 결제·환불·로그인·서버 예약은 구현되지 않았다. Figma 프로토타입의 화면 전환은 **데모 전환**이며 실행 앱의 기능 완성을 뜻하지 않는다.

## 2. Figma 핵심 프로토타입

시작점은 [01_Home_Reference](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=23-67) (`Flow 1`)이다. 기존 마스터 스타일을 유지하고 클릭/시간 반응을 추가했다. 22개 관련 프레임에서 53개 프로토타입 연결을 구조 확인했다. [이미지 없음 생성](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=311-3234)과 [강사 진입 생성](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=312-3487)은 기존 9단계 필드 인스턴스를 복제한 연결용 상태다. 시각 QA를 마쳤다.

| 데모 경로 | Figma 연결 | 의미 |
|---|---|---|
| AI 취향 진입 | 홈 `AI 맞춤 강사 찾기` → [악기 1/5](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=112-299) → [음악 취향 2/5](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=42-136) → [목표 3/5](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=124-405) → [조건 4/5](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=136-537) → [매칭 대기 5/5](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=145-687) → [추천 예시](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=52-181) | `이전`은 직전 단계, 대기는 1.8초 뒤 추천 예시로 이동 |
| 강사에서 예약 | 추천 첫 김민준 `자세히 보기` 또는 홈 김민준 카드 → [김민준 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=63-305) → `이 강사와 레슨하기` → [강사 진입 생성](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=312-3487) | 강사 진입 생성의 뒤로가기는 김민준 상세. 다른 두 추천 강사는 현재 예약 상품이 없으므로 생성으로 연결하지 않음 |
| 홈 예약 현황 | 홈 `다가오는 레슨` 카드 또는 예약 탭 → [예약 목록 기본](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-2781) | 홈 카드의 내용은 실제 앱에서 v2 예약으로 계산해야 함 |
| 목록 CRUD | 목록 `새 레슨 예약` → [목록 진입 생성](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=311-3234); 카드 → [예약 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1807); 상세 `예약 수정` → [수정 예시](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2355) | 목록 진입 생성의 뒤로가기는 목록. 상세 뒤로가기도 목록 |
| 이미지 첨부 | 생성 이미지 선택 → [선택됨](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-2961) → 저장 예시 → [이미지 있는 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3300) | Figma 파일 선택·저장은 정적 상태 전환. 실제 앱은 WebP 변환과 LocalStorage 쓰기 후 이동 |
| 취소·삭제 | 상세 `예약 취소` → [취소 확인](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2478) → [취소 완료 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2748) → `예약 기록 삭제` → [삭제 확인](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2613) → [삭제 완료 목록](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2792) | 확인 전 데이터 변경 없음; 취소는 기록 유지, 삭제는 레코드 제거 |

검색의 예정 칩·조건 초기화·결과 없음 초기화도 Figma 상태 프레임으로 연결했다. Figma의 페이지 수와 결과 수는 예시이며 실제 검색·정렬·페이지 계산은 앱의 URL 쿼리 `q/status/sort/page`가 담당한다.

## 3. 화면·실제 라우트·목적지

| 화면/버튼 | 현재 실제 앱 | 최종 동작 규칙 |
|---|---|---|
| 서비스 랜딩 `/`의 `AI 맞춤 강사 찾기` | 악기 1개 선택하는 **저장되지 않는 프로토타입 Dialog** | Figma의 1~5/5 음악 취향/추천 흐름과 동일 기능으로 소개하지 않는다. 실제 흐름을 구현하기 전에는 현재 데모 안내를 유지 |
| Figma 앱 홈·다가오는 레슨 | **라우트 없음**; BottomNav `홈`은 `/` 랜딩으로 감 | 앱 홈을 도입한다면 별도 `/home`에 Figma 홈을 구현하고 v2 저장소의 다음 예정 레슨을 표시. 카드와 예약 탭은 `/bookings`로. 현재 `/` 랜딩을 암묵적으로 앱 홈이라 부르지 않음 |
| Figma 악기·음악 취향·목표·조건·AI 추천·강사 상세 | **라우트 없음** | 단계 1→2→3→4→5→추천→김민준 상세는 프로토타입만. 선택값을 예약 필드로 몰래 저장하거나 매칭률을 계산된 결과로 표시하지 않음 |
| 김민준 `이 강사와 레슨하기` | **앱 진입 연결 없음** | 향후 앱 강사 화면을 구현할 때 활성 카탈로그 상품 `offer-kim-guitar-60`만 `/bookings/new?offerId=offer-kim-guitar-60`로 전달. 생성 폼은 상품만 사전 선택하고 날짜·시각·공간·확인 체크는 비워 둠. `offerId`가 없거나 비활성/불일치면 다른 강사로 대체하지 말고 선택 오류 안내. 강사 화면 진입과 목록 진입은 뒤로갈 목적지를 구분 |
| 목록 `/bookings`의 카드·새 예약 | 구현됨 | 카드 → `/bookings/detail?id={UUID}` + 유효한 목록 조건; CTA → `/bookings/new`(선택 없는 폼). 검색·필터·정렬·페이지는 URL, 스크롤은 조건별 sessionStorage |
| 생성 `/bookings/new` | 구현됨 | 저장 전 뒤로가기/이탈은 미저장 확인, 현재 앱은 목록으로 복귀. 성공한 v2 쓰기 뒤 상세 `?id=`와 일회성 알림. 실패는 폼·이미지 유지 |
| 상세 `/bookings/detail?id={UUID}` | 구현됨 | Header/`예약 목록으로`는 허용된 목록 조건으로 복귀. 없는 ID와 읽기 실패 구분. 예정만 수정·취소, 종료/취소됨만 삭제, 진행 중 관리 액션 없음 |
| 수정 `/bookings/edit?id={UUID}` | 구현됨 | 기존값·이미지 표시, 의미 있는 변경 없으면 저장 비활성, 미저장 이탈 확인. 성공 후 같은 ID 상세·알림, 실패 시 편집값 유지 |
| 취소·삭제 | 구현됨 | 취소는 `status=cancelled`로 기록과 이미지 유지, 삭제는 해당 레코드·이미지 제거. 공통 Dialog 확인 후에만 실행. 삭제 성공은 목록 조건 유지·페이지 보정·일회성 알림 |
| BottomNav `찾기`·`마이` | 준비 중, 비활성 | 목적지 없는 활성 링크로 만들지 않는다. `예약`은 목록, 현재 `홈`은 랜딩. 앱 홈/찾기/마이가 실제 구현될 때만 목적지를 갱신 |

### 홈 예약 현황의 구현 계약(미구현)

홈 카드가 실제로 연결될 때 `useBookings()`의 **검증된 v2 데이터**와 서울 시각을 쓴다. `scheduled`이고 시작이 현재보다 늦은 예약 중 가장 이른 한 건을 선택하고, 저장된 snapshot의 강사·악기·공간과 서울 날짜·시각을 표시한다. 취소됨·종료·진행 중을 `다가오는 레슨`으로 표시하지 않는다. 예약이 없으면 `예정된 레슨이 없어요`와 `/bookings` 목적지를 보여준다. 초기화 중은 로딩, 읽기 실패는 오류와 `다시 시도`를 보여주며 Figma의 고정 예시(3월 15일 등)를 대신 표시하지 않는다. 카드 클릭·예약 탭은 `/bookings`다. 홈에서 임의로 예약 데이터를 생성하거나 실제 강사 가용성을 확정하지 않는다.

### 강사/음악 취향 연결의 구현 경계(미구현)

Figma 단계 순서는 화면 번호의 정렬과 다르게 **악기 1/5 → 음악 취향 2/5 → 목표·실력 3/5 → 조건 4/5 → 매칭 대기 5/5 → 추천 예시**다. `Rock/Blues/Funk` 선택은 현재 데모 시각 상태일 뿐 v2 `LessonBooking`의 필수 입력이 아니다. 추천 카드의 수치·검증·후기는 실제 계산/검증 결과로 제시하면 안 된다. 현재 카탈로그는 김민준 기타 60분 한 상품만 있다. 이지은·박도현 카드에서 김민준 상품으로 이어지는 링크를 만들지 않는다. 실제 강사 화면을 만들 때에만 데이터 계약을 넓히거나 해당 카드에 `준비 중`을 명시한다. Figma 프로토타입에서는 김민준 카드만 예약 경로로 연결했다.

## 4. 재사용 컴포넌트·데이터

| 계층 | 재사용 기준 |
|---|---|
| 공통 UI | `Button` Primary/Secondary/Loading, `Input`·`Select`·`Textarea`, `StatusBadge`, `InlineAlert`, `ConfirmDialog`, `PageHeader`, `BottomNav`; 검정 CTA·중립 surface·Noto Sans KR·20px 카드 radius를 유지 |
| 예약 UI | `BookingCard`, 공통 `BookingForm`(create/edit), `BookingReferenceImageCard`, `ReferenceImageField`. 9단계 Figma [Remove Pending](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=309-3225)의 `제거 되돌리기`를 실제 구현과 같은 44px 테두리 버튼으로 보정했다 |
| 저장/라우트 | `lib/bookings/repository.ts`만 LocalStorage 접근. 활성 키 `lessonconnect:bookings:v2`; v1 키는 읽기 전용 마이그레이션 원본. `routes.ts`의 `bookingListHref`, `bookingDetailHref`, `bookingEditHref`로 URL 생성 |
| 목록 상태 | `discovery.ts`의 `q/status/sort/page` 정규화. 검색/필터/정렬은 저장 레코드의 snapshot과 서울 시각에서 파생하며 예약 envelope에 저장하지 않음 |

브라우저 프로필과 **origin(프로토콜·호스트·포트)** 단위로 저장된다. 새로고침 후 같은 origin에서는 남지만 다른 기기·브라우저·사이트 주소로 동기화되지 않는다. 브라우저 데이터 삭제 또는 비공개 모드 종료 시 사라질 수 있다. Data URL 이미지도 동일한 로컬 저장 범위다. `/bookings`의 목록 조건은 URL, 스크롤 복원은 별도 sessionStorage다.

## 5. 성공·실패와 Figma/구현 차이

| 항목 | 확인한 차이·최종 판단 |
|---|---|
| 앱 홈/매칭 | Figma에만 존재한다. 실제 앱 랜딩의 악기 체험은 저장되지 않고 AI API를 호출하지 않는다. **남은 구현 범위**로 표시하며 완료라고 보고하지 않는다 |
| 강사에서 생성 | Figma는 강사 상세→사전 선택된 생성 폼을 보여주지만 현재 앱은 목록에서 빈 폼으로만 진입한다. 강사 화면과 `offerId` 사전 선택 검증을 구현하기 전에는 실제 링크를 활성화하지 않는다 |
| 과거 예약 09~12 Figma 화면 | 일정→공간→확인→완료의 이전 구상이다. 현재 실제 생성은 5단계 단일 스크롤 폼이 최종 계약이며 새 프로토타입도 그 폼을 사용한다 |
| 화면 크롬 | Figma의 `9:41` 상태 표시줄·홈 인디케이터는 브라우저 앱에서 그리지 않는다. 실제 viewport는 `100dvh`에서 남는 영역을 사용. 픽셀 단위 고정 높이 차이는 허용한다 |
| 9단계 이미지 UI | 실제 썸네일은 88/152px, Figma 예시는 약 90/154px. `제거 되돌리기`는 44px 버튼이 더 적합해 Figma 마스터를 이번에 보정했다. Figma 사진·파일명은 샘플, 앱은 사용자가 변환한 WebP를 사용 |
| 용량 초과 문구 | 현재 앱은 생성에도 `입력과 기존 이미지는 유지했어요`를 쓴다. **보정 필요:** 생성에는 `브라우저 저장 공간이 부족해요. 작성한 내용과 선택한 이미지는 유지했어요.`(이미지 없음이면 `작성한 내용은 유지했어요.`), 수정에는 기존 예약/편집값 보존 문구를 사용. 기능은 기존 데이터 보존으로 검증됨 |
| 추천 카드의 활성 모양 | 이지은·박도현의 `자세히 보기`는 Figma에서 눌릴 듯 보이지만 실제 상세/상품이 없다. 이 두 카드의 예약 동작은 연결하지 않았다. 앱으로 옮길 때 비활성/준비 중 표시 또는 실제 카탈로그 확장이 필요 |

공통 원칙: **성공한 v2 쓰기 뒤에만** 상세/목록 이동과 성공 알림을 표시한다. 초기화/조회 오류와 0건을 구분한다. 저장 실패·용량 초과·다른 탭 충돌은 원본과 편집 중 값/이미지를 유지한다. 취소·삭제는 확인 Dialog가 닫히기 전에 중복 실행하지 않는다. 목록의 검색 조건과 상세/수정/삭제 복귀 문맥을 유지한다. 전체 검수 항목은 [QA 체크리스트](qa-checklist.md)에 있다.

## 6. 원 과제의 Supabase 항목 대체 범위

| 원 요구 | 현재 대체·한계 |
|---|---|
| Supabase DB의 CRUD | 브라우저 클라이언트의 `BookingRepository`와 LocalStorage v2로 생성·조회·수정·취소·삭제. 서버 공유·동시성 트랜잭션 없음 |
| Supabase Storage 이미지 | 예약 레코드 안의 WebP Data URL 1장(원본 2 MiB, 긴 변 1280px, 결과 500 KiB). 브라우저 총량 초과 시 저장 거절·원본 유지 |
| Supabase Auth/RLS | 로그인·계정·RLS가 없다. 같은 origin의 브라우저 프로필 저장소만 사용하며 사용자별 보호·기기 간 동기화를 주장하지 않음 |
| Next.js Server Actions/Route Handlers | 정적 export를 유지하고 클라이언트 저장소 함수로 처리. 서버 데이터 처리 요건을 충족했다고 표현하지 않음 |
| DB 마이그레이션 | 로컬 v1 키를 검증해 v2 키로 복사. v1 원본 보존, v2 손상 시 자동 대체 금지 |

이 프로젝트는 **로컬 데모 예약**이다. 실제 결제·환불·실시간 강사/공간 확보·서버 AI 추천·계정 간 공유는 범위 밖이며 사용자에게 확정된 서비스 기능처럼 안내하지 않는다.
