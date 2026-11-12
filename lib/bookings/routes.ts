import type { BookingId } from './types';

// 예약 화면 경로 계약(design/steps/01-foundation.md §3). 경로 문자열은 이 파일에서만 만든다.
// 주의: next.config.ts가 정적 export라 런타임에 생기는 예약 ID로 `/bookings/[id]` 정적 HTML을 미리 만들 수 없다.
// 상세(4단계)의 실제 URL 형태가 바뀌면 bookingDetailHref만 고친다.

export const BOOKINGS_HREF = '/bookings';
/** 유효 상품 선택 단계부터 시작하는 새 예약. 목록에서는 임의 상품을 기본 선택하지 않는다. */
export const NEW_BOOKING_HREF = '/bookings/new';

export function bookingDetailHref(id: BookingId): string {
  return `${BOOKINGS_HREF}/${encodeURIComponent(id)}`;
}
