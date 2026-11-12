// 저장 성공 알림을 다음 화면에 한 번만 전달한다(design/steps/05-booking-create.md §저장 3).
// 같은 탭의 클라이언트 이동에서만 유지되는 메모리 값이다. URL 쿼리·LocalStorage·sessionStorage에 남기지 않으므로
// 직접 방문·새로고침·다른 탭에서는 알림이 보이지 않는다. 실제 저장 성공(StoreResult.ok) 이후에만 설정한다.

import type { BookingId } from './types';

export type BookingFlashKind = 'create' | 'update';

let pending: { id: BookingId; kind: BookingFlashKind } | null = null;

export function setBookingFlash(id: BookingId, kind: BookingFlashKind) {
  pending = { id, kind };
}

/** 해당 예약 ID에 대한 알림이 있으면 종류를 돌려준다. 소비하지 않는다(렌더 중 호출 가능). */
export function peekBookingFlash(id: BookingId | null): BookingFlashKind | null {
  return id && pending?.id === id ? pending.kind : null;
}

/** 표시한 뒤 지운다. 다시 방문하면 보이지 않는다. */
export function clearBookingFlash(id: BookingId | null) {
  if (id && pending?.id === id) pending = null;
}

// 목록(`/bookings`)으로 넘기는 알림. 7단계 삭제 성공(deletedId 확인 뒤)에만 설정한다.
export type ListFlashKind = 'delete';

let pendingList: ListFlashKind | null = null;

export function setListFlash(kind: ListFlashKind) {
  pendingList = kind;
}

/** 소비하지 않는다(렌더 중 호출 가능). */
export function peekListFlash(): ListFlashKind | null {
  return pendingList;
}

export function clearListFlash() {
  pendingList = null;
}
