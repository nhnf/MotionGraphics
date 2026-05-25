// Single source of truth untuk SceneSpec aktif + status proses generate.
// Mengikuti coding-rules Section 5 (state + `actions` object terpisah,
// selector hooks di-export terpisah agar komponen tidak re-render berlebihan).
//
// Validates: Property 1 (SceneSpec immutability — komponen tidak boleh
// memutasi sceneSpec; selalu lewat actions di store ini).
// Validates: Property 8 (single source of truth — komponen membaca lewat
// selector granular `useSceneSpec`, `useIsGenerating`, dll).

import { create } from 'zustand';

import { PROMPT_HISTORY_SIZE } from '@/constants';
import type { SceneSpec } from '@/types/SceneSpec';

interface SceneActions {
  /** Simpan SceneSpec baru hasil generate. Juga clear error state. */
  setSceneSpec: (spec: SceneSpec) => void;
  /** Tandai proses generate sedang berjalan / selesai. */
  setGenerating: (value: boolean) => void;
  /**
   * Set pesan error generate. Pemanggilan dengan pesan non-null otomatis
   * mematikan flag isGenerating agar UI tidak macet di state loading saat
   * gagal. Pakai `null` untuk clear error.
   */
  setError: (message: string | null) => void;
  /**
   * Tambah prompt ke riwayat (paling baru di indeks 0). Maks
   * `PROMPT_HISTORY_SIZE` entri dengan kebijakan FIFO (drop yang paling lama).
   * Tidak menambah duplikat berurutan (mis. user klik Generate dua kali
   * dengan prompt yang sama).
   */
  addPromptToHistory: (prompt: string) => void;
  /** Reset seluruh state ke kondisi awal — dipakai untuk testing & logout flow. */
  reset: () => void;
}

interface SceneState {
  sceneSpec: SceneSpec | null;
  isGenerating: boolean;
  error: string | null;
  /** Ring buffer kapasitas `PROMPT_HISTORY_SIZE`, terbaru di depan. */
  promptHistory: string[];
  actions: SceneActions;
}

const INITIAL_SCENE_STATE = {
  sceneSpec: null,
  isGenerating: false,
  error: null,
  promptHistory: [] as string[],
} as const;

export const useSceneStore = create<SceneState>((set) => ({
  ...INITIAL_SCENE_STATE,

  actions: {
    setSceneSpec: (spec) => set({ sceneSpec: spec, error: null }),

    setGenerating: (value) => set({ isGenerating: value }),

    setError: (message) =>
      set(
        message === null
          ? { error: null }
          : { error: message, isGenerating: false }
      ),

    addPromptToHistory: (prompt) =>
      set((state) => {
        const trimmed = prompt.trim();
        if (trimmed.length === 0) {
          return state;
        }
        // Skip duplikat berurutan supaya history bermakna.
        if (state.promptHistory[0] === trimmed) {
          return state;
        }
        const next = [trimmed, ...state.promptHistory].slice(0, PROMPT_HISTORY_SIZE);
        return { promptHistory: next };
      }),

    reset: () => set({ ...INITIAL_SCENE_STATE, promptHistory: [] }),
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks — granular agar komponen yang hanya butuh satu slice tidak
// re-render saat slice lain berubah (Property 8 single source of truth).
// ---------------------------------------------------------------------------

export const useSceneSpec = (): SceneSpec | null =>
  useSceneStore((s) => s.sceneSpec);

export const useIsGenerating = (): boolean =>
  useSceneStore((s) => s.isGenerating);

export const useSceneError = (): string | null => useSceneStore((s) => s.error);

export const usePromptHistory = (): readonly string[] =>
  useSceneStore((s) => s.promptHistory);

export const useSceneActions = (): SceneActions =>
  useSceneStore((s) => s.actions);
