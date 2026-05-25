// Typed wrapper di atas `window.electronAPI` yang melempar `Error` jika IPC
// response `success: false`. Komponen dan hooks memanggil fungsi di sini
// (bukan langsung ke `window.electronAPI`) agar bisa pakai `try-catch` tanpa
// perlu cek `success` manual. Lihat coding-rules Section 7.2 dan design.md
// \"Error mapping\".

import type {
  SetApiKeyPayload,
  ApiKeyStatusResult,
  GetApiKeyResult,
} from '@/types/ipc';

/**
 * Wrapper untuk `window.electronAPI.settings.getStatus()`. Melempar `Error`
 * jika IPC gagal.
 *
 * @returns Object `{ hasKey: boolean }` jika sukses.
 * @throws {Error} Jika IPC response `success: false`.
 */
export async function getApiKeyStatus(): Promise<ApiKeyStatusResult> {
  const response = await window.electronAPI.settings.getStatus();
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

/**
 * Wrapper untuk `window.electronAPI.settings.setKey()`. Melempar `Error`
 * jika IPC gagal (mis: API key kosong/whitespace).
 *
 * @param apiKey - Gemini API key dari Google AI Studio.
 * @throws {Error} Jika IPC response `success: false` (validasi gagal atau
 *   error saat menulis ke disk).
 */
export async function setApiKey(apiKey: string): Promise<void> {
  const payload: SetApiKeyPayload = { apiKey };
  const response = await window.electronAPI.settings.setKey(payload);
  if (!response.success) {
    throw new Error(response.error);
  }
}

/**
 * Wrapper untuk `window.electronAPI.settings.getKey()`. Melempar `Error`
 * jika IPC gagal (mis: API key belum pernah di-set).
 *
 * @returns Object `{ apiKey: string }` jika sukses.
 * @throws {Error} Jika IPC response `success: false` (key belum diset atau
 *   error saat membaca dari disk).
 */
export async function getApiKey(): Promise<GetApiKeyResult> {
  const response = await window.electronAPI.settings.getKey();
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

/**
 * Wrapper untuk `window.electronAPI.settings.deleteKey()`. Melempar `Error`
 * jika IPC gagal (jarang terjadi — delete biasanya idempotent).
 *
 * @throws {Error} Jika IPC response `success: false`.
 */
export async function deleteApiKey(): Promise<void> {
  const response = await window.electronAPI.settings.deleteKey();
  if (!response.success) {
    throw new Error(response.error);
  }
}
