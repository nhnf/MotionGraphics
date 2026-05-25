// Hook untuk mengelola alur export video: save dialog → render:start → progress
// → finish/fail/cancel. Semua state disimpan di renderStore agar komponen
// lain (mis. ExportBar) bisa subscribe tanpa prop drilling.
//
// Validates: Property 3 (render idempotency — guard isRendering sebelum start).
// Validates: Property 4 (no partial output — error dari main process sudah
// menghapus file partial sebelum return).

import { useEffect, useRef } from 'react';

import { RENDER_PROGRESS_THROTTLE } from '@/constants';
import { useIsRendering, useRenderActions } from '@/stores/renderStore';
import { useExportFps, useExportResolution } from '@/stores/settingsStore';
import { useSceneSpec } from '@/stores/sceneStore';
import type { RenderProgressEvent } from '@/types/ipc';

export interface UseRenderReturn {
  /** Apakah render sedang berjalan. */
  isRendering: boolean;
  /** Mulai alur export: save dialog → render. No-op jika sudah rendering. */
  startExport: () => Promise<void>;
  /** Cancel render yang sedang berjalan. */
  cancelExport: () => Promise<void>;
}

/**
 * Hook untuk mengelola alur export video dari SceneSpec ke file MP4.
 *
 * Alur:
 * 1. Tampilkan save dialog via `file:save-dialog`
 * 2. Jika user pilih lokasi, panggil `render:start`
 * 3. Listen event `render:progress` dan update renderStore
 * 4. Saat selesai/gagal, update renderStore dan cleanup listener
 *
 * @returns Object dengan `isRendering`, `startExport`, dan `cancelExport`.
 */
export function useRender(): UseRenderReturn {
  const isRendering = useIsRendering();
  const renderActions = useRenderActions();
  const sceneSpec = useSceneSpec();
  const exportResolution = useExportResolution();
  const exportFps = useExportFps();

  // Ref untuk cleanup progress listener
  const cleanupProgressRef = useRef<(() => void) | null>(null);

  // Cleanup listener saat unmount
  useEffect(() => {
    return () => {
      cleanupProgressRef.current?.();
    };
  }, []);

  const startExport = async (): Promise<void> => {
    // Property 3: Guard idempotency
    if (isRendering) {
      return;
    }

    if (!sceneSpec) {
      return;
    }

    try {
      // Step 1: Tampilkan save dialog
      const defaultName = `${sceneSpec.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp4`;
      const dialogResponse = await window.electronAPI.file.saveDialog({ defaultName });

      if (!dialogResponse.success) {
        renderActions.failRender('Gagal membuka save dialog');
        return;
      }

      // User cancel dialog — tidak mulai render
      if (!dialogResponse.data.filePath) {
        return;
      }

      const outputPath = dialogResponse.data.filePath;

      // Step 2: Setup progress listener sebelum start render
      let lastEmittedProgress = -1;

      const cleanup = window.electronAPI.render.onProgress((event: RenderProgressEvent) => {
        // Throttle: hanya update jika delta >= RENDER_PROGRESS_THROTTLE
        if (event.progress - lastEmittedProgress >= RENDER_PROGRESS_THROTTLE || event.progress >= 1) {
          lastEmittedProgress = event.progress;
          renderActions.setProgress(event.progress);
        }
      });

      cleanupProgressRef.current = cleanup;

      // Step 3: Update store dan mulai render
      renderActions.startRender();

      const renderResponse = await window.electronAPI.render.start({
        sceneSpec,
        outputPath,
        resolution: exportResolution,
        fps: exportFps,
      });

      // Cleanup listener setelah render selesai
      cleanup();
      cleanupProgressRef.current = null;

      if (!renderResponse.success) {
        renderActions.failRender(renderResponse.error);
        return;
      }

      // Step 4: Render sukses
      renderActions.finishRender(renderResponse.data.outputPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export gagal';
      renderActions.failRender(message);

      // Cleanup listener jika ada error
      cleanupProgressRef.current?.();
      cleanupProgressRef.current = null;
    }
  };

  const cancelExport = async (): Promise<void> => {
    if (!isRendering) {
      return;
    }

    try {
      await window.electronAPI.render.cancel();
      renderActions.cancel();

      // Cleanup progress listener
      cleanupProgressRef.current?.();
      cleanupProgressRef.current = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membatalkan render';
      renderActions.failRender(message);
    }
  };

  return {
    isRendering,
    startExport,
    cancelExport,
  };
}
