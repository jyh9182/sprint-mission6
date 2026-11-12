'use client';

import { useCallback, useEffect, useState } from 'react';

const NOW_TICK_MS = 60_000;

/**
 * 진행 중·종료 파생 상태가 화면을 열어 둔 동안에도 바뀌도록 1분마다 현재 시각을 갱신한다.
 * 저장소 재조회 직후처럼 즉시 다시 판정해야 할 때는 refresh()를 부른다.
 */
export function useNowClock(tickMs: number = NOW_TICK_MS): [Date, () => void] {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(timer);
  }, [tickMs]);
  const refresh = useCallback(() => setNow(new Date()), []);
  return [now, refresh];
}

export function useNow(tickMs: number = NOW_TICK_MS) {
  return useNowClock(tickMs)[0];
}
