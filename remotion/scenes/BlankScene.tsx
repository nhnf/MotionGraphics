// BlankScene - fallback scene yang hanya menampilkan background color.
// Dipakai saat scene type tidak dikenali atau sebagai placeholder.

import { AbsoluteFill } from 'remotion';
import type { Scene } from '@/types/SceneSpec';

interface BlankSceneProps {
  scene: Scene;
}

/**
 * Komponen scene paling sederhana - hanya menampilkan background color.
 * Dipakai sebagai fallback untuk scene type yang tidak dikenali.
 */
export function BlankScene({ scene }: BlankSceneProps) {
  const bgColor = scene.bgColor || '#000000';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Blank scene - no content */}
    </AbsoluteFill>
  );
}
