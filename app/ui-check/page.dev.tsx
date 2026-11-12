'use client';

// 개발 서버 전용 공통 UI 확인 화면(/ui-check). next.config.ts의 pageExtensions 설정으로 production build에서 제외된다.
// 예약 화면이 아니며 LocalStorage를 읽거나 쓰지 않는다. 처리 결과는 아래 선택값으로 흉내 낸다.
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, type ConfirmResult } from '@/components/ui/confirm-dialog';
import { Input, Select, Textarea, focusFirstInvalid } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBookingCatalog } from '@/lib/bookings/catalog';
import { FIELD_MESSAGES } from '@/lib/bookings/messages';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MEMO_MAX = 500;

export default function UiCheckPage() {
  const spaces = getBookingCatalog().spaces.filter((s) => s.active);
  const [checked, setChecked] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveFails, setSaveFails] = React.useState(false);
  const [saveResult, setSaveResult] = React.useState<'success' | 'error' | null>(null);

  const [name, setName] = React.useState('');
  const [spaceId, setSpaceId] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const memoTooLong = [...memo.trim()].length > MEMO_MAX;
  const errors = {
    name: submitted && !name.trim() ? '이름을 입력해주세요.' : undefined,
    spaceId: submitted && !spaceId ? FIELD_MESSAGES.spaceId : undefined,
    memo: memoTooLong ? FIELD_MESSAGES.memo : undefined,
  };

  const [dialog, setDialog] = React.useState<'delete' | 'cancel' | null>(null);
  const [dialogFails, setDialogFails] = React.useState(true);
  const [dialogDone, setDialogDone] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveResult(null);
    await wait(1200);
    setSaving(false);
    setSaveResult(saveFails ? 'error' : 'success');
  }

  async function confirmAction(): Promise<ConfirmResult> {
    await wait(1000);
    return { ok: !dialogFails };
  }

  return (
    <main className="lc-check-page">
      <PageHeader title="공통 UI 확인" />
      <p className="lc-check-note">개발용 확인 화면입니다. 실제 예약·저장은 일어나지 않아요.</p>

      <section aria-labelledby="check-buttons" className="lc-check-section">
        <h2 id="check-buttons">버튼</h2>
        <label className="lc-check-toggle"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> 예약 내용을 확인했어요</label>
        <label className="lc-check-toggle"><input type="checkbox" checked={saveFails} onChange={(e) => setSaveFails(e.target.checked)} /> 저장 실패로 응답</label>
        <Button variant="appPrimary" disabled={!checked} loading={saving} busyLabel="저장 중…" onClick={save} aria-describedby={checked ? undefined : 'check-hint'}>예약하기</Button>
        {!checked ? <p id="check-hint" className="lc-field__help">예약 내용을 확인해주세요.</p> : null}
        {saveResult === 'success' ? <InlineAlert tone="success" title="예약을 저장했어요">확인 화면용 결과예요.</InlineAlert> : null}
        {saveResult === 'error' ? <InlineAlert tone="error" title="저장하지 못했어요">입력한 내용은 그대로예요. 다시 시도해주세요.</InlineAlert> : null}
        <div className="lc-check-row">
          <Button variant="appSecondary" onClick={() => {}}>이전</Button>
          <Button variant="appSecondary" disabled>이전</Button>
          <Button variant="appSecondary" loading busyLabel="처리 중…" onClick={() => {}}>이전</Button>
        </div>
      </section>

      <section aria-labelledby="check-fields" className="lc-check-section">
        <h2 id="check-fields">입력</h2>
        <form
          ref={formRef}
          noValidate
          className="lc-check-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            // 상태 반영 후 첫 오류 항목으로 이동
            requestAnimationFrame(() => focusFirstInvalid(formRef.current));
          }}
        >
          <Input label="이름" required placeholder="내용을 입력해주세요" help="입력 내용을 확인해주세요." value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Select label="레슨 공간" required placeholder="공간을 선택해주세요" value={spaceId} onChange={(e) => setSpaceId(e.target.value)} error={errors.spaceId}>
            {spaces.map((s) => <option key={s.id} value={s.id}>{s.studioName} {s.roomName}</option>)}
          </Select>
          <Textarea label="메모" placeholder="선생님께 전하고 싶은 내용을 적어주세요" help={`최대 ${MEMO_MAX}자`} value={memo} onChange={(e) => setMemo(e.target.value)} error={errors.memo} />
          <Button type="submit" variant="appPrimary">입력 확인</Button>
        </form>
      </section>

      <section aria-labelledby="check-badges" className="lc-check-section">
        <h2 id="check-badges">상태 Badge</h2>
        <div className="lc-check-row">
          <StatusBadge phase="upcoming" />
          <StatusBadge phase="in-progress" />
          <StatusBadge phase="ended" />
          <StatusBadge phase="cancelled" />
        </div>
      </section>

      <section aria-labelledby="check-alerts" className="lc-check-section">
        <h2 id="check-alerts">알림</h2>
        <InlineAlert tone="info" title="레슨 전에 확인해주세요">{'장소와 준비물은 예약 내역에서\n다시 확인할 수 있도록 구성할 예정이에요.'}</InlineAlert>
        <InlineAlert tone="success" title="예약을 수정했어요" />
        <InlineAlert tone="error" title="저장하지 못했어요">입력한 내용은 그대로예요. 다시 시도해주세요.</InlineAlert>
      </section>

      <section aria-labelledby="check-header" className="lc-check-section">
        <h2 id="check-header">헤더</h2>
        <PageHeader title="예약 상세" headingLevel={2} onBack={() => setDialogDone('뒤로 가기를 눌렀어요')} />
        <PageHeader title="예약 내역" headingLevel={2} />
      </section>

      <section aria-labelledby="check-dialog" className="lc-check-section">
        <h2 id="check-dialog">확인 Dialog</h2>
        <label className="lc-check-toggle"><input type="checkbox" checked={dialogFails} onChange={(e) => setDialogFails(e.target.checked)} /> 처리 실패로 응답</label>
        <div className="lc-check-row">
          <Button variant="appPrimary" onClick={() => { setDialogDone(null); setDialog('delete'); }}>삭제하기</Button>
          <Button variant="appSecondary" onClick={() => { setDialogDone(null); setDialog('cancel'); }}>예약 취소</Button>
        </div>
        {dialogDone ? <InlineAlert tone="success" title={dialogDone} /> : null}
      </section>

      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(o) => { if (!o) setDialog(null); }}
        title="예약 기록을 삭제할까요?"
        description={'삭제한 예약 기록은 복구할 수 없어요.\n이 브라우저의 기록만 삭제돼요.'}
        confirmLabel="삭제하기"
        errorTitle="삭제하지 못했어요"
        errorMessage="기존 기록은 유지했어요. 다시 시도해주세요."
        onConfirm={confirmAction}
        onSuccess={() => setDialogDone('예약 기록을 삭제했어요')}
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        onOpenChange={(o) => { if (!o) setDialog(null); }}
        title="예약을 취소할까요?"
        description="취소한 예약은 다시 예약해야 해요."
        confirmLabel="예약 취소"
        errorTitle="취소하지 못했어요"
        errorMessage="예약은 그대로예요. 다시 시도해주세요."
        onConfirm={confirmAction}
        onSuccess={() => setDialogDone('예약을 취소했어요')}
      />
    </main>
  );
}
