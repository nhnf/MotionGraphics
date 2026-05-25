# Requirements Document

## Introduction

Motion Studio MVP memungkinkan pengguna desktop Windows membuat motion graphics dengan menulis prompt teks (Bahasa Indonesia/Inggris). Sistem mengirim prompt ke Gemini API, menerima `SceneSpec` JSON terstruktur, menampilkan preview real-time via `@remotion/player`, lalu mengekspor ke MP4 via `@remotion/renderer`. Ruang lingkup MVP mencakup lima fitur inti F-01 sampai F-05 sebagaimana didefinisikan di PRD Section 4.1, target waktu launch < 5 detik, generate < 15 detik, dan render 5 detik 1080p < 60 detik di spesifikasi minimum.

## Glossary

- **SceneSpec**: Struktur JSON output dari Gemini yang mendeskripsikan satu video lengkap (title, durasi, fps, dimensi, daftar scene). Lihat PRD Section 4.1 F-02 untuk schema lengkap.
- **Scene**: Satu segmen visual dalam komposisi, memiliki tipe (title, quote, dll), teks, warna, frame mulai/selesai, dan animasi masuk/keluar.
- **Renderer process**: Proses Electron yang menjalankan UI React (`src/`).
- **Main process**: Proses Electron utama yang punya akses Node.js (`electron/main.ts`), bertanggung jawab atas render video dan storage.
- **IPC channel**: Format `domain:action` (mis: `render:start`, `settings:get-api-key`).
- **Spesifikasi minimum**: Windows 10 64-bit, 4 GB RAM, Intel i3/Ryzen 3 generasi 8+ (PRD Section 6.2).

## Requirements

### Requirement 1: Input Prompt (F-01)

**User Story:** Sebagai pengguna, saya ingin menulis prompt teks deskripsi animasi dan mengirimnya untuk diproses, agar saya bisa menghasilkan motion graphics tanpa belajar software desain.

#### Acceptance Criteria

1. WHEN aplikasi diluncurkan THEN halaman Editor SHALL menampilkan textarea multi-baris dengan placeholder contoh prompt yang relevan.
2. WHEN pengguna mengetik di textarea THEN sistem SHALL menyimpan teks ke state lokal tanpa memicu API call.
3. WHEN pengguna menekan tombol "Generate" atau pintasan `Ctrl+Enter` AND prompt tidak kosong THEN sistem SHALL memulai proses F-02 (AI Scene Generator).
4. WHEN prompt kosong atau hanya whitespace THEN tombol Generate SHALL disabled dan pintasan tidak berefek.
5. WHEN panjang prompt melebihi 500 karakter THEN sistem SHALL menampilkan pesan validasi dan mencegah submit.
6. WHILE proses generate berlangsung THEN tombol Generate SHALL disabled, label berubah menjadi "Generating...", dan indikator loading visual SHALL terlihat.
7. WHEN generate selesai (sukses atau error) THEN riwayat 5 prompt terakhir SHALL terupdate di memori sesi (tidak persisten antar restart aplikasi).
8. WHEN pengguna memilih item dari riwayat prompt THEN textarea SHALL terisi dengan teks tersebut.

### Requirement 2: AI Scene Generator (F-02)

**User Story:** Sebagai pengguna, saya ingin sistem menerjemahkan prompt saya menjadi spesifikasi scene yang valid dan siap dirender, agar saya tidak perlu menulis kode atau JSON manual.

#### Acceptance Criteria

1. WHEN proses generate dimulai AND API key tersedia THEN sistem SHALL mengirim prompt ke Gemini model `gemini-2.0-flash` dengan system instruction yang menghasilkan output JSON `SceneSpec`.
2. WHEN respons Gemini diterima THEN sistem SHALL mem-parse dan memvalidasi JSON terhadap schema `SceneSpec` (lihat PRD Section 4.1).
3. IF JSON invalid atau gagal parse THEN sistem SHALL melakukan retry otomatis ke Gemini sampai maksimal 2 kali (`MAX_RETRY_COUNT`).
4. IF retry tetap gagal setelah 2 kali THEN sistem SHALL menampilkan error eksplisit ke pengguna ("Gagal menghasilkan scene yang valid").
5. WHEN API key belum dikonfigurasi THEN sistem SHALL memblokir generate dan mengarahkan pengguna ke halaman Settings.
6. WHEN response Gemini sukses dan tervalidasi THEN sistem SHALL menyimpan `SceneSpec` ke `sceneStore` dan reset state error.
7. WHEN Gemini API mengembalikan error (auth, quota, network) THEN sistem SHALL menampilkan pesan error spesifik (bukan "Unknown error").
8. WHEN prompt berisi Bahasa Indonesia atau Inggris THEN sistem SHALL memproduksi `SceneSpec` valid dengan teks scene dalam bahasa yang sama dengan prompt.
9. WHERE proses generate selesai THEN durasi total dari klik Generate sampai SceneSpec siap SHALL kurang dari 15 detik (kondisi jaringan normal).

