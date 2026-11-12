import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
const figmaPreviewHost = process.env.LESSONCONNECT_FIGMA_PREVIEW_HOST;
const config: NextConfig = {
  output: 'export',
  images: {unoptimized: true},
  devIndicators: false,
  turbopack: {root: process.cwd()},
  // Only the explicitly configured Figma preview may use the remote dev server.
  allowedDevOrigins: figmaPreviewHost ? [figmaPreviewHost] : [],
};
// `*.dev.tsx` 페이지(예: app/ui-check/page.dev.tsx 공통 UI 확인 화면)는 개발 서버에서만 라우트가 된다.
// production build(`out/`)에는 포함되지 않는다.
export default function nextConfig(phase: string): NextConfig {
  const pageExtensions = phase === PHASE_DEVELOPMENT_SERVER ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'];
  return {...config, pageExtensions};
}
