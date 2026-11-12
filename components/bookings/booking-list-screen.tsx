'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/app/bottom-nav';
import { BookingCard } from '@/components/bookings/booking-card';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import {
  applyDiscovery,
  clampSearchInput,
  DEFAULT_LIST_QUERY,
  describeListQuery,
  hasFilter,
  isCanonicalListSearch,
  isDefaultListQuery,
  LIST_SORTS,
  LIST_STATUSES,
  normalizeSearchText,
  parseListQuery,
  serializeListQuery,
  SORT_LABELS,
  STATUS_LABELS,
  type ListQuery,
  type ListSort,
  type ListStatus,
} from '@/lib/bookings/discovery';
import { clearListFlash, peekListFlash, type ListFlashKind } from '@/lib/bookings/flash';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/bookings/messages';
import { bookingListHref, NEW_BOOKING_HREF } from '@/lib/bookings/routes';
import { useBookings, type BookingsState } from '@/lib/bookings/use-bookings';
import { useNow } from '@/lib/bookings/use-now';

// 예약 목록 `/bookings`. Figma 283:1588(기본) · 283:1659(0건) · 283:1716(초기화) · 283:1771(읽기 실패) · 283:1833(긴 목록).
// 8단계 탐색: 302:2781(기본·페이지) · 302:2896(조건 적용) · 302:3007(결과 없음). design/steps/08-list-discovery.md
// 데이터는 LocalStorage 저장소(useBookings)에서만 읽고, 검색·상태·정렬·페이지는 URL 쿼리만 단일 출처로 쓴다.
// 서버 렌더링·첫 하이드레이션은 항상 초기화 중 상태다(URL은 Suspense 안에서 클라이언트만 읽는다).

const SEARCH_DEBOUNCE_MS = 300;

// 스크롤 복원: 정규화된 조건 조합별 키. 예약 데이터(lessonconnect:bookings:v2)와 분리된 sessionStorage다.
const SCROLL_KEY_PREFIX = 'lessonconnect:bookings:list-scroll';
const scrollKey = (query: ListQuery) => `${SCROLL_KEY_PREFIX}:${serializeListQuery(query)}`;

