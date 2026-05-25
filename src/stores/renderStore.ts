// Status proses export video. State ini di-update lewat handler IPC
// (`render:start`, `render:progress`, `render:cancel`) yang dipanggil dari
// `useRender` hook.
//
// Mengikuti coding-rules Section 5 (state + `actions` object terpisah,
// selector hooks di-export terpisah).
//
// Validates: Property 3 (render idempotency — `startRender()` di-guard di
// hook level dengan membaca `isRendering`; store ini adalah sumbernya).

import { create } from 'zustand';

interface RenderActions {
  /**
   * Mulai sesi render baru. Reset progress ke 0, clear error, set
   * isRendering ke true. Tidak mengubah `lastOutputPath` agar UI bisa tetap
   * menampilkan tombol "Buka Folder" untuk export sebelumnya selama render
   * baru berlangsung.
   */
  startRender: () => void;
  /**
   * Update progress 0..1. Nilai di luar range akan di-clamp untuk mencegah
   * UI progress bar overflow. Aman untuk dipanggil dari listener IPC walau
   * Remotion sesekali mengirim nilai >1 saat finalize.
   */
  setProgress: (p: number) => void;
  /**
   * Tandai render selesai sukses. Menyimpan path output, set progress ke 1,
   * matikan flag isRendering.
   */
  finishRender: (outputPath: string) => void;
  /** Tandai render gagal dengan pesan error. Matikan flag isRendering. */
  failRender: (message: string) => void;
  /**
   * Reset progress + error tanpa mengubah `lastOutputPath`. Dipakai saat
   * user klik Cancel atau saat hook menerima konfirmasi cancel dari main.
   */
  cancel: () => void;
  /** Reset seluruh state ke kondisi awal — dipakai untuk testing. */
  reset: () => void;
}

interface RenderState {
  isRendering: boolean;
  /** Persentase render 0..1 (di-clamp di action). */
  progress: number;
  /** Path output mp4 dari render terakhir yang sukses. `null` jika belum pernah. */
  lastOutputPath: string | null;
  error: string | null;
  actions: RenderActions;
}

const INITIAL_RENDER_STATE = {
  isRendering: false,
  progress: 0,
  lastOutputPath: null,
  error: null,
} as const;

const clampProgress = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

export const useRenderStore = create<RenderState>((set) => ({
  ...INITIAL_RENDER_STATE,

  actions: {
    startRender: () =>
      set({
        isRendering: true,
        progress: 0,
        error: null,
      }),

    setProgress: (p) => set({ progress: clampProgress(p) }),

    finishRender: (outputPath) =>
      set({
        isRendering: false,
        progress: 1,
        lastOutputPath: outputPath,
        error: null,
      }),

    failRender: (message) =>
      set({
        isRendering: false,
        error: message,
      }),

    cancel: () =>
      set({
        isRendering: false,
        progress: 0,
        error: null,
      }),

    reset: () => set({ ...INITIAL_RENDER_STATE }),
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export const useIsRendering = (): boolean => useRenderStore((s) => s.isRendering);

export const useRenderProgress = (): number => useRenderStore((s) => s.progress);

export const useLastOutputPath = (): string | null =>
  useRenderStore((s) => s.lastOutputPath);

export const useRenderError = (): string | null => useRenderStore((s) => s.error);

export const useRenderActions = (): RenderActions =>
  useRenderStore((s) => s.actions);
