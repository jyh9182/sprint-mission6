'use client';

// 예약 상세 화면용 어댑터. URL의 ID로 저장소에서 한 건을 조회한다.
// 서버 렌더링·첫 하이드레이션은 항상 'initializing'이며, 마운트 후에만 저장소를 읽는다.
// NOT_FOUND(없는 ID·잘못된 ID 형식)와 저장소 읽기 오류를 구분한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BOOKING_STORAGE_KEY, getBookingRepository } from './repository';
import type { BookingRepository, LessonBooking, StoreError } from './types';
import { isUuidV4 } from './validation';

export type BookingDetailState =
  | { status: 'initializing' }
  | { status: 'ready'; booking: LessonBooking; revision: number }
  | { status: 'not-found' }
  | { status: 'error'; error: StoreError };

/**
 * initialize()를 기다린 뒤 getBooking(id). 이미 준비된 저장소의 initialize()는 쓰기 없는 조회라
 * 다시 시도·다른 탭 변경 반영에도 같은 경로를 쓴다. 저장값을 덮어쓰거나 지우지 않는다.
 */
export async function loadBookingDetail(repository: BookingRepository, id: string | null): Promise<BookingDetailState> {
  const init = await repository.initialize();
  if (!init.ok) {
    return init.error.code === 'NOT_READY' ? { status: 'initializing' } : { status: 'error', error: init.error };
  }
  if (!isUuidV4(id)) return { status: 'not-found' };
  const result = await repository.getBooking(id);
  if (result.ok) return { status: 'ready', ...result.data };
  if (result.error.code === 'NOT_FOUND') return { status: 'not-found' };
  if (result.error.code === 'NOT_READY') return { status: 'initializing' };
  return { status: 'error', error: result.error }; // 저장소 오류를 NOT_FOUND로 바꾸지 않는다
}

/** id가 바뀌면 화면을 다시 만들도록 호출하는 쪽에서 key={id}를 준다. */
export function useBookingDetail(id: string | null, repository: BookingRepository = getBookingRepository()) {
  const [state, setState] = useState<BookingDetailState>({ status: 'initializing' });
  const [retrying, setRetrying] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    const refresh = () => {
      void loadBookingDetail(repository, id).then((next) => {
        if (activeRef.current) setState(next);
      });
    };
    refresh();
    // 같은 탭의 성공한 쓰기, 다른 탭의 변경(삭제 포함)을 다시 읽는다.
    const unsubscribe = repository.subscribe(refresh);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === BOOKING_STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    // 브라우저 뒤로가기의 페이지 캐시(bfcache)로 돌아와도 삭제·취소된 예약을 그대로 조작하지 않게 다시 읽는다.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      activeRef.current = false;
      unsubscribe();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [repository, id]);

  /** 조회 실패 화면의 다시 시도. 결과가 나올 때까지 오류 화면을 유지한다. */
  const retry = useCallback(() => {
    setRetrying(true);
    void loadBookingDetail(repository, id).then((next) => {
      if (!activeRef.current) return;
      setState(next);
      setRetrying(false);
    });
  }, [repository, id]);

  /** 액션 결과를 확인하기 위해 최신 저장소를 다시 읽고 화면에 반영한다. 반영한 상태를 돌려준다. */
  const reload = useCallback(async () => {
    const next = await loadBookingDetail(repository, id);
    if (activeRef.current) setState(next);
    return next;
  }, [repository, id]);

  return { state, retry, retrying, reload, repository };
}
