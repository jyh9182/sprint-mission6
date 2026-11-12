'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingInfoCard, BookingMemoCard } from '@/components/bookings/booking-detail-cards';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, type ConfirmResult } from '@/components/ui/confirm-dialog';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDetailActions } from '@/lib/bookings/detail-actions';
import { clearBookingFlash, peekBookingFlash, setListFlash, type BookingFlashKind } from '@/lib/bookings/flash';
import { lessonTitle } from '@/lib/bookings/format';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/bookings/messages';
import { parseListQuery, serializeListQuery, type ListQuery } from '@/lib/bookings/discovery';
import { BOOKING_ID_PARAM, bookingEditHref, bookingListHref } from '@/lib/bookings/routes';
import { getBookingPhase } from '@/lib/bookings/time';
import type { BookingId, BookingPhase, LessonBooking, StoreError, StoreErrorCode } from '@/lib/bookings/types';
import { useBookingDetail, type BookingDetailState } from '@/lib/bookings/use-booking-detail';
import { useNowClock } from '@/lib/bookings/use-now';

// 예약 상세. 논리 화면 `/bookings/[id]` → 정적 페이지 `/bookings/detail?id={UUID}`.
// Figma 286:1807(예정) · 286:1869(메모 없음) · 286:1931(긴 메모) · 286:1993(취소됨) · 286:2055(없는 ID) · 286:2090(초기화) · 286:2123(조회 실패).
//
// 액션 연결 상태(7/10단계):
// - 예약 수정: 시작 전 예정 예약에만 Footer Primary `예약 수정` → bookingEditHref(id) (Figma 295:2670).
// - 예약 취소(시작 전 예정)·예약 기록 삭제(종료·취소됨): `예약 관리`의 Secondary 버튼 → 확인 Dialog.
//   Figma 취소 299:2478/2520/2564 → 완료 상세 299:2748, 삭제 299:2613/2655/2699 → 완료 목록 299:2792.
//   버튼은 Dialog만 연다. 저장 함수는 Dialog의 확인 버튼에서만 한 번 호출하고, 최종 판정은 저장소(실행 시각·revision)가 한다.

const SUBTITLES: Record<BookingPhase, string> = {
  upcoming: '예약 내용을 확인하고 변경할 수 있어요.',
  'in-progress': '지금 진행 중인 레슨이에요.',
  ended: '종료된 레슨이에요.',
  cancelled: '이 예약은 취소되었어요.',
};

/** URL 쿼리에서 ID를 읽는다. 정적 export에서는 useSearchParams가 클라이언트에서만 값을 가지므로 Suspense 안에서 쓴다. */
export function BookingDetailFromQuery() {
  const params = useSearchParams();
  const id = params.get(BOOKING_ID_PARAM);
  // 목록에서 넘어온 조건(q/status/sort/page)만 허용값으로 읽는다. 직접 진입이면 기본 목록 조건이다.
  const contextKey = serializeListQuery(parseListQuery(params));
  const context = React.useMemo(() => parseListQuery(new URLSearchParams(contextKey)), [contextKey]);
  return <BookingDetailScreen key={id ?? ''} id={id} context={context} />;
}

type ManageKind = 'cancel' | 'delete';
/** Dialog를 연 시점의 대상. 확인 시 이 revision으로 실행해 그사이 바뀐 상태를 저장소가 CONFLICT로 거절하게 한다. */
type PendingAction = { kind: ManageKind; id: BookingId; revision: number };
type DetailFlash = BookingFlashKind | 'cancel';
type DetailNotice = { title: string; message: string };

