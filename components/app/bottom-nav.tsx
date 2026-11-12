import Link from 'next/link';
import { BOOKINGS_HREF, HOME_HREF } from '@/lib/bookings/routes';

/**
 * 앱 하단 내비게이션. Figma "Bottom Navigation"(30:126).
 * - 홈: 10단계 앱 홈 `/home`(예약 현황). 서비스 소개 랜딩 `/`와 구분한다(design/handoff.md §3).
 * - 예약: 예약 목록 `/bookings`
 * - 찾기·마이: 목적지가 없어 링크를 만들지 않고 "준비 중"으로 표시(누르면 아무 동작 없음)
 * 선택된 탭만 진한 아이콘을 쓴다.
 */
type Tab = 'home' | 'search' | 'bookings' | 'my';

const TABS: { id: Tab; label: string; href?: string; icon: string; activeIcon?: string }[] = [
  { id: 'home', label: '홈', href: HOME_HREF, icon: '/assets/ui/nav-home.svg', activeIcon: '/assets/ui/nav-home-active.svg' },
  { id: 'search', label: '찾기', icon: '/assets/ui/nav-search.svg' },
  { id: 'bookings', label: '예약', href: BOOKINGS_HREF, icon: '/assets/ui/nav-booking.svg', activeIcon: '/assets/ui/nav-booking-active.svg' },
  { id: 'my', label: '마이', icon: '/assets/ui/nav-my.svg' },
];

export function BottomNav({ current }: { current: Tab }) {
  return (
    <nav className="lc-bottom-nav" aria-label="앱 메뉴">
      <ul>
        {TABS.map((tab) => {
          const active = tab.id === current;
          const content = (
            <>
              <img src={active && tab.activeIcon ? tab.activeIcon : tab.icon} alt="" width={25} height={25} />
              <span>{tab.label}</span>
            </>
          );
          return (
            <li key={tab.id}>
              {tab.href ? (
                <Link href={tab.href} className="lc-bottom-nav__tab lc-focus-ring" aria-current={active ? 'page' : undefined} data-active={active || undefined}>
                  {content}
                </Link>
              ) : (
                <span className="lc-bottom-nav__tab" aria-disabled="true">
                  {content}
                  <span className="sr-only"> (준비 중)</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
