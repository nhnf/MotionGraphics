// Video renderer service - handles video export using @remotion/renderer.
// Runs in main process, bundles Remotion composition and renders to MP4.

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { app } from 'electron';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import type { SceneSpec } from '../../src/types/SceneSpec';
import { RENDER_PROGRESS_THROTTLE } from '../../src/constants';

interface RenderVideoOptions {
  sceneSpec: SceneSpec;
  outputPath: string;
  resolution: { width: number; height: number };
  fps: number;
  onProgress?: (progress: number) => void;
}

/**
 * Cache untuk bundle path agar tidak perlu bundle ulang setiap render.
 * Bundle dilakukan sekali saat first render, lalu di-reuse.
 */
let cachedBundlePath: string | null = null;

/**
 * Render SceneSpec menjadi video MP4 menggunakan Remotion.
 *
 * Flow:
 * 1. Bundle Remotion composition (atau pakai cache jika sudah ada)
 * 2. Select composition "motion-studio"
 * 3. Render dengan renderMedia
 * 4. Emit progress events (throttled ke 5%)
 * 5. Return output path jika sukses
 * 6. Cleanup partial file jika error/cancel
 *
 * @param options - Render options (sceneSpec, outputPath, resolution, fps, onProgress)
 * @returns Promise yang resolve ke output path jika sukses
 * @throws Error jika render gagal
 */
export async function renderVideo(options: RenderVideoOptions): Promise<string> {
  const { sceneSpec, outputPath, resolution, fps, onProgress } = options;

  let bundlePath = cachedBundlePath;

  try {
    // Bundle Remotion composition jika belum ada cache
    if (!bundlePath) {
      const remotionRoot = join(app.getAppPath(), 'remotion', 'index.ts');
      
      bundlePath = await bundle(
        remotionRoot,
        undefined, // onProgress
        {
          // webpackOverride opsional — pakai default config
        },
      );

      cachedBundlePath = bundlePath;
    }

    // Pastikan bundlePath tidak null setelah bundle
    if (!bundlePath) {
      throw new Error('Bundle path tidak tersedia setelah proses bundle');
    }

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: 'motion-studio',
      inputProps: { sceneSpec },
    });

    // Calculate duration
    const durationInFrames = Math.ceil(sceneSpec.totalDuration * fps);

    // Progress tracking dengan throttle
    let lastReportedProgress = 0;

    // Render video
    await renderMedia({
      composition: {
        ...composition,
        width: resolution.width,
        height: resolution.height,
        fps,
        durationInFrames,
      },
      serveUrl: bundlePath,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { sceneSpec },
      onProgress: ({ progress }) => {
        // Throttle progress callback ke setiap RENDER_PROGRESS_THROTTLE (5%)
        if (progress - lastReportedProgress >= RENDER_PROGRESS_THROTTLE || progress === 1) {
          lastReportedProgress = progress;
          onProgress?.(progress);
        }
      },
    });

    return outputPath;
  } catch (error) {
    // Cleanup partial file jika render gagal (Property 4)
    try {
      await unlink(outputPath);
    } catch {
      // Ignore error jika file tidak ada
    }

    // Re-throw error dengan context
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to render video: ${message}`);
  }
}

/**
 * Clear bundle cache. Berguna saat development atau jika bundle corrupt.
 */
export function clearBundleCache(): void {
  cachedBundlePath = null;
}