const DIALOG_TEXT: Record<ManageKind, {
  title: string; description: string; confirmLabel: string; busyLabel: string; errorTitle: string; errorMessage: string;
}> = {
  cancel: {
    title: '예약을 취소할까요?',
    description: '취소해도 예약 기록은 남아요.\n다시 예약하려면 새 예약을 만들어주세요.',
    confirmLabel: '예약 취소',
    busyLabel: '취소 중…',
    errorTitle: '취소하지 못했어요',
    errorMessage: '기존 예약은 유지했어요. 다시 시도해주세요.',
  },
  delete: {
    title: '예약 기록을 삭제할까요?',
    description: '삭제한 기록은 복구할 수 없어요.\n이 브라우저의 기록에서 제거돼요.',
    confirmLabel: '삭제하기',
    busyLabel: '삭제 중…',
    errorTitle: '삭제하지 못했어요',
    errorMessage: '기록은 그대로예요. 다시 시도해주세요.',
  },
};

/**
 * Dialog를 닫고 최신 상태를 다시 읽어 보여줄 오류. 오래된 revision으로 자동 재실행하지 않는다.
 * 읽기 문제(CORRUPT_DATA 등)는 상세의 조회 실패 화면과 안전한 읽기 재시도로 넘긴다.
 * 그 외(QUOTA_EXCEEDED·STORAGE_UNAVAILABLE·WRITE_FAILED 등 쓰기 실패)는 Dialog Error 상태로 재시도를 제공한다.
 */
const RELOAD_CODES = new Set<StoreErrorCode>(['NOT_FOUND', 'INVALID_TRANSITION', 'CONFLICT', 'CORRUPT_DATA', 'UNSUPPORTED_VERSION', 'NOT_READY']);

