// Re-export titik tunggal untuk semua tipe global.
// Tambahkan export baru saat fitur diimplementasikan.

export type {
  AnimationType,
  ExitAnimationType,
  FontWeight,
  Scene,
  SceneSpec,
  SceneType,
} from './SceneSpec';

export type {
  ApiKeyStatusResponse,
  ApiKeyStatusResult,
  DeleteApiKeyResponse,
  ElectronAPI,
  ElectronFileAPI,
  ElectronRenderAPI,
  ElectronSettingsAPI,
  GetApiKeyResponse,
  GetApiKeyResult,
  IpcFailure,
  IpcResponse,
  IpcSuccess,
  RenderCancelResponse,
  RenderProgressEvent,
  RenderResolution,
  RenderStartPayload,
  RenderStartResponse,
  RenderStartResult,
  RevealPayload,
  RevealResponse,
  SaveDialogPayload,
  SaveDialogResponse,
  SaveDialogResult,
  SetApiKeyPayload,
  SetApiKeyResponse,
} from './ipc';

export { IPC_CHANNELS } from './ipc';
