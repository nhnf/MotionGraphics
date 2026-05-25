# Design Document

## Overview

MVP Motion Studio terdiri dari tiga layer arsitektural yang berkomunikasi via IPC: **Renderer (UI React)**, **Main (Electron + Node.js)**, dan **Remotion (komposisi video)**. Renderer memegang state UI (Zustand), menampilkan preview lewat `@remotion/player`, dan delegasi I/O berat (network call Gemini bisa di renderer karena sudah CSP-restricted, tapi render video MP4 selalu di main process karena butuh akses filesystem dan ffmpeg).

Desain mengikuti tiga prinsip:

1. **Single source of truth**: `SceneSpec` di `sceneStore` adalah satu-satunya representasi animasi. Preview dan export sama-sama membaca dari sana.
2. **Fail loudly with recovery**: Setiap async path punya tiga state UI eksplisit (loading, error, success). Gemini retry otomatis 2x; selebihnya naik ke pengguna.
3. **Security by isolation**: API key tidak pernah keluar dari main process kecuali saat dipakai di header request Gemini. Renderer tidak punya akses langsung ke `electron-store` atau filesystem.

## Architecture

### High-level data flow

```
┌─────────────────── Renderer Process (React) ─────────────────────┐
│                                                                  │
│  PromptInput ──► sceneStore.actions.setGenerating(true)          │
│       │                                                          │
│       └──► useGemini.generate(prompt) ───► gemini.ts ───┐        │
│                                                          │       │
│                                              fetch HTTPS │       │
│  PreviewPanel ◄── sceneStore.sceneSpec                   ▼       │
│       │                                          Gemini API      │
│       └──► @remotion/player                                      │
│                                                                  │
│  ExportBar ──► window.electronAPI.render.start(payload) ─┐       │
│                                                          │       │
└──────────────────────────────────────────────────────────┼───────┘
                                                           │ IPC
┌─────────────────── Main Process (Node.js) ──────────────▼────────┐
│                                                                  │
│  ipcMain.handle('render:start') ──► renderVideo() ──► MP4 file  │
│  ipcMain.handle('settings:get-api-key') ──► electron-store      │
│                                                                  │
│  @remotion/renderer.bundle() + renderMedia() ──► out.mp4        │
└──────────────────────────────────────────────────────────────────┘
```

### Process responsibility

| Concern | Process | Reason |
|---|---|---|
| UI state (Zustand stores) | Renderer | UI-local, tidak perlu IPC |
| Gemini API call | Renderer | CSP allow `connect-src` ke Gemini saja; main tidak perlu jadi proxy |
| API key persistence | Main | `electron-store` butuh Node.js, key tidak boleh ada di renderer storage |
| Video render (`renderMedia`) | Main | Butuh akses filesystem, ffmpeg binary, dan event loop tidak terblokir UI |
| File dialog (save-as) | Main | Native API hanya tersedia di main |

### Module map

```
src/
├── lib/
│   ├── gemini.ts          ← generateSceneSpec(prompt, apiKey)
│   ├── sceneSchema.ts     ← validateSceneSpec(unknown): SceneSpec
│   └── ipc.ts             ← typed wrapper untuk window.electronAPI
├── stores/
│   ├── sceneStore.ts      ← sceneSpec, isGenerating, error
│   ├── settingsStore.ts   ← apiKey (cached), hasApiKey, exportSettings
│   └── renderStore.ts     ← isRendering, progress, currentRenderPath
├── hooks/
│   ├── useGemini.ts       ← generate flow + error mapping ke UI
│   └── useRender.ts       ← export flow + IPC progress listener
├── components/
│   ├── ui/                ← Button, Input, Modal, ProgressBar
│   └── features/
│       ├── PromptInput.tsx
│       ├── PreviewPanel.tsx
│       ├── SceneList.tsx
│       └── ExportBar.tsx
├── pages/
│   ├── Editor.tsx
│   └── Settings.tsx
└── types/
    ├── SceneSpec.ts       ← interface SceneSpec, Scene, Animation, dll
    └── ipc.ts             ← shape IPC payload & response

electron/
├── main.ts                ← createWindow + register handlers
├── preload.ts             ← contextBridge expose electronAPI
├── ipc/
│   ├── render.ts          ← registerRenderHandlers()
│   ├── settings.ts        ← registerSettingsHandlers()
│   └── file.ts            ← registerFileHandlers()
└── services/
    ├── secureStore.ts     ← wrapper electron-store dengan AES
    └── videoRenderer.ts   ← bundle + renderMedia

remotion/
├── index.ts               ← registerRoot(RootComposition)
├── RootComposition.tsx    ← maps SceneSpec ke <Series.Sequence>
└── scenes/
    ├── TitleCard.tsx
    ├── QuoteCard.tsx
    ├── LowerThird.tsx
    ├── PromoCard.tsx
    └── BlankScene.tsx
```