function BookingDetailScreen({ id, context }: { id: string | null; context: ListQuery }) {
  const router = useRouter();
  const { state, retry, retrying, reload, repository } = useBookingDetail(id);
  const [now, refreshNow] = useNowClock();
  /** 저장소를 다시 읽고 화면의 파생 상태(진행 중·종료)도 현재 시각으로 다시 판정한다. */
  const reloadLatest = React.useCallback(async () => {
    const next = await reload();
    refreshNow();
    return next;
  }, [reload, refreshNow]);
  // 생성·수정 화면에서 저장 성공 직후 넘어온 경우에만 한 번 보인다(메모리 전달, URL·저장소에 남기지 않음).
  const [flash, setFlash] = React.useState<DetailFlash | null>(() => peekBookingFlash(id));
  React.useEffect(() => clearBookingFlash(id), [id]);
  const [notice, setNotice] = React.useState<DetailNotice | null>(null);

  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inFlightRef = React.useRef(false);
  const actionButtonRef = React.useRef<HTMLButtonElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  /** Dialog가 닫힌 뒤 포커스: 원래 액션 버튼(남아 있으면) 또는 상세 제목. */
  const focusTitleRef = React.useRef(false);

  const openAction = React.useCallback(
    (kind: ManageKind) => {
      if (state.status !== 'ready' || inFlightRef.current) return;
      focusTitleRef.current = false;
      setPending({ kind, id: state.booking.id, revision: state.revision });
      setDialogOpen(true);
    },
    [state],
  );

  const pendingKind = pending?.kind;
  const resolveReturnFocus = React.useCallback((): HTMLElement | null => {
    const button = actionButtonRef.current;
    // 같은 동작의 버튼이 남아 있을 때만 돌아간다. 상태가 바뀌어 다른 액션으로 대체됐으면 제목으로 옮긴다.
    if (!focusTitleRef.current && button?.isConnected && button.dataset.action === pendingKind) return button;
    const heading = viewportRef.current?.querySelector<HTMLElement>('h2');
    if (!heading) return null;
    if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    return heading;
  }, [pendingKind]);

  /** 최신 상태 재조회가 필요한 실패. Dialog를 닫고 성공 알림 없이 최신 상세·없는 ID·조회 실패를 보여준다. */
  const closeWithLatest = React.useCallback(
    async (error: StoreError): Promise<ConfirmResult> => {
      await reloadLatest();
      setFlash(null);
      setNotice({ title: '예약 정보를 다시 불러왔어요', message: ERROR_MESSAGES[error.code] });
      focusTitleRef.current = false; // 원래 버튼이 남아 있으면 그 버튼, 사라졌으면 제목
      return { ok: false, close: true };
    },
    [reloadLatest],
  );

  const confirmAction = React.useCallback(async (): Promise<ConfirmResult> => {
    if (!pending || inFlightRef.current) return { ok: false };
    inFlightRef.current = true;
    try {
      if (pending.kind === 'cancel') {
        const result = await repository.cancelBooking(pending.id, pending.revision);
        if (!result.ok) return RELOAD_CODES.has(result.error.code) ? await closeWithLatest(result.error) : { ok: false };
        const changed = result.data.revision !== pending.revision;
        await reloadLatest(); // 같은 ID 상세를 재조회해 취소됨·기록 유지를 보여준다
        if (!changed) {
          // 이미 취소된 레코드의 무변경 성공: 새 성공 메시지를 띄우지 않는다.
          setFlash(null);
          setNotice({ title: '이미 취소된 예약이에요.', message: '예약 기록은 이 브라우저에 남아 있어요.' });
          return { ok: false, close: true };
        }
        setNotice(null);
        setFlash('cancel');
        focusTitleRef.current = true; // 원래 `예약 취소`는 사라진다. 제목에서 Badge·성공 Alert를 이어 읽는다
        return { ok: true };
      }

      const result = await repository.deleteBooking(pending.id, pending.revision);
      if (!result.ok) return RELOAD_CODES.has(result.error.code) ? await closeWithLatest(result.error) : { ok: false };
      if (result.data.deletedId !== pending.id) {
        await reloadLatest();
        return { ok: false, close: true };
      }
      // setItem 성공과 deletedId 일치를 확인한 뒤에만 목록 성공 알림을 넘기고 이동한다.
      // 원래 목록 조건으로 돌아간다. 비거나 사라진 페이지는 목록이 결과 없음·마지막 유효 페이지로 보정한다.
      setListFlash('delete');
      router.push(bookingListHref(context));
      return { ok: true };
    } finally {
      inFlightRef.current = false;
    }
  }, [pending, repository, reloadLatest, closeWithLatest, router, context]);

  const text = DIALOG_TEXT[pending?.kind ?? 'cancel'];

  return (
    <>
      <BookingDetailView
        state={state}
        now={now}
        onRetry={retry}
        retrying={retrying}
        flash={flash}
        notice={notice}
        onAction={openAction}
        actionButtonRef={actionButtonRef}
        viewportRef={viewportRef}
        context={context}
      />
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={text.title}
        description={text.description}
        confirmLabel={text.confirmLabel}
        busyLabel={text.busyLabel}
        cancelLabel="유지하기"
        errorTitle={text.errorTitle}
        errorMessage={text.errorMessage}
        onConfirm={confirmAction}
        resolveReturnFocus={resolveReturnFocus}
      />
    </>
  );
}

/** 정적 HTML·하이드레이션 전에 보이는 초기화 화면(Suspense fallback). 저장소·URL을 읽지 않는다. */
export function BookingDetailLoading() {
  return <BookingDetailView state={{ status: 'initializing' }} />;
}

const FLASH_MESSAGES: Record<DetailFlash, string> = {
  create: '이 브라우저에 예약 내용이 저장됐어요.\n실제 강사·공간 예약은 확정되지 않아요.',
  update: '이 브라우저에 변경 내용이 저장됐어요.\n실제 강사·공간 예약은 확정되지 않아요.',
  cancel: '예약 기록은 이 브라우저에 남아 있어요.\n다시 예약하려면 새 예약을 만들어주세요.',
};

