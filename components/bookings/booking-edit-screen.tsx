'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookingForm } from '@/components/bookings/booking-form';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { getBookingCatalog } from '@/lib/bookings/catalog';
import { setBookingFlash } from '@/lib/bookings/flash';
import { bookingToFormValues, EDIT_MESSAGES, mapSaveError, type BookingFormSubmitResult } from '@/lib/bookings/form';
import { formatLessonDate, formatLessonTimeRange, formatSpace, instructorDisplayName } from '@/lib/bookings/format';
import { ERROR_MESSAGES } from '@/lib/bookings/messages';
import { getBookingRepository } from '@/lib/bookings/repository';
import { parseListQuery, serializeListQuery, type ListQuery } from '@/lib/bookings/discovery';
import { BOOKING_ID_PARAM, bookingDetailHref, bookingListHref } from '@/lib/bookings/routes';
import { getBookingPhase } from '@/lib/bookings/time';
import type { BookingInput, LessonBooking, StoreError } from '@/lib/bookings/types';
import { loadBookingDetail } from '@/lib/bookings/use-booking-detail';
import { useLeaveGuard } from '@/lib/bookings/use-leave-guard';
import { useNow } from '@/lib/bookings/use-now';

// 6단계 예약 수정. 논리 화면 `/bookings/[id]/edit` → 정적 페이지 `/bookings/edit?id={UUID}`.
// Figma 295:2272(Unchanged) · 295:2355(Changed) · 295:2433(Save Error) · 295:2518(Leave Confirm)
// · 295:2605(Not Found) · 295:2637(Unavailable) · 295:2670(Success Detail).
// 5단계 공통 BookingForm(mode='edit')을 재사용한다. 저장은 이 브라우저의 LocalStorage에만 기록한다.

type EditState =
  | { status: 'initializing' }
  | { status: 'not-found' }
  | { status: 'error'; error: StoreError }
  | { status: 'unavailable' }
  | { status: 'ready'; booking: LessonBooking; revision: number };

const TITLE = '예약 수정';

/** URL 쿼리에서 ID를 읽는다. 정적 export에서는 useSearchParams가 클라이언트에서만 값을 가지므로 Suspense 안에서 쓴다. */
export function BookingEditFromQuery() {
  const params = useSearchParams();
  const id = params.get(BOOKING_ID_PARAM);
  // 상세 → 수정 → 상세를 거쳐도 목록 조건을 유지한다(허용된 q/status/sort/page만).
  const contextKey = serializeListQuery(parseListQuery(params));
  const context = React.useMemo(() => parseListQuery(new URLSearchParams(contextKey)), [contextKey]);
  return <BookingEditScreen key={id ?? ''} id={id} context={context} />;
}

/** 정적 HTML·하이드레이션 전에 보이는 초기화 화면(Suspense fallback). 저장소·URL을 읽지 않는다. */
export function BookingEditLoading() {
  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title={TITLE} backLabel="예약 상세로 돌아가기" />
      </div>
      <EditLoadingBody />
    </div>
  );
}

async function loadEdit(id: string | null): Promise<EditState> {
  const result = await loadBookingDetail(getBookingRepository(), id);
  if (result.status !== 'ready') return result;
  // 시작 전 예정 예약만 수정할 수 있다(직접 URL 진입도 같은 자격 검사).
  if (getBookingPhase(result.booking, new Date()) !== 'upcoming') return { status: 'unavailable' };
  return result;
}

