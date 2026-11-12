'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingInfoCard, BookingMemoCard } from '@/components/bookings/booking-detail-cards';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDetailActions } from '@/lib/bookings/detail-actions';
import { clearBookingFlash, peekBookingFlash, type BookingFlashKind } from '@/lib/bookings/flash';
import { lessonTitle } from '@/lib/bookings/format';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/bookings/messages';
import { BOOKING_ID_PARAM, bookingEditHref, BOOKINGS_HREF } from '@/lib/bookings/routes';
import { getBookingPhase } from '@/lib/bookings/time';
import type { BookingPhase, LessonBooking } from '@/lib/bookings/types';
import { useBookingDetail, type BookingDetailState } from '@/lib/bookings/use-booking-detail';
import { useNow } from '@/lib/bookings/use-now';

// 예약 상세. 논리 화면 `/bookings/[id]` → 정적 페이지 `/bookings/detail?id={UUID}`.
// Figma 286:1807(예정) · 286:1869(메모 없음) · 286:1931(긴 메모) · 286:1993(취소됨) · 286:2055(없는 ID) · 286:2090(초기화) · 286:2123(조회 실패).
//
// 현재 단계(6/10)의 액션 연결 상태:
// - 예약 수정: 시작 전 예정 예약에만 Footer Primary `예약 수정` → bookingEditHref(id) (Figma 295:2670).
// - 예약 취소/기록 삭제(7단계)는 확인 흐름이 없어 버튼을 만들지 않는다. "준비 중" 안내만 표시하고 쓰기 함수는 호출하지 않는다.

const SUBTITLES: Record<BookingPhase, string> = {
  upcoming: '예약 내용을 확인하고 변경할 수 있어요.',
  'in-progress': '지금 진행 중인 레슨이에요.',
  ended: '종료된 레슨이에요.',
  cancelled: '이 예약은 취소되었어요.',
};

/** URL 쿼리에서 ID를 읽는다. 정적 export에서는 useSearchParams가 클라이언트에서만 값을 가지므로 Suspense 안에서 쓴다. */
export function BookingDetailFromQuery() {
  const id = useSearchParams().get(BOOKING_ID_PARAM);
  return <BookingDetailScreen key={id ?? ''} id={id} />;
}

function BookingDetailScreen({ id }: { id: string | null }) {
  const { state, retry, retrying } = useBookingDetail(id);
  const now = useNow();
  // 생성·수정 화면에서 저장 성공 직후 넘어온 경우에만 한 번 보인다(메모리 전달, URL·저장소에 남기지 않음).
  const [flash] = React.useState(() => peekBookingFlash(id));
  React.useEffect(() => clearBookingFlash(id), [id]);
  return <BookingDetailView state={state} now={now} onRetry={retry} retrying={retrying} flash={flash} />;
}

/** 정적 HTML·하이드레이션 전에 보이는 초기화 화면(Suspense fallback). 저장소·URL을 읽지 않는다. */
export function BookingDetailLoading() {
  return <BookingDetailView state={{ status: 'initializing' }} />;
}

const FLASH_MESSAGES: Record<BookingFlashKind, string> = {
  create: '이 브라우저에 예약 내용이 저장됐어요.\n실제 강사·공간 예약은 확정되지 않아요.',
  update: '이 브라우저에 변경 내용이 저장됐어요.\n실제 강사·공간 예약은 확정되지 않아요.',
};

