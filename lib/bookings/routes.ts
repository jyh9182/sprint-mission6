import { DEFAULT_LIST_QUERY, serializeListQuery, type ListQuery } from './discovery';
import type { BookingId } from './types';

// 예약 화면 경로 계약(design/steps/01-foundation.md §3). 경로 문자열은 이 파일에서만 만든다.
// next.config.ts가 정적 export라 런타임에 생기는 예약 ID로 `/bookings/[id]` 정적 HTML을 미리 만들 수 없다.
// 그래서 논리 화면 `/bookings/[id]`를 정적 페이지 `/bookings/detail?id={UUID}`로 매핑한다(design/steps/04-booking-detail.md).
//
// 8단계: 목록 조건(q/status/sort/page)을 상세·수정 URL에 선택적으로 보존한다(design/steps/08-list-discovery.md).
// 임의 `returnTo` URL은 받지 않고, 허용된 네 파라미터만 정규화해 다시 붙인다. 기본 조건이면 아무것도 붙지 않는다.

export const BOOKINGS_HREF = '/bookings';
/** 유효 상품 선택 단계부터 시작하는 새 예약. 목록에서는 임의 상품을 기본 선택하지 않는다. */
export const NEW_BOOKING_HREF = '/bookings/new';

/** 상세 정적 페이지 경로와 예약 ID 쿼리 이름. 상세 화면은 이 이름으로 ID를 읽는다. */
export const BOOKING_DETAIL_PATH = '/bookings/detail';
export const BOOKING_ID_PARAM = 'id';

/** 목록 조건을 정규화한 `/bookings?...`. 조건이 없거나 기본값이면 `/bookings`. */
export function bookingListHref(context: ListQuery = DEFAULT_LIST_QUERY): string {
  const search = serializeListQuery(context);
  return search ? `${BOOKINGS_HREF}?${search}` : BOOKINGS_HREF;
}

function withContext(path: string, id: BookingId, context?: ListQuery): string {
  const search = context ? serializeListQuery(context) : '';
  return `${path}?${BOOKING_ID_PARAM}=${encodeURIComponent(id)}${search ? `&${search}` : ''}`;
}

/** 기존 인자 하나 호출(생성·수정 완료 흐름)은 그대로 `?id=` 만 만든다. */
export function bookingDetailHref(id: BookingId, context?: ListQuery): string {
  return withContext(BOOKING_DETAIL_PATH, id, context);
}

/**
 * 예약 수정 정적 페이지. 논리 화면 `/bookings/[id]/edit` → `/bookings/edit?id={UUID}`(design/steps/06-booking-edit.md).
 * ID 쿼리 이름은 상세와 같은 BOOKING_ID_PARAM을 쓴다.
 */
export const BOOKING_EDIT_PATH = '/bookings/edit';

export function bookingEditHref(id: BookingId, context?: ListQuery): string {
  return withContext(BOOKING_EDIT_PATH, id, context);
}

// ---------------------------------------------------------------------------
// 10단계: 앱 홈과 강사 진입 생성(design/handoff.md §3)
// ---------------------------------------------------------------------------

/** 앱 홈. `/`는 서비스 소개 랜딩으로 유지하고, 예약 현황을 보여주는 앱 홈은 별도 경로에 둔다. */
export const HOME_HREF = '/home';

/** 생성 화면이 사전 선택으로 받는 상품 ID 쿼리 이름. 날짜·시각·공간·확인 체크는 전달하지 않는다. */
export const OFFER_ID_PARAM = 'offerId';
/** 생성 화면의 진입 문맥. 허용값만 읽고 임의 복귀 URL은 받지 않는다. */
export const ENTRY_PARAM = 'from';
export type NewBookingEntry = 'list' | 'home';

/** `/bookings/new?offerId=...&from=home`. 문맥이 목록이면 `from`을 붙이지 않는다. */
export function newBookingHref({ offerId, from = 'list' }: { offerId?: string; from?: NewBookingEntry } = {}): string {
  const params = new URLSearchParams();
  if (offerId) params.set(OFFER_ID_PARAM, offerId);
  if (from !== 'list') params.set(ENTRY_PARAM, from);
  const search = params.toString();
  return search ? `${NEW_BOOKING_HREF}?${search}` : NEW_BOOKING_HREF;
}

/** URL에서 생성 진입 정보를 읽는다. `offerId`는 존재 여부만 전달하고 유효성은 카탈로그로 화면에서 판정한다. */
export function parseNewBookingEntry(params: Pick<URLSearchParams, 'get' | 'has'>): { offerId: string | null; from: NewBookingEntry } {
  const offerId = params.has(OFFER_ID_PARAM) ? (params.get(OFFER_ID_PARAM) ?? '').trim() : null;
  return { offerId, from: params.get(ENTRY_PARAM) === 'home' ? 'home' : 'list' };
}