function BookingDetailView({
  state, now, onRetry, retrying = false, flash = null, notice = null, onAction, actionButtonRef, viewportRef, context,
}: {
  state: BookingDetailState;
  now?: Date;
  onRetry?: () => void;
  retrying?: boolean;
  flash?: DetailFlash | null;
  notice?: DetailNotice | null;
  onAction?: (kind: ManageKind) => void;
  actionButtonRef?: React.Ref<HTMLButtonElement>;
  viewportRef?: React.Ref<HTMLDivElement>;
  /** 목록 조건. 직접 URL로 들어왔으면 기본 조건이라 `/bookings`로 간다. */
  context?: ListQuery;
}) {
  const router = useRouter();
  const listHref = bookingListHref(context);
  // 방문 기록에 의존하지 않고 상세 URL에 보존된 목록 조건(없으면 기본 목록)으로 간다.
  const goToList = React.useCallback(() => router.push(listHref), [router, listHref]);
  const phase = state.status === 'ready' && now ? getBookingPhase(state.booking, now) : null;

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title="예약 상세" onBack={goToList} backLabel="예약 목록으로 돌아가기" />
      </div>

      <div ref={viewportRef} className="lc-detail-viewport" aria-busy={state.status === 'initializing' || undefined}>
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
            ) : notice ? (
              <InlineAlert tone="info" title={notice.title} className="lc-detail-flash">{notice.message}</InlineAlert>
            ) : null}
            <BookingDetailContent booking={state.booking} phase={phase} onAction={onAction} actionButtonRef={actionButtonRef} />
          </>
        ) : null}
      </div>

      <footer className="lc-detail-footer">
        {state.status === 'initializing' ? (
          <Button variant="appPrimary" className="lc-detail-wide" disabled>예약 확인 중</Button>
        ) : state.status === 'ready' && phase && getDetailActions(phase).edit ? (
          // 시작 전 예정 예약만 수정 화면으로 간다. 수정 화면도 같은 자격을 다시 검사한다.
          <Button asChild variant="appPrimary" className="lc-detail-wide">
            <Link href={bookingEditHref(state.booking.id, context)}>예약 수정</Link>
          </Button>
        ) : (
          <Button asChild variant="appSecondary" className="lc-detail-wide">
            <Link href={listHref}>예약 목록으로</Link>
          </Button>
        )}
      </footer>
    </div>
  );
}

function BookingDetailContent({ booking, phase, onAction, actionButtonRef }: {
  booking: LessonBooking;
  phase: BookingPhase;
  onAction?: (kind: ManageKind) => void;
  actionButtonRef?: React.Ref<HTMLButtonElement>;
}) {
  const actions = getDetailActions(phase);
  return (
    <article className="lc-detail-content" aria-labelledby="booking-detail-title">
      <div className="lc-detail-heading">
        <StatusBadge phase={phase} className="lc-detail-heading__badge" />
        <h2 id="booking-detail-title" tabIndex={-1} className="lc-detail-heading__title">{lessonTitle(booking.snapshot.instructorName)}</h2>
        <p className="lc-detail-heading__description">{SUBTITLES[phase]}</p>
      </div>
      <BookingInfoCard booking={booking} />
      <BookingMemoCard memo={booking.memo} />
      {/* 허용되지 않은 액션은 비활성으로 남기지 않고 영역에서 제거한다. 진행 중에는 영역 자체가 없다. */}
      {onAction && (actions.cancel || actions.delete) ? (
        <section className="lc-detail-manage" aria-labelledby="booking-manage-title">
          <h3 id="booking-manage-title" className="lc-detail-manage__title">예약 관리</h3>
          {actions.cancel ? (
            <>
              <Button ref={actionButtonRef} data-action="cancel" type="button" variant="appSecondary" className="lc-detail-wide" aria-describedby="booking-manage-hint" onClick={() => onAction('cancel')}>예약 취소</Button>
              <p id="booking-manage-hint" className="lc-detail-manage__hint">레슨 시작 전까지 취소할 수 있어요.</p>
            </>
          ) : (
            <>
              <Button ref={actionButtonRef} data-action="delete" type="button" variant="appSecondary" className="lc-detail-wide" aria-describedby="booking-manage-hint" onClick={() => onAction('delete')}>예약 기록 삭제</Button>
              <p id="booking-manage-hint" className="lc-detail-manage__hint lc-detail-manage__hint--danger">삭제한 기록은 복구할 수 없어요.</p>
            </>
          )}
        </section>
      ) : null}
    </article>
  );
}
