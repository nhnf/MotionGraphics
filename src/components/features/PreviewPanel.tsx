// Komponen preview menggunakan @remotion/player.
// RootComposition di-pass sebagai prop dari parent (Editor) agar PreviewPanel
// tidak perlu import langsung dari remotion/ directory — memutus dependency
// yang menyebabkan TypeScript mencoba resolve remotion package saat typecheck.
//
// Remotion files dikompilasi oleh @remotion/bundler (bukan tsc), sehingga
// tidak perlu masuk ke tsconfig.web.json.

import { useRef, useEffect } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useSceneSpec } from '@/stores/sceneStore';
import type { SceneSpec } from '@/types/SceneSpec';

interface PreviewPanelProps {
  onPlayerReady?: (playerRef: PlayerRef) => void;
  /**
   * Komponen Remotion yang akan di-render. Di-pass dari Editor.tsx
   * yang import RootComposition dari remotion/ directory.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compositionComponent?: React.ComponentType<any>;
}

export function PreviewPanel({ onPlayerReady, compositionComponent }: PreviewPanelProps) {
  const sceneSpec = useSceneSpec();
  const playerRef = useRef<PlayerRef>(null);

  // Notify parent when player is ready (untuk SceneList seek functionality)
  useEffect(() => {
    if (playerRef.current && onPlayerReady) {
      onPlayerReady(playerRef.current);
    }
  }, [onPlayerReady]);

  // Placeholder saat belum ada sceneSpec
  if (!sceneSpec) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 text-6xl opacity-20">🎬</div>
          <p className="mb-2 text-lg font-medium text-fg">Belum ada scene</p>
          <p className="text-sm text-fg-muted">
            Tulis prompt dan klik Generate untuk membuat motion graphics
          </p>
        </div>
      </div>
    );
  }

  // Loading state saat compositionComponent belum siap
  if (!compositionComponent) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <p className="text-sm text-fg-muted">Memuat preview engine...</p>
      </div>
    );
  }

  const durationInFrames = Math.ceil(sceneSpec.totalDuration * sceneSpec.fps);
  const compositionWidth = sceneSpec.width;
  const compositionHeight = sceneSpec.height;
  const fps = sceneSpec.fps;

  return (
    <div className="flex h-full items-center justify-center bg-surface p-4">
      <div
        className="relative overflow-hidden rounded-lg shadow-2xl"
        style={{
          width: '100%',
          maxWidth: `${compositionWidth}px`,
          aspectRatio: `${compositionWidth} / ${compositionHeight}`,
        }}
      >
        <Player
          ref={playerRef}
          component={compositionComponent}
          inputProps={{ sceneSpec } as Record<string, SceneSpec>}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={compositionWidth}
          compositionHeight={compositionHeight}
          style={{ width: '100%', height: '100%' }}
          controls
          loop
          clickToPlay
        />
      </div>
    </div>
  );
}
