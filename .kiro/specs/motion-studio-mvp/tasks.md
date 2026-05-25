# Implementation Plan

## Overview

Tasks pecahan untuk MVP Motion Studio (F-01 sampai F-05). Total 20 task yang membangun bertahap dari foundation (types, validator, stores) ke fitur user-facing (Editor, Preview, Export). Setiap task tertaut ke requirements spesifik dan dapat di-verifikasi secara independen lewat `npm run typecheck`, `npm run lint`, atau smoke test manual.

Pendekatan: **bottom-up incremental**. Layer paling stabil (types, schema validator) dibangun lebih dulu agar fitur yang membaca/menulis data punya kontrak yang jelas. UI dibangun terakhir agar tidak perlu refactor saat shape data berubah.

## Tasks

- [x] 1. Foundation types & constants
  - Buat `src/types/SceneSpec.ts` berisi semua tipe dari design (SceneType, AnimationType, ExitAnimationType, Scene, SceneSpec).
  - Buat `src/types/ipc.ts` berisi shape payload dan response untuk semua channel IPC (`render:*`, `settings:*`, `file:*`).
  - Buat `src/lib/errors.ts` berisi class GeminiError, ParseError, RenderError.
  - Tambahkan konstanta yang belum ada di `src/constants/index.ts` (default scene values, prompt history size, dll).
  - Pastikan `npm run typecheck` dan `npm run lint` lulus.
  - _Requirements: 2.2, 6.1, 8.1_

- [x] 2. SceneSpec validator dengan type guard
  - Implementasi `src/lib/sceneSchema.ts` dengan fungsi `isSceneSpec(value: unknown): value is SceneSpec` dan `validateSceneSpec(value: unknown): SceneSpec`.
  - Validator mengecek: semua field required ada, tipe primitif benar, enum animation/exitAnimation valid, range `0 <= startFrame < endFrame <= totalDuration * fps` per scene, fps di [24, 30, 60], dimensi positif.
  - Lempar `ParseError` dengan pesan yang menyebutkan field bermasalah saat invalid.
  - Tulis test minimal manual: validator menolak 5 contoh SceneSpec invalid (missing field, wrong type, frame out of range, animation enum salah, fps negatif) dan menerima 1 contoh valid.
  - _Requirements: 2.2, 6.1_

- [x] 3. Zustand stores (scene, settings, render)
  - Implementasi `src/stores/sceneStore.ts` dengan state `sceneSpec | null`, `isGenerating`, `error`, `promptHistory` (max 5), dan `actions` object sesuai design.
  - Implementasi `src/stores/settingsStore.ts` dengan `hasApiKey`, `exportResolution`, `exportFps`, `actions`.
  - Implementasi `src/stores/renderStore.ts` dengan `isRendering`, `progress`, `lastOutputPath`, `error`, `actions`.
  - Expose selector hooks (`useSceneSpec`, `useSceneActions`, dll) terpisah agar komponen tidak re-render berlebihan.
  - _Requirements: 1.7, 2.6, 4.6_

- [x] 4. Electron secureStore untuk API key
  - Install `electron-store` dan setup wrapper di `electron/services/secureStore.ts` dengan opsi `encryptionKey` AES.
  - Wrapper expose: `getApiKey(): string | undefined`, `setApiKey(key: string): void`, `deleteApiKey(): void`, `hasApiKey(): boolean`.
  - Schema validation: hanya satu key `apiKey` (string).
  - _Requirements: 5.2, 5.6, 8.2_

- [x] 5. IPC handlers settings + bridge di preload
  - Buat `electron/ipc/settings.ts` dengan handler `settings:get-api-key-status`, `settings:set-api-key`, `settings:get-api-key`, `settings:delete-api-key`. Semua mengembalikan `{ success, ... }`.
  - Update `electron/preload.ts` untuk expose `electronAPI.settings.{getStatus, setKey, getKey, deleteKey}`.
  - Update `src/global.d.ts` dengan interface ElectronAPI yang sesuai.
  - Buat `src/lib/ipc.ts` sebagai typed wrapper dengan error mapping (lempar Error jika `success: false`).
  - Daftarkan handler di `electron/main.ts` saat app ready.
  - _Requirements: 5.2, 5.5, 8.1_

