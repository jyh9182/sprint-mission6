'use client';

import * as React from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/app/bottom-nav';
import { BookingCard } from '@/components/bookings/booking-card';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { ERROR_MESSAGES } from '@/lib/bookings/messages';
import { NEW_BOOKING_HREF } from '@/lib/bookings/routes';
import { getBookingPhase } from '@/lib/bookings/time';
import { useBookings } from '@/lib/bookings/use-bookings';
import { useNow } from '@/lib/bookings/use-now';

// 예약 목록 `/bookings`. Figma 283:1588(기본) · 283:1659(0건) · 283:1716(초기화) · 283:1771(읽기 실패) · 283:1833(긴 목록).
// 데이터는 LocalStorage 저장소(useBookings)에서만 읽는다. 서버 렌더링·첫 하이드레이션은 항상 초기화 중 상태다.

const SCROLL_KEY = 'lessonconnect:bookings:list-scroll';

function readSavedScroll(): number {
  try {
    return Number(window.sessionStorage.getItem(SCROLL_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveScroll(top: number) {
  try {
    window.sessionStorage.setItem(SCROLL_KEY, String(Math.round(top)));
  } catch {
    // 저장할 수 없으면 복원만 생략한다
  }
}

export function BookingListScreen() {
  const { state, retry, retrying } = useBookings();
  const now = useNow();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const restoredRef = React.useRef(false);
  const ready = state.status === 'ready';
  const count = ready ? state.bookings.length : 0;

  // 같은 탭 세션에서 목록 → 상세 → 뒤로 왔을 때 목록 스크롤 위치 복원(조회 성공 후 1회)
  React.useLayoutEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    const el = viewportRef.current;
    if (el) el.scrollTop = readSavedScroll();
  }, [ready]);

  const countLabel = state.status === 'ready' ? `예약 ${count}건` : state.status === 'error' ? '예약을 불러올 수 없어요' : '예약 확인 중';

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title="예약 내역" />
        <div className="lc-list-intro">
          <h2 className="lc-list-intro__title">내 레슨</h2>
          <p className="lc-list-intro__description">예약한 레슨과 지난 기록을 확인하세요.</p>
        </div>
        {ready ? (
          <Button asChild variant="appPrimary" className="lc-list-cta">
            <Link href={NEW_BOOKING_HREF}>새 레슨 예약</Link>
          </Button>
        ) : (
          <Button variant="appPrimary" className="lc-list-cta" disabled>새 레슨 예약</Button>
        )}
        <p className="lc-list-count" aria-live="polite">{countLabel}</p>
      </div>

      <div
        ref={viewportRef}
        className="lc-list-viewport"
        aria-busy={state.status === 'initializing' || undefined}
        onScroll={(e) => saveScroll(e.currentTarget.scrollTop)}
      >
        {state.status === 'initializing' ? (
          <div className="lc-list-state" role="status">
            <img className="lc-spinner lc-list-state__spinner" src="/assets/ui/loading.svg" alt="" width={28} height={28} />
            <p className="lc-list-state__title">예약을 불러오는 중이에요</p>
            <p className="lc-list-state__description">저장된 예약을 확인하고 있어요.</p>
          </div>
        ) : state.status === 'error' ? (
          <div className="lc-list-state lc-list-state--error">
            <InlineAlert tone="error" title="예약을 불러오지 못했어요">{ERROR_MESSAGES[state.error.code]}</InlineAlert>
            <p className="lc-list-state__title">예약 내역을 표시할 수 없어요</p>
            <p className="lc-list-state__description">다시 시도해도 열리지 않으면 브라우저 설정을 확인해주세요.</p>
            <Button variant="appPrimary" className="lc-list-cta" loading={retrying} busyLabel="다시 불러오는 중…" onClick={retry}>다시 시도</Button>
          </div>
        ) : count === 0 ? (
          <div className="lc-list-state">
            <span className="lc-list-state__icon"><img src="/assets/ui/calendar.svg" alt="" width={20} height={20} /></span>
            <p className="lc-list-state__title">아직 예약한 레슨이 없어요</p>
            <p className="lc-list-state__description">마음에 드는 강사와 첫 레슨을 시작해보세요.</p>
          </div>
        ) : (
          <>
            <ul className="lc-booking-list" aria-label={`예약 ${count}건`}>
              {state.bookings.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} phase={getBookingPhase(booking, now)} onNavigate={() => saveScroll(viewportRef.current?.scrollTop ?? 0)} />
                </li>
              ))}
            </ul>
            <p className="lc-list-footnote">예약은 이 브라우저에만 저장돼요.</p>
          </>
        )}
      </div>

      <BottomNav current="bookings" />
    </div>
  );
}
