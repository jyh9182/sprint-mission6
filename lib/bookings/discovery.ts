import { getBookingPhase, seoulStartMs } from './time';
import type { BookingPhase, LessonBooking } from './types';

// 8단계 예약 목록 탐색(design/steps/08-list-discovery.md). 검색·상태·정렬·페이지는 저장소 조회 결과의 파생 데이터다.
// 조건은 URL 쿼리만 단일 출처로 쓰며 LocalStorage 예약 envelope에 저장하지 않는다. 이 파일의 함수는 throw하지 않는다.

export const LIST_STATUSES = ['all', 'upcoming', 'in-progress', 'ended', 'cancelled'] as const;
export type ListStatus = (typeof LIST_STATUSES)[number];
export const LIST_SORTS = ['date-asc', 'created-desc'] as const;
export type ListSort = (typeof LIST_SORTS)[number];

export const STATUS_LABELS: Record<ListStatus, string> = {
  all: '전체',
  upcoming: '예정',
  'in-progress': '진행 중',
  ended: '종료',
  cancelled: '취소됨',
};
export const SORT_LABELS: Record<ListSort, string> = { 'date-asc': '레슨 날짜순', 'created-desc': '최근 생성순' };

export const SEARCH_MAX_CODE_POINTS = 80;
export const PAGE_SIZE = 5;
/** 페이지 값으로 받는 최대 자릿수. 그보다 긴 값은 비정상 값으로 보고 무시한다. */
const PAGE_MAX_DIGITS = 6;

export interface ListQuery {
  q: string;
  status: ListStatus;
  sort: ListSort;
  page: number;
}

export const DEFAULT_LIST_QUERY: ListQuery = { q: '', status: 'all', sort: 'date-asc', page: 1 };
const LIST_PARAMS = ['q', 'status', 'sort', 'page'] as const;

/** Unicode NFC → 앞뒤 공백 제거 → 연속 공백 하나로. 표시·URL용 검색어 정규화(대소문자는 유지). */
export function normalizeSearchText(value: string): string {
  try {
    return value.normalize('NFC').trim().replace(/\s+/g, ' ');
  } catch {
    return '';
  }
}

/** 비교용 키: 정규화 후 영문 소문자화. */
function searchKey(value: string): string {
  return normalizeSearchText(value).toLowerCase();
}

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

/** 입력값을 80 code point 이하로 자른다(UTF-16 maxLength와 다를 수 있어 별도로 적용). */
export function clampSearchInput(value: string): string {
  return codePointLength(value) > SEARCH_MAX_CODE_POINTS ? Array.from(value).slice(0, SEARCH_MAX_CODE_POINTS).join('') : value;
}

const isStatus = (v: string): v is ListStatus => (LIST_STATUSES as readonly string[]).includes(v);
const isSort = (v: string): v is ListSort => (LIST_SORTS as readonly string[]).includes(v);

type ParamsLike = { getAll(name: string): string[]; keys(): Iterable<string>; toString(): string };

/**
 * URL 쿼리를 안전한 조건으로 읽는다. 중복·허용되지 않은 값·음수/소수/지수형·너무 긴 값은 기본값으로 둔다.
 * 목록 화면은 결과를 정규 URL(serializeListQuery)과 비교해 다르면 replace한다.
 * 상세·수정 화면은 같은 함수로 자기 URL에서 허용된 목록 파라미터만 읽는다(`id` 등 다른 이름은 무시).
 */
export function parseListQuery(params: ParamsLike | null | undefined): ListQuery {
  const query: ListQuery = { ...DEFAULT_LIST_QUERY };
  if (!params) return query;
  try {
    const single = (name: string): string | null => {
      const values = params.getAll(name);
      return values.length === 1 ? values[0] : null; // 중복 파라미터는 무시
    };
    const q = single('q');
    if (q !== null) {
      const normalized = normalizeSearchText(q);
      if (codePointLength(normalized) <= SEARCH_MAX_CODE_POINTS) query.q = normalized;
    }
    const status = single('status');
    if (status !== null && isStatus(status)) query.status = status;
    const sort = single('sort');
    if (sort !== null && isSort(sort)) query.sort = sort;
    const page = single('page');
    if (page !== null && new RegExp(`^[1-9]\\d{0,${PAGE_MAX_DIGITS - 1}}$`).test(page)) query.page = Number(page);
  } catch {
    return { ...DEFAULT_LIST_QUERY };
  }
  return query;
}

