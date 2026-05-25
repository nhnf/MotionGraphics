// RootComposition - komposisi utama Remotion yang me-render semua scenes.
// Menggunakan <Series> untuk render scenes secara sequential.

import { Series, AbsoluteFill } from 'remotion';
import type { SceneSpec } from '@/types/SceneSpec';
import { SceneRenderer } from './SceneRenderer';

interface RootCompositionProps {
  sceneSpec: SceneSpec;
}

/**
 * Komposisi root Remotion yang me-render semua scenes dari SceneSpec.
 * Setiap scene di-wrap dalam <Series.Sequence> dengan durasi yang sesuai.
 */
export function RootComposition({ sceneSpec }: RootCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: sceneSpec.bgColor }}>
      <Series>
        {sceneSpec.scenes.map((scene) => {
          const durationInFrames = scene.endFrame - scene.startFrame;

          return (
            <Series.Sequence key={scene.id} durationInFrames={durationInFrames}>
              <SceneRenderer scene={scene} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
}
