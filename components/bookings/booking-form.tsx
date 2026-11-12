'use client';

import * as React from 'react';
import { ReferenceImageField, type ReferenceImageView } from '@/components/bookings/reference-image-field';
import { Button, useClientReady } from '@/components/ui/button';
import { Input, Select, Textarea, focusFirstInvalid } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/inline-alert';
import {
  BOOKING_FORM_FIELDS,
  catalogStartTimes,
  changeOffer,
  EDIT_MESSAGES,
  findSelectableOffer,
  hasMeaningfulChange,
  isPastStart,
  isSameFormValues,
  mapSaveError,
  offerSummaryDetail,
  offerSummaryTitle,
  selectableOffers,
  selectableSpaces,
  toBookingInput,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormField,
  type BookingFormSubmitResult,
  type BookingFormValues,
  type FormSubmitAlert,
} from '@/lib/bookings/form';
import { instructorDisplayName } from '@/lib/bookings/format';
import { IMAGE_ERROR_MESSAGES, prepareReferenceImage } from '@/lib/bookings/image-prepare';
import { seoulDate } from '@/lib/bookings/time';
import type { BookingCatalog, BookingInput, ReferenceImage, ReferenceImageChange, SpaceReference } from '@/lib/bookings/types';
import { useNow } from '@/lib/bookings/use-now';
import { codePointLength, MEMO_MAX_CODE_POINTS } from '@/lib/bookings/validation';

/**
 * 예약 생성·수정 공통 폼. Figma "Booking / Form / Fields"(291:2603), 5단계 Initial·Ready·Errors·Saving·Save Error.
 * - 본문(스크롤)과 고정 Footer CTA를 Fragment로 반환하므로 `.lc-app` 그리드 안, Header 다음에 둔다.
 * - 값 검증(lib/bookings/form.ts) → onSubmit(저장소 호출) 순서. onSubmit이 성공을 반환하면 호출 화면이 이동하고,
 *   폼은 이동이 끝날 때까지 Loading을 유지한다. 실패하면 입력·체크·스크롤을 그대로 두고 오류를 표시한다.
 * - 같은 클릭·Enter가 여러 번 들어와도 저장 중에는 onSubmit을 다시 부르지 않는다.
 * - 오류는 사용자가 값을 바꾸고 떠난(blur) 필드와, 제출을 시도한 뒤의 전체 필드에만 표시한다.
 * - 9단계 참고 이미지: 선택·교체·제거는 폼 draft(`referenceImageChange`)만 바꾼다. 저장 성공 전에는 저장된 첨부가 그대로다.
 *   준비 중에는 저장을 막고, 실패·선택 취소는 직전 draft·미리보기를 유지한다.
 */
export interface BookingFormProps {
  mode: 'create' | 'edit';
  catalog: BookingCatalog;
  initialValues: BookingFormValues;
  title: string;
  description: string;
  submitLabel: string;
  busyLabel?: string;
  /** 저장소 준비 전. 입력과 저장을 막고 상태 문구를 보인다. */
  preparing?: boolean;
  onSubmit: (input: BookingInput) => Promise<BookingFormSubmitResult>;
  /** dirty·저장 중 여부를 화면(이탈 확인)에 알린다. */
  onStateChange?: (state: { dirty: boolean; saving: boolean }) => void;
  /**
   * 수정 화면 전용(6단계). 스크롤 하단의 Secondary 버튼(`수정 취소`). 이탈 규칙은 호출 화면이 정한다.
   */
  onCancel?: () => void;
  cancelLabel?: string;
  /** 호출 화면이 저장을 막아야 하는 경우(시간 경과·다른 화면 변경 확인 전). 입력은 유지하고 CTA만 비활성화한다. */
  submitBlocked?: boolean;
  /** 본문 맨 위 고정 알림 자리에 호출 화면이 넣는 안내(저장 실패 알림보다 우선). */
  notice?: React.ReactNode;
  /** 카탈로그에서 사라진 기존 상품·공간을 비활성 옵션으로 보일 때의 이름(예약 snapshot 기준). */
  unavailableLabels?: { offer?: string; space?: string };
  /** 수정 화면의 저장된 참고 이미지(비교 기준). 생성은 null. */
  initialImage?: ReferenceImage | null;
}

