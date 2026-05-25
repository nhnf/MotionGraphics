---
inclusion: manual
---

# Product Requirements Document (PRD)
# Motion Studio — AI-Powered Motion Graphics Desktop App

**Versi:** 1.0.0
**Tanggal:** 25 Mei 2026
**Status:** Draft
**Author:** Hanafiii

---

## 1. Overview

### 1.1 Ringkasan Produk

Motion Studio adalah aplikasi desktop Windows yang memungkinkan pengguna membuat motion graphics berkualitas tinggi hanya dengan mengetikkan prompt teks berbahasa Indonesia maupun Inggris. Software ini menggunakan kecerdasan buatan (Gemini API) untuk menginterpretasi prompt dan menghasilkan spesifikasi scene, lalu Remotion sebagai engine untuk merender animasi menjadi file video `.mp4`.

### 1.2 Masalah yang Diselesaikan

Pembuatan motion graphics saat ini memerlukan keahlian khusus di software seperti Adobe After Effects atau Blender, membutuhkan waktu yang lama, dan tidak dapat dijangkau oleh pengguna non-teknis. Motion Studio menghilangkan hambatan tersebut dengan memungkinkan siapapun — mulai dari pelajar, content creator, hingga pelaku usaha kecil — untuk membuat animasi profesional dalam hitungan menit.

### 1.3 Target Pengguna

- **Content Creator** yang membutuhkan intro/outro video, lower-third, dan bumper animasi
- **Guru & Pendidik** yang ingin membuat konten visual untuk presentasi dan video pembelajaran
- **Pelaku UMKM** yang membutuhkan animasi promosi sederhana tanpa biaya desainer
- **Mahasiswa/Pelajar** yang belajar desain komunikasi visual

---

## 2. Tujuan Produk

### 2.1 Goals (MVP v1.0)

- Pengguna dapat menghasilkan motion graphics dari teks prompt dalam waktu < 60 detik
- Mendukung minimal 5 template scene bawaan (Title Card, Quote, Lower Third, Promo, Slideshow)
- Menghasilkan video MP4 dengan kualitas minimal 1080p 30fps
- Aplikasi dapat berjalan secara offline setelah setup API key (tidak memerlukan koneksi untuk preview, hanya untuk generate)

### 2.2 Non-Goals (diluar scope MVP)

- Tidak mendukung editing timeline manual di v1.0
- Tidak menyediakan cloud rendering atau storage online
- Tidak mendukung video input (hanya teks dan gambar statis)
- Tidak ada fitur kolaborasi multi-user

---

## 3. Arsitektur Teknis

### 3.1 Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Desktop Framework | **Electron** + `electron-vite` | Cross-platform, full Node.js access |
| UI Framework | **React** + TypeScript | Component-based, konsisten dengan Remotion |
| Styling | **Tailwind CSS v4** | Utility-first, ringan |
| AI Engine | **Gemini API** (`gemini-2.0-flash`) | Interpretasi prompt → JSON scene spec |
| Animation Engine | **Remotion** | Render video dari React components |
| Preview Player | `@remotion/player` | Real-time preview tanpa render penuh |
| Video Renderer | `@remotion/renderer` | Render final MP4 di main process |
| Packaging | **Electron Forge** (Squirrel) | Build installer `.exe` Windows |
| State Management | **Zustand** | Ringan, cocok untuk Electron app |

### 3.2 Struktur Folder Project

```
motion-studio/
├── electron/
│   ├── main.ts              ← Main process: IPC handler, render video
│   └── preload.ts           ← Bridge API renderer ↔ main
├── src/
│   ├── App.tsx              ← Root UI
│   ├── pages/
│   │   ├── Editor.tsx       ← Halaman editor utama
│   │   └── Settings.tsx     ← Halaman pengaturan API key
│   ├── components/
│   │   ├── PromptInput.tsx  ← Area input prompt
│   │   ├── PreviewPanel.tsx ← Remotion Player embed
│   │   ├── SceneList.tsx    ← Daftar scene yang dihasilkan
│   │   └── ExportBar.tsx    ← Tombol export + progress
│   └── lib/
│       ├── gemini.ts        ← Komunikasi ke Gemini API
│       └── sceneSchema.ts   ← TypeScript types untuk scene spec
├── remotion/
│   ├── index.ts             ← Root compositions
│   └── scenes/
│       ├── TitleCard.tsx    ← Template: judul besar
│       ├── QuoteCard.tsx    ← Template: kutipan
│       ├── LowerThird.tsx   ← Template: teks bawah layar
│       ├── PromoCard.tsx    ← Template: promosi produk
│       └── Slideshow.tsx    ← Template: slideshow teks/gambar
├── remotion-bundle/         ← Output bundle (di-generate saat build)
├── electron.vite.config.ts
└── package.json
```

