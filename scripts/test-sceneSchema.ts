// Test manual sederhana untuk `src/lib/sceneSchema.ts`. Dijalankan dengan:
//
//   npx tsx --tsconfig tsconfig.web.json scripts/test-sceneSchema.ts
//
// Flag `--tsconfig` diperlukan agar tsx me-resolve path alias `@/*` yang
// didefinisikan di `tsconfig.web.json`. Tanpa itu, alias gagal di-resolve.
//
// Tujuannya validasi kontrak validator: 1 SceneSpec valid harus diterima,
// dan 5 contoh invalid (per task description) harus ditolak dengan pesan
// `ParseError` yang menyebut field bermasalah. Tidak memakai test framework
// agar tidak menambah dependency MVP — sesuai catatan tasks.md.

import { isSceneSpec, validateSceneSpec } from '@/lib/sceneSchema';
import { ParseError } from '@/lib/errors';
import type { SceneSpec } from '@/types/SceneSpec';

// --- Tiny assertion harness -----------------------------------------------

let passed = 0;
let failed = 0;

function pass(name: string): void {
  passed++;
  // eslint-disable-next-line no-console
  console.log(`  PASS  ${name}`);
}

function fail(name: string, reason: string): void {
  failed++;
  // eslint-disable-next-line no-console
  console.error(`  FAIL  ${name}\n        ${reason}`);
}

function expectAccepts(name: string, value: unknown): void {
  try {
    const result = validateSceneSpec(value);
    if (isSceneSpec(value) && result === value) {
      pass(name);
    } else {
      fail(name, 'isSceneSpec/validateSceneSpec tidak konsisten');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(name, `validator melempar: ${message}`);
  }
}

function expectRejects(name: string, value: unknown, expectedFieldHint: string): void {
  let threw = false;
  try {
    validateSceneSpec(value);
  } catch (error) {
    threw = true;
    if (!(error instanceof ParseError)) {
      fail(name, `error bukan ParseError, melainkan ${error?.constructor?.name ?? typeof error}`);
      return;
    }
    if (!error.message.includes(expectedFieldHint)) {
      fail(name, `pesan error tidak menyebut "${expectedFieldHint}" — pesan: ${error.message}`);
      return;
    }
    if (isSceneSpec(value)) {
      fail(name, 'isSceneSpec mengembalikan true untuk input yang seharusnya invalid');
      return;
    }
    pass(name);
  }
  if (!threw) {
    fail(name, 'validator menerima input invalid (tidak melempar)');
  }
}

// --- Fixture: SceneSpec valid ---------------------------------------------

const validSpec: SceneSpec = {
  title: 'Promo MVP',
  totalDuration: 5,
  fps: 30,
  width: 1920,
  height: 1080,
  bgColor: '#0a0a0a',
  scenes: [
    {
      id: 'scene-1',
      type: 'title',
      text: 'Selamat Datang',
      color: '#ffffff',
      fontSize: 96,
      fontWeight: 'bold',
      startFrame: 0,
      endFrame: 90,
      animation: 'fadeIn',
      exitAnimation: 'fadeOut',
    },
    {
      id: 'scene-2',
      type: 'quote',
      text: 'Code is poetry',
      subText: '— anonymous',
      color: '#ffffff',
      bgColor: '#01696f',
      fontSize: 72,
      fontWeight: 'regular',
      startFrame: 90,
      endFrame: 150,
      animation: 'slideFromLeft',
      exitAnimation: 'none',
    },
  ],
};

// --- Run tests ------------------------------------------------------------

// eslint-disable-next-line no-console
console.log('sceneSchema validator tests\n');

// 1 valid case
expectAccepts('accepts valid SceneSpec', validSpec);

// 5 invalid cases per task description
{
  // Missing field: hilangkan `fps`
  const { fps: _fps, ...missingFps } = validSpec;
  void _fps;
  expectRejects('rejects missing field (fps)', missingFps, 'fps');
}

{
  // Wrong type: width string, bukan number
  const wrongType: unknown = { ...validSpec, width: '1920' };
  expectRejects('rejects wrong type (width as string)', wrongType, 'width');
}

{
  // Frame out of range: endFrame melebihi totalDuration * fps (5 × 30 = 150)
  const outOfRange: SceneSpec = {
    ...validSpec,
    scenes: [
      {
        ...validSpec.scenes[0],
        startFrame: 0,
        endFrame: 200,
      },
    ],
  };
  expectRejects('rejects frame out of range (endFrame > totalDuration*fps)', outOfRange, 'endFrame');
}

{
  // Animation enum salah
  const wrongAnimation: unknown = {
    ...validSpec,
    scenes: [{ ...validSpec.scenes[0], animation: 'spin360' }],
  };
  expectRejects('rejects invalid animation enum', wrongAnimation, 'animation');
}

{
  // fps negatif
  const negativeFps: unknown = { ...validSpec, fps: -30 };
  expectRejects('rejects negative fps', negativeFps, 'fps');
}

// --- Summary --------------------------------------------------------------

// eslint-disable-next-line no-console
console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
