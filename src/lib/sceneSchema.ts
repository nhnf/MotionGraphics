// Runtime validator untuk SceneSpec — output JSON dari Gemini API harus
// melewati gerbang ini sebelum disimpan ke `sceneStore` atau dipakai untuk
// render. Implementasi memakai type guard manual (tanpa Zod) sesuai keputusan
// design.md "Components and Interfaces > SceneSpec schema": dependency
// minimal, error message custom, dan pesan field-spesifik untuk debugging.
//
// Catatan range fps:
//   Validator menerima fps di {24, 30, 60} sesuai task description (task 2).
//   Konstanta `SUPPORTED_FPS` di `@/constants` hanya berisi {24, 30} karena
//   itu adalah pilihan yang muncul di dropdown ExportBar (UI). Kita tidak
//   ingin validator menolak SceneSpec yang men-target 60 fps secara internal
//   walaupun UI saat ini belum menampilkan opsi tersebut.

import {
  MAX_FONT_SIZE,
  MAX_VIDEO_DURATION_SECONDS,
  MIN_FONT_SIZE,
  MIN_VIDEO_DURATION_SECONDS,
} from '@/constants';
import { ParseError } from '@/lib/errors';
import type {
  AnimationType,
  ExitAnimationType,
  FontWeight,
  Scene,
  SceneSpec,
  SceneType,
} from '@/types/SceneSpec';

// --- Allowed enum values ---------------------------------------------------

const SCENE_TYPES: readonly SceneType[] = [
  'title',
  'subtitle',
  'quote',
  'lowerThird',
  'promo',
  'blank',
];

const ANIMATION_TYPES: readonly AnimationType[] = [
  'fadeIn',
  'slideFromLeft',
  'slideFromBottom',
  'scaleUp',
  'typewriter',
];

const EXIT_ANIMATION_TYPES: readonly ExitAnimationType[] = ['fadeOut', 'slideOut', 'none'];

const FONT_WEIGHTS: readonly FontWeight[] = ['regular', 'bold'];

/**
 * Nilai fps yang diizinkan validator. Lihat catatan di header file —
 * berbeda dengan `SUPPORTED_FPS` di constants yang hanya untuk UI.
 */
const ALLOWED_VALIDATOR_FPS: readonly number[] = [24, 30, 60];

// --- Primitive type guards -------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

// --- Internal validator ----------------------------------------------------
//
// Kita pisahkan `assertSceneSpec` (melempar `ParseError` dengan pesan field
// spesifik) dari `isSceneSpec` (boolean). Type guard mempertahankan kontrak
// API publik yang dijanjikan design.md, sementara `assertSceneSpec` memberi
// pesan diagnostik yang dipakai `validateSceneSpec`.

function assertScene(value: unknown, index: number): asserts value is Scene {
  const path = `scenes[${index}]`;

  if (!isPlainObject(value)) {
    throw new ParseError(`${path} harus berupa objek`);
  }

  if (!isNonEmptyString(value.id)) {
    throw new ParseError(`${path}.id harus string non-empty`);
  }

  if (typeof value.type !== 'string' || !SCENE_TYPES.includes(value.type as SceneType)) {
    throw new ParseError(
      `${path}.type tidak valid (harus salah satu dari: ${SCENE_TYPES.join(', ')})`
    );
  }

  if (!isNonEmptyString(value.text)) {
    throw new ParseError(`${path}.text harus string non-empty`);
  }

  // subText opsional — boleh undefined, tapi tidak boleh null atau tipe lain
  if (value.subText !== undefined && !isNonEmptyString(value.subText)) {
    throw new ParseError(`${path}.subText harus string non-empty saat diset`);
  }

  if (!isNonEmptyString(value.color)) {
    throw new ParseError(`${path}.color harus string non-empty (CSS color)`);
  }

  // bgColor opsional — fallback ke SceneSpec.bgColor di renderer
  if (value.bgColor !== undefined && !isNonEmptyString(value.bgColor)) {
    throw new ParseError(`${path}.bgColor harus string non-empty saat diset`);
  }

  if (
    !isFiniteNumber(value.fontSize) ||
    value.fontSize < MIN_FONT_SIZE ||
    value.fontSize > MAX_FONT_SIZE
  ) {
    throw new ParseError(
      `${path}.fontSize harus angka antara ${MIN_FONT_SIZE} dan ${MAX_FONT_SIZE}`
    );
  }

  if (
    typeof value.fontWeight !== 'string' ||
    !FONT_WEIGHTS.includes(value.fontWeight as FontWeight)
  ) {
    throw new ParseError(
      `${path}.fontWeight tidak valid (harus salah satu dari: ${FONT_WEIGHTS.join(', ')})`
    );
  }

  if (!isNonNegativeInteger(value.startFrame)) {
    throw new ParseError(`${path}.startFrame harus integer non-negatif`);
  }

  if (!isNonNegativeInteger(value.endFrame)) {
    throw new ParseError(`${path}.endFrame harus integer non-negatif`);
  }

  if (value.startFrame >= value.endFrame) {
    throw new ParseError(
      `${path} memiliki range frame invalid: startFrame (${value.startFrame}) harus < endFrame (${value.endFrame})`
    );
  }

  if (
    typeof value.animation !== 'string' ||
    !ANIMATION_TYPES.includes(value.animation as AnimationType)
  ) {
    throw new ParseError(
      `${path}.animation tidak valid (harus salah satu dari: ${ANIMATION_TYPES.join(', ')})`
    );
  }

  if (
    typeof value.exitAnimation !== 'string' ||
    !EXIT_ANIMATION_TYPES.includes(value.exitAnimation as ExitAnimationType)
  ) {
    throw new ParseError(
      `${path}.exitAnimation tidak valid (harus salah satu dari: ${EXIT_ANIMATION_TYPES.join(', ')})`
    );
  }
}

