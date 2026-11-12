import { GENRE_LABELS } from './catalog';
import type { GenreId, LessonBooking, LocalDate, LocalTime } from './types';

// 화면 표시용 순수 함수. 예약 snapshot만 사용하고 현재 카탈로그를 다시 조회하지 않는다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const HONORIFIC = '선생님';

/** `김민준` → `김민준 선생님`. 이미 호칭이 있으면 중복 추가하지 않는다. */
export function instructorDisplayName(name: string): string {
  const trimmed = name.trim();
  return trimmed.endsWith(HONORIFIC) ? trimmed : `${trimmed} ${HONORIFIC}`;
}

/** `2026-11-19` → `2026년 11월 19일 (목)`. 저장 날짜는 서울 달력 날짜이므로 장치 시간대와 무관하게 계산한다. */
export function formatLessonDate(date: LocalDate): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

/** `19:00` + 60분 → `19:00–20:00`. */
export function formatLessonTimeRange(startTime: LocalTime, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const end = h * 60 + m + durationMinutes;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${startTime}–${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

export function formatInstrument(booking: Pick<LessonBooking, 'snapshot'>): string {
  return `${booking.snapshot.instrumentLabel} · ${booking.snapshot.durationMinutes}분`;
}

export function formatSpace(booking: Pick<LessonBooking, 'snapshot'>): string {
  return `${booking.snapshot.studioName} · ${booking.snapshot.roomName}`;
}

/** `['rock', 'blues']` → `Rock · Blues`. 저장된 순서를 유지한다. */
export function formatGenres(genres: readonly GenreId[]): string {
  return genres.map((id) => GENRE_LABELS[id]).join(' · ');
}

/** 상세 제목. 호칭은 instructorDisplayName이 항상 `선생님`으로 끝내므로 조사는 `과`. */
export function lessonTitle(instructorName: string): string {
  return `${instructorDisplayName(instructorName)}과의 레슨`;
}
