'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { formatImageBytes, REFERENCE_IMAGE_ACCEPT } from '@/lib/bookings/reference-image';
import type { ReferenceImage } from '@/lib/bookings/types';

/**
 * 공통 폼의 `참고 이미지 (선택)` 필드. Figma 09_Reference_Image_Field_States(306:2964):
 * Empty 306:2936 · Selected 306:2944 · Error 306:2956 · Remove Pending 309:3225.
 * - 실제 file input은 화면에서 숨기고, 보이는 버튼(`참고 이미지 선택`·`교체`)이 연다. accept는 힌트이며 검증은 별도로 한다.
 * - 미리보기는 변환 결과 Data URL만 쓴다(object URL을 남기지 않음).
 * - 오류는 필드 아래 role=alert. 실패해도 직전 미리보기는 유지된다(상태는 BookingForm이 가진다).
 */
export type ReferenceImageView =
  | { kind: 'empty' }
  | { kind: 'selected'; image: ReferenceImage }
  | { kind: 'remove-pending' };

export interface ReferenceImageFieldProps {
  id: string;
  view: ReferenceImageView;
  preparing: boolean;
  error: string | null;
  disabled?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  onUndoRemove: () => void;
}

export function ReferenceImageField({ id, view, preparing, error, disabled = false, onFile, onRemove, onUndoRemove }: ReferenceImageFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const statusId = `${id}-status`;
  const describedBy = [helpId, error ? errorId : undefined, preparing ? statusId : undefined].filter(Boolean).join(' ');
  const busy = disabled || preparing;

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 파일을 다시 골라도 change가 오도록 비운다
    if (file) onFile(file); // 선택 창 취소(파일 없음)는 직전 draft를 그대로 둔다
  }

  const triggerA11y = {
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
  } as const;

  return (
    <div className="lc-field lc-image-field" role="group" aria-labelledby={labelId} aria-busy={preparing || undefined}>
      <label id={labelId} className="lc-field__label" htmlFor={id}>참고 이미지 (선택)</label>
      <p id={helpId} className="lc-field__help">JPEG · PNG · WebP · 원본 최대 2MB</p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={REFERENCE_IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-describedby={describedBy}
        disabled={busy}
        onChange={handleChange}
        data-testid="reference-image-input"
      />

      {view.kind === 'selected' ? (
        <div className="lc-image-card lc-image-card--selected">
          <img className="lc-image-card__thumb" src={view.image.dataUrl} alt={`선택한 참고 이미지: ${view.image.fileName}`} width={view.image.width} height={view.image.height} />
          <div className="lc-image-card__body">
            <p className="lc-image-card__name" title={view.image.fileName}>{view.image.fileName}</p>
            <p className="lc-image-card__meta">{`변환 완료 · ${formatImageBytes(view.image.sizeBytes)}`}</p>
            <div className="lc-image-card__actions">
              <Button type="button" variant="appSecondary" className="lc-image-card__action" disabled={busy} onClick={openPicker} aria-label="참고 이미지 교체" {...triggerA11y}>교체</Button>
              <Button type="button" variant="appSecondary" className="lc-image-card__action" disabled={busy} onClick={onRemove} aria-label="참고 이미지 제거">제거</Button>
            </div>
          </div>
        </div>
      ) : view.kind === 'remove-pending' ? (
        <div className="lc-image-card">
          <span className="lc-image-card__icon" aria-hidden="true" />
          <div className="lc-image-card__body">
            <p className="lc-image-card__title">이미지 제거 예정</p>
            <p className="lc-image-card__meta">저장 전에는 기존 이미지가 유지돼요</p>
          </div>
        </div>
      ) : (
        <Button type="button" variant={null} size={null} className="lc-image-card lc-image-card--trigger" disabled={busy} onClick={openPicker} {...triggerA11y}>
          {error ? null : <span className="lc-image-card__icon" aria-hidden="true" />}
          <span className="lc-image-card__body">
            <span className="lc-image-card__title">{error ? '다른 이미지 선택' : '참고 이미지 선택'}</span>
            <span className="lc-image-card__meta">{error ? '파일을 선택해 다시 시도해주세요' : '레슨에 참고할 사진 1장을 추가해요'}</span>
          </span>
        </Button>
      )}

      <p id={statusId} className="lc-field__help" role="status">{preparing ? '이미지 준비 중…' : ''}</p>
      {error ? <p id={errorId} className="lc-field__error" role="alert">{error}</p> : null}

      {view.kind === 'remove-pending' ? (
        <Button type="button" variant="appSecondary" className="lc-image-field__undo" disabled={busy} onClick={onUndoRemove}>제거 되돌리기</Button>
      ) : view.kind === 'selected' ? (
        <p className="lc-form-note">이 브라우저에만 저장돼요.</p>
      ) : (
        <p className="lc-form-note">긴 변 1280px · 변환 후 최대 500KB</p>
      )}
    </div>
  );
}
