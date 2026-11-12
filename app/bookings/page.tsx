import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingListFromQuery, BookingListLoading } from '@/components/bookings/booking-list-screen';

export const metadata: Metadata = { title: '예약 내역 | 레슨커넥트AI' };

// 정적 export라 목록 조건(q/status/sort/page)은 빌드 시 알 수 없다. 클라이언트에서 URL 쿼리를 읽는다.
// 정적 HTML에는 Suspense fallback(초기화 중 화면)만 들어가고, 쿼리·LocalStorage는 브라우저에서만 읽는다.
export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingListLoading />}>
      <BookingListFromQuery />
    </Suspense>
  );
}
