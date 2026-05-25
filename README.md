# Motion Studio

Aplikasi desktop Windows untuk membuat motion graphics dari prompt teks. Powered by Gemini API dan Remotion.

## Status

🚧 **v0.1.0 — Skeleton** | Pondasi project siap, fitur MVP (F-01 sampai F-05) menyusul lewat spec.

## Tech Stack

Electron · electron-vite · React 19 · TypeScript · Tailwind CSS v4 · Remotion · Gemini API · Zustand

## Prasyarat

- Node.js 20 LTS atau lebih baru
- npm 10+
- Windows 10 (build 1903+) atau Windows 11

## Setup

```bash
npm install
```

## Scripts

| Command | Keterangan |
|---|---|
| `npm run dev` | Jalankan Electron + Vite dev server (renderer hot reload) |
| `npm run build` | Build production (main, preload, renderer) |
| `npm run preview` | Preview hasil build |
| `npm run typecheck` | TypeScript type check tanpa emit |
| `npm run lint` | ESLint check (max-warnings 0) |
| `npm run format` | Format dengan Prettier |
| `npm run remotion:studio` | Buka Remotion Studio untuk preview komposisi |

## Struktur Folder

```
electron/        Main process & preload (IPC)
src/             Renderer UI (React + Tailwind)
  pages/         Halaman penuh
  components/    UI atoms + feature components
  lib/           Logic bisnis (Gemini, schema)
  hooks/         Custom React hooks
  stores/        Zustand stores
  types/         TypeScript types global
  constants/     Konstanta global
remotion/        Komposisi & template scene Remotion
  scenes/        Template (TitleCard, QuoteCard, dll)
.kiro/           Steering & spec untuk Kiro AI
```

## Aturan Kontribusi

Lihat `.kiro/steering/coding-rules.md` untuk aturan lengkap (TypeScript strict, struktur komponen, IPC convention, dll).

## Lisensi

UNLICENSED — proyek personal Hanafiii.
