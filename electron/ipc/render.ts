// IPC handlers untuk channel `render:*` - mengelola video rendering.
// Handler ini berkomunikasi dengan videoRenderer service di main process.

import { ipcMain, BrowserWindow } from 'electron';
import { renderVideo } from '../services/videoRenderer';
import { resolve, extname } from 'node:path';
import {
  IPC_CHANNELS,
  type RenderStartPayload,
  type RenderStartResponse,
  type RenderCancelResponse,
  type RenderProgressEvent,
} from '../../src/types/ipc';

/**
 * Track render state untuk enforce Property 3 (render idempotency).
 * Hanya satu render yang boleh aktif pada satu waktu.
 */
let isCurrentlyRendering = false;
let currentRenderAbortController: AbortController | null = null;

/**
 * Mendaftarkan semua handler `render:*` ke `ipcMain`.
 */
export function registerRenderHandlers(mainWindow: BrowserWindow): void {
  // render:start - mulai render video
  ipcMain.handle(
    IPC_CHANNELS.render.start,
    async (_, payload: RenderStartPayload): Promise<RenderStartResponse> => {
      // Property 3: Reject jika sudah ada render aktif
      if (isCurrentlyRendering) {
        return {
          success: false,
          error: 'Render sudah berjalan. Tunggu hingga selesai atau cancel terlebih dahulu.',
        };
      }

      try {
        // Validasi output path (Property 5, Requirement 8.3)
        const resolvedPath = resolve(payload.outputPath);
        const ext = extname(resolvedPath).toLowerCase();

        if (ext !== '.mp4') {
          return {
            success: false,
            error: 'Output file harus berekstensi .mp4',
          };
        }

        // Set render state
        isCurrentlyRendering = true;
        currentRenderAbortController = new AbortController();

        // Start render dengan progress callback
        const outputPath = await renderVideo({
          sceneSpec: payload.sceneSpec,
          outputPath: resolvedPath,
          resolution: payload.resolution,
          fps: payload.fps,
          onProgress: (progress) => {
            // Emit progress event ke renderer
            const progressEvent: RenderProgressEvent = { progress };
            mainWindow.webContents.send(IPC_CHANNELS.render.progress, progressEvent);
          },
        });

        return {
          success: true,
          data: { outputPath },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Render gagal';
        return {
          success: false,
          error: message,
        };
      } finally {
        // Reset render state
        isCurrentlyRendering = false;
        currentRenderAbortController = null;
      }
    },
  );

  // render:cancel - cancel render yang sedang berjalan
  ipcMain.handle(
    IPC_CHANNELS.render.cancel,
    async (): Promise<RenderCancelResponse> => {
      if (!isCurrentlyRendering) {
        return {
          success: false,
          error: 'Tidak ada render yang sedang berjalan',
        };
      }

      try {
        // Abort render (jika videoRenderer support abort signal)
        currentRenderAbortController?.abort();

        // Reset state
        isCurrentlyRendering = false;
        currentRenderAbortController = null;

        return {
          success: true,
          data: undefined,
        };
      } catch {
        return {
          success: false,
          error: 'Gagal membatalkan render',
        };
      }
    },
  );
}