const ALL_FIELDS = new Set<BookingFormField>(BOOKING_FORM_FIELDS);

export function BookingForm({
  mode,
  catalog,
  initialValues,
  title,
  description,
  submitLabel,
  busyLabel = '저장 중…',
  preparing = false,
  onSubmit,
  onStateChange,
  onCancel,
  cancelLabel = '수정 취소',
  submitBlocked = false,
  notice,
  unavailableLabels,
  initialImage = null,
}: BookingFormProps) {
  const baseId = React.useId();
  const formId = `${baseId}-form`;
  const ids = {
    offer: `${baseId}-offer`,
    date: `${baseId}-date`,
    time: `${baseId}-time`,
    space: `${baseId}-space`,
    memo: `${baseId}-memo`,
    ack: `${baseId}-ack`,
    image: `${baseId}-image`,
    notice: `${baseId}-notice`,
  };
  const formRef = React.useRef<HTMLFormElement>(null);
  const clientReady = useClientReady();
  const now = useNow();

  const [values, setValues] = React.useState<BookingFormValues>(initialValues);
  const [dateBadInput, setDateBadInput] = React.useState(false);
  const [touched, setTouched] = React.useState<Set<BookingFormField>>(() => new Set());
  // 수정 화면: 기존 상품·시간·공간이 현재 카탈로그에서 선택할 수 없으면 처음부터 필드 오류로 재선택을 안내한다.
  const [activated, setActivated] = React.useState<Set<BookingFormField>>(() => {
    if (mode !== 'edit') return new Set();
    const initialErrors = validateBookingForm(initialValues, { catalog, nowMs: Date.now() });
    return new Set((['offerId', 'startTime', 'spaceId'] as const).filter((f) => initialErrors[f]));
  });
  const [externalErrors, setExternalErrors] = React.useState<BookingFormErrors>({});
  const [alert, setAlert] = React.useState<FormSubmitAlert | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [checkedAt, setCheckedAt] = React.useState(0);
  const [offerResetNotice, setOfferResetNotice] = React.useState(false);
  const [focusRequest, setFocusRequest] = React.useState(0);
  const submittingRef = React.useRef(false);

  // 참고 이미지 draft. keep = 생성은 첨부 없음, 수정은 저장된 이미지 유지.
  const [imageChange, setImageChange] = React.useState<ReferenceImageChange>({ kind: 'keep' });
  const [imagePreparing, setImagePreparing] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const imageTaskRef = React.useRef(0);
  React.useEffect(() => () => {
    imageTaskRef.current += 1; // 화면을 떠나면 진행 중인 변환 결과를 버린다
  }, []);

  const nowMs = Math.max(now.getTime(), checkedAt);
  const computed = validateBookingForm(values, { catalog, nowMs, dateBadInput });
  const errors: BookingFormErrors = {};
  for (const field of BOOKING_FORM_FIELDS) {
    const message = externalErrors[field] ?? (activated.has(field) ? computed[field] : undefined);
    if (message) errors[field] = message;
  }

  // 생성: 처음 값과 다르면 dirty. 수정: 예약 필드·trim 메모의 의미 있는 변경만 dirty(확인 체크 제외).
  // 수정 화면의 initialValues는 비교 기준(처음 읽은 예약)이며, 호출 화면이 최신 예약을 확인하면 바뀔 수 있다.
  // 이미지 선택·교체·제거도 의미 있는 변경이다.
  const dirty =
    dateBadInput ||
    imageChange.kind !== 'keep' ||
    (mode === 'edit' ? hasMeaningfulChange(values, initialValues) : !isSameFormValues(values, initialValues));
  const unchangedEdit = mode === 'edit' && !dirty;
  React.useEffect(() => {
    onStateChange?.({ dirty, saving });
  }, [dirty, saving, onStateChange]);

  // 제출 실패 후 렌더가 끝나면 첫 오류 필드로 포커스(포커스가 스크롤도 맞춘다).
  React.useEffect(() => {
    if (focusRequest > 0) focusFirstInvalid(formRef.current);
  }, [focusRequest]);

  const offers = selectableOffers(catalog);
  const selected = findSelectableOffer(catalog, values.offerId);
  const spaces = selectableSpaces(catalog, values.offerId);
  const times = catalogStartTimes(catalog);
  const today = clientReady ? seoulDate(now.getTime()) : undefined;
  const dependentDisabled = preparing || !selected;
  const locked = preparing || saving;

  const imageView: ReferenceImageView =
    imageChange.kind === 'replace'
      ? { kind: 'selected', image: imageChange.image }
      : imageChange.kind === 'remove'
        ? initialImage ? { kind: 'remove-pending' } : { kind: 'empty' }
        : initialImage ? { kind: 'selected', image: initialImage } : { kind: 'empty' };

  async function handleImageFile(file: File) {
    if (locked || imagePreparing) return; // 변환 중 중복 선택 차단
    const task = ++imageTaskRef.current;
    setImagePreparing(true);
    setImageError(null);
    let message: string | null = null;
    let next: ReferenceImage | null = null;
    try {
      const result = await prepareReferenceImage(file);
      if (result.ok) next = result.image;
      else message = IMAGE_ERROR_MESSAGES[result.error];
    } catch {
      message = IMAGE_ERROR_MESSAGES.encode;
    }
    if (task !== imageTaskRef.current) return;
    setImagePreparing(false);
    if (next) {
      const image = next;
      setImageChange({ kind: 'replace', image });
    } else {
      setImageError(message); // 새 파일만 버리고 직전 draft·미리보기는 유지
    }
  }

  function handleImageRemove() {
    if (locked || imagePreparing) return;
    setImageError(null);
    // 수정의 저장된 이미지는 `제거 예정`(되돌리기 가능). 생성·저장 이미지 없는 수정은 첨부 없음으로 돌아간다.
    setImageChange(initialImage ? { kind: 'remove' } : { kind: 'keep' });
  }

  function handleImageUndo() {
    if (locked || imagePreparing) return;
    setImageChange({ kind: 'keep' });
  }

  function update(patch: Partial<BookingFormValues>, fields: BookingFormField[]) {
    if (locked) return;
    setValues((prev) => ({ ...prev, ...patch }));
    setTouched((prev) => new Set([...prev, ...fields]));
    // 저장소가 알려준 필드 오류(시간 겹침 등)는 관련 값이 바뀌면 지운다.
    setExternalErrors((prev) => {
      const next = { ...prev };
      for (const field of fields) delete next[field];
      if (fields.includes('date')) delete next.startTime;
      return next;
    });
  }

  function handleOfferChange(offerId: string) {
    if (locked) return;
    const hadDependents = Boolean(values.date || values.startTime || values.spaceId || dateBadInput);
    const next = changeOffer(values, offerId);
    if (next === values) return;
    setValues(next);
    setDateBadInput(false);
    setTouched((prev) => new Set([...prev, 'offerId']));
    // 상품을 바꾸면 종속 값과 그 오류 표시를 초기화한다. 메모·확인 체크는 유지.
    setActivated((prev) => new Set([...prev].filter((f) => f !== 'date' && f !== 'startTime' && f !== 'spaceId')));
    setExternalErrors({});
    setOfferResetNotice(Boolean(values.offerId) && hadDependents);
  }

  /** 값을 바꾼 필드에서 포커스가 떠나면 그 필드의 오류를 보이기 시작한다. */
  function handleBlur(field: BookingFormField) {
    if (touched.has(field) && !activated.has(field)) setActivated((prev) => new Set([...prev, field]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || preparing || unchangedEdit || submitBlocked || imagePreparing) return; // Enter 제출도 같은 조건으로 막는다
    const checkNow = Date.now();
    setCheckedAt(checkNow);
    setActivated(new Set(ALL_FIELDS));
    setExternalErrors({});
    setAlert(null);
    const clientErrors = validateBookingForm(values, { catalog, nowMs: checkNow, dateBadInput });
    if (Object.keys(clientErrors).length > 0) {
      setFocusRequest((n) => n + 1);
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    let result: BookingFormSubmitResult;
    try {
      result = await onSubmit({ ...toBookingInput(values), referenceImageChange: imageChange });
    } catch {
      result = mapSaveError({ code: 'WRITE_FAILED', message: '' });
    }
    if (result.ok) return; // 호출 화면이 이동한다. 이동이 끝날 때까지 Loading·중복 제출 차단을 유지한다.

    submittingRef.current = false;
    setSaving(false);
    if (result.revalidate) setCheckedAt(Date.now());
    if (result.alert) setAlert(result.alert);
    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
      setExternalErrors(result.fieldErrors);
      setFocusRequest((n) => n + 1);
    }
  }

  // 오늘을 고르면 이미 시작한 시각은 고를 수 없다. 카탈로그 밖 기존 값(수정 화면)은 표시만 한다.
  const timeOptions = times.map((t) => ({ value: t, disabled: values.date === today && isPastStart(values.date, t, nowMs) }));
  const memoCount = codePointLength(values.memo.trim());

  if (offers.length === 0 && !preparing) {
    return (
      <>
        <div className="lc-form-viewport">
          <div className="lc-list-state">
            <h2 className="lc-list-state__title">선택할 수 있는 레슨이 없어요.</h2>
            <p className="lc-list-state__description">예약 목록에서 저장된 레슨을 확인할 수 있어요.</p>
          </div>
        </div>
        <footer className="lc-detail-footer" />
      </>
    );
  }

  return (
    <>
      <div className="lc-form-viewport">
        {notice ? (
          <div className="lc-form-alert">{notice}</div>
        ) : alert ? (
          <div className="lc-form-alert">
            <InlineAlert tone="error" title={alert.title}>{alert.message}</InlineAlert>
          </div>
        ) : null}
        <div className="lc-form-intro">
          <h2 className="lc-form-intro__title">{title}</h2>
          <p className="lc-form-intro__description">{description}</p>
          {preparing ? <p className="lc-form-intro__status" role="status">예약 정보를 준비하고 있어요.</p> : null}
          {mode === 'edit' ? (
            <p className="lc-form-intro__status" role="status">{unchangedEdit && !preparing ? EDIT_MESSAGES.unchanged : ''}</p>
          ) : null}
        </div>

        <form
          ref={formRef}
          id={formId}
          className="lc-form"
          noValidate
          onSubmit={handleSubmit}
          aria-busy={saving || preparing || undefined}
          data-mode={mode}
        >
          <fieldset className="lc-form__fieldset" disabled={preparing}>
            <legend className="sr-only">{title}</legend>

            <Select
              id={ids.offer}
              label="강사 · 레슨"
              required
              placeholder="레슨을 선택해주세요"
              value={values.offerId}
              error={errors.offerId}
              help="선택한 상품의 악기·장르·길이로 예약해요."
              onChange={(e) => handleOfferChange(e.target.value)}
              onBlur={() => handleBlur('offerId')}
            >
              {offers.map(({ offer, instructorName }) => (
                <option key={offer.id} value={offer.id}>{`${instructorDisplayName(instructorName)} · ${offer.instrumentLabel}`}</option>
              ))}
              {values.offerId && !selected ? <option value={values.offerId} disabled>{unavailableLabels?.offer ? `${unavailableLabels.offer} (현재 선택할 수 없음)` : '현재 선택할 수 없는 레슨'}</option> : null}
            </Select>

            {selected ? (
              <div className="lc-form-summary" role="group" aria-label="선택한 레슨 요약">
                <p className="lc-form-summary__title">{offerSummaryTitle(selected.offer)}</p>
                <p className="lc-form-summary__detail">{offerSummaryDetail(selected.offer)}</p>
              </div>
            ) : (
              <p className="lc-form-note">레슨을 선택하면 악기·장르·길이와 가능한 공간을 볼 수 있어요.</p>
            )}
            <p id={ids.notice} className="lc-form-note" role="status">
              {offerResetNotice ? '레슨을 바꿔서 날짜·시작 시간·공간 선택을 지웠어요. 다시 선택해주세요.' : ''}
            </p>

            <Input
              id={ids.date}
              type="date"
              label="날짜"
              required
              min={today}
              value={values.date}
              disabled={dependentDisabled}
              error={errors.date}
              help="서울 시간 기준, 미래 시작 시각"
              onChange={(e) => {
                setDateBadInput(e.target.validity.badInput);
                update({ date: e.target.value }, ['date']);
              }}
              onBlur={() => handleBlur('date')}
            />

            <Select
              id={ids.time}
              label="시작 시간"
              required
              placeholder="시간을 선택해주세요"
              value={values.startTime}
              disabled={dependentDisabled}
              error={errors.startTime}
              help={times.join(' · ')}
              onChange={(e) => update({ startTime: e.target.value }, ['startTime'])}
              onBlur={() => handleBlur('startTime')}
            >
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value} disabled={t.disabled}>{t.disabled ? `${t.value} (지난 시간)` : t.value}</option>
              ))}
              {values.startTime && !times.includes(values.startTime) ? <option value={values.startTime} disabled>{values.startTime}</option> : null}
            </Select>

            <Select
              id={ids.space}
              label="레슨 공간"
              required
              placeholder="공간을 선택해주세요"
              value={values.spaceId}
              disabled={dependentDisabled}
              error={errors.spaceId}
              help="선택한 상품에서 이용 가능한 데모 공간"
              onChange={(e) => update({ spaceId: e.target.value }, ['spaceId'])}
              onBlur={() => handleBlur('spaceId')}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>{spaceOptionLabel(space)}</option>
              ))}
              {values.spaceId && !spaces.some((s) => s.id === values.spaceId) ? <option value={values.spaceId} disabled>{unavailableLabels?.space ? `${unavailableLabels.space} (현재 선택할 수 없음)` : '현재 선택할 수 없는 공간'}</option> : null}
            </Select>

            <p className="lc-form-note">표시된 일정·공간은 데모 선택 항목이며 실제 예약 가능 여부를 확인하지 않아요.</p>

            <Textarea
              id={ids.memo}
              label="메모"
              placeholder="선생님께 전할 내용을 적어주세요"
              value={values.memo}
              error={errors.memo}
              help={`${memoCount}/${MEMO_MAX_CODE_POINTS}자`}
              onChange={(e) => update({ memo: e.target.value }, ['memo'])}
              onBlur={() => handleBlur('memo')}
            />

            <ReferenceImageField
              id={ids.image}
              view={imageView}
              preparing={imagePreparing}
              error={imageError}
              disabled={locked}
              onFile={(file) => void handleImageFile(file)}
              onRemove={handleImageRemove}
              onUndoRemove={handleImageUndo}
            />

            <div className="lc-form-check">
              <label className="lc-form-check__label" htmlFor={ids.ack}>
                <input
                  id={ids.ack}
                  type="checkbox"
                  className="lc-form-check__input"
                  checked={values.acknowledged}
                  aria-required
                  aria-invalid={errors.acknowledged ? true : undefined}
                  aria-describedby={errors.acknowledged ? `${ids.ack}-message` : undefined}
                  onChange={(e) => update({ acknowledged: e.target.checked }, ['acknowledged'])}
                  onBlur={() => handleBlur('acknowledged')}
                />
                <span>예약 내용과 이용 안내를 확인했어요.</span>
              </label>
              {errors.acknowledged ? <p id={`${ids.ack}-message`} className="lc-field__error">{errors.acknowledged}</p> : null}
            </div>

            {onCancel ? (
              <Button type="button" variant="appSecondary" className="lc-detail-wide" disabled={saving} onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}

            <p className="lc-form-note">이 기기의 이 브라우저에 예약 내용이 저장돼요. 실제 강사·공간 예약은 확정되지 않아요.</p>
          </fieldset>
        </form>
      </div>

      <footer className="lc-detail-footer">
        <Button
          type="submit"
          form={formId}
          variant="appPrimary"
          className="lc-detail-wide"
          disabled={preparing || !values.offerId || unchangedEdit || submitBlocked || imagePreparing}
          loading={saving}
          busyLabel={busyLabel}
        >
          {submitLabel}
        </Button>
      </footer>
    </>
  );
}

/** `동탄 스튜디오 · A 레슨실 (기타·앰프)` — 같은 스튜디오의 방을 장비까지 구별한다. */
function spaceOptionLabel(space: SpaceReference): string {
  const equipment = space.equipmentLabels.length > 0 ? ` (${space.equipmentLabels.join('·')})` : '';
  return `${space.studioName} · ${space.roomName}${equipment}`;
}
