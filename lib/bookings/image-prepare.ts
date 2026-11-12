// 선택한 파일을 참고 이미지(ReferenceImage)로 준비한다 — design/data-contract.md §8 "선택·축소·변환 규칙".
// 브라우저 API(File·createImageBitmap·Canvas)를 호출 시점에만 사용한다. 파일은 기기 밖으로 전송하지 않는다.
// 순서: 선언 MIME → 빈 파일 → 원본 2 MiB(디코딩 전 중단) → 시그니처 일치 → 디코딩 → 긴 변 1280px 축소 → WebP ≤ 500 KiB.

import {
  MAX_LONG_EDGE_PX,
  MAX_ORIGINAL_BYTES,
  MAX_OUTPUT_BYTES,
  REFERENCE_IMAGE_SOURCE_MIMES,
  isValidReferenceImage,
  sanitizeFileName,
  sniffImageMime,
} from './reference-image';
import type { ReferenceImage } from './types';

export type ImagePrepareError = 'type' | 'size' | 'decode' | 'encode';
export type ImagePrepareResult = { ok: true; image: ReferenceImage } | { ok: false; error: ImagePrepareError };

export const IMAGE_ERROR_MESSAGES: Record<ImagePrepareError, string> = {
  type: 'JPEG, PNG, WebP 이미지만 첨부할 수 있어요.',
  size: '원본 이미지는 2MB 이하만 첨부할 수 있어요.',
  decode: '이미지를 열 수 없어요. 다른 파일을 선택해주세요.',
  encode: '이미지를 준비하지 못했어요. 다른 파일로 다시 시도해주세요.',
};

/** 품질을 단계적으로 낮추고, 그래도 크면 픽셀을 줄인다. 반복 횟수와 최소 크기를 고정해 무한 반복·0px을 막는다. */
const QUALITY_STEPS = [0.86, 0.76, 0.66, 0.56, 0.46] as const;
const SCALE_STEP = 0.8;
const MAX_SCALE_ROUNDS = 5;
const MIN_LONG_EDGE_PX = 320;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

export async function prepareReferenceImage(file: File): Promise<ImagePrepareResult> {
  const declared = file.type;
  if (declared !== '' && !(REFERENCE_IMAGE_SOURCE_MIMES as readonly string[]).includes(declared)) return fail('type');
  if (file.size === 0) return fail('decode');
  if (file.size > MAX_ORIGINAL_BYTES) return fail('size');

  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  } catch {
    return fail('decode');
  }
  const sniffed = sniffImageMime(head);
  // 빈 MIME은 시그니처로 식별될 때만 허용. 선언 MIME과 시그니처가 다르면 형식 오류.
  if (!sniffed || (declared !== '' && declared !== sniffed)) return fail('type');

  const decoded = await decode(file);
  if (!decoded) return fail('decode');
  try {
    const encoded = await encodeWithinLimit(decoded);
    if (!encoded) return fail('encode');
    const image: ReferenceImage = {
      fileName: sanitizeFileName(file.name),
      originalMimeType: sniffed,
      originalSizeBytes: file.size,
      mimeType: 'image/webp',
      sizeBytes: encoded.blob.size,
      width: encoded.width,
      height: encoded.height,
      dataUrl: encoded.dataUrl,
    };
    // 저장소와 같은 검증기로 최종 확인한다(시그니처·바이트 수·픽셀 범위).
    return isValidReferenceImage(image) ? { ok: true, image } : fail('encode');
  } finally {
    decoded.release();
  }
}

function fail(error: ImagePrepareError): ImagePrepareResult {
  return { ok: false, error };
}

/** EXIF 방향은 브라우저가 해석한 결과를 쓴다(createImageBitmap 'from-image', <img> 기본 image-orientation). */
async function decode(file: File): Promise<Decoded | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width > 0 && bitmap.height > 0) return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
      bitmap.close();
      return null;
    } catch {
      return null;
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => undefined };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url); // 디코딩이 끝나면 즉시 해제(미리보기는 변환 결과 Data URL을 쓴다)
  }
}

async function encodeWithinLimit(decoded: Decoded): Promise<{ blob: Blob; width: number; height: number; dataUrl: string } | null> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;
  const longEdge = Math.max(decoded.width, decoded.height);
  let scale = Math.min(1, MAX_LONG_EDGE_PX / longEdge); // 작은 이미지는 확대하지 않는다

  for (let round = 0; round < MAX_SCALE_ROUNDS; round += 1) {
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(decoded.source, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const blob = await toBlob(canvas, quality);
      // WebP 인코딩을 지원하지 않는 환경은 PNG 등으로 대체 반환한다 → 변환 실패로 안내.
      if (!blob || blob.type !== 'image/webp') return null;
      if (blob.size > 0 && blob.size <= MAX_OUTPUT_BYTES) {
        const dataUrl = await blobToDataUrl(blob);
        return dataUrl ? { blob, width, height, dataUrl } : null;
      }
    }
    const nextLongEdge = Math.max(width, height) * SCALE_STEP;
    if (nextLongEdge < MIN_LONG_EDGE_PX) break;
    scale *= SCALE_STEP;
  }
  return null; // 제한까지 줄여도 500 KiB를 넘으면 초과 결과를 만들지 않는다
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
    } catch {
      resolve(null);
    }
  });
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
