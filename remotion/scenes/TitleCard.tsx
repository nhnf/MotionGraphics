// TitleCard - scene untuk menampilkan judul/title dengan animasi entry dan exit.
// Menggunakan helper animations untuk apply animasi yang konsisten.

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface TitleCardProps {
  scene: Scene;
}

/**
 * Komponen scene untuk menampilkan title/judul dengan animasi.
 * Mendukung semua tipe animasi entry (fadeIn, slideFromLeft, dll) dan
 * exit (fadeOut, slideOut, none).
 */
export function TitleCard({ scene }: TitleCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);

  const bgColor = scene.bgColor || '#0a0a0a';
  const textColor = scene.color || '#ffffff';
  const fontSize = scene.fontSize || 96;
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          ...animationStyle,
          color: textColor,
          fontSize: `${fontSize}px`,
          fontWeight,
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '100%',
          wordWrap: 'break-word',
        }}
      >
        {scene.text}
      </div>

      {/* SubText jika ada */}
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            position: 'absolute',
            bottom: '120px',
            left: '80px',
            right: '80px',
            color: textColor,
            fontSize: `${fontSize * 0.4}px`,
            fontWeight: 400,
            textAlign: 'center',
            opacity: (animationStyle.opacity ?? 1) * 0.8,
          }}
        >
          {scene.subText}
        </div>
      )}
    </AbsoluteFill>
  );
}
