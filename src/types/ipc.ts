// Shape payload dan response untuk semua IPC channel antara renderer dan main
// process. Mengikuti coding-rules Section 7 (channel `domain:action`, response
// `{ success, ... }`) dan design.md "IPC contract".
//
// Tipe ini dipakai bersama oleh:
// - `electron/ipc/*.ts` (handler di main process)
// - `electron/preload.ts` (bridge contextBridge)
// - `src/lib/ipc.ts` (typed wrapper di renderer)

import type { SceneSpec } from './SceneSpec';

// ---------------------------------------------------------------------------
// Generic response envelope
// ---------------------------------------------------------------------------

/** Response sukses dengan payload data tambahan. */
export interface IpcSuccess<T = void> {
  success: true;
  data: T;
}

/** Response gagal dengan pesan error yang aman ditampilkan ke UI. */
export interface IpcFailure {
  success: false;
  error: string;
}

/**
 * Discriminated union response yang dipakai semua handler IPC. Renderer
 * wrapper (`src/lib/ipc.ts`) yang akan melempar `Error` jika `success: false`,
 * sehingga pemanggil di renderer cukup pakai `try-catch`.
 */
export type IpcResponse<T = void> = IpcSuccess<T> | IpcFailure;

// ---------------------------------------------------------------------------
// Channel: render:*
// ---------------------------------------------------------------------------

/** Pasangan resolusi yang dipilih user di ExportBar. */
export interface RenderResolution {
  width: number;
  height: number;
}

/** Payload untuk channel `render:start`. */
export interface RenderStartPayload {
  sceneSpec: SceneSpec;
  outputPath: string;
  resolution: RenderResolution;
  fps: number;
}

/** Data sukses untuk channel `render:start`. */
export interface RenderStartResult {
  outputPath: string;
}

export type RenderStartResponse = IpcResponse<RenderStartResult>;
export type RenderCancelResponse = IpcResponse;

/**
 * Event one-way `render:progress` dari main ke renderer. Bukan request/response
 * — emit lewat `webContents.send`, di-listen di renderer via `useRender` hook.
 */
export interface RenderProgressEvent {
  /** Persentase 0..1. */
  progress: number;
}

// ---------------------------------------------------------------------------
// Channel: settings:*
// ---------------------------------------------------------------------------

export interface ApiKeyStatusResult {
  hasKey: boolean;
}

export interface SetApiKeyPayload {
  apiKey: string;
}

export interface GetApiKeyResult {
  apiKey: string;
}

export type ApiKeyStatusResponse = IpcResponse<ApiKeyStatusResult>;
export type SetApiKeyResponse = IpcResponse;
export type GetApiKeyResponse = IpcResponse<GetApiKeyResult>;
export type DeleteApiKeyResponse = IpcResponse;

// ---------------------------------------------------------------------------
// Channel: file:*
// ---------------------------------------------------------------------------

export interface SaveDialogPayload {
  defaultName: string;
}

export interface SaveDialogResult {
  /** `null` jika user membatalkan dialog. */
  filePath: string | null;
}

export interface RevealPayload {
  path: string;
}

export type SaveDialogResponse = IpcResponse<SaveDialogResult>;
export type RevealResponse = IpcResponse;

// ---------------------------------------------------------------------------
// Channel name constants
// ---------------------------------------------------------------------------

/**
 * Nama channel IPC sebagai konstanta agar tidak ada typo string di handler
 * maupun bridge. Format `domain:action` mengikuti coding-rules Section 7.1.
 */
export const IPC_CHANNELS = {
  render: {
    start: 'render:start',
    cancel: 'render:cancel',
    progress: 'render:progress',
  },
  settings: {
    getStatus: 'settings:get-api-key-status',
    setKey: 'settings:set-api-key',
    getKey: 'settings:get-api-key',
    deleteKey: 'settings:delete-api-key',
  },
  file: {
    saveDialog: 'file:save-dialog',
    reveal: 'file:reveal',
  },
} as const;

// ---------------------------------------------------------------------------
// `window.electronAPI` shape — bridged via contextBridge di preload
// ---------------------------------------------------------------------------

export interface ElectronRenderAPI {
  start: (payload: RenderStartPayload) => Promise<RenderStartResponse>;
  cancel: () => Promise<RenderCancelResponse>;
  onProgress: (listener: (event: RenderProgressEvent) => void) => () => void;
}

export interface ElectronSettingsAPI {
  getStatus: () => Promise<ApiKeyStatusResponse>;
  setKey: (payload: SetApiKeyPayload) => Promise<SetApiKeyResponse>;
  getKey: () => Promise<GetApiKeyResponse>;
  deleteKey: () => Promise<DeleteApiKeyResponse>;
}

export interface ElectronFileAPI {
  saveDialog: (payload: SaveDialogPayload) => Promise<SaveDialogResponse>;
  reveal: (payload: RevealPayload) => Promise<RevealResponse>;
}

export interface ElectronAPI {
  render: ElectronRenderAPI;
  settings: ElectronSettingsAPI;
  file: ElectronFileAPI;
}
