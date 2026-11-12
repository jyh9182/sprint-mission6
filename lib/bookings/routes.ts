import type { BookingId } from './types';

// 예약 화면 경로 계약(design/steps/01-foundation.md §3). 경로 문자열은 이 파일에서만 만든다.
// next.config.ts가 정적 export라 런타임에 생기는 예약 ID로 `/bookings/[id]` 정적 HTML을 미리 만들 수 없다.
// 그래서 논리 화면 `/bookings/[id]`를 정적 페이지 `/bookings/detail?id={UUID}`로 매핑한다(design/steps/04-booking-detail.md).

export const BOOKINGS_HREF = '/bookings';
/** 유효 상품 선택 단계부터 시작하는 새 예약. 목록에서는 임의 상품을 기본 선택하지 않는다. */
export const NEW_BOOKING_HREF = '/bookings/new';

/** 상세 정적 페이지 경로와 예약 ID 쿼리 이름. 상세 화면은 이 이름으로 ID를 읽는다. */
export const BOOKING_DETAIL_PATH = '/bookings/detail';
export const BOOKING_ID_PARAM = 'id';

export function bookingDetailHref(id: BookingId): string {
  return `${BOOKING_DETAIL_PATH}?${BOOKING_ID_PARAM}=${encodeURIComponent(id)}`;
}

/**
 * 예약 수정 정적 페이지. 논리 화면 `/bookings/[id]/edit` → `/bookings/edit?id={UUID}`(design/steps/06-booking-edit.md).
 * ID 쿼리 이름은 상세와 같은 BOOKING_ID_PARAM을 쓴다.
 */
export const BOOKING_EDIT_PATH = '/bookings/edit';

export function bookingEditHref(id: BookingId): string {
  return `${BOOKING_EDIT_PATH}?${BOOKING_ID_PARAM}=${encodeURIComponent(id)}`;
}
