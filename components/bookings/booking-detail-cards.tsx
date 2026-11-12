import { formatGenres, formatInstrument, formatLessonDate, formatLessonTimeRange, formatSpace, instructorDisplayName } from '@/lib/bookings/format';
import type { LessonBooking } from '@/lib/bookings/types';

/**
 * 예약 상세 정보 카드. Figma "15 Booking Detail / Card / Information"(285:1808).
 * 저장된 snapshot과 서울 기준 날짜·시간만 표시한다(현재 카탈로그로 과거 값을 덮지 않음).
 * 긴 값은 줄바꿈해 전체를 보이고 카드 높이가 늘어난다.
 */
export function BookingInfoCard({ booking }: { booking: LessonBooking }) {
  const rows: [string, string][] = [
    ['강사', instructorDisplayName(booking.snapshot.instructorName)],
    ['악기', formatInstrument(booking)],
    ['장르', formatGenres(booking.snapshot.genres)],
  ];
  const schedule: [string, string][] = [
    ['날짜', formatLessonDate(booking.date)],
    ['시간', formatLessonTimeRange(booking.startTime, booking.snapshot.durationMinutes)],
    ['공간', formatSpace(booking)],
  ];
  return (
    <section className="lc-detail-card" aria-label="예약 정보">
      <dl className="lc-detail-info">
        {rows.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
      </dl>
      <span className="lc-detail-info__divider" aria-hidden="true" />
      <dl className="lc-detail-info">
        {schedule.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
      </dl>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="lc-detail-info__row">
      <dt className="lc-detail-info__label">{label}</dt>
      <dd className="lc-detail-info__value">{value}</dd>
    </div>
  );
}

/**
 * 메모 카드. Figma "15 Booking Detail / Card / Memo"(285:1828).
 * 저장값을 텍스트 그대로(줄바꿈 유지, HTML 해석 없음)표시한다. 빈 문자열이면 안내 문구.
 */
export function BookingMemoCard({ memo }: { memo: string }) {
  return (
    <section className="lc-detail-card lc-detail-memo" aria-labelledby="booking-memo-title">
      <h3 id="booking-memo-title" className="lc-detail-memo__title">메모</h3>
      {memo === '' ? (
        <p className="lc-detail-memo__text lc-detail-memo__text--empty">작성한 메모가 없어요.</p>
      ) : (
        <p className="lc-detail-memo__text">{memo}</p>
      )}
    </section>
  );
}
