'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva('ui-button inline-flex items-center justify-center gap-3 whitespace-nowrap font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-40', {variants:{variant:{default:'bg-[var(--ink)] text-white hover:bg-[var(--hover)]',secondary:'border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--surface)]',ghost:'text-[var(--ink)] hover:bg-[var(--surface)]',
  // 앱(예약) 화면용: Figma "11 Final / PrimaryButton"(188:1164), "13 Booking / Button / Secondary"(274:1459)
  appPrimary:'lc-button lc-button--primary',appSecondary:'lc-button lc-button--secondary'},size:{default:'h-14 px-7 text-base',sm:'h-11 px-5 text-sm',icon:'size-11 p-0',app:''}},defaultVariants:{variant:'default',size:'default'}});
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useClientReady() {
  return React.useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  /** 실제 비동기 작업(저장 Promise) 동안만 true. 포커스를 유지하도록 native disabled 대신 aria-disabled를 쓴다. */
  loading?: boolean;
  /** 처리 중 표시·접근 가능한 이름. 없으면 children을 유지한다. */
  busyLabel?: React.ReactNode;
};

export function Button({className,variant,size,asChild=false,loading=false,busyLabel,children,onClick,...props}:ButtonProps) {
  const ready = useClientReady();
  const Comp = asChild ? Slot : 'button';
  const isApp = variant === 'appPrimary' || variant === 'appSecondary';
  const disabled = props.disabled || (Boolean(onClick) && !ready);
  const busy = loading && !asChild;
  const handleClick: React.MouseEventHandler<HTMLButtonElement> | undefined = busy
    ? (e) => e.preventDefault() // 중복 실행·폼 재제출 방지
    : onClick;
  return <Comp data-slot="button" className={cn(buttonVariants({variant,size:size ?? (isApp ? 'app' : undefined),className}))} {...props} onClick={handleClick} disabled={asChild ? undefined : disabled} aria-disabled={busy ? true : props['aria-disabled']} aria-busy={busy ? true : props['aria-busy']}>
    {busy ? <><img className="lc-spinner" src={variant === 'appPrimary' || variant === 'default' || variant === undefined ? '/assets/ui/spinner-light.svg' : '/assets/ui/spinner-dark.svg'} alt="" width={20} height={20}/>{busyLabel ?? children}</> : children}
  </Comp>;
}
export {buttonVariants};
