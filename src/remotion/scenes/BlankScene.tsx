import { AbsoluteFill } from 'remotion';
import type { Scene } from '@/types/SceneSpec';

interface BlankSceneProps {
  scene: Scene;
}

export function BlankScene({ scene }: BlankSceneProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: scene.bgColor ?? '#000000' }} />
  );
}