### Requirement 3: Preview Real-Time (F-03)

**User Story:** Sebagai pengguna, saya ingin melihat hasil animasi di preview window sebelum melakukan export, agar saya bisa memverifikasi hasil tanpa menunggu render penuh.

#### Acceptance Criteria

1. WHEN `SceneSpec` valid tersedia di store THEN PreviewPanel SHALL menampilkan komposisi via `@remotion/player` dengan dimensi sesuai `SceneSpec` (default 1920×1080).
2. WHEN `SceneSpec` belum tersedia THEN PreviewPanel SHALL menampilkan placeholder kosong dengan instruksi singkat ("Tulis prompt dan klik Generate").
3. WHEN `SceneSpec` di store berubah THEN PreviewPanel SHALL otomatis update tanpa perlu interaksi pengguna.
4. WHEN pengguna menekan tombol play/pause di player THEN preview SHALL play/pause sesuai kontrol Remotion bawaan.
5. WHEN pengguna men-scrub timeline THEN preview SHALL menampilkan frame yang sesuai dengan posisi scrub.
6. WHEN preview mencapai akhir komposisi AND mode loop aktif THEN preview SHALL kembali ke frame 0 dan terus berputar.
7. WHILE preview berjalan THEN sistem TIDAK BOLEH memanggil API eksternal atau memicu render disk.
8. WHEN pengguna memilih scene tertentu di SceneList THEN preview SHALL melompat ke `startFrame` scene tersebut.

### Requirement 4: Export Video (F-04)

**User Story:** Sebagai pengguna, saya ingin mengekspor hasil preview ke file MP4 yang bisa saya gunakan di tempat lain, agar hasil kerja saya bisa dipakai untuk konten akhir.

#### Acceptance Criteria

1. WHEN `SceneSpec` valid tersedia THEN tombol Export di ExportBar SHALL enabled.
2. WHEN `SceneSpec` belum tersedia THEN tombol Export SHALL disabled.
3. WHEN pengguna mengklik Export THEN sistem SHALL menampilkan dialog save-as Windows native dengan ekstensi default `.mp4`.
4. WHEN pengguna memilih lokasi file dan menekan Save THEN sistem SHALL memanggil IPC `render:start` dengan payload `SceneSpec`, resolusi terpilih, dan fps terpilih.
5. WHEN pengguna membatalkan dialog save-as THEN proses render TIDAK dimulai dan UI tetap idle.
6. WHILE render berjalan di main process THEN renderer SHALL menampilkan progress bar dengan persentase yang diupdate via IPC `render:progress`.
7. WHEN render selesai sukses THEN sistem SHALL menampilkan notifikasi "Export selesai" dengan tombol "Buka Folder" yang membuka File Explorer di lokasi file.
8. WHEN render gagal THEN sistem SHALL menampilkan pesan error spesifik dan tidak meninggalkan file output corrupt.
9. WHEN pengguna mengklik Cancel saat render berlangsung THEN sistem SHALL memanggil IPC `render:cancel` dan menghentikan proses.
10. WHERE pilihan resolusi tersedia THEN nilai SHALL `1280×720 (HD)` dan `1920×1080 (Full HD)`.
11. WHERE pilihan fps tersedia THEN nilai SHALL `24` dan `30`.
12. WHERE codec output THEN sistem SHALL memakai H.264 (default `@remotion/renderer`).

### Requirement 5: Pengaturan API Key (F-05)

**User Story:** Sebagai pengguna, saya ingin menyimpan Gemini API key saya secara aman di aplikasi, agar saya tidak perlu mengetik ulang setiap kali generate dan agar key tersebut tidak bocor.

#### Acceptance Criteria

1. WHEN pengguna mengakses halaman Settings THEN sistem SHALL menampilkan input field untuk API key (tipe password) dan link ke Google AI Studio.
2. WHEN pengguna mengisi API key dan menekan Save THEN sistem SHALL menyimpan key terenkripsi (AES) ke `electron-store` via IPC `settings:set-api-key`.
3. WHEN halaman Settings dibuka kembali THEN field API key SHALL menampilkan placeholder masked (bukan plain text key) jika sudah pernah disimpan.
4. WHEN pengguna mengklik tombol "Test Connection" THEN sistem SHALL memanggil Gemini API dengan request minimal dan menampilkan status sukses atau error.
5. WHEN pengguna mengklik "Hapus API Key" THEN sistem SHALL menghapus key dari storage dan reset state ke kondisi belum dikonfigurasi.
6. WHERE penyimpanan API key THEN nilai TIDAK BOLEH muncul di log, console, file plain text, atau payload IPC selain channel `settings:set-api-key` dan `settings:get-api-key`.
7. WHEN aplikasi diluncurkan tanpa API key tersimpan THEN halaman Editor SHALL menampilkan banner peringatan dengan link langsung ke Settings.

