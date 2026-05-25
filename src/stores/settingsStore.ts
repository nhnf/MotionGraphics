// Cache status API key + preferensi export. API key sebenarnya TIDAK pernah
// disimpan di renderer (Property 2 — API key tidak bocor); store ini hanya
// menyimpan boolean `hasApiKey` yang di-sync dari main process via IPC
// `settings:get-api-key-status`.
//
// Mengikuti coding-rules Section 5 (state + `actions` object terpisah,
// selector hooks di-export terpisah).

import { create } from 'zustand';

import { DEFAULT_FPS, DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@/constants';

/** FPS yang didukung untuk export. Mirror dari `SUPPORTED_FPS` di constants. */
export type ExportFps = 24 | 30;

/** Pasangan resolusi yang dipilih user di ExportBar. */
export interface ExportResolution {
  width: number;
  height: number;
}

interface SettingsActions {
  /** Update flag setelah berhasil set/delete API key di main process. */
  setHasApiKey: (value: boolean) => void;
  setExportResolution: (res: ExportResolution) => void;
  setExportFps: (fps: ExportFps) => void;
  /** Reset seluruh state ke default — dipakai untuk testing & logout flow. */
  reset: () => void;
}

interface SettingsState {
  hasApiKey: boolean;
  exportResolution: ExportResolution;
  exportFps: ExportFps;
  actions: SettingsActions;
}

// Tipe assertion sengaja dipakai agar `DEFAULT_FPS` (number) bisa muat ke
// union literal `ExportFps` — nilai konstan sudah dijamin valid lewat
// `SUPPORTED_FPS` di `constants/index.ts`.
const DEFAULT_EXPORT_FPS = DEFAULT_FPS as ExportFps;

const INITIAL_SETTINGS_STATE = {
  hasApiKey: false,
  exportResolution: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT } as ExportResolution,
  exportFps: DEFAULT_EXPORT_FPS,
} as const;

export const useSettingsStore = create<SettingsState>((set) => ({
  ...INITIAL_SETTINGS_STATE,

  actions: {
    setHasApiKey: (value) => set({ hasApiKey: value }),
    setExportResolution: (res) => set({ exportResolution: res }),
    setExportFps: (fps) => set({ exportFps: fps }),
    reset: () =>
      set({
        hasApiKey: INITIAL_SETTINGS_STATE.hasApiKey,
        exportResolution: { ...INITIAL_SETTINGS_STATE.exportResolution },
        exportFps: INITIAL_SETTINGS_STATE.exportFps,
      }),
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export const useHasApiKey = (): boolean => useSettingsStore((s) => s.hasApiKey);

export const useExportResolution = (): ExportResolution =>
  useSettingsStore((s) => s.exportResolution);

export const useExportFps = (): ExportFps => useSettingsStore((s) => s.exportFps);

export const useSettingsActions = (): SettingsActions =>
  useSettingsStore((s) => s.actions);
