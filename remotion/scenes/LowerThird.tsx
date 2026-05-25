// LowerThird - scene untuk menampilkan text overlay di sepertiga bawah layar.
// Biasa dipakai untuk name tags, location info, atau caption.

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface LowerThirdProps {
  scene: Scene;
}

/**
 * Komponen scene untuk lower third graphics - text di sepertiga bawah layar.
 * Layout: background bar dengan text utama dan optional subtext.
 */
export function LowerThird({ scene }: LowerThirdProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);

  const bgColor = scene.bgColor || '#0a0a0a';
  const textColor = scene.color || '#ffffff';
  const fontSize = scene.fontSize || 48;
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;

  // Accent color untuk background bar (slightly lighter than bg)
  const barColor = bgColor === '#0a0a0a' ? '#1a1a1a' : bgColor;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
      }}
    >
      {/* Lower third bar */}
      <div
        style={{
          ...animationStyle,
          width: '100%',
          backgroundColor: barColor,
          padding: '30px 60px',
          borderTop: `3px solid ${textColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Main text */}
        <div
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            lineHeight: 1.2,
          }}
        >
          {scene.text}
        </div>

        {/* SubText */}
        {scene.subText && (
          <div
            style={{
              color: textColor,
              fontSize: `${fontSize * 0.5}px`,
              fontWeight: 400,
              opacity: 0.8,
              lineHeight: 1.2,
            }}
          >
            {scene.subText}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
