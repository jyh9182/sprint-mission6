// 5단계 공통 예약 폼 검증 함수 (브라우저 없이 Node에서 실행).
import { test, expect } from '@playwright/test';
import { getBookingCatalog } from '../lib/bookings/catalog';
import {
  changeOffer,
  EMPTY_BOOKING_FORM,
  FORM_MESSAGES,
  mapSaveError,
  offerSummaryDetail,
  offerSummaryTitle,
  selectableSpaces,
  toBookingInput,
  validateBookingForm,
  type BookingFormValues,
} from '../lib/bookings/form';
import type { BookingCatalog } from '../lib/bookings/types';

// 2026-11-11 19:30 서울 (10:30Z)
const NOW = Date.parse('2026-11-11T10:30:00.000Z');
const catalog = getBookingCatalog();
const valid: BookingFormValues = {
  offerId: 'offer-kim-guitar-60',
  date: '2026-11-19',
  startTime: '19:00',
  spaceId: 'space-dongtan-b',
  memo: '  퇴근 후 레슨 희망  ',
  acknowledged: true,
};
const check = (v: Partial<BookingFormValues>, opts: { catalog?: BookingCatalog; dateBadInput?: boolean } = {}) =>
  validateBookingForm({ ...valid, ...v }, { catalog: opts.catalog ?? catalog, nowMs: NOW, dateBadInput: opts.dateBadInput });

test('정상 입력은 오류 없음, 저장소 입력은 acknowledged:true만 전달', () => {
  expect(check({})).toEqual({});
  expect(toBookingInput(valid)).toEqual({
    offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: '2026-11-19', startTime: '19:00', memo: '  퇴근 후 레슨 희망  ', acknowledged: true,
  });
});

test('빈 폼: 모든 필수 항목에 명세 문구', () => {
  expect(validateBookingForm(EMPTY_BOOKING_FORM, { catalog, nowMs: NOW })).toEqual({
    offerId: FORM_MESSAGES.offerRequired,
    date: FORM_MESSAGES.dateRequired,
    startTime: FORM_MESSAGES.timeRequired,
    spaceId: FORM_MESSAGES.spaceRequired,
    acknowledged: FORM_MESSAGES.acknowledgedRequired,
  });
  expect(FORM_MESSAGES.offerRequired).toBe('강사와 레슨을 선택해주세요.');
  expect(FORM_MESSAGES.acknowledgedRequired).toBe('예약 내용을 확인해주세요.');
});

test('날짜: 과거·형식 오류·달력에 없는 날짜·브라우저가 해석 못 한 입력', () => {
  expect(check({ date: '2026-11-10' })).toEqual({ date: '미래의 날짜와 시작 시간을 선택해주세요.' });
  expect(check({ date: '2026-02-30' })).toEqual({ date: '올바른 날짜를 선택해주세요.' });
  expect(check({ date: '2026/11/19' })).toEqual({ date: '올바른 날짜를 선택해주세요.' });
  expect(check({ date: '' }, { dateBadInput: true })).toEqual({ date: '올바른 날짜를 선택해주세요.' });
});

test('시작 시간: 오늘 이미 시작한 시각, 카탈로그 밖 17:30, 빈값', () => {
  // 서울 19:30 기준 오늘 19:00은 지났고 20:00은 미래
  expect(check({ date: '2026-11-11', startTime: '19:00' })).toEqual({ startTime: '미래의 날짜와 시작 시간을 선택해주세요.' });
  expect(check({ date: '2026-11-11', startTime: '20:00' })).toEqual({});
  expect(check({ startTime: '17:30' })).toEqual({ startTime: '선택할 수 없는 시간이에요. 다시 선택해주세요.' });
  expect(check({ startTime: '' })).toEqual({ startTime: '시작 시간을 선택해주세요.' });
  // 장치 시간대와 무관: 서울 00:00 경계(UTC 전날 15:00)
  const midnight = Date.parse('2026-11-11T15:00:00.000Z'); // 서울 2026-11-12 00:00
  expect(validateBookingForm({ ...valid, date: '2026-11-11', startTime: '21:00' }, { catalog, nowMs: midnight })).toEqual({ date: '미래의 날짜와 시작 시간을 선택해주세요.' });
});

