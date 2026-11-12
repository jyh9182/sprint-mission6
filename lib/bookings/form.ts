// 예약 생성·수정 공통 폼의 값·검증·오류 매핑 — design/steps/05-booking-create.md.
// 화면과 무관한 순수 함수만 둔다. 저장소의 최종 검증(validateBookingInput)과 별개로,
// 사용자가 고칠 수 있도록 필드별 구체적인 문구를 만든다. 저장소 결과가 항상 최종이다.

import { formatGenres } from './format';
import { isValidLocalDate, isValidLocalTime, endsSameSeoulDay, seoulDate, seoulStartMs } from './time';
import type { BookingCatalog, BookingInput, LessonBooking, LessonOfferReference, SpaceReference, StoreError } from './types';
import { codePointLength, MEMO_MAX_CODE_POINTS } from './validation';

/** 폼이 들고 있는 편집 값. 확인 체크는 제출 시에만 `acknowledged: true`로 전달하고 저장하지 않는다. */
export interface BookingFormValues {
  offerId: string;
  date: string;
  startTime: string;
  spaceId: string;
  memo: string;
  acknowledged: boolean;
}

/** 화면에 보이는 필드 순서(첫 오류 포커스 순서와 같다). */
export const BOOKING_FORM_FIELDS = ['offerId', 'date', 'startTime', 'spaceId', 'memo', 'acknowledged'] as const;
export type BookingFormField = (typeof BOOKING_FORM_FIELDS)[number];
export type BookingFormErrors = Partial<Record<BookingFormField, string>>;

export const EMPTY_BOOKING_FORM: BookingFormValues = Object.freeze({
  offerId: '',
  date: '',
  startTime: '',
  spaceId: '',
  memo: '',
  acknowledged: false,
});

/** 5단계 명세의 필드 문구. 저장소 기본 문구(FIELD_MESSAGES)보다 구체적이며 폼에서만 쓴다. */
export const FORM_MESSAGES = {
  offerRequired: '강사와 레슨을 선택해주세요.',
  offerUnavailable: '선택한 레슨을 이용할 수 없어요. 다시 선택해주세요.',
  dateRequired: '날짜를 선택해주세요.',
  dateInvalid: '올바른 날짜를 선택해주세요.',
  past: '미래의 날짜와 시작 시간을 선택해주세요.',
  timeRequired: '시작 시간을 선택해주세요.',
  timeUnavailable: '선택할 수 없는 시간이에요. 다시 선택해주세요.',
  spaceRequired: '레슨 공간을 선택해주세요.',
  spaceUnavailable: '선택한 공간을 이용할 수 없어요. 다시 선택해주세요.',
  memoTooLong: `메모는 ${MEMO_MAX_CODE_POINTS}자까지 입력할 수 있어요.`,
  acknowledgedRequired: '예약 내용을 확인해주세요.',
} as const;

// ---------------------------------------------------------------------------
// 카탈로그 옵션 — 읽기 전용 데모 카탈로그에서만 만든다. 실제 가용성을 조회하지 않는다.
// ---------------------------------------------------------------------------

/** 활성 상품 + 활성 강사만. */
export function selectableOffers(catalog: BookingCatalog): { offer: LessonOfferReference; instructorName: string }[] {
  return catalog.offers.flatMap((offer) => {
    if (!offer.active) return [];
    const instructor = catalog.instructors.find((i) => i.id === offer.instructorId && i.active);
    return instructor ? [{ offer, instructorName: instructor.name }] : [];
  });
}

export function findSelectableOffer(catalog: BookingCatalog, offerId: string) {
  return selectableOffers(catalog).find((o) => o.offer.id === offerId);
}

/** 선택한 상품이 허용하는 활성 공간만. */
export function selectableSpaces(catalog: BookingCatalog, offerId: string): SpaceReference[] {
  const offer = findSelectableOffer(catalog, offerId)?.offer;
  if (!offer) return [];
  return offer.allowedSpaceIds.flatMap((id) => {
    const space = catalog.spaces.find((s) => s.id === id && s.active);
    return space ? [space] : [];
  });
}

/** 카탈로그 시작 시각 중 같은 서울 날짜에 끝나는 것. */
export function catalogStartTimes(catalog: BookingCatalog): string[] {
  return catalog.demoStartTimes.filter((t) => isValidLocalTime(t) && endsSameSeoulDay(t));
}

/** 오늘(서울)을 고른 경우 이미 시작했거나 지난 시각인지. 다른 날짜는 false. */
export function isPastStart(date: string, startTime: string, nowMs: number): boolean {
  if (!isValidLocalDate(date) || !isValidLocalTime(startTime)) return false;
  return seoulStartMs(date, startTime) <= nowMs;
}

/** 상품 요약 첫 줄: `기타 · Rock / Blues`. 장르 구분은 Figma 요약 카드 표기(` / `)를 따른다. */
export function offerSummaryTitle(offer: LessonOfferReference): string {
  return `${offer.instrumentLabel} · ${formatGenres(offer.genres).split(' · ').join(' / ')}`;
}