function BookingDetailView({ state, now, onRetry, retrying = false, flash = null }: {
  state: BookingDetailState;
  now?: Date;
  onRetry?: () => void;
  retrying?: boolean;
  flash?: BookingFlashKind | null;
}) {
  const router = useRouter();
  // 직접 링크로 들어와도 방문 기록에 의존하지 않고 항상 목록으로 간다.
  const goToList = React.useCallback(() => router.push(BOOKINGS_HREF), [router]);
  const phase = state.status === 'ready' && now ? getBookingPhase(state.booking, now) : null;

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title="예약 상세" onBack={goToList} backLabel="예약 목록으로 돌아가기" />
      </div>

      <div className="lc-detail-viewport" aria-busy={state.status === 'initializing' || undefined}>
        {state.status === 'initializing' ? (
          <div className="lc-list-state lc-detail-state" role="status">
            <img className="lc-spinner lc-list-state__spinner" src="/assets/ui/loading.svg" alt="" width={28} height={28} />
            <p className="lc-list-state__title">예약을 불러오는 중이에요</p>
            <p className="lc-list-state__description">저장된 예약 정보를 확인하고 있어요.</p>
          </div>
        ) : state.status === 'not-found' ? (
          <div className="lc-list-state lc-detail-state">
            <span className="lc-list-state__icon"><img src="/assets/ui/calendar.svg" alt="" width={20} height={20} /></span>
            <h2 className="lc-list-state__title">예약을 찾을 수 없어요</h2>
            <p className="lc-list-state__description">삭제되었거나 주소가 잘못됐을 수 있어요.</p>
          </div>
        ) : state.status === 'error' ? (
          <div className="lc-list-state lc-detail-state lc-detail-state--error">
            <InlineAlert tone="error" title="예약 정보를 읽지 못했어요">{ERROR_MESSAGES[state.error.code]}</InlineAlert>
            <h2 className="lc-list-state__title">예약 상세를 표시할 수 없어요</h2>
            <p className="lc-list-state__description">다시 시도해도 열리지 않으면 브라우저 설정을 확인해주세요.</p>
            <Button variant="appPrimary" className="lc-detail-wide" loading={retrying} busyLabel="다시 불러오는 중…" onClick={onRetry}>다시 시도</Button>
          </div>
        ) : phase ? (
          <>
            {flash ? (
              <InlineAlert tone="success" title={SUCCESS_MESSAGES[flash]} className="lc-detail-flash">{FLASH_MESSAGES[flash]}</InlineAlert>
            ) : null}
            <BookingDetailContent booking={state.booking} phase={phase} />
          </>
        ) : null}
      </div>

      <footer className="lc-detail-footer">
        {state.status === 'initializing' ? (
          <Button variant="appPrimary" className="lc-detail-wide" disabled>예약 확인 중</Button>
        ) : state.status === 'ready' && phase && getDetailActions(phase).edit ? (
          // 시작 전 예정 예약만 수정 화면으로 간다. 수정 화면도 같은 자격을 다시 검사한다.
          <Button asChild variant="appPrimary" className="lc-detail-wide">
            <Link href={bookingEditHref(state.booking.id)}>예약 수정</Link>
          </Button>
        ) : (
          <Button asChild variant="appSecondary" className="lc-detail-wide">
            <Link href={BOOKINGS_HREF}>예약 목록으로</Link>
          </Button>
        )}
      </footer>
    </div>
  );
}

function BookingDetailContent({ booking, phase }: { booking: LessonBooking; phase: BookingPhase }) {
  const actions = getDetailActions(phase);
  return (
    <article className="lc-detail-content" aria-labelledby="booking-detail-title">
      <div className="lc-detail-heading">
        <StatusBadge phase={phase} className="lc-detail-heading__badge" />
        <h2 id="booking-detail-title" className="lc-detail-heading__title">{lessonTitle(booking.snapshot.instructorName)}</h2>
        <p className="lc-detail-heading__description">{SUBTITLES[phase]}</p>
      </div>
      <BookingInfoCard booking={booking} />
      <BookingMemoCard memo={booking.memo} />
      {actions.edit || actions.cancel || actions.delete ? (
        <section className="lc-detail-manage" aria-labelledby="booking-manage-title">
          <h3 id="booking-manage-title" className="lc-detail-manage__title">예약 관리</h3>
          {actions.cancel ? (
            <InlineAlert tone="info" title="예약 취소는 준비 중이에요">
              {'레슨 시작 전까지 아래 예약 수정 버튼으로 내용을 바꿀 수 있어요.\n취소 기능은 아직 연결되지 않았어요.'}
            </InlineAlert>
          ) : (
            <InlineAlert tone="info" title="예약 기록 삭제는 준비 중이에요">
              {'삭제 기능은 아직 연결되지 않았어요.\n기능이 연결된 뒤 삭제한 기록은 복구할 수 없어요.'}
            </InlineAlert>
          )}
        </section>
      ) : null}
    </article>
  );
}
