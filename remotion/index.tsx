// Root entry point untuk Remotion compositions.
// Mendaftarkan komposisi "motion-studio" yang akan di-render.
// File ini dipakai oleh Remotion Studio dan @remotion/bundler.

import React from 'react';
import { Composition } from 'remotion';
import { RootComposition } from './RootComposition';
import type { SceneSpec } from '@/types/SceneSpec';
import {
  DEFAULT_FPS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_BG_COLOR,
} from '@/constants';

/**
 * Default SceneSpec untuk preview dan development.
 * Akan di-override dengan SceneSpec aktual saat render via inputProps.
 */
const DEFAULT_SCENE_SPEC: SceneSpec = {
  title: 'Motion Studio Preview',
  totalDuration: 5,
  fps: DEFAULT_FPS,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  bgColor: DEFAULT_BG_COLOR,
  scenes: [
    {
      id: 'scene-1',
      type: 'title',
      text: 'Motion Studio',
      color: '#ffffff',
      fontSize: 96,
      fontWeight: 'bold',
      startFrame: 0,
      endFrame: 150, // 5 detik @ 30fps
      animation: 'fadeIn',
      exitAnimation: 'fadeOut',
    },
  ],
};

/**
 * RemotionRoot — komponen yang mendaftarkan semua Composition ke Remotion.
 * Dipakai oleh Remotion Studio (`npm run remotion:studio`) dan bundler.
 * BUKAN untuk @remotion/player — player langsung pakai RootComposition.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="motion-studio"
        component={RootComposition}
        durationInFrames={Math.ceil(DEFAULT_SCENE_SPEC.totalDuration * DEFAULT_SCENE_SPEC.fps)}
        fps={DEFAULT_SCENE_SPEC.fps}
        width={DEFAULT_SCENE_SPEC.width}
        height={DEFAULT_SCENE_SPEC.height}
        defaultProps={{
          sceneSpec: DEFAULT_SCENE_SPEC,
        }}
      />
    </>
  );
}
