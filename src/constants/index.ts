// Konstanta global aplikasi. Hindari magic number — taruh di sini.

import type { SceneType } from '@/types/SceneSpec';

export const APP_NAME = 'Motion Studio';
export const APP_VERSION = '0.1.0';

// Default render config (PRD Section 4.1 F-04)
export const DEFAULT_FPS = 30;
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;

// Resolusi yang didukung untuk export (PRD Section 4.1 F-04)
export const SUPPORTED_RESOLUTIONS = [
  { label: 'HD (1280×720)', width: 1280, height: 720 },
  { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
] as const;

export const SUPPORTED_FPS = [24, 30] as const;

// Limits
export const MAX_RETRY_COUNT = 2;
export const PROMPT_HISTORY_SIZE = 5;
export const MAX_PROMPT_LENGTH = 500;

// Gemini
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Color tokens (PRD product.md — accent teal)
export const ACCENT_COLOR = '#01696f';
export const DEFAULT_BG_COLOR = '#0a0a0a';
export const DEFAULT_TEXT_COLOR = '#ffffff';

// Default scene values (dipakai sebagai fallback di validator dan default props)
export const DEFAULT_FONT_SIZE = 96;
export const DEFAULT_FONT_WEIGHT: 'regular' | 'bold' = 'bold';
export const DEFAULT_ANIMATION = 'fadeIn';
export const DEFAULT_EXIT_ANIMATION = 'fadeOut';

// Frame budget untuk transisi entry/exit (60 fps-equivalent ≈ 0.66 s @ 30 fps)
export const ENTRY_ANIMATION_FRAMES = 20;
export const EXIT_ANIMATION_FRAMES = 20;

/**
 * Durasi default per jenis scene dalam detik. Sesuai requirements.md
 * Requirement 6.3-6.6. Dipakai saat Gemini tidak menyertakan range frame
 * dan validator perlu fallback aman, atau saat user me-reset scene.
 */
export const DEFAULT_SCENE_DURATION_SECONDS: Record<SceneType, number> = {
  title: 3,
  quote: 5,
  lowerThird: 4,
  promo: 5,
  subtitle: 3,
  blank: 2,
};

// Validasi panjang teks scene agar tidak overflow di komposisi
export const MAX_SCENE_TEXT_LENGTH = 200;
export const MAX_SCENE_SUBTEXT_LENGTH = 200;

// Range valid untuk angka di SceneSpec — dipakai validator (`lib/sceneSchema.ts`)
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 512;
export const MIN_VIDEO_DURATION_SECONDS = 1;
export const MAX_VIDEO_DURATION_SECONDS = 60;

/**
 * Throttle event `render:progress` agar tidak spam IPC saat renderMedia
 * mengirim update tiap frame. Nilai 0..1 — emit saat delta progress ≥ ini.
 */
export const RENDER_PROGRESS_THROTTLE = 0.05;

// Gemini API tuning
export const GEMINI_REQUEST_TIMEOUT_MS = 30_000;

// External links
export const GOOGLE_AI_STUDIO_URL = 'https://aistudio.google.com/apikey';
