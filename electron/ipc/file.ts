// IPC handlers untuk channel `file:*` - mengelola file dialogs dan file operations.

import { ipcMain, dialog, shell } from 'electron';
import { extname } from 'node:path';
import {
  IPC_CHANNELS,
  type SaveDialogPayload,
  type SaveDialogResponse,
  type RevealPayload,
  type RevealResponse,
} from '../../src/types/ipc';

/**
 * Mendaftarkan semua handler `file:*` ke `ipcMain`.
 */
export function registerFileHandlers(): void {
  // file:save-dialog - tampilkan save dialog untuk pilih lokasi output
  ipcMain.handle(
    IPC_CHANNELS.file.saveDialog,
    async (_, payload: SaveDialogPayload): Promise<SaveDialogResponse> => {
      try {
        const result = await dialog.showSaveDialog({
          title: 'Simpan Video',
          defaultPath: payload.defaultName,
          filters: [
            { name: 'Video MP4', extensions: ['mp4'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        });

        // User cancel dialog
        if (result.canceled || !result.filePath) {
          return {
            success: true,
            data: { filePath: null },
          };
        }

        // Ensure .mp4 extension
        let filePath = result.filePath;
        if (extname(filePath).toLowerCase() !== '.mp4') {
          filePath += '.mp4';
        }

        return {
          success: true,
          data: { filePath },
        };
      } catch {
        return {
          success: false,
          error: 'Gagal membuka save dialog',
        };
      }
    },
  );

  // file:reveal - buka file explorer dan highlight file
  ipcMain.handle(
    IPC_CHANNELS.file.reveal,
    async (_, payload: RevealPayload): Promise<RevealResponse> => {
      try {
        // showItemInFolder akan buka explorer dan highlight file
        shell.showItemInFolder(payload.path);

        return {
          success: true,
          data: undefined,
        };
      } catch {
        return {
          success: false,
          error: 'Gagal membuka file explorer',
        };
      }
    },
  );
}
