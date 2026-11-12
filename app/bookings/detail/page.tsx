import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingDetailFromQuery, BookingDetailLoading } from '@/components/bookings/booking-detail-screen';

export const metadata: Metadata = { title: '예약 상세 | 레슨커넥트AI' };

// 정적 export라 예약 ID는 빌드 시 알 수 없다. `/bookings/detail?id={UUID}` 한 페이지가 클라이언트에서 ID를 읽는다.
// 정적 HTML에는 Suspense fallback(초기화 중 화면)만 들어가고, 쿼리·LocalStorage는 브라우저에서만 읽는다.
export default function BookingDetailPage() {
  return (
    <Suspense fallback={<BookingDetailLoading />}>
      <BookingDetailFromQuery />
    </Suspense>
  );
}
