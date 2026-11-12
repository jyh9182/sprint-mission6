import type { BookingPhase } from './types';

// 예약 상세의 액션 노출 규칙(design/steps/04-booking-detail.md "상태별 액션 조건").
// 저장소의 상태 전이 규칙(repository.ts updateBooking/cancelBooking/deleteBooking)과 같은 조건이다.
//
// 이 규칙은 "이 상태에서 허용되는 액션"만 정한다. 실제 화면 연결은 단계별로 다르다.
// - 수정: 6단계 수정 화면이 생기기 전에는 404로 가는 활성 버튼을 만들지 않는다.
// - 취소·삭제: 7단계 확인 Dialog와 처리 흐름이 생기기 전에는 버튼을 만들지 않는다.
//   확인 없이 cancelBooking/deleteBooking을 실행하지 않는다.

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
