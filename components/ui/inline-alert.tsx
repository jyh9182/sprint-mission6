import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 공통 알림. Figma "13 Booking / Inline Alert"(275:1550, Info는 기존 안내 188:1182).
 * 자동으로 사라지는 Toast 대신 문제가 해결되거나 다음 성공 액션까지 유지한다.
 * 정보·성공은 role=status(aria-live=polite), 오류는 role=alert.
 * 성공 알림은 실제 저장 성공 이후에만 렌더링한다(호출하는 화면의 책임).
 */
export type InlineAlertTone = 'info' | 'success' | 'error';

const ICONS: Record<InlineAlertTone, string> = {
  info: '/assets/ui/notice-info.svg',
  success: '/assets/ui/notice-success.svg',
  error: '/assets/ui/notice-error.svg',
};

export function InlineAlert({ tone = 'info', title, children, className, id }: {
  tone?: InlineAlertTone;
  title: string;
  /** 줄바꿈(\n)은 그대로 표시된다. */
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const live = tone === 'error' ? { role: 'alert' } : { role: 'status', 'aria-live': 'polite' as const };
  return (
    <div id={id} className={cn('lc-alert', `lc-alert--${tone}`, className)} {...live}>
      <img className="lc-alert__icon" src={ICONS[tone]} alt="" width={20} height={20} />
      <div className="lc-alert__body">
        <p className="lc-alert__title">{title}</p>
        {children ? <p className="lc-alert__message">{children}</p> : null}
      </div>
    </div>
  );
}
