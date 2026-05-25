// Helper functions untuk apply animasi entry dan exit ke scene Remotion.
// Dipakai oleh semua scene template untuk konsistensi animasi.

import { interpolate } from 'remotion';
import type { Scene } from '@/types/SceneSpec';
import { ENTRY_ANIMATION_FRAMES, EXIT_ANIMATION_FRAMES } from '@/constants';

/**
 * Apply animasi entry (masuk) ke scene berdasarkan tipe animasi.
 * Mengembalikan object dengan properti CSS yang bisa langsung dipakai di style.
 *
 * @param frame - Current frame dari useCurrentFrame()
 * @param scene - Scene object yang berisi startFrame dan animation type
 * @returns Object dengan properti CSS (opacity, transform, dll)
 *
 * @example
 * ```tsx
 * const frame = useCurrentFrame();
 * const entryStyle = applyEntryAnimation(frame, scene);
 * return <div style={entryStyle}>...</div>;
 * ```
 */
export function applyEntryAnimation(
  frame: number,
  scene: Scene,
): React.CSSProperties {
  const relativeFrame = frame - scene.startFrame;
  const animationDuration = ENTRY_ANIMATION_FRAMES;

  // Jika belum masuk range animasi, return invisible
  if (relativeFrame < 0) {
    return { opacity: 0 };
  }

  // Jika sudah lewat animasi, return fully visible
  if (relativeFrame >= animationDuration) {
    return { opacity: 1 };
  }

  // Apply animasi sesuai tipe
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
      const translateX = interpolate(
        relativeFrame,
        [0, animationDuration],
        [-100, 0],
        {
          extrapolateRight: 'clamp',
        },
      );
      return {
        opacity,
        transform: `translateX(${translateX}px)`,
      };
    }

    case 'slideFromBottom': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const translateY = interpolate(
        relativeFrame,
        [0, animationDuration],
        [100, 0],
        {
          extrapolateRight: 'clamp',
        },
      );
      return {
        opacity,
        transform: `translateY(${translateY}px)`,
      };
    }

    case 'scaleUp': {
      const opacity = interpolate(relativeFrame, [0, animationDuration], [0, 1], {
        extrapolateRight: 'clamp',
      });
      const scale = interpolate(relativeFrame, [0, animationDuration], [0.8, 1], {
        extrapolateRight: 'clamp',
      });
      return {
        opacity,
        transform: `scale(${scale})`,
      };
    }

    case 'typewriter': {
      // Typewriter effect: opacity langsung 1, tapi text akan di-reveal per karakter
      // (implementasi di komponen individual yang butuh)
      return { opacity: 1 };
    }

    default:
      return { opacity: 1 };
  }
}

/**
 * Apply animasi exit (keluar) ke scene berdasarkan tipe animasi.
 * Mengembalikan object dengan properti CSS yang bisa langsung dipakai di style.
 *
 * @param frame - Current frame dari useCurrentFrame()
 * @param scene - Scene object yang berisi endFrame dan exitAnimation type
 * @returns Object dengan properti CSS (opacity, transform, dll)
 *
 * @example
 * ```tsx
 * const frame = useCurrentFrame();
 * const exitStyle = applyExitAnimation(frame, scene);
 * return <div style={exitStyle}>...</div>;
 * ```
 */
export function applyExitAnimation(
  frame: number,
  scene: Scene,
): React.CSSProperties {
  const exitStartFrame = scene.endFrame - EXIT_ANIMATION_FRAMES;
  const relativeFrame = frame - exitStartFrame;
  const animationDuration = EXIT_ANIMATION_FRAMES;

  // Jika belum masuk range exit animasi, return fully visible
  if (relativeFrame < 0) {
    return { opacity: 1 };
  }

  // Jika sudah lewat scene, return invisible
  if (frame >= scene.endFrame) {
    return { opacity: 0 };
  }

  // Apply animasi sesuai tipe
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
      const translateY = interpolate(
        relativeFrame,
        [0, animationDuration],
        [0, -100],
        {
          extrapolateRight: 'clamp',
        },
      );
      return {
        opacity,
        transform: `translateY(${translateY}px)`,
      };
    }

    case 'none':
      return { opacity: 1 };

    default:
      return { opacity: 1 };
  }
}

/**
 * Combine entry dan exit animation styles. Helper untuk scene yang butuh
 * kedua animasi sekaligus.
 *
 * @param frame - Current frame dari useCurrentFrame()
 * @param scene - Scene object
 * @returns Object dengan properti CSS gabungan entry + exit
 */
export function applyCombinedAnimation(
  frame: number,
  scene: Scene,
): React.CSSProperties {
  const entryStyle = applyEntryAnimation(frame, scene);
  const exitStyle = applyExitAnimation(frame, scene);

  // Merge styles - exit animation takes precedence jika ada conflict
  return {
    ...entryStyle,
    ...exitStyle,
    // Opacity adalah minimum dari keduanya (ensure numeric)
    opacity: Math.min(
      typeof entryStyle.opacity === 'number' ? entryStyle.opacity : 1,
      typeof exitStyle.opacity === 'number' ? exitStyle.opacity : 1,
    ),
  };
}
