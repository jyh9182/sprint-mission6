import Link from 'next/link';
import { BOOKINGS_HREF } from '@/lib/bookings/routes';

/**
 * 앱 하단 내비게이션. Figma "Bottom Navigation"(30:126), 예약 선택 인스턴스.
 * 이 프로젝트에는 앱 홈·찾기·마이 화면이 아직 없다.
 * - 홈: 현재 서비스 홈인 랜딩(`/`)으로 연결
 * - 찾기·마이: 목적지가 없어 링크를 만들지 않고 "준비 중"으로 표시(누르면 아무 동작 없음)
 * 아이콘은 Figma 예약 선택 인스턴스 그대로(예약만 진한 색). 다른 탭 선택 화면이 생기면 선택 아이콘을 추가한다.
 */
type Tab = 'home' | 'search' | 'bookings' | 'my';

const TABS: { id: Tab; label: string; href?: string; icon: string }[] = [
  { id: 'home', label: '홈', href: '/', icon: '/assets/ui/nav-home.svg' },
  { id: 'search', label: '찾기', icon: '/assets/ui/nav-search.svg' },
  { id: 'bookings', label: '예약', href: BOOKINGS_HREF, icon: '/assets/ui/nav-booking-active.svg' },
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
              <img src={tab.icon} alt="" width={25} height={25} />
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
