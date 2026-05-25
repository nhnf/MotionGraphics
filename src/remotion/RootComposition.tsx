import { Series, AbsoluteFill } from 'remotion';
import type { SceneSpec } from '@/types/SceneSpec';
import { SceneRenderer } from './SceneRenderer';

interface RootCompositionProps {
  sceneSpec: SceneSpec;
}

export function RootComposition({ sceneSpec }: RootCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: sceneSpec.bgColor }}>
      <Series>
        {sceneSpec.scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={scene.endFrame - scene.startFrame}>
            <SceneRenderer scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
}
