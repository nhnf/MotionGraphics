import { contextBridge } from 'electron';

// Skeleton — IPC bridges (render:*, settings:*, file:*) akan ditambahkan
// saat fitur F-04 (Export) dan F-05 (Settings API key) diimplementasikan.
// Lihat coding-rules.md Section 7 untuk struktur IPC yang benar.

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder untuk future API:
  // render: { start, cancel },
  // settings: { getApiKey, setApiKey, testConnection },
  // file: { saveVideo, openFolder },
});
