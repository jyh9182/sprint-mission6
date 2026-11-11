import type { StoreErrorCode } from './types';

export const ERROR_MESSAGES: Record<StoreErrorCode, string> = {
  NOT_READY: '예약 정보를 준비하고 있어요.',
  STORAGE_UNAVAILABLE: '이 브라우저에서 예약을 저장하거나 불러올 수 없어요. 브라우저 설정을 확인한 뒤 다시 시도해주세요.',
  CORRUPT_DATA: '저장된 예약 정보를 읽을 수 없어요. 기존 데이터는 변경하지 않았어요.',
  UNSUPPORTED_VERSION: '현재 앱에서 지원하지 않는 예약 데이터예요. 앱 버전을 확인해주세요.',
  QUOTA_EXCEEDED: '저장 공간이 부족해요. 입력 내용은 유지했어요.',
  WRITE_FAILED: '저장하지 못했어요. 입력 내용을 확인하고 다시 시도해주세요.',
  VALIDATION_ERROR: '입력 내용을 확인해주세요.',
  NOT_FOUND: '예약을 찾을 수 없어요.',
  INVALID_TRANSITION: '현재 상태에서는 이 작업을 할 수 없어요. 예약 정보를 다시 확인해주세요.',
  CONFLICT: '다른 화면에서 예약 정보가 변경됐어요. 새 정보를 확인한 뒤 다시 시도해주세요.',
  LOCAL_TIME_CONFLICT: '같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.',
};

export const FIELD_MESSAGES = {
  offerId: '레슨을 선택해주세요.',
  spaceId: '이용할 공간을 선택해주세요.',
  dateTime: '예약 가능한 미래 날짜와 시간을 선택해주세요.',
  memo: '메모는 500자까지 입력할 수 있어요.',
  acknowledged: '예약 내용과 이용 안내를 확인해주세요.',
} as const;

export const SUCCESS_MESSAGES = {
  create: '예약을 저장했어요',
  update: '예약을 수정했어요',
  cancel: '예약을 취소했어요',
  delete: '예약 기록을 삭제했어요',
} as const;