- [x] 6. Halaman Settings (UI API key)
  - Buat `src/components/ui/Button.tsx`, `Input.tsx`, dan komponen atom lain yang dibutuhkan.
  - Implementasi `src/pages/Settings.tsx` dengan form input API key (type=password), tombol Save, tombol Test Connection, tombol Hapus.
  - Save → panggil `electronAPI.settings.setKey()`.
  - Test Connection → panggil Gemini API dengan request minimal, tampilkan status sukses/error.
  - Field menampilkan placeholder masked jika `hasApiKey === true`.
  - Link ke Google AI Studio (`https://aistudio.google.com/apikey`) yang membuka external browser.
  - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [x] 7. Routing minimal Editor ↔ Settings
  - Update `src/App.tsx` dengan state route sederhana (`'editor' | 'settings'`) tanpa router library.
  - Header punya tombol "Settings" yang switch route.
  - Halaman Settings punya tombol "Kembali ke Editor".
  - Saat app launch dan `hasApiKey === false`, tampilkan banner di Editor dengan link ke Settings.
  - _Requirements: 2.5, 5.7_

- [x] 8. Gemini integration (`lib/gemini.ts`)
  - Buat `src/constants/geminiPrompt.ts` berisi system instruction yang menginstruksikan Gemini menghasilkan JSON SceneSpec dengan schema yang ketat.
  - Implementasi `src/lib/gemini.ts` dengan fungsi `generateSceneSpec(prompt, apiKey)` memakai SDK `@google/genai`.
  - Pakai `responseSchema` dengan tipe yang merefleksikan SceneSpec.
  - Loop retry max 2x: parse JSON → validate via `isSceneSpec` → return jika valid, retry jika tidak.
  - Map error response (401, 429, network) ke `GeminiError` dengan pesan spesifik.
  - JSDoc lengkap sesuai coding-rules Section 10.2.
  - _Requirements: 2.1, 2.3, 2.4, 2.7, 2.8_

- [x] 9. Hook `useGemini` + komponen `PromptInput`
  - Implementasi `src/hooks/useGemini.ts` yang membaca `hasApiKey` dari settingsStore, ambil API key via IPC, panggil `generateSceneSpec`, dan update `sceneStore` (loading, error, sceneSpec, promptHistory).
  - Implementasi `src/components/features/PromptInput.tsx` dengan textarea (max 500 char), tombol Generate, shortcut Ctrl+Enter, indikator loading, dropdown riwayat 5 prompt terakhir.
  - Tombol disabled saat `isGenerating` atau prompt kosong/whitespace atau panjang melebihi limit.
  - Saat `hasApiKey === false`, klik Generate menampilkan banner peringatan dengan link ke Settings (tidak memanggil API).
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.5, 2.9_

- [x] 10. Remotion: scene templates dasar (`BlankScene`, `TitleCard`)
  - Buat `remotion/scenes/BlankScene.tsx` — fallback yang hanya menampilkan bgColor.
  - Buat `remotion/scenes/TitleCard.tsx` dengan animasi masuk (fadeIn default) memakai `useCurrentFrame` + `interpolate` sesuai coding-rules Section 8.1.
  - Implementasi helper `applyEntryAnimation(frame, scene)` dan `applyExitAnimation(frame, scene)` untuk reuse di template lain.
  - _Requirements: 6.1, 6.2, 6.3, 6.8, 6.9, 6.10_

- [x] 11. Remotion: scene templates sisanya (`QuoteCard`, `LowerThird`, `PromoCard`)
  - Implementasi tiga komponen sesuai design dengan layout yang berbeda (kutipan dengan separator, lower third di sepertiga bawah, promo card dengan highlight CTA).
  - Semua memakai helper animation dari task 10.
  - Pastikan props serializable (JSON-safe) sesuai coding-rules Section 8.2.
  - _Requirements: 6.4, 6.5, 6.6_

