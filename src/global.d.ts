// Tipe global untuk API yang di-expose via electron/preload.ts contextBridge.
// Shape detail didefinisikan di `src/types/ipc.ts` agar bisa dipakai juga di
// main process dan typed wrapper.

import type { ElectronAPI } from '@/types/ipc';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
