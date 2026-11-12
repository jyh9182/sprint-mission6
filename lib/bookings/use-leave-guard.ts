'use client';

// 작성 중 이탈 확인 — design/steps/05-booking-create.md §저장·이동·이탈 6~7.
// - 새로고침·탭 닫기·외부 이동: dirty일 때 브라우저 기본 beforeunload 확인만 사용한다(문구 지정 불가).
// - 브라우저 뒤로가기: dirty가 되면 같은 URL의 기록을 하나 더 쌓아 두고(popstate 가드), 뒤로가기가 그 기록을
//   소비하면 onAttemptLeave로 앱의 확인 Dialog를 연다. Next 16은 window.history.pushState를 라우터와 통합한다.
// - 저장 성공 후 이동이나 확인된 나가기는 allowLeave()를 먼저 호출해 가드를 끈다.
// 미저장 draft를 따로 저장하거나 복원하지 않는다.

import { useCallback, useEffect, useRef } from 'react';

export function useLeaveGuard({ dirty, onAttemptLeave }: { dirty: boolean; onAttemptLeave: () => void }) {
  const allowedRef = useRef(false);
  const guardRef = useRef(false);
  const attemptRef = useRef(onAttemptLeave);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    attemptRef.current = onAttemptLeave;
    dirtyRef.current = dirty;
  }, [onAttemptLeave, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowedRef.current) return;
      event.preventDefault();
      event.returnValue = ''; // 일부 브라우저는 이 값이 있어야 기본 확인창을 띄운다
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (dirty && !guardRef.current && !allowedRef.current) {
      window.history.pushState(window.history.state, '', window.location.href);
      guardRef.current = true;
    }
  }, [dirty]);

  useEffect(() => {
    const onPopState = () => {
      if (!guardRef.current || allowedRef.current) return;
      // 가드 기록이 소비됐다. 지금은 원래 기록(같은 URL)에 있다.
      guardRef.current = false;
      if (dirtyRef.current) {
        window.history.pushState(window.history.state, '', window.location.href);
        guardRef.current = true;
        // 기록 이동과 Next 라우터의 popstate 처리가 끝난 뒤에 확인 Dialog를 연다.
        window.setTimeout(() => attemptRef.current(), 0);
      } else {
        window.history.back(); // 다시 깨끗해졌다면 사용자가 의도한 뒤로가기를 그대로 진행
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** 확인된 이동(나가기·저장 성공) 직전에 호출한다. 이후 beforeunload·뒤로가기 가드가 동작하지 않는다. */
  const allowLeave = useCallback(() => {
    allowedRef.current = true;
  }, []);

  return { allowLeave };
}
