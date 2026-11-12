'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BookingForm } from '@/components/bookings/booking-form';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { getBookingCatalog } from '@/lib/bookings/catalog';
import { setBookingFlash } from '@/lib/bookings/flash';
import { EMPTY_BOOKING_FORM, mapSaveError, type BookingFormSubmitResult } from '@/lib/bookings/form';
import { ERROR_MESSAGES } from '@/lib/bookings/messages';
import { getBookingRepository } from '@/lib/bookings/repository';
import { bookingDetailHref, BOOKINGS_HREF } from '@/lib/bookings/routes';
import type { BookingInput, StoreError } from '@/lib/bookings/types';
import { useLeaveGuard } from '@/lib/bookings/use-leave-guard';

// 5단계 예약 생성 `/bookings/new`. Figma 291:1950(Initial) · 291:2020/2114(Ready) · 291:2208(Errors)
// · 291:2303(Saving) · 291:2399(Save Error) · 291:2500(Leave Confirm) · 291:2647(Success Detail).
// 저장은 이 브라우저의 LocalStorage에만 기록한다. 실제 강사·공간 예약 서버와 연결하지 않는다.

type InitState = { status: 'preparing' } | { status: 'ready' } | { status: 'error'; error: StoreError };

export function BookingCreateScreen() {
  const router = useRouter();
  const repository = getBookingRepository();
  const catalog = getBookingCatalog();
  const [init, setInit] = React.useState<InitState>({ status: 'preparing' });
  const [retrying, setRetrying] = React.useState(false);
  const revisionRef = React.useRef<number | null>(null);
  const [formState, setFormState] = React.useState({ dirty: false, saving: false });
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  // 마운트 후에만 저장소를 읽어 최신 revision을 받는다(SSR·import 중에는 LocalStorage를 읽지 않는다).
  // 초기화 실패는 빈 폼으로 성공한 것처럼 전환하지 않고 재시도 화면을 보인다.
  const applyInit = React.useCallback((result: Awaited<ReturnType<typeof repository.initialize>>) => {
    if (result.ok) {
      revisionRef.current = result.data.revision;
      setInit({ status: 'ready' });
    } else if (result.error.code !== 'NOT_READY') {
      setInit({ status: 'error', error: result.error });
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void repository.initialize().then((result) => {
      if (active) applyInit(result);
    });
    return () => {
      active = false;
    };
  }, [repository, applyInit]);

  const retry = React.useCallback(() => {
    setRetrying(true);
    void repository.initialize().then((result) => {
      applyInit(result);
      setRetrying(false);
    });
  }, [repository, applyInit]);

  const openLeaveDialog = React.useCallback(() => setLeaveOpen(true), []);
  const { allowLeave } = useLeaveGuard({ dirty: formState.dirty, onAttemptLeave: openLeaveDialog });

  const leaveToList = React.useCallback(() => {
    allowLeave();
    router.push(BOOKINGS_HREF);
  }, [allowLeave, router]);

  function handleBack() {
    if (formState.saving) return; // 저장 중에는 화면 안 이동을 막고 결과를 기다린다
    if (formState.dirty) setLeaveOpen(true);
    else router.push(BOOKINGS_HREF);
  }

  const handleSubmit = React.useCallback(
    async (input: BookingInput): Promise<BookingFormSubmitResult> => {
      const revision = revisionRef.current;
      if (revision === null) return mapSaveError({ code: 'NOT_READY', message: ERROR_MESSAGES.NOT_READY });
      const result = await repository.createBooking(input, revision);
      if (result.ok) {
        // setItem 성공이 반영된 결과에서만 성공 알림을 넘기고 반환된 ID의 상세로 이동한다.
        revisionRef.current = result.data.revision;
        setBookingFlash(result.data.booking.id, 'create');
        allowLeave();
        router.push(bookingDetailHref(result.data.booking.id));
        return { ok: true };
      }
      if (result.error.code === 'CONFLICT') {
        // 오래된 revision으로 조용히 다시 쓰지 않는다. 최신값만 다시 읽고, 사용자가 확인 후 다시 누르게 한다.
        const latest = await repository.getBookings();
        if (latest.ok) revisionRef.current = latest.data.revision;
        else return mapSaveError(latest.error);
      }
      return mapSaveError(result.error);
    },
    [repository, router, allowLeave],
  );

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title="새 레슨 예약" onBack={handleBack} backLabel="예약 목록으로 돌아가기" />
      </div>

      {init.status === 'error' ? (
        <>
          <div className="lc-form-viewport">
            <div className="lc-list-state lc-detail-state lc-detail-state--error">
              <InlineAlert tone="error" title="예약 정보를 준비하지 못했어요">{ERROR_MESSAGES[init.error.code]}</InlineAlert>
              <h2 className="lc-list-state__title">지금은 새 예약을 작성할 수 없어요</h2>
              <p className="lc-list-state__description">다시 시도해도 열리지 않으면 브라우저 설정을 확인해주세요.</p>
            </div>
          </div>
          <footer className="lc-detail-footer">
            <Button variant="appPrimary" className="lc-detail-wide" loading={retrying} busyLabel="다시 불러오는 중…" onClick={retry}>다시 시도</Button>
          </footer>
        </>
      ) : (
        <BookingForm
          mode="create"
          catalog={catalog}
          initialValues={EMPTY_BOOKING_FORM}
          title="새 레슨 예약"
          description="강사와 일정, 공간을 선택해 레슨을 예약해보세요."
          submitLabel="예약하기"
          preparing={init.status === 'preparing'}
          onSubmit={handleSubmit}
          onStateChange={setFormState}
        />
      )}

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="예약 작성을 그만둘까요?"
        description="작성 중인 내용은 저장되지 않아요."
        cancelLabel="계속 작성"
        confirmLabel="나가기"
        errorTitle="이동하지 못했어요"
        onConfirm={async () => ({ ok: true })}
        onSuccess={leaveToList}
      />
    </div>
  );
}