### Requirement 6: Template Scene Bawaan

**User Story:** Sebagai pengguna, saya ingin tersedia minimal 5 template scene yang sudah dirancang baik, agar prompt saya menghasilkan animasi yang konsisten dan profesional.

#### Acceptance Criteria

1. WHEN sistem merender `SceneSpec` THEN setiap scene dengan `type` valid SHALL dipetakan ke komponen Remotion yang sesuai.
2. WHERE template MVP THEN sistem SHALL menyediakan: `title` (Title Card), `quote` (Quote Card), `lowerThird` (Lower Third), `promo` (Promo Card), dan `subtitle/blank` untuk scene transisi pendukung.
3. WHEN template Title Card di-render THEN durasi default SHALL 3 detik dengan animasi masuk.
4. WHEN template Quote Card di-render THEN durasi default SHALL 5 detik dan menampilkan teks kutipan dengan garis pembatas dan sumber (jika ada `subText`).
5. WHEN template Lower Third di-render THEN durasi default SHALL 4 detik, posisi teks di sepertiga bawah layar.
6. WHEN template Promo Card di-render THEN durasi default SHALL 5 detik dengan highlight warna pada CTA.
7. WHEN `Slideshow` digunakan THEN sistem SHALL merangkai beberapa scene berurutan tanpa overlap frame.
8. WHEN `Scene.animation` bernilai salah satu dari `fadeIn`, `slideFromLeft`, `slideFromBottom`, `scaleUp`, atau `typewriter` THEN komposisi SHALL menerapkan transisi sesuai jenis animasi.
9. WHEN `Scene.exitAnimation` bernilai `fadeOut`, `slideOut`, atau `none` THEN komposisi SHALL menerapkan transisi keluar sesuai jenis exit animation.
10. IF `type` tidak dikenali THEN komposisi SHALL menampilkan scene blank dengan `bgColor` saja dan log warning di main process (tidak crash).

### Requirement 7: Performa & Kualitas

**User Story:** Sebagai pengguna dengan komputer spesifikasi minimum, saya ingin aplikasi tetap responsif dan tidak crash, agar saya bisa bekerja tanpa frustrasi.

#### Acceptance Criteria

1. WHEN aplikasi diluncurkan di komputer spesifikasi minimum THEN waktu dari double-click sampai window terlihat SHALL kurang dari 5 detik.
2. WHEN proses render 5 detik video di resolusi 1080p berjalan THEN durasi render SHALL kurang dari 60 detik di spesifikasi minimum.
3. WHEN pengguna melakukan 5 sesi generate berturut-turut THEN tidak boleh ada memory leak yang membuat usage RAM bertambah > 50 MB per sesi setelah GC.
4. WHEN render error terjadi THEN aplikasi TIDAK BOLEH crash; error SHALL ditangkap dan ditampilkan ke UI.
5. WHEN dependencies bermasalah (mis: ffmpeg tidak ditemukan) THEN sistem SHALL menampilkan pesan error yang actionable, bukan stack trace mentah.

### Requirement 8: Keamanan

**User Story:** Sebagai pengguna, saya ingin data sensitif (API key, prompt) saya aman dan tidak bocor ke pihak ketiga, agar saya bisa percaya dengan aplikasi ini.

#### Acceptance Criteria

1. WHEN renderer process membutuhkan akses ke main process THEN komunikasi SHALL melalui `contextBridge` dan IPC channel yang spesifik (tidak expose `ipcRenderer` mentah).
2. WHEN data dikirim ke Gemini API THEN payload SHALL hanya berisi prompt pengguna dan API key di header — tidak ada data tambahan dari sistem.
3. WHEN file disimpan dari dialog save-as THEN sistem SHALL memvalidasi ekstensi `.mp4` dan menggunakan `path.resolve()` untuk mencegah path traversal.
4. WHEN aplikasi berjalan THEN `nodeIntegration` SHALL `false` dan `contextIsolation` SHALL `true` di BrowserWindow.
5. WHEN halaman dimuat THEN Content Security Policy (CSP) SHALL membatasi `connect-src` ke `https://generativelanguage.googleapis.com` dan `script-src 'self'`.
