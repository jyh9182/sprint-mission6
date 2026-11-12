import type { Metadata } from 'next';
import { BookingListScreen } from '@/components/bookings/booking-list-screen';

export const metadata: Metadata = { title: '예약 내역 | 레슨커넥트AI' };

export default function BookingsPage() {
  return <BookingListScreen />;
}
