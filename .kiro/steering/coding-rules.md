# Coding Rules — Motion Studio
> Aturan ini berlaku untuk seluruh codebase proyek Motion Studio (Electron + React + TypeScript + Remotion).
> Tujuan: kode yang konsisten, mudah dibaca, mudah di-maintain, dan aman untuk dikembangkan oleh siapapun.

---

## 1. Prinsip Dasar

- **Clarity over cleverness** — Kode yang mudah dibaca lebih bernilai daripada kode yang pintar tapi sulit dipahami.
- **One responsibility, one file** — Setiap file hanya memiliki satu tanggung jawab utama.
- **Fail loudly** — Error harus dilempar dan ditangani secara eksplisit, bukan diabaikan diam-diam.
- **No magic numbers** — Semua nilai tetap harus didefinisikan sebagai konstanta bernama.
- **Consistency is king** — Pilih satu cara, pakai di seluruh codebase. Jangan campur gaya.

---

## 2. Struktur Folder & Penamaan File

### 2.1 Aturan Folder

```
src/
├── pages/          ← Komponen halaman penuh (satu file = satu halaman)
├── components/     ← Komponen UI yang reusable
│   ├── ui/         ← Komponen atom: Button, Input, Badge, Modal
│   └── features/   ← Komponen spesifik fitur: PromptInput, PreviewPanel
├── lib/            ← Logic bisnis, helper, dan integrasi API
├── hooks/          ← Custom React hooks (useGemini, useRender, dll)
├── stores/         ← State management (Zustand stores)
├── types/          ← TypeScript types dan interfaces global
└── constants/      ← Konstanta aplikasi (warna, config, enum)
```

### 2.2 Konvensi Penamaan

| Jenis | Format | Contoh |
|---|---|---|
| Komponen React | `PascalCase` | `PreviewPanel.tsx` |
| Hook | `camelCase` dengan prefix `use` | `useGemini.ts` |
| Zustand Store | `camelCase` dengan suffix `Store` | `sceneStore.ts` |
| Utility/Helper | `camelCase` | `formatDuration.ts` |
| TypeScript Types | `PascalCase` | `SceneSpec.ts` |
| Konstanta | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Folder | `kebab-case` | `scene-templates/` |

### 2.3 Aturan Import

```typescript
// ✅ BENAR — urutan import: external → internal → relative
import React, { useState, useEffect } from 'react';
import { Player } from '@remotion/player';

import { useSceneStore } from '@/stores/sceneStore';
import { generateSceneSpec } from '@/lib/gemini';

import { PreviewPanel } from './PreviewPanel';
import type { SceneSpec } from './types';

// ❌ SALAH — import acak tanpa urutan
import { PreviewPanel } from './PreviewPanel';
import React from 'react';
import { generateSceneSpec } from '@/lib/gemini';
import { Player } from '@remotion/player';
```

Gunakan path alias `@/` untuk semua import dari dalam `src/`. Tidak boleh ada relative path yang naik lebih dari satu level (`../../`).

---

## 3. TypeScript

### 3.1 Aturan Wajib

- **Selalu gunakan TypeScript** — tidak ada file `.js` baru di dalam `src/`, `electron/`, atau `remotion/`.
- **Tidak boleh ada `any`** — jika tipe tidak diketahui, gunakan `unknown` dan lakukan type narrowing.
- **Semua props komponen harus diketik** — gunakan `interface` untuk props, bukan `type` untuk konsistensi.
- **Aktifkan `strict: true`** di `tsconfig.json` dan tidak boleh ada flag yang melemahkan strict mode.

### 3.2 Interface vs Type

```typescript
// ✅ Gunakan interface untuk props komponen dan objek data
interface SceneProps {
  scene: Scene;
  isActive: boolean;
  onSelect: (id: string) => void;
}

// ✅ Gunakan type untuk union, intersection, atau alias primitif
type AnimationType = 'fadeIn' | 'slideFromLeft' | 'scaleUp';
type SceneOrNull = Scene | null;

// ❌ Jangan gunakan any
const handleResponse = (data: any) => { ... }  // SALAH

// ✅ Gunakan unknown + type guard
const handleResponse = (data: unknown) => {
  if (isSceneSpec(data)) { ... }
}
```

### 3.3 Nullability

