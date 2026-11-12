// 참고 이미지 계약의 순수 규칙 — design/data-contract.md §8.
// 저장소 읽기·쓰기 검증과 브라우저 변환(image-prepare.ts)이 같은 기준을 쓴다. 브라우저 API에 의존하지 않는다.

import type { ReferenceImage, ReferenceImageChange, ReferenceImageSourceMime } from './types';

export const REFERENCE_IMAGE_SOURCE_MIMES: readonly ReferenceImageSourceMime[] = ['image/jpeg', 'image/png', 'image/webp'];
export const REFERENCE_IMAGE_ACCEPT = REFERENCE_IMAGE_SOURCE_MIMES.join(',');
export const MAX_ORIGINAL_BYTES = 2 * 1024 * 1024; // 원본 2 MiB
export const MAX_LONG_EDGE_PX = 1280; // 변환 결과 긴 변
export const MAX_OUTPUT_BYTES = 500 * 1024; // 변환 바이너리 500 KiB
export const FILE_NAME_MAX_CODE_POINTS = 120;
export const WEBP_DATA_URL_PREFIX = 'data:image/webp;base64,';
/** 500 KiB 바이너리를 base64로 바꾼 최대 문자 수. 이보다 긴 Data URL은 디코딩 전에 거부한다. */
export const MAX_DATA_URL_LENGTH = WEBP_DATA_URL_PREFIX.length + Math.ceil(MAX_OUTPUT_BYTES / 3) * 4;

const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
// 제어문자(C0·C1·DEL)와 방향 제어 등 보이지 않는 서식 문자. 경로 구분자는 별도로 처리한다.
const UNSAFE_NAME_CHARS_RE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

/** 파일 앞부분 바이트로 실제 형식을 판별한다. 확장자·선언 MIME은 신뢰하지 않는다. */
export function sniffImageMime(bytes: Uint8Array): ReferenceImageSourceMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return 'image/png';
  if (isWebpHeader(bytes)) return 'image/webp';
  return null;
}

function isWebpHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  );
}

/** 표시용 안전한 기본 이름. 경로·제어문자를 지우고 120 code point로 자른다. 비면 기본 이름. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(UNSAFE_NAME_CHARS_RE, '').trim();
  const limited = Array.from(cleaned).slice(0, FILE_NAME_MAX_CODE_POINTS).join('').trim();
  return limited || '참고 이미지';
}

function isSafeFileName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const length = Array.from(value).length;
  return length >= 1 && length <= FILE_NAME_MAX_CODE_POINTS && value === value.trim() && !/[\\/]/.test(value) && !new RegExp(UNSAFE_NAME_CHARS_RE.source).test(value);
}

function isIntIn(value: unknown, min: number, max: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}

/** base64 문자열의 실제 바이트 수(패딩 반영). */
export function base64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function decodeBase64Prefix(base64: string, byteCount: number): Uint8Array | null {
  try {
    const chars = Math.ceil(byteCount / 3) * 4;
    const binary = atob(base64.slice(0, chars));
    return Uint8Array.from(binary.slice(0, byteCount), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * 저장·읽기 검증. prefix·길이 상한(디코딩 전)·base64 형식·실제 바이트 크기·WebP 시그니처와
 * RIFF 크기·메타데이터 범위를 모두 확인한다. 하나라도 어긋나면 false(레코드 손상).
 */
export function isValidReferenceImage(value: unknown): value is ReferenceImage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const keys = Object.keys(v).sort().join(',');
  if (keys !== 'dataUrl,fileName,height,mimeType,originalMimeType,originalSizeBytes,sizeBytes,width') return false;
  if (!isSafeFileName(v.fileName)) return false;
  if (!(REFERENCE_IMAGE_SOURCE_MIMES as readonly unknown[]).includes(v.originalMimeType)) return false;
  if (!isIntIn(v.originalSizeBytes, 1, MAX_ORIGINAL_BYTES)) return false;
  if (v.mimeType !== 'image/webp') return false;
  if (!isIntIn(v.sizeBytes, 1, MAX_OUTPUT_BYTES)) return false;
  if (!isIntIn(v.width, 1, MAX_LONG_EDGE_PX) || !isIntIn(v.height, 1, MAX_LONG_EDGE_PX)) return false;
  if (typeof v.dataUrl !== 'string' || v.dataUrl.length > MAX_DATA_URL_LENGTH || !v.dataUrl.startsWith(WEBP_DATA_URL_PREFIX)) return false;
  const base64 = v.dataUrl.slice(WEBP_DATA_URL_PREFIX.length);
  if (base64.length === 0 || !BASE64_RE.test(base64)) return false;
  if (base64ByteLength(base64) !== v.sizeBytes) return false;
  const head = decodeBase64Prefix(base64, 12);
  if (!head || !isWebpHeader(head)) return false;
  const riffSize = head[4] | (head[5] << 8) | (head[6] << 16) | (head[7] << 24);
  return riffSize + 8 === v.sizeBytes; // 잘리거나 덧붙은 바이트 거부
}

/** 저장소 입력 검증. 잘못된 명령은 null(→ VALIDATION_ERROR). 생략은 keep. */
export function normalizeImageChange(value: unknown): ReferenceImageChange | null {
  if (value === undefined) return { kind: 'keep' };
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.kind === 'keep') return { kind: 'keep' };
  if (v.kind === 'remove') return { kind: 'remove' };
  if (v.kind === 'replace' && isValidReferenceImage(v.image)) return { kind: 'replace', image: { ...v.image } };
  return null;
}

export function sameReferenceImage(a: ReferenceImage | null, b: ReferenceImage | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.fileName === b.fileName && a.originalMimeType === b.originalMimeType && a.originalSizeBytes === b.originalSizeBytes &&
    a.mimeType === b.mimeType && a.sizeBytes === b.sizeBytes && a.width === b.width && a.height === b.height && a.dataUrl === b.dataUrl
  );
}

/** `420KB` · `1.6MB` — 화면 표기용. */
export function formatImageBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
