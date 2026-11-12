import type { BookingPhase } from './types';

// 예약 상세의 액션 노출 규칙(design/steps/04-booking-detail.md "상태별 액션 조건").
// 저장소의 상태 전이 규칙(repository.ts updateBooking/cancelBooking/deleteBooking)과 같은 조건이다.
//
// 이 규칙은 화면 노출만 정한다. 최종 판정은 저장소가 실행 시각·최신 revision으로 다시 한다.
// - 수정: Footer Primary `예약 수정` → 수정 화면(6단계).
// - 취소·삭제: `예약 관리` 버튼 → 확인 Dialog(7단계). 확인 없이 cancelBooking/deleteBooking을 실행하지 않는다.

export interface DetailActions {
  edit: boolean;
  cancel: boolean;
  delete: boolean;
}

export function getDetailActions(phase: BookingPhase): DetailActions {
  switch (phase) {
    case 'upcoming':
      return { edit: true, cancel: true, delete: false };
    case 'in-progress':
      return { edit: false, cancel: false, delete: false };
    case 'ended':
    case 'cancelled':
      return { edit: false, cancel: false, delete: true };
  }
}