function assertSceneSpec(value: unknown): asserts value is SceneSpec {
  if (!isPlainObject(value)) {
    throw new ParseError('SceneSpec harus berupa objek');
  }

  if (!isNonEmptyString(value.title)) {
    throw new ParseError('title harus string non-empty');
  }

  if (
    !isFiniteNumber(value.totalDuration) ||
    value.totalDuration < MIN_VIDEO_DURATION_SECONDS ||
    value.totalDuration > MAX_VIDEO_DURATION_SECONDS
  ) {
    throw new ParseError(
      `totalDuration harus angka antara ${MIN_VIDEO_DURATION_SECONDS} dan ${MAX_VIDEO_DURATION_SECONDS} detik`
    );
  }

  if (!isFiniteNumber(value.fps) || !ALLOWED_VALIDATOR_FPS.includes(value.fps)) {
    throw new ParseError(`fps harus salah satu dari: ${ALLOWED_VALIDATOR_FPS.join(', ')}`);
  }

  if (!isPositiveInteger(value.width)) {
    throw new ParseError('width harus integer positif');
  }

  if (!isPositiveInteger(value.height)) {
    throw new ParseError('height harus integer positif');
  }

  if (!isNonEmptyString(value.bgColor)) {
    throw new ParseError('bgColor harus string non-empty (CSS color)');
  }

  if (!Array.isArray(value.scenes)) {
    throw new ParseError('scenes harus berupa array');
  }

  if (value.scenes.length === 0) {
    throw new ParseError('scenes tidak boleh kosong');
  }

  // Per-scene validation — fail-fast pada error pertama, pesan menyebut index.
  const maxFrame = Math.floor(value.totalDuration * value.fps);
  const seenIds = new Set<string>();

  for (let i = 0; i < value.scenes.length; i++) {
    const scene = value.scenes[i];
    assertScene(scene, i);

    // Cross-field check: endFrame tidak boleh melewati total durasi
    if (scene.endFrame > maxFrame) {
      throw new ParseError(
        `scenes[${i}].endFrame (${scene.endFrame}) melebihi total durasi (${maxFrame} frame = totalDuration × fps)`
      );
    }

    // Cek uniqueness id — dipakai sebagai React key di SceneList
    if (seenIds.has(scene.id)) {
      throw new ParseError(`scenes[${i}].id duplikat: "${scene.id}" sudah dipakai scene lain`);
    }
    seenIds.add(scene.id);
  }
}

// --- Public API ------------------------------------------------------------

/**
 * Type guard: cek apakah `value` valid sebagai `SceneSpec`. Tidak melempar —
 * mengembalikan `false` saat ada pelanggaran. Pakai ini untuk branching tanpa
 * exception (mis. retry loop di `lib/gemini.ts`).
 *
 * Untuk pesan error spesifik, pakai {@link validateSceneSpec} yang melempar
 * `ParseError` dengan field path.
 */
export function isSceneSpec(value: unknown): value is SceneSpec {
  try {
    assertSceneSpec(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validasi `value` sebagai `SceneSpec`. Mengembalikan nilai asli (sudah
 * dipersempit tipe-nya) jika valid; melempar `ParseError` dengan pesan
 * yang menyebut field bermasalah jika tidak.
 *
 * @param value - Output Gemini API yang sudah diparse (atau apapun bertipe `unknown`)
 * @returns SceneSpec yang sudah tervalidasi
 * @throws {ParseError} Saat ada field yang tidak memenuhi kontrak
 */
export function validateSceneSpec(value: unknown): SceneSpec {
  assertSceneSpec(value);
  return value;
}
