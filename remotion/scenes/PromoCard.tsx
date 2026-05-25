// PromoCard - scene untuk menampilkan promo/CTA dengan emphasis visual.
// Layout: main text dengan highlight, subtext sebagai CTA atau detail.

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface PromoCardProps {
  scene: Scene;
}

/**
 * Komponen scene untuk promo/CTA content dengan visual emphasis.
 * Layout: centered text dengan background highlight dan CTA button-style subtext.
 */
export function PromoCard({ scene }: PromoCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);

  const bgColor = scene.bgColor || '#0a0a0a';
  const textColor = scene.color || '#01696f';
  const fontSize = scene.fontSize || 84;
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        gap: '40px',
      }}
    >
      {/* Main promo text with highlight */}
      <div
        style={{
          ...animationStyle,
          position: 'relative',
        }}
      >
        {/* Highlight background */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px -40px',
            backgroundColor: textColor,
            opacity: 0.15,
            borderRadius: '12px',
          }}
        />

        {/* Text */}
        <div
          style={{
            position: 'relative',
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {scene.text}
        </div>
      </div>

      {/* CTA / SubText */}
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            backgroundColor: textColor,
            color: bgColor,
            fontSize: `${fontSize * 0.35}px`,
            fontWeight: 600,
            padding: '16px 48px',
            borderRadius: '8px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {scene.subText}
        </div>
      )}
    </AbsoluteFill>
  );
}
