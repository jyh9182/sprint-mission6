'use client';

import * as React from 'react';
import { formatGenres, formatInstrument, formatLessonDate, formatLessonTimeRange, formatSpace, instructorDisplayName } from '@/lib/bookings/format';
import { formatImageBytes } from '@/lib/bookings/reference-image';
import type { LessonBooking, ReferenceImage } from '@/lib/bookings/types';

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

/**
 * 참고 이미지 카드(9단계). Figma 20_Booking_Detail_With_Reference_Image(307:3300).
 * 메모 다음·예약 관리 전에 두며 referenceImage가 있을 때만 렌더한다(없으면 빈 자리 없음).
 * 저장된 Data URL은 `<img src>`로만 표시한다. 표시 실패는 빈 이미지로 두지 않고 안내로 바꾸되 저장값은 바꾸지 않는다.
 */
export function BookingReferenceImageCard({ image }: { image: ReferenceImage }) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const failed = failedSrc === image.dataUrl;
  return (
    <section className="lc-detail-card lc-detail-image" aria-labelledby="booking-image-title">
      <h3 id="booking-image-title" className="lc-detail-memo__title">참고 이미지</h3>
      {failed ? (
        <p className="lc-field__error" role="alert">이미지를 표시할 수 없어요. 저장된 예약 정보는 변경하지 않았어요.</p>
      ) : (
        <div className="lc-detail-image__body">
          <img
            className="lc-detail-image__img"
            src={image.dataUrl}
            alt={`예약 참고 이미지: ${image.fileName}`}
            width={image.width}
            height={image.height}
            onError={() => setFailedSrc(image.dataUrl)}
          />
          <div className="lc-detail-image__meta">
            <p className="lc-detail-image__name" title={image.fileName}>{image.fileName}</p>
            <p className="lc-detail-image__size">{`변환 후 ${formatImageBytes(image.sizeBytes)}`}</p>
          </div>
        </div>
      )}
    </section>
  );
}
