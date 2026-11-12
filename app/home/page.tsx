import type { Metadata } from 'next';
import { AppHomeScreen } from '@/components/app/app-home-screen';

export const metadata: Metadata = { title: '홈 | 레슨커넥트AI' };

// 10단계 앱 홈. 정적 HTML에는 초기화 중 상태만 들어가고, 예약 현황은 브라우저에서 LocalStorage v2를 읽어 계산한다.
export default function AppHomePage() {
  return <AppHomeScreen />;
}