/** 기본값을 생략하고 q → status → sort → page 순서로 URLSearchParams 인코딩한 문자열(`?` 없음). */
export function serializeListQuery(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status !== DEFAULT_LIST_QUERY.status) params.set('status', query.status);
  if (query.sort !== DEFAULT_LIST_QUERY.sort) params.set('sort', query.sort);
  if (query.page !== DEFAULT_LIST_QUERY.page) params.set('page', String(query.page));
  return params.toString();
}

/** 목록 URL의 쿼리가 이미 정규 형태인지. 알 수 없는 파라미터가 하나라도 있으면 false. */
export function isCanonicalListSearch(params: ParamsLike, query: ListQuery): boolean {
  try {
    for (const key of params.keys()) if (!(LIST_PARAMS as readonly string[]).includes(key)) return false;
    return params.toString() === serializeListQuery(query);
  } catch {
    return false;
  }
}

export function isDefaultListQuery(query: ListQuery): boolean {
  return serializeListQuery(query) === '';
}

/** 검색어나 상태 필터가 걸려 있는지. 정렬·페이지만 바뀐 경우는 전체 예약으로 본다. */
export function hasFilter(query: ListQuery): boolean {
  return query.q !== '' || query.status !== 'all';
}

function matchesSearch(booking: LessonBooking, key: string): boolean {
  if (!key) return true;
  const { instructorName, instrumentLabel, studioName, roomName } = booking.snapshot;
  return [instructorName, instrumentLabel, studioName, roomName, `${studioName} ${roomName}`].some((target) => searchKey(target).includes(key));
}

const byId = (a: LessonBooking, b: LessonBooking) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const COMPARATORS: Record<ListSort, (a: LessonBooking, b: LessonBooking) => number> = {
  // 취소 예약도 레슨 예정 날짜 기준으로 정렬한다
  'date-asc': (a, b) => seoulStartMs(a.date, a.startTime) - seoulStartMs(b.date, b.startTime) || byId(a, b),
  'created-desc': (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0) || byId(a, b),
};

export interface DiscoveryRow {
  booking: LessonBooking;
  phase: BookingPhase;
}

export interface DiscoveryResult {
  rows: DiscoveryRow[];
  /** 조건을 통과한 전체 수(현재 페이지 수가 아님). */
  resultCount: number;
  pageCount: number;
  /** 범위로 보정한 현재 페이지. 요청한 page와 다르면 URL을 replace한다. */
  page: number;
}

/** 검색 → 상태 → 정렬 → 페이지 순서로 고정해 적용한다. */
export function applyDiscovery(bookings: readonly LessonBooking[], now: Date, query: ListQuery): DiscoveryResult {
  const key = searchKey(query.q);
  const matched: DiscoveryRow[] = [];
  for (const booking of bookings) {
    if (!matchesSearch(booking, key)) continue;
    const phase = getBookingPhase(booking, now);
    if (query.status !== 'all' && phase !== query.status) continue;
    matched.push({ booking, phase });
  }
  const compare = COMPARATORS[query.sort];
  matched.sort((a, b) => compare(a.booking, b.booking));
  const resultCount = matched.length;
  const pageCount = Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);
  return { rows: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), resultCount, pageCount, page };
}

/** 적용 조건 요약. 예: `“기타” · 예정 · 최근 생성순`, 기본은 `전체 예약 · 레슨 날짜순`. */
export function describeListQuery(query: ListQuery): string {
  const parts: string[] = [];
  if (query.q) parts.push(`“${query.q}”`);
  parts.push(query.status === 'all' ? (query.q ? '전체' : '전체 예약') : STATUS_LABELS[query.status]);
  parts.push(SORT_LABELS[query.sort]);
  return parts.join(' · ');
}