## Components and Interfaces

### `SceneSpec` schema

Tipe canonical di `src/types/SceneSpec.ts` mengikuti PRD Section 4.1 F-02.

```typescript
export type SceneType = 'title' | 'subtitle' | 'quote' | 'lowerThird' | 'promo' | 'blank';

export type AnimationType =
  | 'fadeIn'
  | 'slideFromLeft'
  | 'slideFromBottom'
  | 'scaleUp'
  | 'typewriter';

export type ExitAnimationType = 'fadeOut' | 'slideOut' | 'none';

export interface Scene {
  id: string;
  type: SceneType;
  text: string;
  subText?: string;
  color: string;
  bgColor?: string;
  fontSize: number;
  fontWeight: 'regular' | 'bold';
  startFrame: number;
  endFrame: number;
  animation: AnimationType;
  exitAnimation: ExitAnimationType;
}

export interface SceneSpec {
  title: string;
  totalDuration: number; // detik
  fps: number;
  width: number;
  height: number;
  bgColor: string;
  scenes: Scene[];
}
```

Validasi runtime di `src/lib/sceneSchema.ts` memakai type guard manual (tanpa Zod untuk MVP, biar dependency minimal):

```typescript
export function isSceneSpec(value: unknown): value is SceneSpec {
  // Cek struktur, tipe, range angka, enum animation, dll.
  // Return false jika apapun melenceng — fail-closed.
}

export function validateSceneSpec(value: unknown): SceneSpec {
  if (!isSceneSpec(value)) {
    throw new ParseError('Output Gemini bukan SceneSpec yang valid');
  }
  return value;
}
```

### `lib/gemini.ts`

Single export utama:

```typescript
/**
 * Mengirim prompt ke Gemini API dan mengembalikan SceneSpec terstruktur.
 * Retry max 2x jika output gagal di-parse atau gagal validasi.
 */
export async function generateSceneSpec(
  prompt: string,
  apiKey: string
): Promise<SceneSpec>;
```

Implementasi memakai SDK `@google/genai` dengan `responseSchema` agar Gemini return JSON bertipe (mengurangi peluang invalid output). System instruction di-hardcode sebagai konstanta di `src/constants/geminiPrompt.ts`.

### Zustand stores

Tiga store, masing-masing satu domain. Pattern wajib mengikuti coding-rules Section 5.1 (state + `actions` object terpisah, selector di-expose).

**`sceneStore`** — single source of truth SceneSpec + status generate.

```typescript
interface SceneState {
  sceneSpec: SceneSpec | null;
  isGenerating: boolean;
  error: string | null;
  promptHistory: string[]; // max 5
  actions: {
    setSceneSpec: (spec: SceneSpec) => void;
    setGenerating: (value: boolean) => void;
    setError: (message: string | null) => void;
    addPromptToHistory: (prompt: string) => void;
    reset: () => void;
  };
}
```

**`settingsStore`** — cache API key status (bukan key-nya) + export settings.

```typescript
interface SettingsState {
  hasApiKey: boolean;
  exportResolution: { width: number; height: number };
  exportFps: 24 | 30;
  actions: {
    setHasApiKey: (value: boolean) => void;
    setExportResolution: (res: { width: number; height: number }) => void;
    setExportFps: (fps: 24 | 30) => void;
  };
}
```

**`renderStore`** — progress render + path output terakhir.

```typescript
interface RenderState {
  isRendering: boolean;
  progress: number; // 0..1
  lastOutputPath: string | null;
  error: string | null;
  actions: {
    startRender: () => void;
    setProgress: (p: number) => void;
    finishRender: (path: string) => void;
    failRender: (message: string) => void;
    cancel: () => void;
  };
}
```

### IPC contract

Semua channel mengikuti format `domain:action` (coding-rules Section 7.1). Response shape konsisten `{ success: true, data } | { success: false, error: string }`.

