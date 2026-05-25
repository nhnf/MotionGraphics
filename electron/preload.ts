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
} from '../src/types/ipc';

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

  // Placeholder untuk future API (task 16):
  // render: { start, cancel, onProgress },
  // file: { saveDialog, reveal },
});
