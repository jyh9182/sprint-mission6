import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingEditFromQuery, BookingEditLoading } from '@/components/bookings/booking-edit-screen';

export const metadata: Metadata = { title: '예약 수정 | 레슨커넥트AI' };

// 정적 export라 예약 ID는 빌드 시 알 수 없다. `/bookings/edit?id={UUID}` 한 페이지가 클라이언트에서 ID를 읽는다.
// 정적 HTML에는 Suspense fallback(불러오는 중 화면)만 들어가고, 쿼리·LocalStorage는 브라우저에서만 읽는다.
export default function BookingEditPage() {
  return (
    <Suspense fallback={<BookingEditLoading />}>
      <BookingEditFromQuery />
    </Suspense>
  );
}
