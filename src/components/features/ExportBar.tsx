// Komponen bar export di bagian bawah Editor. Berisi dropdown resolusi & fps,
// tombol Export, progress bar saat render berjalan, dan tombol "Buka Folder"
// setelah render selesai.
//
// Mengikuti coding-rules Section 4 (function declaration, destructure props,
// max 150 baris). Komponen ini hanya UI — semua logic di useRender hook.

import { SUPPORTED_FPS, SUPPORTED_RESOLUTIONS } from '@/constants';
import { useRenderError, useIsRendering, useRenderProgress, useLastOutputPath } from '@/stores/renderStore';
import { useExportFps, useExportResolution, useSettingsActions } from '@/stores/settingsStore';
import { useSceneSpec } from '@/stores/sceneStore';
import type { ExportFps, ExportResolution } from '@/stores/settingsStore';
import { useRender } from '@/hooks/useRender';
import { Button } from '@/components/ui/Button';

export function ExportBar() {
  const sceneSpec = useSceneSpec();
  const isRendering = useIsRendering();
  const progress = useRenderProgress();
  const lastOutputPath = useLastOutputPath();
  const renderError = useRenderError();
  const exportResolution = useExportResolution();
  const exportFps = useExportFps();
  const { setExportResolution, setExportFps } = useSettingsActions();
  const { startExport, cancelExport } = useRender();

  const canExport = sceneSpec !== null && !isRendering;

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [width, height] = e.target.value.split('x').map(Number);
    setExportResolution({ width, height } as ExportResolution);
  };

  const handleFpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportFps(Number(e.target.value) as ExportFps);
  };

  const handleRevealFolder = async () => {
    if (!lastOutputPath) return;
    await window.electronAPI.file.reveal({ path: lastOutputPath });
  };

  const renderProgressBar = () => {
    if (!isRendering) return null;
    const percent = Math.round(progress * 100);
    return (
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-fg-muted tabular-nums w-10 text-right">{percent}%</span>
      </div>
    );
  };

  const renderSuccessBanner = () => {
    if (isRendering || !lastOutputPath || renderError) return null;
    return (
      <div className="flex items-center gap-2 text-xs text-success">
        <span>✓ Export selesai</span>
        <button
          onClick={handleRevealFolder}
          className="underline hover:no-underline text-success"
        >
          Buka Folder
        </button>
      </div>
    );
  };

  const renderErrorBanner = () => {
    if (!renderError) return null;
    return (
      <span className="text-xs text-error flex-1 truncate" title={renderError}>
        ✕ {renderError}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-surface">
      {/* Resolusi dropdown */}
      <select
        value={`${exportResolution.width}x${exportResolution.height}`}
        onChange={handleResolutionChange}
        disabled={isRendering}
        className="bg-surface-2 border border-border text-fg text-xs rounded px-2 py-1.5 disabled:opacity-50 cursor-pointer"
        aria-label="Pilih resolusi export"
      >
        {SUPPORTED_RESOLUTIONS.map((res) => (
          <option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
            {res.label}
          </option>
        ))}
      </select>

      {/* FPS dropdown */}
      <select
        value={exportFps}
        onChange={handleFpsChange}
        disabled={isRendering}
        className="bg-surface-2 border border-border text-fg text-xs rounded px-2 py-1.5 disabled:opacity-50 cursor-pointer"
        aria-label="Pilih frame rate export"
      >
        {SUPPORTED_FPS.map((fps) => (
          <option key={fps} value={fps}>
            {fps} fps
          </option>
        ))}
      </select>

      {/* Progress bar atau status */}
      {isRendering ? renderProgressBar() : (
        <div className="flex-1 flex items-center">
          {renderSuccessBanner()}
          {renderErrorBanner()}
        </div>
      )}

      {/* Tombol Export / Cancel */}
      {isRendering ? (
        <Button variant="secondary" onClick={cancelExport} className="text-xs px-3 py-1.5">
          Batalkan
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={startExport}
          disabled={!canExport}
          className="text-xs px-4 py-1.5"
          aria-label="Export video ke MP4"
        >
          Export MP4
        </Button>
      )}
    </div>
  );
}
