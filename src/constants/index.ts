// Konstanta global aplikasi. Hindari magic number — taruh di sini.

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
