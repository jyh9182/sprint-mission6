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
import { EMPTY_BOOKING_FORM, findSelectableOffer, mapSaveError, type BookingFormSubmitResult, type BookingFormValues } from '@/lib/bookings/form';
import { ERROR_MESSAGES } from '@/lib/bookings/messages';
import { getBookingRepository } from '@/lib/bookings/repository';
import { bookingDetailHref, BOOKINGS_HREF, HOME_HREF, parseNewBookingEntry, type NewBookingEntry } from '@/lib/bookings/routes';
import type { BookingInput, StoreError } from '@/lib/bookings/types';
import { useLeaveGuard } from '@/lib/bookings/use-leave-guard';

// 5단계 예약 생성 `/bookings/new`. Figma 291:1950(Initial) · 291:2020/2114(Ready) · 291:2208(Errors)
// · 291:2303(Saving) · 291:2399(Save Error) · 291:2500(Leave Confirm) · 291:2647(Success Detail).
// 저장은 이 브라우저의 LocalStorage에만 기록한다. 실제 강사·공간 예약 서버와 연결하지 않는다.

type InitState = { status: 'preparing' } | { status: 'ready' } | { status: 'error'; error: StoreError };

/**
 * 10단계: URL의 진입 문맥을 읽는다(정적 export라 Suspense 안 클라이언트에서만 읽힌다).
 * - `?offerId=`: 활성 카탈로그 상품이면 상품만 사전 선택한다. 날짜·시각·공간·확인 체크는 비워 둔다.
 *   없거나 비활성인 ID는 다른 상품으로 대체하지 않고 빈 선택 + 오류 안내를 보인다.
 * - `?from=home`: 뒤로가기·이탈 목적지를 앱 홈으로 한다. 그 밖의 값은 목록.
 */
export function BookingCreateFromQuery() {
  const params = useSearchParams();
  const { offerId, from } = parseNewBookingEntry(params);
  return <BookingCreateScreen key={`${from}:${offerId ?? ''}`} offerId={offerId} from={from} />;
}

/** Suspense fallback: 쿼리를 읽기 전 정적 HTML. 저장소를 읽지 않고 준비 중 폼만 보인다. */
export function BookingCreateLoading() {
  return <BookingCreateScreen offerId={null} from="list" staticShell />;
}

const BACK: Record<NewBookingEntry, { href: string; label: string }> = {
  list: { href: BOOKINGS_HREF, label: '예약 목록으로 돌아가기' },
  home: { href: HOME_HREF, label: '홈으로 돌아가기' },
};

export function BookingCreateScreen({ offerId = null, from = 'list', staticShell = false }: { offerId?: string | null; from?: NewBookingEntry; staticShell?: boolean }) {
  const router = useRouter();
  const repository = getBookingRepository();
  const catalog = getBookingCatalog();
  const [init, setInit] = React.useState<InitState>({ status: 'preparing' });
  const [retrying, setRetrying] = React.useState(false);
  const revisionRef = React.useRef<number | null>(null);
  const [formState, setFormState] = React.useState({ dirty: false, saving: false });
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const back = BACK[from];
  // 사전 선택은 활성 상품일 때만. 빈 문자열·없는 ID·비활성 상품은 선택하지 않는다.
  const presetOffer = offerId ? findSelectableOffer(catalog, offerId) : undefined;
  const invalidOffer = offerId !== null && !presetOffer;
  const initialValues = React.useMemo<BookingFormValues>(
    () => (presetOffer ? { ...EMPTY_BOOKING_FORM, offerId: presetOffer.offer.id } : EMPTY_BOOKING_FORM),
    [presetOffer],
  );

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
    if (staticShell) return;
    let active = true;
    void repository.initialize().then((result) => {
      if (active) applyInit(result);
    });
    return () => {
      active = false;
    };
  }, [repository, applyInit, staticShell]);

  const retry = React.useCallback(() => {
    setRetrying(true);
    void repository.initialize().then((result) => {
      applyInit(result);
      setRetrying(false);
    });
  }, [repository, applyInit]);

  const openLeaveDialog = React.useCallback(() => setLeaveOpen(true), []);
  const { allowLeave } = useLeaveGuard({ dirty: formState.dirty, onAttemptLeave: openLeaveDialog });

  const leaveToBack = React.useCallback(() => {
    allowLeave();
    router.push(back.href);
  }, [allowLeave, router, back.href]);

  function handleBack() {
    if (formState.saving) return; // 저장 중에는 화면 안 이동을 막고 결과를 기다린다
    if (formState.dirty) setLeaveOpen(true);
    else router.push(back.href);
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
      return mapSaveError(result.error, 'create', { imageSelected: input.referenceImageChange?.kind === 'replace' });
    },
    [repository, router, allowLeave],
  );

  return (
    <div className="lc-app">
      <div className="lc-app__top">
        <PageHeader title="새 레슨 예약" onBack={handleBack} backLabel={back.label} />
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
          initialValues={initialValues}
          notice={invalidOffer && !formState.dirty ? (
            <InlineAlert tone="error" title="선택한 강사 레슨을 찾을 수 없어요">
              {'다른 강사로 바꾸지 않았어요. 아래에서 강사와 레슨을 직접 선택해주세요.'}
            </InlineAlert>
          ) : undefined}
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
        onSuccess={leaveToBack}
      />
    </div>
  );
}