function readSavedScroll(key: string): number {
  try {
    return Number(window.sessionStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function saveScroll(key: string, top: number) {
  try {
    window.sessionStorage.setItem(key, String(Math.round(top)));
  } catch {
    // 저장할 수 없으면 복원만 생략한다
  }
}

/** URL 쿼리를 읽는다. 정적 export에서 useSearchParams는 클라이언트에서만 값을 가지므로 Suspense 안에서 쓴다. */
export function BookingListFromQuery() {
  const params = useSearchParams();
  return <BookingListScreen params={params} />;
}

/** 정적 HTML·하이드레이션 전에 보이는 초기화 화면(Suspense fallback). 저장소·URL을 읽지 않는다. */
export function BookingListLoading() {
  return (
    <ListLayout
      state={{ status: 'initializing' }}
      top={null}
      controls={<DiscoveryControls query={DEFAULT_LIST_QUERY} draft="" disabled countLabel="예약 확인 중" />}
      body={<LoadingState />}
    />
  );
}

type Navigate = (next: ListQuery, mode: 'push' | 'replace') => void;

type ParamsLike = Pick<URLSearchParams, 'getAll' | 'keys' | 'toString'>;

function BookingListScreen({ params }: { params: ParamsLike }) {
  const { state, retry, retrying } = useBookings();
  const now = useNow();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const ready = state.status === 'ready';

  // 상세에서 삭제 성공 직후 같은 탭 이동으로 넘어온 경우에만 한 번 보인다(새로고침·직접 방문에는 없음).
  const [flash] = React.useState(peekListFlash);
  React.useEffect(() => clearListFlash(), []);

  const search = params.toString();
  const query = React.useMemo(() => parseListQuery(params), [search]);
  /** 가장 최근에 의도한 조건. 라우터가 useSearchParams를 갱신하기 전에 이어지는 조작(칩 → 정렬 등)도 이 값 위에서 계산한다. */
  const queryRef = React.useRef(query);
  /** 이 화면이 history에 쓴 뒤 라우터가 아직 반영하지 않은 정규 쿼리. null이면 대기 중인 자체 변경이 없다. */
  const intentRef = React.useRef<string | null>(null);

  /** 화면 안 조작의 URL 반영. Next.js 라우터와 연동되는 history API를 써서 useSearchParams가 갱신된다. */
  /** 자체 변경이 아직 라우터에 반영되지 않은 중간 상태인지. 이때는 보정·정규화를 하지 않는다(최신 의도를 덮지 않게). */
  const isStale = React.useCallback((q: ListQuery) => intentRef.current !== null && intentRef.current !== serializeListQuery(q), []);

  const navigate = React.useCallback<Navigate>((next, mode) => {
    queryRef.current = next;
    intentRef.current = serializeListQuery(next);
    const href = bookingListHref(next);
    try {
      if (mode === 'push') window.history.pushState(null, '', href);
      else window.history.replaceState(null, '', href);
    } catch {
      // history를 쓸 수 없는 환경이면 조건 반영을 생략한다
    }
  }, []);

  // 잘못된 쿼리(알 수 없는·중복 파라미터, 허용되지 않은 값, 순서 차이)는 정규 URL로 replace한다.
  // 초기화 중·읽기 실패여도 조건 자체는 URL에 유지한다(범위 보정은 조회 성공 뒤에만).
  React.useEffect(() => {
    if (isStale(query)) return;
    if (!isCanonicalListSearch(params, query)) navigate(query, 'replace');
  }, [params, query, navigate, isStale]);

  // 검색 입력: 즉시 화면에 보이고, 결과·URL은 입력이 멈춘 뒤 300ms에 replace한다.
  const [draft, setDraft] = React.useState(query.q);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const timerRef = React.useRef<number | null>(null);
  const cancelPendingSearch = React.useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  React.useEffect(() => cancelPendingSearch, [cancelPendingSearch]);
  // 브라우저 뒤로/앞으로 이동은 외부 변경이다. 대기 중인 자체 변경 표시를 지운다.
  React.useEffect(() => {
    const onPopState = () => {
      intentRef.current = null;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  // 라우터의 쿼리가 바뀌면:
  // - 이 화면이 쓴 변경의 반영이면(중간 단계 포함) 입력값을 건드리지 않는다. 늦게 도착한 반영이 그사이 입력한 글자를 지우지 않게 한다.
  // - 뒤로 가기 등 외부 변경이면 기준 조건과 입력값을 URL에 맞춘다(공백 차이만 있으면 입력 중인 값 유지).
  React.useEffect(() => {
    if (intentRef.current !== null) {
      if (intentRef.current === serializeListQuery(query)) intentRef.current = null;
      return;
    }
    queryRef.current = query;
    if (normalizeSearchText(draftRef.current) !== query.q) {
      cancelPendingSearch();
      setDraft(query.q);
    }
  }, [query, cancelPendingSearch]);

  /** 대기 중인 검색어를 포함한 현재 조건. 칩·정렬을 바꿀 때 입력 중이던 검색어를 잃지 않게 한다. */
  const currentWithDraft = React.useCallback((): ListQuery => {
    cancelPendingSearch();
    return { ...queryRef.current, q: normalizeSearchText(draftRef.current) };
  }, [cancelPendingSearch]);

  const commitSearch = React.useCallback(
    (text: string) => {
      cancelPendingSearch();
      const q = normalizeSearchText(text);
      if (q === queryRef.current.q) return;
      navigate({ ...queryRef.current, q, page: 1 }, 'replace');
    },
    [cancelPendingSearch, navigate],
  );

  const onDraftChange = (value: string) => {
    const next = clampSearchInput(value);
    setDraft(next);
    cancelPendingSearch();
    timerRef.current = window.setTimeout(() => commitSearch(next), SEARCH_DEBOUNCE_MS);
  };
  const clearSearch = () => {
    setDraft('');
    commitSearch('');
  };
  const changeStatus = (status: ListStatus) => {
    const base = currentWithDraft();
    if (status === base.status && base.q === queryRef.current.q) return;
    navigate({ ...base, status, page: 1 }, 'push');
  };
  const changeSort = (sort: ListSort) => {
    const base = currentWithDraft();
    navigate({ ...base, sort, page: 1 }, 'push');
  };
  const resetAll = () => {
    cancelPendingSearch();
    setDraft('');
    navigate(DEFAULT_LIST_QUERY, 'push');
  };

  const discovery = React.useMemo(() => (state.status === 'ready' ? applyDiscovery(state.bookings, now, query) : null), [state, now, query]);

  // 범위를 벗어난 페이지(직접 URL, 삭제·시간 경과·다른 탭 변경으로 결과가 줄어듦)는 마지막 유효 페이지로 replace한다.
  React.useEffect(() => {
    if (discovery && discovery.page !== query.page && !isStale(query)) navigate({ ...query, page: discovery.page }, 'replace');
  }, [discovery, query, navigate, isStale]);

  const goToPage = (page: number) => navigate({ ...queryRef.current, page }, 'push');

  // 스크롤: 조회 성공 직후 한 번은 같은 조건 키의 위치를 복원하고(상세 → 목록 복귀),
  // 그 뒤 조건·페이지가 바뀔 때마다 맨 위에서 시작한다. 다른 조건의 위치는 적용하지 않는다.
  const key = scrollKey(discovery ? { ...query, page: discovery.page } : query);
  const restoredRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!ready) return;
    const el = viewportRef.current;
    if (!el) return;
    if (!restoredRef.current) {
      restoredRef.current = true;
      el.scrollTop = readSavedScroll(key);
    } else {
      el.scrollTop = 0;
    }
  }, [ready, key]);

  const filtered = hasFilter(query);
  const total = ready ? state.bookings.length : 0;
  const countLabel =
    state.status === 'ready'
      ? filtered && total > 0
        ? `검색 결과 ${discovery?.resultCount ?? 0}건`
        : `예약 ${total}건`
      : state.status === 'error'
        ? '예약을 불러올 수 없어요'
        : '예약 확인 중';

  return (
    <ListLayout
      state={state}
      viewportRef={viewportRef}
      onViewportScroll={(top) => ready && saveScroll(key, top)}
      top={<ListTop ready={ready} flash={flash} />}
      controls={
        <DiscoveryControls
          query={query}
          draft={draft}
          disabled={!ready}
          countLabel={countLabel}
          onDraftChange={onDraftChange}
          onCommitSearch={() => commitSearch(draftRef.current)}
          onClearSearch={clearSearch}
          onStatus={changeStatus}
          onSort={changeSort}
          onReset={resetAll}
        />
      }
      body={
        state.status === 'initializing' ? (
          <LoadingState />
        ) : state.status === 'error' ? (
          <ErrorState code={state.error.code} retrying={retrying} onRetry={retry} />
        ) : total === 0 ? (
          <div className="lc-list-state">
            <span className="lc-list-state__icon"><img src="/assets/ui/calendar.svg" alt="" width={20} height={20} /></span>
            <p className="lc-list-state__title">아직 예약한 레슨이 없어요</p>
            <p className="lc-list-state__description">마음에 드는 강사와 첫 레슨을 시작해보세요.</p>
          </div>
        ) : !discovery || discovery.resultCount === 0 ? (
          <div className="lc-list-state lc-discovery-empty">
            <p className="lc-list-state__title">검색 결과가 없어요</p>
            <p className="lc-list-state__description">검색어나 필터를 바꿔 다시 찾아보세요.</p>
            <Button type="button" variant="appSecondary" className="lc-button--outline lc-discovery-empty__reset" onClick={resetAll}>조건 초기화</Button>
          </div>
        ) : (
          <>
            <ul className="lc-booking-list" aria-label={`${countLabel}, ${discovery.page} / ${discovery.pageCount} 페이지`}>
              {discovery.rows.map(({ booking, phase }) => (
                <li key={booking.id}>
                  <BookingCard
                    booking={booking}
                    phase={phase}
                    context={{ ...query, page: discovery.page }}
                    onNavigate={() => saveScroll(key, viewportRef.current?.scrollTop ?? 0)}
                  />
                </li>
              ))}
            </ul>
            <p className="lc-list-footnote">예약은 이 브라우저에만 저장돼요.</p>
          </>
        )
      }
      pagination={discovery && discovery.resultCount > 0 && discovery.pageCount > 1 ? <Pagination page={discovery.page} pageCount={discovery.pageCount} onPage={goToPage} /> : null}
    />
  );
}

function ListLayout({
  state, top, controls, body, pagination = null, viewportRef, onViewportScroll,
}: {
  state: BookingsState;
  top: React.ReactNode;
  controls: React.ReactNode;
  body: React.ReactNode;
  pagination?: React.ReactNode;
  viewportRef?: React.Ref<HTMLDivElement>;
  onViewportScroll?: (top: number) => void;
}) {
  return (
    <div className="lc-app lc-app--list">
      <div className="lc-app__top">
        {top ?? <ListTop ready={false} flash={null} />}
        {controls}
      </div>
      <div
        ref={viewportRef}
        className="lc-list-viewport lc-list-viewport--discovery"
        aria-busy={state.status === 'initializing' || undefined}
        onScroll={onViewportScroll ? (e) => onViewportScroll(e.currentTarget.scrollTop) : undefined}
      >
        {body}
      </div>
      {pagination}
      <BottomNav current="bookings" />
    </div>
  );
}

function ListTop({ ready, flash }: { ready: boolean; flash: ListFlashKind | null }) {
  const flashRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (flash) flashRef.current?.focus(); // 삭제 성공 뒤 포커스를 성공 Alert로 옮긴다
  }, [flash]);
  return (
    <>
      <PageHeader title="예약 내역" />
      {flash ? (
        <div ref={flashRef} tabIndex={-1} className="lc-list-flash">
          <InlineAlert tone="success" title={SUCCESS_MESSAGES[flash]}>삭제한 기록은 복구할 수 없어요.</InlineAlert>
        </div>
      ) : null}
      <div className="lc-list-intro">
        <h2 className="lc-list-intro__title">내 레슨</h2>
        <p className="lc-list-intro__description">예약한 레슨과 지난 기록을 확인하세요.</p>
      </div>
      {ready ? (
        <Button asChild variant="appPrimary" className="lc-list-cta">
          <Link href={NEW_BOOKING_HREF}>새 레슨 예약</Link>
        </Button>
      ) : (
        <Button variant="appPrimary" className="lc-list-cta" disabled>새 레슨 예약</Button>
      )}
    </>
  );
}

function DiscoveryControls({
  query, draft, disabled, countLabel, onDraftChange, onCommitSearch, onClearSearch, onStatus, onSort, onReset,
}: {
  query: ListQuery;
  draft: string;
  disabled: boolean;
  countLabel: string;
  onDraftChange?: (value: string) => void;
  onCommitSearch?: () => void;
  onClearSearch?: () => void;
  onStatus?: (status: ListStatus) => void;
  onSort?: (sort: ListSort) => void;
  onReset?: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const summary = describeListQuery(query);
  return (
    <div className="lc-discovery">
      <div className="lc-search" role="search">
        <label className="lc-field__label" htmlFor="booking-search">예약 검색</label>
        <div className="lc-search__box">
          <img className="lc-search__icon" src="/assets/ui/nav-search.svg" alt="" width={18} height={18} />
          <input
            ref={inputRef}
            id="booking-search"
            className="lc-control lc-search__input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="강사, 악기, 공간 검색"
            value={draft}
            disabled={disabled}
            onChange={(e) => onDraftChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onCommitSearch?.();
              } else if (e.key === 'Escape' && draft !== '') {
                e.preventDefault();
                onClearSearch?.();
              }
            }}
          />
          {draft !== '' && !disabled ? (
            <button
              type="button"
              className="lc-search__clear lc-focus-ring"
              aria-label="검색어 지우기"
              onClick={() => {
                onClearSearch?.();
                inputRef.current?.focus();
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="lc-chips" role="group" aria-label="예약 상태 필터">
        {LIST_STATUSES.map((status) => {
          const selected = query.status === status;
          return (
            <button
              key={status}
              type="button"
              className="lc-chip lc-focus-ring"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onStatus?.(status)}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>

      <div className="lc-discovery__row">
        <p className="lc-discovery__count" aria-live="polite">{countLabel}</p>
        <div className="lc-select lc-sort">
          <label className="sr-only" htmlFor="booking-sort">정렬</label>
          <select
            id="booking-sort"
            className="lc-control lc-sort__control"
            value={query.sort}
            disabled={disabled}
            onChange={(e) => onSort?.(e.target.value as ListSort)}
          >
            {LIST_SORTS.map((sort) => (
              <option key={sort} value={sort}>{SORT_LABELS[sort]}</option>
            ))}
          </select>
          <img className="lc-select__icon" src="/assets/ui/chevron-down.svg" alt="" width={16} height={16} />
        </div>
      </div>

      <div className="lc-discovery__summary">
        <p className="lc-discovery__conditions"><span className="sr-only">적용 조건: </span>{summary}</p>
        {!isDefaultListQuery(query) && !disabled ? (
          <button type="button" className="lc-discovery__reset lc-focus-ring" onClick={onReset}>초기화</button>
        ) : null}
      </div>
    </div>
  );
}

function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  // 끝 페이지에 도달해 누른 버튼이 비활성되면 포커스를 반대쪽 버튼으로 옮겨 잃지 않게 한다.
  const focusAfterRef = React.useRef<'prev' | 'next' | null>(null);
  React.useEffect(() => {
    const target = focusAfterRef.current;
    focusAfterRef.current = null;
    if (target === 'prev') prevRef.current?.focus();
    if (target === 'next') nextRef.current?.focus();
  }, [page]);
  return (
    <nav className="lc-pagination" aria-label="예약 목록 페이지">
      <Button
        ref={prevRef}
        type="button"
        variant="appSecondary"
        className="lc-button--outline lc-pagination__button"
        aria-label="이전 페이지"
        disabled={page <= 1}
        onClick={() => {
          if (page - 1 <= 1) focusAfterRef.current = 'next';
          onPage(page - 1);
        }}
      >
        이전
      </Button>
      <p className="lc-pagination__current"><span className="sr-only">현재 페이지 </span>{page} / {pageCount}</p>
      <Button
        ref={nextRef}
        type="button"
        variant="appSecondary"
        className="lc-button--outline lc-pagination__button"
        aria-label="다음 페이지"
        disabled={page >= pageCount}
        onClick={() => {
          if (page + 1 >= pageCount) focusAfterRef.current = 'prev';
          onPage(page + 1);
        }}
      >
        다음
      </Button>
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="lc-list-state" role="status">
      <img className="lc-spinner lc-list-state__spinner" src="/assets/ui/loading.svg" alt="" width={28} height={28} />
      <p className="lc-list-state__title">예약을 불러오는 중이에요</p>
      <p className="lc-list-state__description">저장된 예약을 확인하고 있어요.</p>
    </div>
  );
}

function ErrorState({ code, retrying, onRetry }: { code: keyof typeof ERROR_MESSAGES; retrying: boolean; onRetry: () => void }) {
  return (
    <div className="lc-list-state lc-list-state--error">
      <InlineAlert tone="error" title="예약을 불러오지 못했어요">{ERROR_MESSAGES[code]}</InlineAlert>
      <p className="lc-list-state__title">예약 내역을 표시할 수 없어요</p>
      <p className="lc-list-state__description">다시 시도해도 열리지 않으면 브라우저 설정을 확인해주세요.</p>
      <Button variant="appPrimary" className="lc-list-cta" loading={retrying} busyLabel="다시 불러오는 중…" onClick={onRetry}>다시 시도</Button>
    </div>
  );
}
