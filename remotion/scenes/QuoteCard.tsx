// QuoteCard - scene untuk menampilkan kutipan/quote dengan separator visual.
// Layout: quote text di tengah dengan garis separator, attribution di bawah.

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface QuoteCardProps {
  scene: Scene;
}

/**
 * Komponen scene untuk menampilkan quote/kutipan dengan styling khusus.
 * Menampilkan teks quote dengan garis separator dan optional attribution (subText).
 */
export function QuoteCard({ scene }: QuoteCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);

  const bgColor = scene.bgColor || '#0a0a0a';
  const textColor = scene.color || '#ffffff';
  const fontSize = scene.fontSize || 72;
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 120px',
      }}
    >
      {/* Quote mark */}
      <div
        style={{
          ...animationStyle,
          fontSize: `${fontSize * 1.5}px`,
          color: textColor,
          opacity: (animationStyle.opacity ?? 1) * 0.3,
          marginBottom: '20px',
          fontFamily: 'Georgia, serif',
        }}
      >
        &ldquo;
      </div>

      {/* Quote text */}
      <div
        style={{
          ...animationStyle,
          color: textColor,
          fontSize: `${fontSize}px`,
          fontWeight,
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: '100%',
          fontStyle: 'italic',
        }}
      >
        {scene.text}
      </div>

      {/* Separator line */}
      <div
        style={{
          ...animationStyle,
          width: '80px',
          height: '2px',
          backgroundColor: textColor,
          margin: '40px 0',
          opacity: (animationStyle.opacity ?? 1) * 0.5,
        }}
      />

      {/* Attribution (subText) */}
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            color: textColor,
            fontSize: `${fontSize * 0.4}px`,
            fontWeight: 400,
            textAlign: 'center',
            opacity: (animationStyle.opacity ?? 1) * 0.7,
          }}
        >
          — {scene.subText}
        </div>
      )}
    </AbsoluteFill>
  );
}
