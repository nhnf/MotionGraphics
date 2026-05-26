// Bridge antara renderer dan main process via contextBridge. Expose API
// yang type-safe ke `window.electronAPI` sesuai interface di `src/types/ipc.ts`.
// Lihat coding-rules Section 7 untuk pattern IPC yang benar.

import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  type SetApiKeyPayload,
  type ApiKeyStatusResponse,
  type SetApiKeyResponse,
  type GetApiKeyResponse,
  type DeleteApiKeyResponse,
  type RenderStartPayload,
  type RenderStartResponse,
  type RenderCancelResponse,
  type RenderProgressEvent,
  type SaveDialogPayload,
  type SaveDialogResponse,
  type RevealPayload,
  type RevealResponse,
} from '../src/types/ipc';

// Debug: konfirmasi preload berjalan
console.log('[preload] Script loaded, setting up electronAPI...');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
  settings: {
    /**
     * Cek apakah API key sudah tersimpan tanpa membaca nilainya.
     * Dipakai untuk update `hasApiKey` di settingsStore.
     */
    getStatus: (): Promise<ApiKeyStatusResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.settings.getStatus);
    },

    /**
     * Simpan Gemini API key terenkripsi ke disk.
     * @param payload - Object berisi `apiKey` string.
     */
    setKey: (payload: SetApiKeyPayload): Promise<SetApiKeyResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.settings.setKey, payload);
    },

    /**
     * Ambil API key untuk dipakai saat generate scene. Hanya dipanggil dari
     * `useGemini` hook, tidak pernah disimpan di state renderer.
     */
    getKey: (): Promise<GetApiKeyResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.settings.getKey);
    },

    /**
     * Hapus API key dari disk. Dipanggil dari halaman Settings saat user
     * klik tombol "Hapus".
     */
    deleteKey: (): Promise<DeleteApiKeyResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.settings.deleteKey);
    },
  },

  render: {
    /**
     * Mulai render video dari SceneSpec.
     */
    start: (payload: RenderStartPayload): Promise<RenderStartResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.render.start, payload);
    },

    /**
     * Cancel render yang sedang berjalan.
     */
    cancel: (): Promise<RenderCancelResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.render.cancel);
    },

    /**
     * Listen untuk progress events dari main process.
     * Returns cleanup function untuk remove listener.
     */
    onProgress: (listener: (event: RenderProgressEvent) => void): (() => void) => {
      const handler = (_: unknown, event: RenderProgressEvent) => listener(event);
      ipcRenderer.on(IPC_CHANNELS.render.progress, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.render.progress, handler);
    },
  },

  file: {
    /**
     * Tampilkan save dialog untuk pilih lokasi output video.
     */
    saveDialog: (payload: SaveDialogPayload): Promise<SaveDialogResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.file.saveDialog, payload);
    },

    /**
     * Buka file explorer dan highlight file.
     */
    reveal: (payload: RevealPayload): Promise<RevealResponse> => {
      return ipcRenderer.invoke(IPC_CHANNELS.file.reveal, payload);
    },
  },
});
  console.log('[preload] electronAPI exposed successfully');
} catch (err) {
  console.error('[preload] Failed to expose electronAPI:', err);
}