/** 상품 요약 둘째 줄: `레슨 길이 60분 · 예시 50,000원`. 가격은 예시임을 항상 밝힌다. */
export function offerSummaryDetail(offer: LessonOfferReference): string {
  return `레슨 길이 ${offer.durationMinutes}분 · 예시 ${offer.examplePriceKRW.toLocaleString('ko-KR')}원`;
}

// ---------------------------------------------------------------------------
// 검증
// ---------------------------------------------------------------------------

export interface FormValidationContext {
  catalog: BookingCatalog;
  nowMs: number;
  /** 네이티브 date 입력이 해석할 수 없는 값을 가진 경우(value는 빈 문자열이 된다). */
  dateBadInput?: boolean;
}

/** 전체 필드 검증. 반환 객체의 키 순서는 화면 순서와 같다. */
export function validateBookingForm(values: BookingFormValues, ctx: FormValidationContext): BookingFormErrors {
  const errors: BookingFormErrors = {};
  const { catalog, nowMs } = ctx;

  if (!values.offerId) errors.offerId = FORM_MESSAGES.offerRequired;
  else if (!findSelectableOffer(catalog, values.offerId)) errors.offerId = FORM_MESSAGES.offerUnavailable;

  const dateOk = isValidLocalDate(values.date) && !ctx.dateBadInput;
  if (ctx.dateBadInput) errors.date = FORM_MESSAGES.dateInvalid;
  else if (!values.date) errors.date = FORM_MESSAGES.dateRequired;
  else if (!dateOk) errors.date = FORM_MESSAGES.dateInvalid;
  else if (values.date < seoulDate(nowMs)) errors.date = FORM_MESSAGES.past;

  const timeOk = catalogStartTimes(catalog).includes(values.startTime);
  if (!values.startTime) errors.startTime = FORM_MESSAGES.timeRequired;
  else if (!timeOk) errors.startTime = FORM_MESSAGES.timeUnavailable;
  else if (dateOk && !errors.date && isPastStart(values.date, values.startTime, nowMs)) errors.startTime = FORM_MESSAGES.past;

  if (!values.spaceId) errors.spaceId = FORM_MESSAGES.spaceRequired;
  else if (!selectableSpaces(catalog, values.offerId).some((s) => s.id === values.spaceId)) errors.spaceId = FORM_MESSAGES.spaceUnavailable;

  if (codePointLength(values.memo.trim()) > MEMO_MAX_CODE_POINTS) errors.memo = FORM_MESSAGES.memoTooLong;

  if (!values.acknowledged) errors.acknowledged = FORM_MESSAGES.acknowledgedRequired;

  return errors;
}

/** 저장소에 넘길 입력. 검증을 통과한 값에만 호출한다. snapshot 등은 저장소가 카탈로그에서 만든다. */
export function toBookingInput(values: BookingFormValues): BookingInput {
  return {
    offerId: values.offerId,
    spaceId: values.spaceId,
    date: values.date,
    startTime: values.startTime,
    memo: values.memo,
    acknowledged: true,
  };
}

/** 상품을 바꾸면 종속 값(날짜·시간·공간)을 지운다. 메모·확인 체크는 유지한다. */
export function changeOffer(values: BookingFormValues, offerId: string): BookingFormValues {
  if (values.offerId === offerId) return values;
  return { ...values, offerId, date: '', startTime: '', spaceId: '' };
}

export function isSameFormValues(a: BookingFormValues, b: BookingFormValues): boolean {
  return BOOKING_FORM_FIELDS.every((field) => a[field] === b[field]);
}

// ---------------------------------------------------------------------------
// 수정(6단계) — design/steps/06-booking-edit.md
// ---------------------------------------------------------------------------

/** 저장된 예약값으로 수정 폼을 채운다. 확인 체크는 저장 필드가 아니므로 매번 false로 시작한다. */
export function bookingToFormValues(booking: LessonBooking): BookingFormValues {
  return {
    offerId: booking.offerId,
    date: booking.date,
    startTime: booking.startTime,
    spaceId: booking.spaceId,
    memo: booking.memo,
    acknowledged: false,
  };
}

/**
 * 의미 있는 변경 여부. 예약 필드(offerId·date·startTime·spaceId)와 trim한 메모만 비교한다.
 * 확인 체크·메모 앞뒤 공백은 변경이 아니며, 바꿨다가 되돌리면 다시 변경 없음이다.
 */
export function hasMeaningfulChange(values: BookingFormValues, baseline: BookingFormValues): boolean {
  return (
    values.offerId !== baseline.offerId ||
    values.date !== baseline.date ||
    values.startTime !== baseline.startTime ||
    values.spaceId !== baseline.spaceId ||
    values.memo.trim() !== baseline.memo.trim()
  );
}

export const EDIT_MESSAGES = {
  unchanged: '변경한 내용이 없어요. 내용을 바꾸면 저장할 수 있어요.',
  noLongerEditable: '이 예약은 이제 수정할 수 없어요.',
  changedElsewhere: '다른 화면에서 이 예약이 변경됐어요. 새 내용을 확인해주세요.',
} as const;

