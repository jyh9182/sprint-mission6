import { lessonWindow } from './time';
import type { LessonBooking } from './types';

// 10단계 앱 홈 `다가오는 레슨`(design/handoff.md §3 "홈 예약 현황의 구현 계약").
// 검증된 v2 예약 중 scheduled이고 시작이 현재보다 늦은 예약 가운데 가장 이른 한 건만 고른다.
// 취소됨·진행 중·종료는 고르지 않는다. 시작 시각이 같으면 먼저 만든 예약을 고른다.
export function selectUpcomingBooking(bookings: readonly LessonBooking[], now: Date): LessonBooking | null {
  const nowMs = now.getTime();
  let best: { booking: LessonBooking; start: number } | null = null;
  for (const booking of bookings) {
    if (booking.status !== 'scheduled') continue;
    const { start } = lessonWindow(booking);
    if (!(start > nowMs)) continue;
    if (!best || start < best.start || (start === best.start && booking.createdAt < best.booking.createdAt)) {
      best = { booking, start };
    }
  }
  return best?.booking ?? null;
}

/** 홈에 남은 예정 레슨 수(선택된 한 건 포함). */
export function countUpcomingBookings(bookings: readonly LessonBooking[], now: Date): number {
  const nowMs = now.getTime();
  return bookings.filter((b) => b.status === 'scheduled' && lessonWindow(b).start > nowMs).length;
}
