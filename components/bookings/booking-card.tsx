import Link from 'next/link';
import { BOOKING_PHASE_LABELS, StatusBadge } from '@/components/ui/status-badge';
import { formatInstrument, formatLessonDate, formatLessonTimeRange, formatSpace, instructorDisplayName } from '@/lib/bookings/format';
import { bookingDetailHref } from '@/lib/bookings/routes';
import type { BookingPhase, LessonBooking } from '@/lib/bookings/types';

/**
 * 예약 목록 카드. Figma "14 Booking List / Card / LessonBooking"(282:1584).
 * 카드 전체가 상세 링크 하나이며 카드 안에 취소·삭제 동작을 두지 않는다.
 * 강사·공간·악기는 화면에서 최대 2줄로 줄이고, 링크의 접근 가능한 이름에는 전체 문자열을 담는다.
 */
export function BookingCard({ booking, phase, onNavigate }: { booking: LessonBooking; phase: BookingPhase; onNavigate?: () => void }) {
  const instructor = instructorDisplayName(booking.snapshot.instructorName);
  const date = formatLessonDate(booking.date);
  const time = formatLessonTimeRange(booking.startTime, booking.snapshot.durationMinutes);
  const instrument = formatInstrument(booking);
  const space = formatSpace(booking);
  const label = `${instructor}, ${date} ${time}, ${BOOKING_PHASE_LABELS[phase]}, ${instrument}, ${space}, 예약 상세 보기`;

  return (
    <Link href={bookingDetailHref(booking.id)} className="lc-booking-card lc-focus-ring" aria-label={label} onClick={onNavigate}>
      <span className="lc-booking-card__top">
        <span className="lc-booking-card__instructor lc-clamp-2">{instructor}</span>
        <StatusBadge phase={phase} className="lc-booking-card__badge" />
      </span>
      <span className="lc-booking-card__instrument lc-clamp-2">{instrument}</span>
      <span className="lc-booking-card__divider" aria-hidden="true" />
      <span className="lc-booking-card__row">
        <img src="/assets/ui/calendar.svg" alt="" width={20} height={20} />
        <span className="lc-booking-card__datetime">
          <span className="lc-nowrap">{date}</span> · <span className="lc-nowrap">{time}</span>
        </span>
      </span>
      <span className="lc-booking-card__row">
        <img src="/assets/ui/location.svg" alt="" width={20} height={20} />
        <span className="lc-booking-card__space lc-clamp-2">{space}</span>
      </span>
      <span className="lc-booking-card__more" aria-hidden="true">예약 상세 보기 ›</span>
    </Link>
  );
}