test('공간·상품: 허용되지 않은 공간, 비활성 상품·공간', () => {
  expect(check({ spaceId: 'space-unknown' })).toEqual({ spaceId: '선택한 공간을 이용할 수 없어요. 다시 선택해주세요.' });
  expect(check({ offerId: 'offer-unknown' })).toMatchObject({ offerId: FORM_MESSAGES.offerUnavailable, spaceId: FORM_MESSAGES.spaceUnavailable });

  const restricted: BookingCatalog = {
    ...catalog,
    offers: [{ ...catalog.offers[0], allowedSpaceIds: ['space-dongtan-a', 'space-dongtan-c'] }],
    spaces: catalog.spaces.map((s) => (s.id === 'space-dongtan-c' ? { ...s, active: false } : s)),
  };
  expect(selectableSpaces(restricted, valid.offerId).map((s) => s.id)).toEqual(['space-dongtan-a']);
  expect(check({ spaceId: 'space-dongtan-b' }, { catalog: restricted })).toEqual({ spaceId: FORM_MESSAGES.spaceUnavailable });

  const inactiveInstructor: BookingCatalog = { ...catalog, instructors: [{ ...catalog.instructors[0], active: false }] };
  expect(check({}, { catalog: inactiveInstructor })).toMatchObject({ offerId: FORM_MESSAGES.offerUnavailable });
});

test('메모: 앞뒤 공백 제외 500 code point까지, 501이면 오류(이모지도 1자)', () => {
  expect(check({ memo: '🎸'.repeat(500) })).toEqual({});
  expect(check({ memo: `  ${'가'.repeat(500)}\n ` })).toEqual({});
  expect(check({ memo: '🎸'.repeat(501) })).toEqual({ memo: '메모는 500자까지 입력할 수 있어요.' });
});

test('확인 체크 누락', () => {
  expect(check({ acknowledged: false })).toEqual({ acknowledged: '예약 내용을 확인해주세요.' });
});

test('상품 변경은 날짜·시간·공간을 지우고 메모·체크는 유지, 같은 상품은 그대로', () => {
  expect(changeOffer(valid, 'offer-other')).toEqual({ ...valid, offerId: 'offer-other', date: '', startTime: '', spaceId: '' });
  expect(changeOffer(valid, valid.offerId)).toBe(valid);
});

test('상품 요약은 카탈로그 값과 일치하고 가격은 예시로 표시', () => {
  expect(offerSummaryTitle(catalog.offers[0])).toBe('기타 · Rock / Blues');
  expect(offerSummaryDetail(catalog.offers[0])).toBe('레슨 길이 60분 · 예시 50,000원');
});

test('저장 실패 매핑: 어떤 실패도 성공으로 바꾸지 않음', () => {
  expect(mapSaveError({ code: 'QUOTA_EXCEEDED', message: '' })).toEqual({ ok: false, alert: { title: '예약을 저장하지 못했어요', message: '저장 공간이 부족해요. 입력 내용은 유지했어요.' } });
  expect(mapSaveError({ code: 'WRITE_FAILED', message: '' })).toEqual({ ok: false, alert: { title: '예약을 저장하지 못했어요', message: '입력 내용은 유지했어요. 다시 시도해주세요.' } });
  expect(mapSaveError({ code: 'STORAGE_UNAVAILABLE', message: '' }).alert?.title).toBe('예약을 저장하지 못했어요');
  expect(mapSaveError({ code: 'LOCAL_TIME_CONFLICT', message: '같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.' })).toEqual({
    ok: false, fieldErrors: { startTime: '같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.' },
  });
  expect(mapSaveError({ code: 'VALIDATION_ERROR', message: '', fieldErrors: { date: 'x', startTime: 'x' } })).toEqual({
    ok: false, fieldErrors: { startTime: FORM_MESSAGES.past }, revalidate: true,
  });
  expect(mapSaveError({ code: 'CONFLICT', message: '' }).alert?.title).toBe('다른 화면에서 예약 정보가 변경됐어요');
});
