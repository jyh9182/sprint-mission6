'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/app/bottom-nav';
import { Button, useClientReady } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { getBookingCatalog } from '@/lib/bookings/catalog';
import { findSelectableOffer, selectableSpaces } from '@/lib/bookings/form';
import { formatGenres, formatInstrument, formatLessonDate, formatLessonTimeRange, formatSpace, instructorDisplayName } from '@/lib/bookings/format';
import { countUpcomingBookings, selectUpcomingBooking } from '@/lib/bookings/home';
import { ERROR_MESSAGES } from '@/lib/bookings/messages';
import { BOOKINGS_HREF, newBookingHref } from '@/lib/bookings/routes';
import { useBookings, type BookingsState } from '@/lib/bookings/use-bookings';
import { useNow } from '@/lib/bookings/use-now';
import type { BookingCatalog } from '@/lib/bookings/types';

// 10단계 앱 홈 `/home`. Figma 01_Home_Reference(23:67)의 `다가오는 레슨`·추천 강사 영역을 실제 데이터 범위로 줄여 구현한다.
// - 다가오는 레슨: useBookings()의 검증된 v2 데이터에서 서울 시각 기준 다음 예정 1건만 계산한다(Figma 고정 날짜 사용 안 함).
// - 강사: 현재 예약 가능한 카탈로그 상품(김민준 기타 60분)만 예시로 보이고 `/bookings/new?offerId=`로 사전 선택 진입한다.
//   Figma의 AI 매칭률·별점·후기 수·검증 배지·이지은/박도현 카드는 실제 근거가 없어 옮기지 않는다(CLAUDE.md 허위 후기·실적 금지).
// 홈에서는 예약 데이터를 만들거나 고치지 않는다.

const FEATURED_OFFER_ID = 'offer-kim-guitar-60';

export function AppHomeScreen() {
  const { state, retry, retrying } = useBookings();
  const catalog = getBookingCatalog();
  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <header className="lc-home-header">
          <h1 className="lc-home-header__title">레슨커넥트AI</h1>
          <p className="lc-home-header__tagline">음악이 더 가까워지는 순간</p>
        </header>
      </div>
      <div className="lc-list-viewport lc-home" aria-busy={state.status === 'initializing' || undefined}>
        <section className="lc-home-section" aria-labelledby="home-upcoming-title">
          <div className="lc-home-section__head">
            <h2 id="home-upcoming-title" className="lc-home-section__title">다가오는 레슨</h2>
            <Link href={BOOKINGS_HREF} className="lc-home-section__more lc-focus-ring">예약 전체보기 ›</Link>
          </div>
          <UpcomingLesson state={state} retrying={retrying} onRetry={retry} />
        </section>

        <section className="lc-home-section" aria-labelledby="home-instructor-title">
          <div className="lc-home-section__head">
            <h2 id="home-instructor-title" className="lc-home-section__title">강사 예시</h2>
          </div>
          <FeaturedInstructor catalog={catalog} />
        </section>

        <p className="lc-list-footnote">
          예약은 이 브라우저에만 저장되는 데모예요. 실제 AI 추천·결제·강사 일정 확정은 진행되지 않아요.{' '}
          <Link href="/" className="lc-home-link lc-focus-ring">서비스 소개 보기</Link>
        </p>
      </div>
      <BottomNav current="home" />
    </div>
  );
}

