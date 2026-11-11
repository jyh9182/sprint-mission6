import type { BookingPhase, LessonBooking, LocalDate, LocalTime } from './types';

// 모든 레슨 시각은 장치 시간대와 무관하게 Asia/Seoul(UTC+9, 일광절약 없음)로 해석한다.
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const LESSON_DURATION_MS = 60 * 60 * 1000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function isValidLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function isValidLocalTime(value: unknown): value is LocalTime {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function isValidISOInstant(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_INSTANT_RE.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
}

/** 서울 날짜+시각의 시작 시점(epoch ms). */
export function seoulStartMs(date: LocalDate, startTime: LocalTime): number {
  return Date.parse(`${date}T${startTime}:00+09:00`);
}

export function lessonWindow(booking: Pick<LessonBooking, 'date' | 'startTime'>) {
  const start = seoulStartMs(booking.date, booking.startTime);
  return { start, end: start + LESSON_DURATION_MS };
}

/** 종료(시작+60분)가 같은 서울 날짜 안에 있는지. 24:00 정각 종료는 허용한다. */
export function endsSameSeoulDay(startTime: LocalTime): boolean {
  const [h, m] = startTime.split(':').map(Number);
  return h * 60 + m + 60 <= 24 * 60;
}

/** now 시점의 서울 날짜. UTC 날짜를 자르지 않고 +9시간 이동 후 계산한다. */
export function seoulDate(nowMs: number): LocalDate {
  return new Date(nowMs + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function getBookingPhase(booking: LessonBooking, now: Date): BookingPhase {
  if (booking.status === 'cancelled') return 'cancelled';
  const { start, end } = lessonWindow(booking);
  const t = now.getTime();
  if (t < start) return 'upcoming';
  if (t < end) return 'in-progress';
  return 'ended';
}
