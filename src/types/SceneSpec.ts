// Tipe canonical untuk SceneSpec — output JSON terstruktur dari Gemini API
// dan satu-satunya representasi data animasi yang dibaca Preview & Renderer.
// Lihat design.md "Components and Interfaces > SceneSpec schema" dan
// requirements.md Requirement 2.2, 6.1 untuk detail kontrak.

/**
 * Jenis scene yang didukung MVP. Setiap nilai dipetakan ke komponen Remotion
 * di `remotion/SceneRenderer.tsx`. Nilai di luar union ini dianggap invalid.
 */
export type SceneType = 'title' | 'subtitle' | 'quote' | 'lowerThird' | 'promo' | 'blank';

/**
 * Animasi masuk yang valid untuk sebuah Scene. Diterapkan di awal range frame
 * scene (`startFrame` ke `startFrame + ENTRY_ANIMATION_FRAMES`).
 */
export type AnimationType =
  | 'fadeIn'
  | 'slideFromLeft'
  | 'slideFromBottom'
  | 'scaleUp'
  | 'typewriter';

/**
 * Animasi keluar yang valid untuk sebuah Scene. Diterapkan di akhir range
 * frame scene (`endFrame - EXIT_ANIMATION_FRAMES` ke `endFrame`). Nilai
 * `'none'` berarti scene berakhir tanpa transisi keluar.
 */
export type ExitAnimationType = 'fadeOut' | 'slideOut' | 'none';

/**
 * Bobot font yang didukung untuk teks scene. Di-mapping ke `fontWeight` CSS
 * di komponen Remotion.
 */
export type FontWeight = 'regular' | 'bold';

/**
 * Satu segmen visual dalam komposisi. Range frame harus memenuhi
 * `0 <= startFrame < endFrame <= totalDuration * fps` (divalidasi di
 * `lib/sceneSchema.ts`). Field opsional dijelaskan di komentar masing-masing.
 */
export interface Scene {
  /** ID unik scene di dalam SceneSpec. Dipakai sebagai React key dan target seek. */
  id: string;
  type: SceneType;
  /** Teks utama scene. Wajib non-empty. */
  text: string;
  /** Teks pendukung (sumber kutipan, jabatan di lower third, dll). Opsional. */
  subText?: string;
  /** Warna teks utama dalam format CSS hex/rgb/hsl. */
  color: string;
  /** Warna latar scene. Jika tidak diset, fallback ke `SceneSpec.bgColor`. */
  bgColor?: string;
  /** Ukuran font dalam pixel pada resolusi `SceneSpec.width × SceneSpec.height`. */
  fontSize: number;
  fontWeight: FontWeight;
  /** Frame mulai scene (inklusif). */
  startFrame: number;
  /** Frame akhir scene (eksklusif untuk durasi, inklusif untuk validasi range). */
  endFrame: number;
  animation: AnimationType;
  exitAnimation: ExitAnimationType;
}

/**
 * Spesifikasi lengkap satu video. Single source of truth — disimpan di
 * `sceneStore` dan dibaca oleh Preview Player serta service video renderer.
 */
export interface SceneSpec {
  /** Judul ringkas video, dipakai sebagai default nama file saat export. */
  title: string;
  /** Durasi total video dalam detik. Dipakai untuk hitung `durationInFrames`. */
  totalDuration: number;
  fps: number;
  width: number;
  height: number;
  /** Warna latar default seluruh komposisi (fallback jika `Scene.bgColor` kosong). */
  bgColor: string;
  scenes: Scene[];
}