function UpcomingLesson({ state, retrying, onRetry }: { state: BookingsState; retrying: boolean; onRetry: () => void }) {
  const now = useNow();
  if (state.status === 'initializing') {
    return (
      <div className="lc-home-card lc-home-card--state" role="status">
        <img className="lc-spinner" src="/assets/ui/loading.svg" alt="" width={20} height={20} />
        <p className="lc-home-card__meta">예약 현황을 불러오는 중이에요</p>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="lc-home-card lc-home-card--state lc-home-card--error">
        <InlineAlert tone="error" title="예약 현황을 불러오지 못했어요">{ERROR_MESSAGES[state.error.code]}</InlineAlert>
        <Button variant="appSecondary" className="lc-button--outline lc-home-card__action" loading={retrying} busyLabel="다시 불러오는 중…" onClick={onRetry}>다시 시도</Button>
      </div>
    );
  }

  const next = selectUpcomingBooking(state.bookings, now);
  if (!next) {
    return (
      <div className="lc-home-card lc-home-card--state">
        <p className="lc-home-card__title">예정된 레슨이 없어요</p>
        <p className="lc-home-card__meta">지난 기록과 새 예약은 예약 목록에서 확인할 수 있어요.</p>
        <Button asChild variant="appSecondary" className="lc-button--outline lc-home-card__action">
          <Link href={BOOKINGS_HREF}>예약 목록 보기</Link>
        </Button>
      </div>
    );
  }

  const instructor = instructorDisplayName(next.snapshot.instructorName);
  const date = formatLessonDate(next.date);
  const time = formatLessonTimeRange(next.startTime, next.snapshot.durationMinutes);
  const instrument = formatInstrument(next);
  const space = formatSpace(next);
  const others = countUpcomingBookings(state.bookings, now) - 1;
  return (
    <Link
      href={BOOKINGS_HREF}
      className="lc-home-card lc-home-card--upcoming lc-focus-ring"
      aria-label={`다가오는 레슨: ${instructor}, ${date} ${time}, ${instrument}, ${space}${others > 0 ? `, 예정 레슨 ${others}건 더 있음` : ''}, 예약 목록 보기`}
    >
      <span className="lc-home-card__row">
        <img src="/assets/ui/calendar.svg" alt="" width={20} height={20} />
        <span className="lc-home-card__title"><span className="lc-nowrap">{date}</span> <span className="lc-nowrap">{time}</span></span>
      </span>
      <span className="lc-home-card__meta lc-clamp-2">{instructor} · {instrument}</span>
      <span className="lc-home-card__meta lc-clamp-2">{space}</span>
      <span className="lc-home-card__foot" aria-hidden="true">
        <span>{others > 0 ? `예정 레슨 ${others}건 더` : ''}</span>
        <span>예약 목록 보기 ›</span>
      </span>
    </Link>
  );
}

function FeaturedInstructor({ catalog }: { catalog: BookingCatalog }) {
  const ready = useClientReady();
  const selectable = findSelectableOffer(catalog, FEATURED_OFFER_ID);
  return (
    <article className="lc-home-card lc-home-instructor" aria-labelledby="home-instructor-name">
      <div className="lc-home-instructor__body">
        <img className="lc-home-instructor__photo" src="/assets/teacher.png" alt="기타를 든 김민준 선생님의 예시 프로필" width={96} height={112} />
        <div className="lc-home-instructor__info">
          <span className="lc-home-badge">예시 강사</span>
          <h3 id="home-instructor-name" className="lc-home-card__title">{instructorDisplayName(selectable?.instructorName ?? '김민준')}</h3>
          {selectable ? (
            <>
              <p className="lc-home-card__meta">{selectable.offer.instrumentLabel} · {formatGenres(selectable.offer.genres)}</p>
              <p className="lc-home-card__meta">{[`${selectable.offer.durationMinutes}분 레슨`, ...new Set(selectableSpaces(catalog, selectable.offer.id).map((s) => s.studioName))].join(' · ')}</p>
            </>
          ) : (
            <p className="lc-home-card__meta">현재 예약할 수 있는 레슨이 없어요.</p>
          )}
        </div>
      </div>
      <p className="lc-home-card__note">예시 강사 정보예요. AI 매칭 결과·후기·검증 내역이 아니에요.</p>
      {selectable && ready ? (
        <Button asChild variant="appPrimary" className="lc-home-card__action">
          <Link href={newBookingHref({ offerId: selectable.offer.id, from: 'home' })}>이 강사와 레슨하기</Link>
        </Button>
      ) : (
        <Button variant="appPrimary" className="lc-home-card__action" disabled>{selectable ? '이 강사와 레슨하기' : '준비 중'}</Button>
      )}
    </article>
  );
}
