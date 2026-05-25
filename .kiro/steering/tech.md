# Tech Stack — Motion Studio

## Stack

| Layer | Teknologi |
|---|---|
| Desktop Framework | Electron + `electron-vite` |
| UI Framework | React + TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| AI Engine | Gemini API (`gemini-2.0-flash`) |
| Animation Engine | Remotion |
| Preview Player | `@remotion/player` |
| Video Renderer | `@remotion/renderer` |
| State Management | Zustand |
| Packaging | Electron Forge (Squirrel installer `.exe`) |
| Encrypted Storage | `electron-store` (untuk API key) |

## Struktur Folder Project

```
motion-studio/
├── electron/
│   ├── main.ts              ← Main process: IPC handler, render video
│   └── preload.ts           ← Bridge API renderer ↔ main (contextBridge)
├── src/
│   ├── App.tsx              ← Root UI
│   ├── pages/               ← Halaman penuh (Editor, Settings)
│   ├── components/
│   │   ├── ui/              ← Atom: Button, Input, Badge, Modal
│   │   └── features/        ← Spesifik fitur: PromptInput, PreviewPanel
│   ├── lib/                 ← Logic bisnis (gemini.ts, sceneSchema.ts)
│   ├── hooks/               ← Custom hooks (useGemini, useRender)
│   ├── stores/              ← Zustand stores (sceneStore, settingsStore)
│   ├── types/               ← TypeScript types global
│   └── constants/           ← Konstanta (warna, config, enum)
├── remotion/
│   ├── index.ts             ← Root compositions
│   └── scenes/              ← Template scene (TitleCard, Quote, dll)
├── remotion-bundle/         ← Output bundle (di-generate saat build)
├── electron.vite.config.ts
└── package.json
```

## Alur Data Utama

```
[1] User tulis prompt → PromptInput
[2] src/lib/gemini.ts → kirim ke Gemini API
[3] Gemini response → JSON SceneSpec (validated)
[4] PreviewPanel → @remotion/player render real-time
[5] User klik Export → IPC ke electron/main.ts
[6] @remotion/renderer.renderMedia() → simpan .mp4
```

## Common Commands

> Akan diisi setelah skeleton siap. Convention sementara:
> - `npm run dev` — jalankan Electron + Vite dev server
> - `npm run build` — build production
> - `npm run package` — build installer `.exe` via Electron Forge
> - `npm run lint` — ESLint check
> - `npx tsc --noEmit` — TypeScript type check

## Path Alias

- `@/*` → `src/*` (wajib dipakai untuk import dari dalam `src/`)

## Environment

- Target OS: Windows 10 64-bit (build 1903+) dan Windows 11
- Node.js: 20 LTS atau lebih baru
- Package manager: npm

## Keamanan

- Gemini API key disimpan terenkripsi di `electron-store` (AES)
- Tidak ada hardcoded secret di kode
- Renderer process tidak punya akses Node.js langsung — selalu via `contextBridge`
- Validasi semua input dari luar (Gemini output, file dialog, IPC payload)
