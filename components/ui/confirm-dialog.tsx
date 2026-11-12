'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';

/**
 * 확인 Dialog. Figma "13 Booking / Confirmation Dialog"(276:1448) — Default / Processing / Error.
 * - 네이티브 <dialog>.showModal()로 배경 콘텐츠를 비활성화하고, Tab 순환을 Dialog 안에 가둔다.
 * - 열리면 취소(유지) 버튼에 포커스. 닫히면 연 요소(또는 returnFocusRef)로 포커스를 복원한다.
 * - Escape로 닫힌다. 배경 클릭으로는 닫히지 않는다. 처리 중에는 Escape·취소를 막는다.
 * - onConfirm이 성공을 반환한 뒤에만 닫고 onSuccess를 호출한다(결과 알림은 호출 화면에서 표시).
 *   실패하면 Error 상태로 바꾸고 같은 확인 버튼으로 다시 시도할 수 있다.
 */
export type ConfirmResult = { ok: true } | { ok: false };

type Phase = 'idle' | 'processing' | 'error';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel = '처리 중…',
  cancelLabel = '유지하기',
  errorTitle,
  errorMessage,
  onConfirm,
  onSuccess,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  errorTitle: string;
  errorMessage?: string;
  /** 실제 저장 작업. StoreResult도 그대로 반환할 수 있다. 예외는 실패로 처리한다. */
  onConfirm: () => Promise<ConfirmResult>;
  onSuccess?: () => void;
  /** 닫힌 뒤 포커스를 돌려줄 요소. 없으면 Dialog를 연 요소로 돌아간다(문서에서 사라졌으면 생략). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
  /** 이 컴포넌트가 showModal로 연 상태인지. 코드가 닫은 경우와 브라우저가 직접 닫은 경우를 구분한다. */
  const shownRef = React.useRef(false);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const processing = phase === 'processing';
  const baseId = React.useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  // open prop과 네이티브 dialog 상태 동기화
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPhase('idle');
      dialog.showModal();
      shownRef.current = true;
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      shownRef.current = false;
      dialog.close();
    }
  }, [open]);

  function restoreFocus() {
    const target = returnFocusRef?.current ?? openerRef.current;
    if (target?.isConnected) target.focus();
    openerRef.current = null;
  }

  function requestClose() {
    if (processing) return;
    onOpenChange(false);
  }

  async function handleConfirm() {
    if (processing) return;
    setPhase('processing');
    let ok = false;
    try {
      ok = (await onConfirm()).ok;
    } catch {
      ok = false;
    }
    if (ok) {
      setPhase('idle');
      onOpenChange(false);
      onSuccess?.();
    } else {
      setPhase('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'Escape') {
      // 기본 close 요청을 직접 처리해 처리 중 닫힘을 확실히 막는다.
      e.preventDefault();
      requestClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !e.currentTarget.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="lc-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={(e) => {
        // close 이벤트는 비동기로 도착한다. 그사이 다시 열렸다면 이전 닫힘의 지연된 이벤트이므로 무시한다.
        if (e.currentTarget.open) return;
        restoreFocus();
        // 코드가 닫은 경우는 이미 open=false다. 브라우저가 직접 닫은 경우에만 상태를 맞춘다.
        if (shownRef.current) {
          shownRef.current = false;
          onOpenChange(false);
        }
      }}
    >
      <h2 id={titleId} className="lc-dialog__title">{title}</h2>
      <p id={descriptionId} className="lc-dialog__description">{description}</p>
      {phase === 'error' ? <InlineAlert tone="error" title={errorTitle}>{errorMessage}</InlineAlert> : null}
      <div className="lc-dialog__actions">
        <Button ref={cancelRef} type="button" variant="appSecondary" disabled={processing} onClick={requestClose}>{cancelLabel}</Button>
        <Button type="button" variant="appPrimary" loading={processing} busyLabel={busyLabel} onClick={handleConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