function BookingEditScreen({ id, context }: { id: string | null; context: ListQuery }) {
  const router = useRouter();
  const [state, setState] = React.useState<EditState>({ status: 'initializing' });
  const [retrying, setRetrying] = React.useState(false);

  // 마운트 후 한 번만 읽는다. 편집 중 다른 화면 변경으로 폼 값을 조용히 바꾸지 않는다(CONFLICT 처리에서 확인).
  React.useEffect(() => {
    let active = true;
    void loadEdit(id).then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const retry = React.useCallback(() => {
    setRetrying(true);
    void loadEdit(id).then((next) => {
      setState(next);
      setRetrying(false);
    });
  }, [id]);

  if (state.status === 'ready' && id) {
    return <BookingEditReady id={id} context={context} booking={state.booking} revision={state.revision} onStateChange={setState} />;
  }

  const toDetail = () => router.push(id ? bookingDetailHref(id, context) : bookingListHref(context));
  const toList = () => router.push(bookingListHref(context));

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader
          title={TITLE}
          onBack={state.status === 'not-found' ? toList : toDetail}
          backLabel={state.status === 'not-found' ? '예약 목록으로 돌아가기' : '예약 상세로 돌아가기'}
        />
      </div>
      {state.status === 'initializing' ? (
        <EditLoadingBody />
      ) : (
        <>
          <div className="lc-form-viewport">
            {state.status === 'not-found' ? (
              <EmptyState title="수정할 예약을 찾을 수 없어요" description="삭제되었거나 주소가 잘못됐을 수 있어요." />
            ) : state.status === 'unavailable' ? (
              <EmptyState title="이 예약은 수정할 수 없어요" description="시작 전 예정 예약만 수정할 수 있어요." />
            ) : state.status === 'error' ? (
              <div className="lc-list-state lc-detail-state lc-detail-state--error">
                <InlineAlert tone="error" title="예약 정보를 읽지 못했어요">{ERROR_MESSAGES[state.error.code]}</InlineAlert>
                <h2 className="lc-list-state__title">지금은 예약을 수정할 수 없어요</h2>
                <p className="lc-list-state__description">다시 시도해도 열리지 않으면 브라우저 설정을 확인해주세요.</p>
              </div>
            ) : null}
          </div>
          <footer className="lc-detail-footer">
            {state.status === 'not-found' ? (
              <Button variant="appSecondary" className="lc-detail-wide" onClick={toList}>예약 목록으로</Button>
            ) : state.status === 'unavailable' ? (
              <Button variant="appSecondary" className="lc-detail-wide" onClick={toDetail}>예약 상세로</Button>
            ) : state.status === 'error' ? (
              <Button variant="appPrimary" className="lc-detail-wide" loading={retrying} busyLabel="다시 불러오는 중…" onClick={retry}>다시 시도</Button>
            ) : null}
          </footer>
        </>
      )}
    </div>
  );
}

function EditLoadingBody() {
  return (
    <>
      <div className="lc-form-viewport" aria-busy>
        <div className="lc-list-state lc-detail-state" role="status">
          <img className="lc-spinner lc-list-state__spinner" src="/assets/ui/loading.svg" alt="" width={28} height={28} />
          <p className="lc-list-state__title">예약을 불러오는 중이에요</p>
          <p className="lc-list-state__description">저장된 예약 정보를 확인하고 있어요.</p>
        </div>
      </div>
      <footer className="lc-detail-footer">
        <Button variant="appPrimary" className="lc-detail-wide" disabled>예약 확인 중</Button>
      </footer>
    </>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="lc-list-state lc-detail-state">
      <span className="lc-list-state__icon"><img src="/assets/ui/calendar.svg" alt="" width={20} height={20} /></span>
      <h2 className="lc-list-state__title">{title}</h2>
      <p className="lc-list-state__description">{description}</p>
    </div>
  );
}

/** 다른 화면에서 바뀐 대상 예약. 사용자가 확인하기 전에는 저장을 막는다. */
type Conflict = { booking: LessonBooking; revision: number };

function BookingEditReady({
  id,
  context,
  booking,
  revision,
  onStateChange,
}: {
  id: string;
  context: ListQuery;
  booking: LessonBooking;
  revision: number;
  onStateChange: (state: EditState) => void;
}) {
  const router = useRouter();
  const repository = getBookingRepository();
  const catalog = getBookingCatalog();
  const now = useNow();

  // 의미 있는 변경 비교 기준. 처음 읽은 예약이며, 다른 화면 변경을 사용자가 확인하면 최신 예약으로 바뀐다.
  const [baseline, setBaseline] = React.useState(booking);
  const initialValues = React.useMemo(() => bookingToFormValues(baseline), [baseline]);
  const revisionRef = React.useRef(revision);
  const [conflict, setConflict] = React.useState<Conflict | null>(null);
  const [transitionBlocked, setTransitionBlocked] = React.useState(false);
  const [formState, setFormState] = React.useState({ dirty: false, saving: false });
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  // 화면을 열어 둔 사이 시작 시각이 지나면 저장을 막는다. 최종 판정은 저장소의 INVALID_TRANSITION.
  const expired = getBookingPhase(baseline, now) !== 'upcoming';
  const noLongerEditable = expired || transitionBlocked;

  const openLeaveDialog = React.useCallback(() => setLeaveOpen(true), []);
  const { allowLeave } = useLeaveGuard({ dirty: formState.dirty, onAttemptLeave: openLeaveDialog });
  const detailHref = bookingDetailHref(id, context);

  /** 폼을 숨기는 상태(없는 ID·수정 불가)로 바꾼다. draft는 버리므로 이탈 가드를 끈다. */
  const switchState = React.useCallback(
    (next: EditState) => {
      allowLeave();
      onStateChange(next);
    },
    [allowLeave, onStateChange],
  );

  const leaveToDetail = React.useCallback(() => {
    allowLeave();
    router.push(detailHref);
  }, [allowLeave, router, detailHref]);

  /** Header 뒤로가기·`수정 취소` 공통 규칙: 변경 없음은 바로 상세, 변경 있음은 확인 Dialog. */
  function handleLeave() {
    if (formState.saving) return; // 저장 중에는 화면 안 이동을 막고 결과를 기다린다
    if (formState.dirty) setLeaveOpen(true);
    else router.push(detailHref);
  }

  function acceptLatest() {
    if (!conflict) return;
    // 최신 예약을 비교 기준으로 삼고 편집 draft(폼 값)는 그대로 둔다. 다시 확인 체크 후 저장한다.
    revisionRef.current = conflict.revision;
    setBaseline(conflict.booking);
    setConflict(null);
  }

  const handleSubmit = React.useCallback(
    async (input: BookingInput): Promise<BookingFormSubmitResult> => {
      const result = await repository.updateBooking(id, input, revisionRef.current);
      if (result.ok) {
        // setItem 성공이 반영된 결과에서만 성공 알림을 넘기고 같은 ID 상세로 돌아간다.
        revisionRef.current = result.data.revision;
        setBookingFlash(id, 'update');
        allowLeave();
        router.push(detailHref);
        return { ok: true };
      }
      switch (result.error.code) {
        case 'NOT_FOUND':
          switchState({ status: 'not-found' });
          return { ok: false };
        case 'INVALID_TRANSITION':
          setTransitionBlocked(true); // draft는 유지하고 다시 시도하지 않게 한다
          return { ok: false };
        case 'CONFLICT': {
          // revision만 갱신해 그대로 재시도하지 않는다. 대상 예약 자체를 다시 읽어 판단한다.
          const latest = await repository.getBooking(id);
          if (!latest.ok) {
            if (latest.error.code === 'NOT_FOUND') {
              switchState({ status: 'not-found' });
              return { ok: false };
            }
            return mapSaveError(latest.error, 'edit');
          }
          if (getBookingPhase(latest.data.booking, new Date()) !== 'upcoming') {
            switchState({ status: 'unavailable' });
            return { ok: false };
          }
          if (latest.data.booking.updatedAt !== baseline.updatedAt) {
            setConflict({ booking: latest.data.booking, revision: latest.data.revision });
            return { ok: false };
          }
          // 다른 예약만 바뀌었다. 최신 revision으로 바꾸고 사용자가 다시 누르면(확인) 재시도한다.
          revisionRef.current = latest.data.revision;
          return mapSaveError(result.error, 'edit');
        }
        default:
          return mapSaveError(result.error, 'edit');
      }
    },
    [repository, id, router, detailHref, allowLeave, switchState, baseline.updatedAt],
  );

  const notice = conflict ? (
    <InlineAlert tone="error" title={EDIT_MESSAGES.changedElsewhere}>
      <span className="lc-edit-latest">
        {`저장된 최신 내용: ${formatLessonDate(conflict.booking.date)} ${formatLessonTimeRange(conflict.booking.startTime, conflict.booking.snapshot.durationMinutes)} · ${formatSpace(conflict.booking)}`}
        {conflict.booking.memo ? `\n메모: ${conflict.booking.memo}` : '\n메모 없음'}
        {'\n편집 중인 내용은 유지했어요. 확인한 뒤 다시 저장해주세요.'}
      </span>
      <Button variant="appSecondary" className="lc-edit-latest__action" onClick={acceptLatest}>최신 내용 확인했어요</Button>
    </InlineAlert>
  ) : noLongerEditable ? (
    <InlineAlert tone="error" title={EDIT_MESSAGES.noLongerEditable}>시작 전 예정 예약만 수정할 수 있어요. 편집 중인 내용은 저장되지 않았어요.</InlineAlert>
  ) : null;

  const snapshot = baseline.snapshot;

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title={TITLE} onBack={handleLeave} backLabel="예약 상세로 돌아가기" />
      </div>

      <BookingForm
        mode="edit"
        catalog={catalog}
        initialValues={initialValues}
        title={TITLE}
        description="예약 내용을 확인하고 필요한 내용을 바꿔주세요."
        submitLabel="변경사항 저장"
        onSubmit={handleSubmit}
        onStateChange={setFormState}
        onCancel={handleLeave}
        cancelLabel="수정 취소"
        submitBlocked={Boolean(conflict) || noLongerEditable}
        notice={notice}
        unavailableLabels={{
          offer: `${instructorDisplayName(snapshot.instructorName)} · ${snapshot.instrumentLabel}`,
          space: `${snapshot.studioName} · ${snapshot.roomName}`,
        }}
      />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="수정을 그만둘까요?"
        description="변경한 내용은 저장되지 않아요."
        cancelLabel="계속 작성"
        confirmLabel="나가기"
        errorTitle="이동하지 못했어요"
        onConfirm={async () => ({ ok: true })}
        onSuccess={leaveToDetail}
      />
    </div>
  );
}
