import type { BookingCatalog, GenreId } from './types';

// 읽기 전용 데모 카탈로그. 강사·가격·공간은 화면 예시이며 실제 확보 정보가 아니다.
// ID는 data-contract.md §4의 v1 fixture를 그대로 사용한다 (기존 앱에 카탈로그 없음).
const CATALOG_V1: BookingCatalog = deepFreeze({
  version: '1',
  instructors: [{ id: 'instructor-kim-minjun', name: '김민준', active: true }],
  offers: [
    {
      id: 'offer-kim-guitar-60',
      instructorId: 'instructor-kim-minjun',
      instrumentId: 'guitar',
      instrumentLabel: '기타',
      genres: ['rock', 'blues'],
      durationMinutes: 60,
      examplePriceKRW: 50000,
      allowedSpaceIds: ['space-dongtan-a', 'space-dongtan-b', 'space-dongtan-c'],
      active: true,
    },
  ],
  spaces: [
    { id: 'space-dongtan-a', studioName: '동탄 스튜디오', roomName: 'A 레슨실', equipmentLabels: ['기타', '앰프'], active: true },
    { id: 'space-dongtan-b', studioName: '동탄 스튜디오', roomName: 'B 레슨실', equipmentLabels: ['기타', '앰프'], active: true },
    { id: 'space-dongtan-c', studioName: '동탄 스튜디오', roomName: 'C 레슨실', equipmentLabels: ['기타'], active: true },
  ],
  demoStartTimes: ['18:00', '19:00', '20:00', '21:00'],
});

/** 장르 표시 레이블. 예약 snapshot의 장르 ID를 화면에 보여줄 때만 쓴다. */
export const GENRE_LABELS: Readonly<Record<GenreId, string>> = Object.freeze({
  rock: 'Rock',
  pop: 'Pop',
  jazz: 'Jazz',
  blues: 'Blues',
  rnb: 'R&B',
  'k-pop': 'K-Pop',
  funk: 'Funk',
  ballad: 'Ballad',
  indie: 'Indie',
  metal: 'Metal',
  classical: 'Classical',
  'new-age': 'New Age',
  edm: 'EDM',
});

export const SEED_OFFER_ID = 'offer-kim-guitar-60';
export const SEED_SPACE_ID = 'space-dongtan-a';
export const SEED_START_TIME = '19:00';
export const SEED_DAYS_AHEAD = 7;

export function getBookingCatalog(): BookingCatalog {
  return CATALOG_V1;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
