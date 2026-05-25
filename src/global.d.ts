// Tipe global untuk API yang di-expose via electron/preload.ts contextBridge.
// Akan diperluas saat IPC bridge ditambahkan (render, settings, file).

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ElectronAPI {
  // render?: { start: (...) => Promise<...>; cancel: () => Promise<...> };
  // settings?: { getApiKey: () => Promise<...>; setApiKey: (key: string) => Promise<...> };
  // file?: { saveVideo: (...) => Promise<...>; openFolder: (path: string) => Promise<...> };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