```typescript
// ✅ Selalu handle null/undefined secara eksplisit
const title = scene?.text ?? 'Untitled';

// ❌ Jangan gunakan non-null assertion (!.) sembarangan
const title = scene!.text;  // SALAH — bisa crash di runtime
```

---

## 4. Komponen React

### 4.1 Struktur Komponen

Setiap komponen harus mengikuti urutan ini:

```typescript
// 1. Import
import React, { useState } from 'react';
import type { SceneProps } from '@/types';

// 2. Interface/Type lokal (jika tidak ada di types/)
interface LocalState { ... }

// 3. Konstanta lokal
const ANIMATION_DURATION = 300;

// 4. Komponen utama
export function SceneCard({ scene, isActive, onSelect }: SceneProps) {
  // 4a. Hooks (urutan: state → ref → custom hooks → derived state)
  const [isHovered, setIsHovered] = useState(false);
  const { updateScene } = useSceneStore();

  // 4b. Event handlers (prefix "handle")
  const handleClick = () => onSelect(scene.id);

  // 4c. Render helpers (prefix "render", gunakan jika JSX > 3 baris)
  const renderBadge = () => (
    <span className="badge">{scene.type}</span>
  );

  // 4d. Return JSX
  return (
    <div onClick={handleClick}>
      {renderBadge()}
      <p>{scene.text}</p>
    </div>
  );
}
```

### 4.2 Aturan Komponen

- **Satu file = satu komponen utama** yang di-export. Komponen helper kecil boleh ada di file yang sama tapi tidak di-export.
- **Komponen harus pure** — tidak ada side effect di luar `useEffect`. Jangan memanggil API langsung dari dalam render.
- **Maksimal 150 baris per komponen** — jika lebih, pecah menjadi sub-komponen.
- **Gunakan function declaration, bukan arrow function** untuk komponen utama yang di-export:

```typescript
// ✅ Function declaration — lebih mudah di-debug (nama muncul di stack trace)
export function PreviewPanel({ sceneSpec }: PreviewPanelProps) { ... }

// ❌ Hindari arrow function untuk komponen yang di-export
export const PreviewPanel = ({ sceneSpec }: PreviewPanelProps) => { ... }
```

### 4.3 Props

```typescript
// ✅ Destructure props di parameter
export function Button({ label, onClick, disabled = false }: ButtonProps) { ... }

// ❌ Jangan akses via props.xxx di dalam body
export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>  // SALAH
}
```

---

## 5. State Management (Zustand)

### 5.1 Struktur Store

Setiap store dipisah per domain fitur. Jangan buat satu "God Store" untuk semua state.

```typescript
// src/stores/sceneStore.ts
import { create } from 'zustand';
import type { SceneSpec } from '@/types';

interface SceneState {
  // State
  sceneSpec: SceneSpec | null;
  isGenerating: boolean;
  error: string | null;

  // Actions (dalam satu objek `actions`)
  actions: {
    setSceneSpec: (spec: SceneSpec) => void;
    setGenerating: (value: boolean) => void;
    setError: (message: string | null) => void;
    reset: () => void;
  };
}

export const useSceneStore = create<SceneState>((set) => ({
  sceneSpec: null,
  isGenerating: false,
  error: null,

  actions: {
    setSceneSpec: (spec) => set({ sceneSpec: spec, error: null }),
    setGenerating: (value) => set({ isGenerating: value }),
    setError: (message) => set({ error: message, isGenerating: false }),
    reset: () => set({ sceneSpec: null, isGenerating: false, error: null }),
  },
}));

// Selector yang diekspos terpisah agar komponen tidak re-render berlebihan
export const useSceneSpec = () => useSceneStore((s) => s.sceneSpec);
export const useSceneActions = () => useSceneStore((s) => s.actions);
```

### 5.2 Aturan Store

- **Jangan akses store di luar komponen/hook** tanpa alasan yang jelas (misal: dari `electron/main.ts`).
- **Actions selalu di dalam store**, bukan di komponen.
- **Derived state dihitung di selector**, bukan di-store sebagai state terpisah.

---

## 6. Async & Error Handling

### 6.1 Pola Async

```typescript
// ✅ Selalu gunakan try-catch untuk semua async call
async function generateScene(prompt: string): Promise<SceneSpec> {
  try {
    const result = await callGeminiAPI(prompt);
    return parseSceneSpec(result);
  } catch (error) {
    // Jangan biarkan error hilang begitu saja
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate scene: ${message}`);
  }
}

