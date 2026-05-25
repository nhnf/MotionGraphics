import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface PromoCardProps {
  scene: Scene;
}

export function PromoCard({ scene }: PromoCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;
  const bgColor = scene.bgColor ?? '#0a0a0a';

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
      <div style={{ ...animationStyle, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-20px -40px',
            backgroundColor: scene.color,
            opacity: 0.15,
            borderRadius: '12px',
          }}
        />
        <div
          style={{
            position: 'relative',
            color: scene.color,
            fontSize: `${scene.fontSize}px`,
            fontWeight,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {scene.text}
        </div>
      </div>
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            backgroundColor: scene.color,
            color: bgColor,
            fontSize: `${scene.fontSize * 0.35}px`,
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