### 3.3 Alur Data Utama

```
[1] User tulis prompt di PromptInput
         ↓
[2] src/lib/gemini.ts → kirim prompt ke Gemini API
         ↓
[3] Gemini mengembalikan JSON SceneSpec (terstruktur, tervalidasi)
         ↓
[4] PreviewPanel → render SceneSpec via @remotion/player (real-time)
         ↓
[5] User klik "Export" → IPC call ke electron/main.ts
         ↓
[6] renderMedia() dari @remotion/renderer → simpan file .mp4
```

---

## 4. Fitur Detail

### 4.1 Fitur Inti (MVP)

#### F-01: Input Prompt
- Text area multi-baris dengan placeholder contoh prompt
- Tombol "Generate" dengan shortcut `Ctrl+Enter`
- Indikator loading saat Gemini sedang memproses
- Riwayat prompt terakhir (5 entri, disimpan di memori sesi)

#### F-02: AI Scene Generator
- Mengirim prompt ke Gemini API menggunakan model `gemini-2.0-flash`
- Output: JSON terstruktur berisi daftar scene (`SceneSpec`)
- Validasi JSON otomatis; jika invalid, sistem meminta ulang ke Gemini (max 2x retry)
- Mendukung prompt Bahasa Indonesia dan Inggris

**Struktur `SceneSpec` (TypeScript):**
```typescript
interface SceneSpec {
  title: string;
  totalDuration: number;       // dalam detik
  fps: number;                 // default: 30
  width: number;               // default: 1920
  height: number;              // default: 1080
  bgColor: string;             // hex color
  scenes: Scene[];
}

interface Scene {
  id: string;
  type: "title" | "subtitle" | "quote" | "lowerThird" | "promo" | "blank";
  text: string;
  subText?: string;
  color: string;
  bgColor?: string;
  fontSize: number;
  fontWeight: "regular" | "bold";
  startFrame: number;
  endFrame: number;
  animation: "fadeIn" | "slideFromLeft" | "slideFromBottom" | "scaleUp" | "typewriter";
  exitAnimation: "fadeOut" | "slideOut" | "none";
}
```

#### F-03: Preview Real-Time
- Preview menggunakan `@remotion/player` yang di-embed di UI
- Kontrol play/pause, scrub timeline, dan looping
- Preview tidak membutuhkan proses render (langsung dari React components)
- Update otomatis setiap kali SceneSpec berubah

#### F-04: Export Video
- Export ke format MP4 (codec H.264)
- Pilihan resolusi: 1280×720 (HD), 1920×1080 (Full HD)
- Pilihan frame rate: 24fps, 30fps
- Dialog save-as Windows native untuk memilih lokasi penyimpanan
- Progress bar dengan persentase render
- Notifikasi selesai dengan opsi "Buka Folder"

#### F-05: Pengaturan API Key
- Halaman Settings khusus untuk menyimpan Gemini API key
- API key disimpan terenkripsi menggunakan `electron-store` dengan enkripsi AES
- Tombol "Test Connection" untuk verifikasi API key valid
- Link ke Google AI Studio untuk mendapatkan API key

### 4.2 Template Scene Bawaan

| ID | Nama | Deskripsi | Durasi Default |
|---|---|---|---|
| `title` | Title Card | Judul besar di tengah layar dengan animasi masuk | 3 detik |
| `quote` | Quote Card | Teks kutipan dengan garis pembatas dan nama sumber | 5 detik |
| `lowerThird` | Lower Third | Teks nama/keterangan di bagian bawah layar | 4 detik |
| `promo` | Promo Card | Teks promosi dengan highlight warna dan CTA | 5 detik |
| `slideshow` | Slideshow | Beberapa scene teks berurutan | Variabel |

### 4.3 Fitur Lanjutan (v1.5 — Roadmap)

- Edit manual teks scene hasil AI (WYSIWYG editor ringan)
- Pilihan preset color palette (Dark, Light, Brand Custom)
- Dukungan upload gambar untuk background scene
- Export ke format GIF dan WebM
- Simpan project sebagai file `.msproj` untuk dibuka kembali
- Fitur "Regenerate Scene" untuk membuat ulang scene tertentu saja

---

## 5. Desain UI/UX

