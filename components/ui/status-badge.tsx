import type { BookingPhase } from '@/lib/bookings/types';
import { cn } from '@/lib/utils';

/**
 * 예약 상태 Badge. Figma "13 Booking / Status Badge"(275:1526).
 * 읽기 전용 표시이며 클릭·포커스할 수 없다. 색만으로 구별하지 않고 텍스트를 항상 표시한다.
 * 진행 중·종료는 서울 시각에서 파생한 상태로, 수강 확인·완료 확정을 뜻하지 않는다.
 */
export const BOOKING_PHASE_LABELS: Record<BookingPhase, string> = {
  upcoming: '예정',
  'in-progress': '진행 중',
  ended: '종료',
  cancelled: '취소됨',
};

export function StatusBadge({ phase, className }: { phase: BookingPhase; className?: string }) {
  return <span className={cn('lc-badge', `lc-badge--${phase}`, className)}>{BOOKING_PHASE_LABELS[phase]}</span>;
}