| Channel | Direction | Payload | Response |
|---|---|---|---|
| `render:start` | renderer → main | `{ sceneSpec, outputPath, resolution, fps }` | `{ success, outputPath }` |
| `render:cancel` | renderer → main | `void` | `{ success }` |
| `render:progress` | main → renderer | `{ progress: number }` | event-only |
| `settings:get-api-key-status` | renderer → main | `void` | `{ success, hasKey: boolean }` |
| `settings:set-api-key` | renderer → main | `{ apiKey: string }` | `{ success }` |
| `settings:get-api-key` | renderer → main | `void` | `{ success, apiKey: string }` |
| `settings:delete-api-key` | renderer → main | `void` | `{ success }` |
| `file:save-dialog` | renderer → main | `{ defaultName: string }` | `{ success, filePath: string \| null }` |
| `file:reveal` | renderer → main | `{ path: string }` | `{ success }` |

`window.electronAPI` di preload mem-bridge IPC ini menjadi method bertipe (lihat `src/types/ipc.ts`).

### Komponen UI utama

**`PromptInput`** — textarea, validasi panjang, tombol Generate, riwayat dropdown. Memakai `useGemini` hook untuk handler.

**`PreviewPanel`** — wrap `@remotion/player` dengan `inputProps={{ sceneSpec }}` dan `compositionId="motion-studio"`. Menggunakan calculation:

```typescript
const durationInFrames = Math.ceil(sceneSpec.totalDuration * sceneSpec.fps);
```

**`SceneList`** — daftar scene dengan badge type, klik melompat ke startFrame via player ref.

**`ExportBar`** — dropdown resolusi & fps, tombol Export, progress bar. Pakai `useRender` hook.

### Remotion composition

`RootComposition.tsx` me-register satu komposisi dinamis:

```typescript
<Composition
  id="motion-studio"
  component={MotionStudioRoot}
  durationInFrames={...}
  fps={...}
  width={...}
  height={...}
  defaultProps={{ sceneSpec: DEFAULT_SCENE_SPEC }}
/>
```

`MotionStudioRoot` me-loop scenes dan render `<Series>` dengan masing-masing scene memakai `<Sequence from={startFrame} durationInFrames={endFrame - startFrame}>` yang berisi komponen template sesuai `type`.

Mapping `type` → komponen via switch di `SceneRenderer.tsx`:

```typescript
function SceneRenderer({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case 'title': return <TitleCard scene={scene} />;
    case 'quote': return <QuoteCard scene={scene} />;
    case 'lowerThird': return <LowerThird scene={scene} />;
    case 'promo': return <PromoCard scene={scene} />;
    case 'subtitle':
    case 'blank':
    default: return <BlankScene scene={scene} />;
  }
}
```

## Data Models

### Persisted data (electron-store)

Hanya satu key yang persisten:

```
~/AppData/Roaming/motion-studio/config.json (encrypted)
{
  "apiKey": "<encrypted blob>"
}
```

`electron-store` v10 mendukung `encryptionKey` option untuk obfuscation AES-256-CTR. Bukan enkripsi level enterprise, tapi cukup untuk memenuhi PRD F-05 ("disimpan terenkripsi") dan menghalangi pembacaan langsung dari disk oleh malware non-targeted.

### In-memory ephemeral data

| Data | Lokasi | Lifetime |
|---|---|---|
| Prompt history (5 entri) | `sceneStore.promptHistory` | Sesi (hilang saat app close) |
| Current SceneSpec | `sceneStore.sceneSpec` | Sesi |
| Render progress | `renderStore.progress` | Sampai render selesai/cancel |
| Cached API key | Tidak ada cache di renderer | — |

## Error Handling

### Tipe error custom

```typescript
// src/lib/errors.ts
export class GeminiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class RenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenderError';
  }
}
```

### Mapping error ke pesan UI

| Error | Pesan untuk pengguna | Tindakan UI |
|---|---|---|
| `GeminiError` (auth) | "API key tidak valid. Periksa di Settings." | Tombol "Buka Settings" |
| `GeminiError` (quota) | "Kuota Gemini API habis. Coba lagi nanti." | Tombol Retry |
| `GeminiError` (network) | "Tidak ada koneksi internet." | Tombol Retry |
| `ParseError` | "Gagal menghasilkan scene yang valid. Coba prompt lain." | Tombol Retry |
| `RenderError` | "Render gagal: <detail teknis>." | Tombol Retry |
| Unknown | "Terjadi kesalahan tidak terduga." | Logging + tombol Retry |

### IPC error handling

Sesuai coding-rules Section 7.2, handler IPC tidak melempar error mentah — mengembalikan `{ success: false, error: string }`. Renderer wrapper (`lib/ipc.ts`) yang melempar `Error` typed agar pemanggil bisa `try-catch`.

## Testing Strategy

PRD tidak mewajibkan unit test untuk MVP, tapi tetap dianjurkan untuk dua area kritikal:

1. **`sceneSchema.validateSceneSpec`** — kasus valid + 10+ kasus invalid (missing field, wrong type, animation enum salah, dll). Vitest, run di tahap akhir sebelum installer.
2. **Smoke test render pipeline** — script Node yang load dummy SceneSpec, panggil `videoRenderer.render()`, verifikasi file output ada dan size > 0.

Untuk MVP, manual testing di akhir setiap task lebih praktis daripada setup test framework lengkap. Suite test lengkap ditargetkan di v1.5.

### Manual smoke test sebelum build installer

| Test | Pass criteria |
|---|---|
| Launch aplikasi tanpa API key | Banner peringatan muncul, link ke Settings |
| Set API key + Test Connection | Status sukses ditampilkan |
| Generate dengan prompt Bahasa Indonesia | SceneSpec valid + preview play |
| Generate dengan prompt Bahasa Inggris | SceneSpec valid + preview play |
| Export 1080p 30fps 5 detik | File MP4 < 60 detik render, playable di Windows Media Player |
| Cancel saat render | Render berhenti, tidak ada file partial |
| Restart aplikasi | API key masih tersimpan, scene reset |
| Putus internet saat generate | Error "Tidak ada koneksi" muncul |

## Correctness Properties

Properti yang harus selalu dijaga selama implementasi (invariants yang menjadi acuan saat testing dan code review).

### Property 1: SceneSpec immutability di store

`sceneStore.sceneSpec` hanya boleh diubah lewat `actions.setSceneSpec`. Tidak ada mutasi langsung dari komponen — komponen yang menerima SceneSpec memperlakukannya sebagai read-only.

**Validates: Requirements 2.6, 3.3**

### Property 2: API key tidak bocor

String API key TIDAK BOLEH muncul di: log console, payload IPC selain channel `settings:*`, error message yang ditampilkan ke UI, atau React state di renderer. Pelanggaran property ini diklasifikasikan sebagai bug critical.

**Validates: Requirements 5.6, 8.2**

### Property 3: Render idempotency

Memanggil `render:start` saat `isRendering = true` SHALL ditolak dengan error eksplisit, bukan menjalankan render paralel. Tombol Export di UI juga disabled saat render berlangsung.

**Validates: Requirements 4.1, 4.6**

### Property 4: No partial output

Jika render gagal atau di-cancel, file output yang corrupt SHALL dihapus sebelum handler return ke renderer. Pengguna tidak boleh menemukan file `.mp4` 0 byte atau truncated di disk.

**Validates: Requirements 4.8, 4.9**

### Property 5: CSP enforced

`connect-src` di runtime hanya boleh ke `https://generativelanguage.googleapis.com` dan `'self'`. Tidak ada `unsafe-eval` atau `unsafe-inline` di `script-src`. Header CSP didefinisikan di `index.html` dan tidak boleh dilonggarkan untuk fitur baru.

**Validates: Requirements 8.5**

### Property 6: Frame range valid per scene

Setiap `Scene` SHALL memenuhi `0 <= startFrame < endFrame <= totalDuration * fps`. Validator `isSceneSpec` menolak SceneSpec yang melanggar. Scene boleh overlap dalam timeline (mis: subtitle on top of title), tapi tidak boleh berada di luar total durasi.

**Validates: Requirements 2.2, 6.7**

### Property 7: Type-safe IPC

Setiap channel punya tipe payload dan response tertulis di `src/types/ipc.ts`. Tidak ada `any` di shape IPC. Method `window.electronAPI.*` mengembalikan `Promise<T>` yang typed sesuai response.

**Validates: Requirements 8.1**

### Property 8: Single source of truth

Komponen tidak menyimpan duplikat SceneSpec di local state. Semua bacaan SceneSpec berasal dari selector `useSceneSpec()` agar update di store langsung tercermin di seluruh UI.

**Validates: Requirements 3.3, 4.1**

## Open decisions

Beberapa keputusan ditangguhkan ke fase implementasi karena bergantung pada eksperimen aktual:

1. **Bundle Remotion**: di-prebuild saat `npm run build` (lewat `bundle()` dari `@remotion/bundler` yang dipanggil di build script) atau di-bundle saat first render. Default: **prebuild**, karena PRD Section 8.2 mewajibkan ini.
2. **Frame untuk progress**: `renderMedia` Remotion punya callback `onProgress`. Throttle ke setiap 5% supaya tidak spam IPC. Final keputusan saat implementasi F-04.
3. **Lokasi default save dialog**: `app.getPath('videos')` untuk MVP. Bisa disempurnakan dengan ingat folder terakhir di v1.5.