// ❌ Jangan biarkan Promise tanpa .catch() atau try-catch
callGeminiAPI(prompt).then(setScene);  // SALAH — error tidak ditangani
```

### 6.2 Loading & Error States

Setiap async operation WAJIB memiliki tiga state yang ditangani di UI:

```typescript
// ✅ Selalu tangani loading, error, dan success
function GenerateButton() {
  const { isGenerating, error } = useSceneStore();
  const { setGenerating, setError, setSceneSpec } = useSceneActions();

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const spec = await generateScene(prompt);
      setSceneSpec(spec);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal generate scene');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button disabled={isGenerating} onClick={handleGenerate}>
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
      {error && <p className="text-error">{error}</p>}
    </>
  );
}
```

---

## 7. Electron IPC

### 7.1 Naming Convention

Semua IPC channel diberi nama dengan format `domain:action`:

```typescript
// ✅ Format: domain:action
'render:start'
'render:cancel'
'settings:get-api-key'
'settings:set-api-key'
'file:save-video'

// ❌ Nama ambigu atau tidak konsisten
'renderVideo'
'getKey'
'SAVE'
```

### 7.2 Struktur IPC Handler

```typescript
// electron/main.ts
// Semua handler dikelompokkan per domain
function registerRenderHandlers() {
  ipcMain.handle('render:start', async (_, payload: RenderPayload) => {
    try {
      const outputPath = await renderVideo(payload);
      return { success: true, outputPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Render failed'
      };
    }
  });
}

// ✅ IPC selalu mengembalikan objek { success, data/error }
// Jangan lempar error langsung dari handler — serialisasi tidak aman
```

### 7.3 Preload Script

```typescript
// electron/preload.ts
// Selalu expose API secara minimal via contextBridge
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  render: {
    start: (payload: RenderPayload) => ipcRenderer.invoke('render:start', payload),
    cancel: () => ipcRenderer.invoke('render:cancel'),
  },
  settings: {
    getApiKey: () => ipcRenderer.invoke('settings:get-api-key'),
    setApiKey: (key: string) => ipcRenderer.invoke('settings:set-api-key', key),
  },
});

// ❌ Jangan expose ipcRenderer secara langsung — security risk
contextBridge.exposeInMainWorld('ipc', ipcRenderer);  // SALAH
```

---

## 8. Remotion

### 8.1 Aturan Komposisi

```typescript
// remotion/scenes/TitleCard.tsx
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';
import type { Scene } from '@/types';

// ✅ Semua nilai animasi dihitung dari useCurrentFrame()
// ✅ Gunakan interpolate() untuk semua transisi — jangan hardcode nilai
export function TitleCard({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [scene.startFrame, scene.startFrame + 20],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: scene.bgColor }}>
      <p style={{ color: scene.color, fontSize: scene.fontSize }}>
        {scene.text}
      </p>
    </AbsoluteFill>
  );
}
```

### 8.2 Aturan Remotion

- **Tidak ada side effects di dalam komposisi** — tidak ada `fetch()`, `setInterval()`, atau DOM manipulation.
- **Semua props komposisi harus serializable** (JSON-safe) karena dikirim via IPC.
- **Bundle Remotion harus di-prebuild** sebelum packaging `.exe`, bukan di-build saat runtime.

---

## 9. Formatting & Linting

### 9.1 Prettier Config (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### 9.2 ESLint Rules Wajib

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"]
  }
}
```

### 9.3 Aturan Formatting

- **Indentasi**: 2 spasi — tidak boleh ada tab.
- **Panjang baris**: maksimal 100 karakter.
- **Semicolon**: selalu ada di akhir statement.
- **Quote**: single quote `'` untuk semua string di TypeScript/JavaScript. Double quote `"` hanya untuk JSX attribute.
- **Trailing comma**: selalu ada di multi-line array, object, dan parameter.

---

## 10. Komentar & Dokumentasi

### 10.1 Aturan Komentar

```typescript
// ✅ Komentar menjelaskan MENGAPA, bukan APA
// Gemini kadang mengembalikan JSON dengan trailing comma, perlu dibersihkan dulu
const cleaned = rawResponse.replace(/,(\s*[}\]])/g, '$1');

// ❌ Komentar yang hanya menjelaskan apa yang sudah jelas dari kode
// Loop melalui array scenes
scenes.forEach(scene => { ... });
```

