'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 앱 화면 헤더. Figma "13 Booking / Header / Basic"(275:1551).
 * 뒤로 가기는 44×44 터치 영역. onBack이 없으면(Show back=false) 버튼을 DOM에서 제외하고
 * 빈 균형 영역으로 제목 가운데 정렬을 유지한다. 브라우저 status bar는 포함하지 않는다.
 */
export function PageHeader({ title, onBack, backLabel = '뒤로 가기', headingLevel = 1, className }: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  headingLevel?: 1 | 2;
  className?: string;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <header className={cn('lc-header', className)}>
      {onBack ? (
        <Button variant="ghost" size="icon" className="lc-header__back lc-focus-ring" aria-label={backLabel} onClick={onBack}>
          <img src="/assets/ui/back.svg" alt="" width={22} height={22} />
        </Button>
      ) : null}
      <Heading className="lc-header__title">{title}</Heading>
    </header>
  );
}
