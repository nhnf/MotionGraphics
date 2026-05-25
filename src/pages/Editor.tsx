// Halaman editor utama. Layout sesuai PRD Section 5.1:
// HEADER | LEFT (PromptInput + SceneList) | CENTER (Preview) | BOTTOM (ExportBar)
//
// Mengikuti coding-rules Section 4 (function declaration, max 150 baris).
// Logic di-delegate ke komponen features dan hooks masing-masing.

import { useEffect, useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';

import { Button } from '@/components/ui/Button';
import { PromptInput } from '@/components/features/PromptInput';
import { PreviewPanel } from '@/components/features/PreviewPanel';
import { SceneList } from '@/components/features/SceneList';
import { ExportBar } from '@/components/features/ExportBar';
import { useHasApiKey, useSettingsActions } from '@/stores/settingsStore';
import { getApiKeyStatus } from '@/lib/ipc';
import type { Scene, SceneSpec } from '@/types/SceneSpec';

interface EditorProps {
  onNavigateToSettings: () => void;
}

export function Editor({ onNavigateToSettings }: EditorProps) {
  const hasApiKey = useHasApiKey();
  const settingsActions = useSettingsActions();
  const playerRef = useRef<PlayerRef | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [RootComposition, setRootComposition] = useState<React.ComponentType<{ sceneSpec: SceneSpec }> | null>(null);

  // Lazy-load RootComposition dari remotion directory (tidak di-typecheck oleh tsc)
  useEffect(() => {
    // Dynamic import dengan @vite-ignore agar Vite tidak pre-bundle ini,
    // dan TypeScript tidak mencoba resolve path ke remotion/ directory.
    // Remotion files dikompilasi oleh @remotion/bundler, bukan tsc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadComponent = new Function(
      'return import(/* @vite-ignore */ "../../../remotion/RootComposition")'
    );
    loadComponent()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((mod: any) => setRootComposition(() => mod.RootComposition as React.ComponentType<{ sceneSpec: SceneSpec }>))
      .catch(() => {
        // Gagal load — preview tidak tersedia
      });
  }, []);

  // Sync API key status dari main process saat mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getApiKeyStatus();
        settingsActions.setHasApiKey(status.hasKey);
      } catch {
        // Jika IPC gagal (mis. di dev tanpa Electron), biarkan state default
      }
    };
    checkStatus();
  }, [settingsActions]);

  const handlePlayerReady = (ref: PlayerRef) => {
    playerRef.current = ref;
  };

  // Seek player ke startFrame scene yang diklik di SceneList
  const handleSceneClick = (scene: Scene) => {
    playerRef.current?.seekTo(scene.startFrame);
  };

  return (
    <div className="flex h-full flex-col bg-bg text-fg overflow-hidden">
      {/* HEADER */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-accent">Motion</span>
          <span className="text-base font-bold tracking-tight text-fg">Studio</span>
        </div>
        <Button
          variant="secondary"
          onClick={onNavigateToSettings}
          className="text-xs px-3 py-1.5"
          aria-label="Buka halaman Settings"
        >
          ⚙ Settings
        </Button>
      </header>

      {/* API KEY WARNING BANNER */}
      {!hasApiKey && (
        <div className="shrink-0 border-b border-error/30 bg-error/10 px-5 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-error">
              ⚠ Gemini API key belum diset — generate tidak akan berfungsi.
            </p>
            <Button
              variant="secondary"
              onClick={onNavigateToSettings}
              className="shrink-0 text-xs px-3 py-1"
            >
              Set API Key
            </Button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT: LEFT PANEL + CENTER PREVIEW */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Prompt Input */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
          <div className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Prompt
            </h2>
            <PromptInput onNavigateToSettings={onNavigateToSettings} />
          </div>
        </aside>

        {/* CENTER: Preview + Scene List */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 overflow-hidden">
            <PreviewPanel
              onPlayerReady={handlePlayerReady}
              compositionComponent={RootComposition ?? undefined}
            />
          </div>

          {/* Scene list */}
          <div className="shrink-0">
            <SceneList onSceneClick={handleSceneClick} />
          </div>
        </div>
      </div>

      {/* BOTTOM: Export Bar */}
      <div className="shrink-0">
        <ExportBar />
      </div>
    </div>
  );
}
