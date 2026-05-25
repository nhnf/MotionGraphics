// Helper functions untuk apply animasi entry dan exit ke scene Remotion.
// Dipakai oleh semua scene template untuk konsistensi animasi.

import { interpolate } from 'remotion';
import type { Scene } from '@/types/SceneSpec';
import { ENTRY_ANIMATION_FRAMES, EXIT_ANIMATION_FRAMES } from '@/constants';

export function applyEntryAnimation(frame: number, scene: Scene): React.CSSProperties {
  const relativeFrame = frame - scene.startFrame;
  const animationDuration = ENTRY_ANIMATION_FRAMES;

  if (relativeFrame < 0) return { opacity: 0 };
  if (relativeFrame >= animationDuration) return { opacity: 1 };

  switch (scene.animation) {
    case 'fadeIn': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      return { opacity };
    }
    case 'slideFromLeft': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const translateX = interpolate(relativeFrame, [0, animationDuration], [-100, 0], {
        extrapolateRight: 'clamp',
      });
      return { opacity, transform: `translateX(${translateX}px)` };
    }
    case 'slideFromBottom': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const translateY = interpolate(relativeFrame, [0, animationDuration], [100, 0], {
        extrapolateRight: 'clamp',
      });
      return { opacity, transform: `translateY(${translateY}px)` };
    }
    case 'scaleUp': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const scale = interpolate(relativeFrame, [0, animationDuration], [0.8, 1], {
        extrapolateRight: 'clamp',
      });
      return { opacity, transform: `scale(${scale})` };
    }
    case 'typewriter':
      return { opacity: 1 };
    default:
      return { opacity: 1 };
  }
}

export function applyExitAnimation(frame: number, scene: Scene): React.CSSProperties {
  const exitStartFrame = scene.endFrame - EXIT_ANIMATION_FRAMES;
  const relativeFrame = frame - exitStartFrame;
  const animationDuration = EXIT_ANIMATION_FRAMES;

  if (relativeFrame < 0) return { opacity: 1 };
  if (frame >= scene.endFrame) return { opacity: 0 };

  switch (scene.exitAnimation) {
    case 'fadeOut': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [1, 0], {
        extrapolateRight: 'clamp',
      });
      return { opacity };
    }
    case 'slideOut': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [1, 0], {
        extrapolateRight: 'clamp',
      });
      const translateY = interpolate(relativeFrame, [0, animationDuration], [0, -100], {
        extrapolateRight: 'clamp',
      });
      return { opacity, transform: `translateY(${translateY}px)` };
    }
    case 'none':
      return { opacity: 1 };
    default:
      return { opacity: 1 };
  }
}

export function applyCombinedAnimation(frame: number, scene: Scene): React.CSSProperties {
  const entryStyle = applyEntryAnimation(frame, scene);
  const exitStyle = applyExitAnimation(frame, scene);
  return {
    ...entryStyle,
    ...exitStyle,
    opacity: Math.min(
      typeof entryStyle.opacity === 'number' ? entryStyle.opacity : 1,
      typeof exitStyle.opacity === 'number' ? exitStyle.opacity : 1,
    ),
  };
}
