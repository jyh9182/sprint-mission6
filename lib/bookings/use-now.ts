'use client';

import { useEffect, useState } from 'react';

const NOW_TICK_MS = 60_000;

/** 진행 중·종료 파생 상태가 화면을 열어 둔 동안에도 바뀌도록 1분마다 현재 시각을 갱신한다. */
export function useNow(tickMs: number = NOW_TICK_MS) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(timer);
  }, [tickMs]);
  return now;
}