### 10.2 JSDoc untuk Fungsi Publik

Semua fungsi yang di-export dari `src/lib/` wajib memiliki JSDoc:

```typescript
/**
 * Mengirim prompt ke Gemini API dan mengembalikan SceneSpec terstruktur.
 * Melakukan validasi JSON dan retry otomatis jika output invalid (max 2x).
 *
 * @param prompt - Teks deskripsi animasi dari pengguna
 * @param apiKey - Gemini API key yang tersimpan di settings
 * @returns Promise yang resolve ke SceneSpec yang valid
 * @throws {GeminiError} Jika API key invalid atau quota habis
 * @throws {ParseError} Jika output Gemini tidak bisa diparse setelah 2 retry
 */
export async function generateSceneSpec(
  prompt: string,
  apiKey: string
): Promise<SceneSpec> { ... }
```

### 10.3 TODO Comment

```typescript
// ✅ TODO harus menyertakan konteks dan nomor issue/task
// TODO(hanafi): Tambahkan validasi panjang prompt max 500 karakter — #issue-12
// FIXME(hanafi): Race condition saat user cepat klik Generate — #bug-7

// ❌ TODO tanpa konteks tidak berguna
// TODO: fix this later
```

---

## 11. Git & Commit Convention

### 11.1 Commit Message Format

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <deskripsi singkat>

[body opsional]
```

| Type | Kapan digunakan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Perubahan kode tanpa bug fix atau fitur baru |
| `style` | Perubahan formatting, spasi, dll (tidak mengubah logika) |
| `chore` | Perubahan konfigurasi, dependencies, dll |
| `docs` | Perubahan dokumentasi |
| `test` | Menambah atau memperbaiki test |

**Contoh:**
```
feat(gemini): tambah retry otomatis jika output JSON invalid

Gemini kadang mengembalikan JSON yang tidak valid pada saat API load tinggi.
Implementasi retry dengan exponential backoff max 2 kali percobaan.
```

### 11.2 Branch Naming

```
feature/nama-fitur-singkat    → feature/gemini-retry-logic
fix/deskripsi-bug             → fix/preview-not-updating
refactor/nama-modul           → refactor/scene-store
chore/nama-task               → chore/update-remotion-v4
```

### 11.3 Aturan Commit

- **Satu commit = satu perubahan logis** — jangan campur banyak hal dalam satu commit.
- **Commit message dalam Bahasa Inggris** agar mudah dibaca jika proyek dibuka ke publik.
- **Jangan commit langsung ke `main`** — selalu gunakan branch dan Pull Request, bahkan untuk proyek solo.
- **Jangan commit file yang tidak perlu**: `.env`, `node_modules/`, `remotion-bundle/`, `dist/`.

---

## 12. Keamanan

- **Tidak ada secret di dalam kode** — API key, password, dan token selalu dari environment variable atau encrypted local storage.
- **Tidak ada `eval()` atau `Function()` constructor** — potensi XSS/code injection.
- **Validasi semua input dari luar** — termasuk output dari Gemini API, file yang dibuka pengguna, dan data dari IPC.
- **Gunakan `contextBridge` selalu** — jangan pernah expose Node.js API langsung ke renderer process.
- **Sanitasi path file** — selalu gunakan `path.resolve()` dan validasi ekstensi sebelum operasi file sistem.

---

## 13. Checklist Sebelum Commit

Sebelum setiap commit, pastikan semua poin ini terpenuhi:

- [ ] Tidak ada `console.log()` debug yang tertinggal
- [ ] Tidak ada `any` type yang baru ditambahkan
- [ ] Semua async function memiliki error handling
- [ ] Komponen baru sudah mengikuti struktur yang ditentukan (Section 4.1)
- [ ] Import sudah diurutkan dengan benar (Section 2.3)
- [ ] Fungsi yang di-export dari `lib/` sudah ada JSDoc-nya
- [ ] Prettier dan ESLint tidak ada error: `npm run lint`
- [ ] TypeScript compile tanpa error: `npx tsc --noEmit`

---

*Rules ini adalah dokumen hidup. Diskusikan perubahan sebelum mengimplementasikan rule baru agar seluruh tim (atau dirimu di masa depan) tidak kaget.*
