// IPC handlers untuk channel `settings:*` — mengelola Gemini API key via
// secureStore. Semua handler mengembalikan `IpcResponse` envelope sesuai
// coding-rules Section 7.1 dan design.md \"IPC contract\".
//
// Handler ini didaftarkan di `electron/main.ts` saat `app.whenReady()`.

import { ipcMain } from 'electron';
import {
  getApiKey,
  setApiKey,
  deleteApiKey,
  hasApiKey,
} from '../services/secureStore';
import {
  IPC_CHANNELS,
  type ApiKeyStatusResponse,
  type SetApiKeyPayload,
  type SetApiKeyResponse,
  type GetApiKeyResponse,
  type DeleteApiKeyResponse,
} from '../../src/types/ipc';

/**
 * Mendaftarkan semua handler `settings:*` ke `ipcMain`. Dipanggil sekali
 * dari `electron/main.ts` setelah app ready.
 */
export function registerSettingsHandlers(): void {
  // settings:get-api-key-status — cek apakah API key sudah tersimpan tanpa
  // membaca nilainya. Dipakai untuk update `hasApiKey` di settingsStore.
  ipcMain.handle(
    IPC_CHANNELS.settings.getStatus,
    (): ApiKeyStatusResponse => {
      try {
        return {
          success: true,
          data: { hasKey: hasApiKey() },
        };
      } catch {
        return {
          success: false,
          error: 'Gagal mengecek status API key',
        };
      }
    },
  );

  // settings:set-api-key — simpan API key terenkripsi ke disk. Validasi
  // dilakukan di `secureStore.setApiKey()` yang akan throw jika invalid.
  ipcMain.handle(
    IPC_CHANNELS.settings.setKey,
    (_event, payload: SetApiKeyPayload): SetApiKeyResponse => {
      try {
        setApiKey(payload.apiKey);
        return { success: true, data: undefined };
      } catch (err) {
        // Error dari `setApiKey` sudah aman (tidak menyertakan nilai key).
        const message =
          err instanceof Error ? err.message : 'Gagal menyimpan API key';
        return { success: false, error: message };
      }
    },
  );

  // settings:get-api-key — ambil API key untuk dipakai saat generate scene.
  // Hanya dipanggil dari `useGemini` hook, tidak pernah disimpan di state
  // renderer agar tidak bocor via DevTools (Property 2).
  ipcMain.handle(IPC_CHANNELS.settings.getKey, (): GetApiKeyResponse => {
    try {
      const apiKey = getApiKey();
      if (apiKey === undefined) {
        return {
          success: false,
          error: 'API key belum diset',
        };
      }
      return {
        success: true,
        data: { apiKey },
      };
    } catch {
      return {
        success: false,
        error: 'Gagal membaca API key',
      };
    }
  });

  // settings:delete-api-key — hapus API key dari disk. Dipanggil dari
  // halaman Settings saat user klik tombol "Hapus".
  ipcMain.handle(
    IPC_CHANNELS.settings.deleteKey,
    (): DeleteApiKeyResponse => {
      try {
        deleteApiKey();
        return { success: true, data: undefined };
      } catch {
        return {
          success: false,
          error: 'Gagal menghapus API key',
        };
      }
    },
  );
}
