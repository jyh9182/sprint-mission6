import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingCreateFromQuery, BookingCreateLoading } from '@/components/bookings/booking-create-screen';

export const metadata: Metadata = { title: '새 레슨 예약 | 레슨커넥트AI' };

// 정적 페이지. 진입 쿼리(offerId·from)·저장소 초기화·입력·저장은 브라우저에서만 일어난다.
export default function NewBookingPage() {
  return (
    <Suspense fallback={<BookingCreateLoading />}>
      <BookingCreateFromQuery />
    </Suspense>
  );
}
