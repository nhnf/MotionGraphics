// Typed wrapper di atas `window.electronAPI` yang melempar `Error` jika IPC
// response `success: false`. Komponen dan hooks memanggil fungsi di sini
// (bukan langsung ke `window.electronAPI`) agar bisa pakai `try-catch` tanpa
// perlu cek `success` manual.

import type {
  SetApiKeyPayload,
  ApiKeyStatusResult,
  GetApiKeyResult,
} from '@/types/ipc';

/**
 * Guard: pastikan window.electronAPI tersedia sebelum memanggil IPC.
 * Memberikan error yang jelas jika preload script tidak jalan.
 */
function requireElectronAPI() {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error(
      'window.electronAPI tidak tersedia. ' +
        'Pastikan aplikasi berjalan di dalam Electron (bukan browser biasa) ' +
        'dan preload script sudah ter-load dengan benar.',
    );
  }
  return window.electronAPI;
}

export async function getApiKeyStatus(): Promise<ApiKeyStatusResult> {
  const api = requireElectronAPI();
  const response = await api.settings.getStatus();
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

export async function setApiKey(apiKey: string): Promise<void> {
  const api = requireElectronAPI();
  const payload: SetApiKeyPayload = { apiKey };
  const response = await api.settings.setKey(payload);
  if (!response.success) {
    throw new Error(response.error);
  }
}

export async function getApiKey(): Promise<GetApiKeyResult> {
  const api = requireElectronAPI();
  const response = await api.settings.getKey();
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

export async function deleteApiKey(): Promise<void> {
  const api = requireElectronAPI();
  const response = await api.settings.deleteKey();
  if (!response.success) {
    throw new Error(response.error);
  }
}
