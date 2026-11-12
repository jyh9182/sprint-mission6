import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 앱(예약) 입력 공통 필드. Figma "13 Booking / Input·Select·Textarea"(275:1455, 275:1476, 275:1505).
 * - 레이블은 항상 보이며 `(필수)`/`(선택)`을 붙인다. placeholder로 레이블을 대신하지 않는다.
 * - 도움말·오류는 aria-describedby로 연결하고, 오류가 있으면 aria-invalid=true. 오류가 있으면 도움말 자리에 오류를 표시한다.
 * - native `required`는 브라우저 기본 검증 말풍선을 띄우므로 aria-required만 쓴다.
 */
type FieldBaseProps = {
  label: string;
  required?: boolean;
  help?: React.ReactNode;
  /** 표시할 오류 문구. 비어 있으면 정상 상태. 오류여도 입력값은 지우지 않는다. */
  error?: string;
  className?: string;
};

function useFieldA11y(idProp: string | undefined, { help, error }: Pick<FieldBaseProps, 'help' | 'error'>, describedBy?: string) {
  const autoId = React.useId();
  const id = idProp ?? `field-${autoId}`;
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error) || Boolean(help);
  return {
    id,
    messageId,
    controlProps: {
      id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': [describedBy, hasMessage ? messageId : undefined].filter(Boolean).join(' ') || undefined,
    } as const,
  };
}

function FieldShell({ id, messageId, label, required, help, error, className, children }: FieldBaseProps & { id: string; messageId: string; children: React.ReactNode }) {
  return (
    <div className={cn('lc-field', className)}>
      <label className="lc-field__label" htmlFor={id}>{label} ({required ? '필수' : '선택'})</label>
      {children}
      {error ? (
        <p id={messageId} className="lc-field__error">{error}</p>
      ) : help ? (
        <p id={messageId} className="lc-field__help">{help}</p>
      ) : null}
    </div>
  );
}

export type InputProps = FieldBaseProps & Omit<React.ComponentProps<'input'>, 'className' | 'required'>;

export function Input({ label, required, help, error, className, id: idProp, 'aria-describedby': describedBy, ...props }: InputProps) {
  const { id, messageId, controlProps } = useFieldA11y(idProp, { help, error }, describedBy);
  return (
    <FieldShell {...{ id, messageId, label, required, help, error, className }}>
      <input className="lc-control" aria-required={required || undefined} {...props} {...controlProps} />
    </FieldShell>
  );
}

export type SelectProps = FieldBaseProps & Omit<React.ComponentProps<'select'>, 'className' | 'required'> & {
  /** 값이 비어 있을 때 보이는 선택 불가능한 안내 옵션. 예: `공간을 선택해주세요` */
  placeholder?: string;
};

export function Select({ label, required, help, error, className, id: idProp, placeholder, children, 'aria-describedby': describedBy, ...props }: SelectProps) {
  const { id, messageId, controlProps } = useFieldA11y(idProp, { help, error }, describedBy);
  return (
    <FieldShell {...{ id, messageId, label, required, help, error, className }}>
      <div className="lc-select">
        <select className="lc-control" aria-required={required || undefined} {...props} {...controlProps}>
          {placeholder !== undefined && <option value="" disabled>{placeholder}</option>}
          {children}
        </select>
        <img className="lc-select__icon" src="/assets/ui/chevron-down.svg" alt="" width={16} height={16} />
      </div>
    </FieldShell>
  );
}

export type TextareaProps = FieldBaseProps & Omit<React.ComponentProps<'textarea'>, 'className' | 'required'>;

export function Textarea({ label, required, help, error, className, id: idProp, 'aria-describedby': describedBy, ...props }: TextareaProps) {
  const { id, messageId, controlProps } = useFieldA11y(idProp, { help, error }, describedBy);
  return (
    <FieldShell {...{ id, messageId, label, required, help, error, className }}>
      <textarea className="lc-control lc-control--textarea" aria-required={required || undefined} {...props} {...controlProps} />
    </FieldShell>
  );
}

/** 제출 시 첫 오류 항목으로 포커스한다. 연결된 오류 문구가 함께 읽힌다. 포커스한 요소를 반환한다. */
export function focusFirstInvalid(container: ParentNode | null | undefined): HTMLElement | null {
  const target = container?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? null;
  target?.focus();
  return target;
}