- [x] 12. Remotion: RootComposition + SceneRenderer mapping
  - Buat `remotion/SceneRenderer.tsx` dengan switch berdasarkan `scene.type` ke komponen yang sesuai (default fallback ke BlankScene + log warning).
  - Buat `remotion/RootComposition.tsx` yang menerima `sceneSpec` prop, render `<Series>` dengan setiap scene di-wrap `<Series.Sequence durationInFrames={endFrame - startFrame}>`.
  - Update `remotion/index.ts` dengan `registerRoot` yang mendaftarkan satu Composition `id="motion-studio"` dengan dimensi/fps/duration dihitung dari sceneSpec.
  - _Requirements: 6.1, 6.2, 6.7, 6.10_

- [x] 13. Komponen `PreviewPanel` dengan `@remotion/player`
  - Implementasi `src/components/features/PreviewPanel.tsx` membaca `sceneSpec` dari store.
  - Embed `<Player>` dengan `inputProps={{ sceneSpec }}`, `compositionWidth/Height` dari sceneSpec, `durationInFrames`, `fps`, dan controls bawaan.
  - Saat `sceneSpec === null`, tampilkan placeholder "Tulis prompt dan klik Generate".
  - Expose ref player agar bisa seek dari SceneList (task 14).
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 14. Komponen `SceneList`
  - Implementasi `src/components/features/SceneList.tsx` yang me-render daftar scene horizontal dengan badge `type`.
  - Klik scene → seek player ke `startFrame` (lewat callback ke parent atau context).
  - Tampilkan placeholder "Belum ada scene" saat `sceneSpec === null`.
  - _Requirements: 3.8_

- [x] 15. Video renderer service di main process
  - Install `@remotion/bundler` jika belum.
  - Implementasi `electron/services/videoRenderer.ts` dengan fungsi `renderVideo({ sceneSpec, outputPath, resolution, fps, onProgress }): Promise<string>`.
  - Bundle Remotion sekali di build time atau lazy on first render. Cache bundle path.
  - Panggil `renderMedia` dengan `serveUrl`, `composition`, `inputProps={{ sceneSpec }}`, `outputLocation`, `codec='h264'`.
  - Throttle progress callback ke setiap 5%.
  - Pastikan file partial dihapus saat error/cancel (Property 4).
  - _Requirements: 4.4, 4.6, 4.8, 4.12, 7.4_

- [x] 16. IPC handlers render + file dialog
  - Buat `electron/ipc/render.ts` dengan handler `render:start`, `render:cancel`. Tolak start jika sudah ada render aktif (Property 3).
  - Emit event `render:progress` ke renderer via `webContents.send`.
  - Buat `electron/ipc/file.ts` dengan handler `file:save-dialog` (memakai `dialog.showSaveDialog`) dan `file:reveal` (memakai `shell.showItemInFolder`).
  - Validasi ekstensi `.mp4` dan path resolve sebelum render (Property 5, Requirement 8.3).
  - Update `preload.ts` dan `global.d.ts` dengan API baru.
  - _Requirements: 4.3, 4.4, 4.5, 4.7, 4.9, 8.3_

- [x] 17. Hook `useRender` + komponen `ExportBar`
  - Implementasi `src/hooks/useRender.ts` yang trigger `file:save-dialog` lalu `render:start`, listen event `render:progress`, dan update `renderStore`.
  - Implementasi `src/components/features/ExportBar.tsx` dengan dropdown resolusi (HD, Full HD), dropdown fps (24, 30), tombol Export, progress bar, tombol Cancel saat render aktif.
  - Saat render selesai → tampilkan toast/banner sukses dengan tombol "Buka Folder" (panggil `file:reveal`).
  - _Requirements: 4.1, 4.2, 4.6, 4.7, 4.9, 4.10, 4.11_

- [x] 18. Halaman Editor: layout final
  - Update `src/pages/Editor.tsx` dengan layout grid sesuai PRD Section 5.1: header (logo + Settings button), left panel (PromptInput + SceneList), center (PreviewPanel), bottom (ExportBar).
  - Banner peringatan "API key belum diset" muncul saat `hasApiKey === false`.
  - Apply Tailwind dark theme dengan accent teal sesuai design tokens.
  - _Requirements: 5.7_

