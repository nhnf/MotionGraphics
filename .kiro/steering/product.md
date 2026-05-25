# Product Overview — Motion Studio

Motion Studio adalah aplikasi desktop Windows untuk membuat motion graphics dari prompt teks (Bahasa Indonesia/Inggris). AI menginterpretasi prompt menjadi spesifikasi scene, lalu Remotion merender animasi menjadi MP4.

## Target Pengguna
- Content creator (intro/outro, lower-third, bumper)
- Guru & pendidik (konten visual presentasi)
- Pelaku UMKM (animasi promosi)
- Mahasiswa/pelajar desain

## Goal MVP (v1.0)
- Generate motion graphics dari prompt < 60 detik
- Minimal 5 template scene: Title Card, Quote, Lower Third, Promo, Slideshow
- Output MP4 minimal 1080p 30fps
- Offline-first: koneksi hanya saat generate (panggil Gemini API)

## Non-Goals (di luar MVP)
- Tidak ada timeline editor manual
- Tidak ada cloud rendering / storage online
- Tidak ada video input (hanya teks dan gambar statis)
- Tidak ada kolaborasi multi-user

## Prinsip Desain UX
- Dark mode default
- Minimal dan fokus, satu aksi utama per panel
- Feedback langsung untuk setiap aksi (loading, success, error)
- Color accent: Teal (`#01696f`)

> Dokumen PRD lengkap tersedia melalui context key `#prd` di chat.
