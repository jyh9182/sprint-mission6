'use client';

// 화면에서 초기화 중 / 준비됨 / 오류 상태를 구분하기 위한 최소 어댑터.
// 서버 렌더링과 첫 하이드레이션은 항상 'initializing'이며, 마운트 후에만 저장소를 읽는다.

import { useCallback, useEffect, useState } from 'react';
import { BOOKING_STORAGE_KEY, getBookingRepository } from './repository';
import type { BookingListData, BookingRepository, StoreError, StoreResult } from './types';

export type BookingsState =
  | { status: 'initializing' }
  | ({ status: 'ready' } & BookingListData)
  | { status: 'error'; error: StoreError };

function toState(result: StoreResult<BookingListData>): BookingsState {
  if (result.ok) return { status: 'ready', ...result.data };
  if (result.error.code === 'NOT_READY') return { status: 'initializing' };
  return { status: 'error', error: result.error };
}

export function useBookings(repository: BookingRepository = getBookingRepository()) {
  const [state, setState] = useState<BookingsState>({ status: 'initializing' });

  useEffect(() => {
    let active = true;
    const apply = (result: StoreResult<BookingListData>) => {
      if (active) setState(toState(result));
    };
    const refresh = () => {
      void repository.getBookings().then(apply);
    };

    void repository.initialize().then(apply);
    const unsubscribe = repository.subscribe(refresh);
    // 다른 탭의 변경은 다시 읽는다. 편집 중인 폼의 충돌 안내는 해당 화면 단계에서 처리한다.
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === BOOKING_STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [repository]);

  /** 오류 화면의 다시 시도. 저장값을 덮어쓰지 않고 다시 읽기만 한다. */
  const retry = useCallback(() => {
    setState({ status: 'initializing' });
    void repository.initialize().then((result) => setState(toState(result)));
  }, [repository]);

  return { state, retry, repository };
}