### 5.1 Layout Utama

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo | Nama Project | Settings | Minimize/Close │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  LEFT PANEL  │            CENTER: PREVIEW               │
│  ─────────── │         (@remotion/player)               │
│  Prompt      │                                          │
│  Input Area  │    [  ▶ Play  ──────── 0:00 / 0:05  ]   │
│              │                                          │
│  [Generate]  ├──────────────────────────────────────────┤
│              │         BOTTOM: SCENE LIST               │
│  Scene List  │  [Scene 1][Scene 2][Scene 3][+ Add]      │
│  ─────────── │                                          │
│  Scene 1     ├──────────────────────────────────────────┤
│  Scene 2     │  EXPORT BAR:  [HD ▼] [30fps ▼] [Export] │
│  Scene 3     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### 5.2 Prinsip Desain

- **Dark mode sebagai default** — nyaman untuk pekerjaan panjang, cocok dengan konten video
- **Minimal dan fokus** — satu aksi utama per panel, tidak ada elemen dekoratif berlebihan
- **Feedback langsung** — setiap aksi (generate, render) memiliki state visual yang jelas (loading, success, error)
- **Color accent: Teal** — menggunakan palet Nexus (`#01696f`) sebagai aksen utama

---

## 6. Kebutuhan Non-Fungsional

### 6.1 Performa
- Waktu launch aplikasi: < 5 detik di komputer spesifikasi minimum
- Waktu generate dari prompt hingga preview: < 15 detik (tergantung respons Gemini API)
- Waktu render video 5 detik / 1080p: < 60 detik di spesifikasi minimum

### 6.2 Spesifikasi Minimum Windows
- OS: Windows 10 64-bit (build 1903 ke atas)
- RAM: 4 GB (8 GB direkomendasikan)
- Storage: 500 MB untuk instalasi + ruang untuk output video
- CPU: Intel Core i3 / AMD Ryzen 3 generasi ke-8 ke atas
- Koneksi internet: Diperlukan hanya saat Generate (memanggil Gemini API)

### 6.3 Keamanan
- Gemini API key tidak pernah di-hardcode, disimpan di local storage terenkripsi
- Tidak ada data pengguna yang dikirim ke server selain prompt ke Gemini API
- Semua proses render berjalan secara lokal

---

## 7. Rencana Pengembangan

### Phase 1 — MVP (Estimasi: 6–8 minggu)

| Minggu | Target |
|---|---|
| 1–2 | Setup project Electron + Vite + React + Remotion, integrasi Gemini API dasar |
| 3–4 | Bangun 5 template scene Remotion, validasi SceneSpec |
| 5 | Integrasi `@remotion/player` untuk preview, layout UI utama |
| 6 | Implementasi render export via IPC + dialog save-as |
| 7 | Halaman Settings, enkripsi API key, error handling menyeluruh |
| 8 | Testing, bug fix, build installer `.exe` via Electron Forge |

### Phase 2 — v1.5 (Estimasi: 4–6 minggu setelah MVP)

- Edit manual scene (teks, warna, timing)
- Dukungan gambar background
- Format export tambahan (GIF, WebM)
- Simpan/buka file project

### Phase 3 — v2.0 (Roadmap Jangka Panjang)

- Timeline editor visual (drag & drop)
- Support audio/musik background
- Brand kit (simpan warna, font, logo perusahaan)
- Plugin system untuk template komunitas

---

## 8. Risiko dan Mitigasi

| Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|
| Output JSON Gemini tidak valid atau tidak konsisten | Tinggi | Sedang | Validasi schema + retry otomatis (max 2x) + fallback template default |
| Perubahan harga/kebijakan Gemini API | Sedang | Rendah | Desain arsitektur agar mudah ganti provider AI (abstraksi `lib/ai.ts`) |
| Performa render lambat di hardware low-end | Sedang | Tinggi | Batasi kompleksitas scene, gunakan Web Workers, tambahkan opsi resolusi HD (720p) |
| Electron bundle size terlalu besar | Rendah | Tinggi | Gunakan `electron-builder` tree-shaking, pisahkan Remotion bundle |
| Kompatibilitas Windows versi lama | Rendah | Sedang | Target Windows 10+ saja untuk MVP |

---

## 9. Kesuksesan Produk

### 9.1 Metrik Keberhasilan MVP

- Pengguna berhasil generate dan export minimal 1 video dari prompt tanpa membaca dokumentasi
- Waktu dari buka aplikasi hingga video selesai di-export: < 3 menit
- Zero crash saat proses render di 3 skenario prompt yang berbeda
- File `.exe` installer berjalan di Windows 10 dan Windows 11 tanpa error

### 9.2 Kriteria Go/No-Go untuk Rilis

- [ ] Semua fitur MVP (F-01 hingga F-05) berfungsi penuh
- [ ] Installer `.exe` berhasil diuji di minimal 2 mesin Windows berbeda
- [ ] API key tersimpan aman, tidak tampil di log atau proses manapun
- [ ] Tidak ada memory leak setelah 5 sesi generate berturut-turut

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan proyek.*