// ---------------------------------------------------------------------------
// 저장 실패 → 폼 표시
// ---------------------------------------------------------------------------

export interface FormSubmitAlert {
  title: string;
  message: string;
}

/** 폼 onSubmit 결과. 성공 시 이동은 호출 화면이 맡고, 폼은 Loading을 유지한다. */
export type BookingFormSubmitResult =
  | { ok: true }
  | { ok: false; alert?: FormSubmitAlert; fieldErrors?: BookingFormErrors; revalidate?: boolean };

/**
 * 저장 공간 초과 문구(10단계 보정, design/handoff.md §5). 생성에는 저장된 `기존 이미지`가 없으므로
 * 작성한 내용과(선택했다면) 선택한 이미지를 유지했다고 안내한다. 수정은 저장된 예약과 편집값 보존을 안내한다.
 */
export const QUOTA_MESSAGES = {
  create: '브라우저 저장 공간이 부족해요. 작성한 내용은 유지했어요.',
  createWithImage: '브라우저 저장 공간이 부족해요. 작성한 내용과 선택한 이미지는 유지했어요.',
  edit: '브라우저 저장 공간이 부족해요. 기존 예약과 편집 중인 내용은 유지했어요.',
} as const;

/** 생성/수정 화면의 실패 문구 차이(5단계 Save Error · 6단계 Edit Save Error). */
const SAVE_COPY = {
  create: { title: '예약을 저장하지 못했어요', keep: '입력 내용은 유지했어요.' },
  edit: { title: '변경 내용을 저장하지 못했어요', keep: '편집 중인 내용은 유지했어요.' },
} as const;

/**
 * 저장소 오류를 폼 표시로 바꾼다. 어떤 실패도 성공 화면으로 넘기지 않는다.
 * - LOCAL_TIME_CONFLICT: 같은 브라우저의 다른 예약과 시간 겹침 → 시작 시간 필드 오류(실시간 일정 검증 아님)
 * - VALIDATION_ERROR: 저장 시점의 현재 시각·카탈로그로 다시 검증하도록 표시(경계 시각 등)
 * - CONFLICT: 다른 탭·화면 변경. 호출 화면이 최신 revision을 다시 읽고, 사용자가 확인 후 재시도한다.
 */
export function mapSaveError(
  error: StoreError,
  mode: 'create' | 'edit' = 'create',
  { imageSelected = false }: { imageSelected?: boolean } = {},
): Exclude<BookingFormSubmitResult, { ok: true }> {
  const { title: SAVE_FAILED_TITLE, keep: KEEP_INPUT } = SAVE_COPY[mode];
  switch (error.code) {
    case 'LOCAL_TIME_CONFLICT':
      return { ok: false, fieldErrors: { startTime: error.message } };
    case 'VALIDATION_ERROR': {
      const fieldErrors: BookingFormErrors = {};
      const f = error.fieldErrors ?? {};
      if (f.offerId) fieldErrors.offerId = FORM_MESSAGES.offerUnavailable;
      if (f.date || f.startTime) fieldErrors.startTime = FORM_MESSAGES.past;
      if (f.spaceId) fieldErrors.spaceId = FORM_MESSAGES.spaceUnavailable;
      if (f.memo) fieldErrors.memo = FORM_MESSAGES.memoTooLong;
      if (f.acknowledged) fieldErrors.acknowledged = FORM_MESSAGES.acknowledgedRequired;
      if (f.referenceImageChange) {
        // 폼 검증을 우회한 이미지 값. 파일 형식 오류와 섞지 않고 저장 실패 알림으로 안내한다.
        return { ok: false, fieldErrors, revalidate: true, alert: { title: SAVE_FAILED_TITLE, message: `참고 이미지를 저장할 수 없어요. 이미지를 다시 선택해주세요.\n${KEEP_INPUT}` } };
      }
      return { ok: false, fieldErrors, revalidate: true };
    }
    case 'CONFLICT':
      return {
        ok: false,
        alert: { title: '다른 화면에서 예약 정보가 변경됐어요', message: `최신 예약 정보를 다시 불러왔어요. ${KEEP_INPUT} 내용을 확인한 뒤 다시 시도해주세요.` },
      };
    case 'QUOTA_EXCEEDED':
      // 9단계: 입력·준비한 이미지·제거 예정과 저장된 기존 이미지를 모두 보존한다(자동으로 첨부를 지우지 않음).
      return {
        ok: false,
        alert: { title: SAVE_FAILED_TITLE, message: mode === 'edit' ? QUOTA_MESSAGES.edit : imageSelected ? QUOTA_MESSAGES.createWithImage : QUOTA_MESSAGES.create },
      };
    case 'CORRUPT_DATA':
    case 'UNSUPPORTED_VERSION':
      return { ok: false, alert: { title: SAVE_FAILED_TITLE, message: `${error.message}\n${KEEP_INPUT}` } };
    default:
      // STORAGE_UNAVAILABLE · WRITE_FAILED · 그 밖의 예기치 못한 실패
      return { ok: false, alert: { title: SAVE_FAILED_TITLE, message: `${KEEP_INPUT} 다시 시도해주세요.` } };
  }
}