- [x] 19. CSP, security hardening, dan smoke test manual
  - Verifikasi CSP di `index.html` membatasi `connect-src` ke domain yang benar (Property 5).
  - Verifikasi `BrowserWindow` punya `contextIsolation: true` dan `nodeIntegration: false` (Requirement 8.4).
  - Pastikan tidak ada `console.log` API key di seluruh codebase (grep manual).
  - Jalankan smoke test manual sesuai design Section "Manual smoke test sebelum build installer" (8 skenario).
  - Fix issue yang ditemukan.
  - _Requirements: 5.6, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 20. Performance check & polish akhir
  - Ukur waktu launch app, waktu generate, waktu render 5 detik 1080p di mesin development. Bandingkan dengan target (5s, 15s, 60s).
  - Jika ada bottleneck render: throttle progress event lebih agresif, konfigurasi Remotion concurrency.
  - Cek memory usage setelah 5 sesi generate berturut-turut, pastikan < 50 MB increment per sesi.
  - Update README dengan screenshot dan instruksi penggunaan.
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "name": "Foundation",
      "tasks": [1],
      "depends_on": []
    },
    {
      "wave": 2,
      "name": "Schema & Stores",
      "tasks": [2, 3],
      "depends_on": [1]
    },
    {
      "wave": 3,
      "name": "Settings Backend & Remotion Templates",
      "tasks": [4, 10],
      "depends_on": [2, 3]
    },
    {
      "wave": 4,
      "name": "Settings IPC, Templates Lanjutan",
      "tasks": [5, 11],
      "depends_on": [4, 10]
    },
    {
      "wave": 5,
      "name": "Settings UI, Routing, RootComposition",
      "tasks": [6, 7, 12],
      "depends_on": [5, 11]
    },
    {
      "wave": 6,
      "name": "Gemini Integration & Preview",
      "tasks": [8, 13, 15],
      "depends_on": [5, 7, 12]
    },
    {
      "wave": 7,
      "name": "Prompt UI, SceneList, Render IPC",
      "tasks": [9, 14, 16],
      "depends_on": [8, 13, 15]
    },
    {
      "wave": 8,
      "name": "Export UI",
      "tasks": [17],
      "depends_on": [16]
    },
    {
      "wave": 9,
      "name": "Editor Final Assembly",
      "tasks": [18],
      "depends_on": [9, 14, 17]
    },
    {
      "wave": 10,
      "name": "Security & Polish",
      "tasks": [19, 20],
      "depends_on": [18]
    }
  ],
  "notes": "Wave 3 onwards punya parallelism antara track Settings dan track Remotion. Foundation (wave 1-2) wajib sequential. Final assembly (wave 9) menunggu semua track selesai."
}
```

### Visual reference

```
Foundation (sequential, must complete first):
  1 (types)  ──►  2 (validator)  ──►  3 (stores)

Settings track (depends on foundation):
  3  ──►  4 (secureStore)  ──►  5 (settings IPC)  ──►  6 (Settings UI)  ──►  7 (routing)

Generate track (depends on settings track):
  5, 7  ──►  8 (gemini.ts)  ──►  9 (useGemini + PromptInput)

Remotion track (parallel to settings/generate, depends only on foundation):
  1, 2  ──►  10 (BlankScene + TitleCard)  ──►  11 (Quote/LowerThird/Promo)  ──►  12 (RootComposition)

Preview track (depends on Remotion + stores):
  3, 12  ──►  13 (PreviewPanel)  ──►  14 (SceneList)

Export track (depends on Remotion + IPC):
  12, 5  ──►  15 (videoRenderer service)  ──►  16 (render/file IPC)  ──►  17 (useRender + ExportBar)

Final assembly:
  9, 13, 14, 17  ──►  18 (Editor layout)  ──►  19 (security smoke test)  ──►  20 (performance polish)
```

## Notes

- **Tidak ada test framework** di MVP — verifikasi pakai `npm run typecheck`, `npm run lint`, dan smoke test manual. Suite test ditargetkan di v1.5.
- **Packaging Electron Forge** belum ada di task list ini. Itu fase setelah MVP berfungsi penuh; akan ditambahkan sebagai spec terpisah.
- **Open decisions di design** (bundle Remotion strategy, throttle interval progress, save dialog default location) diputuskan saat task terkait dikerjakan, bukan sebelumnya.
- **Setiap task** harus diakhiri dengan `npm run typecheck && npm run lint && npm run build` lulus sebelum dianggap selesai (sesuai coding-rules Section 13).
