import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface QuoteCardProps {
  scene: Scene;
}

export function QuoteCard({ scene }: QuoteCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;
  const opacityValue = typeof animationStyle.opacity === 'number' ? animationStyle.opacity : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.bgColor ?? '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 120px',
      }}
    >
      <div
        style={{
          ...animationStyle,
          fontSize: `${scene.fontSize * 1.5}px`,
          color: scene.color,
          opacity: opacityValue * 0.3,
          marginBottom: '20px',
          fontFamily: 'Georgia, serif',
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          ...animationStyle,
          color: scene.color,
          fontSize: `${scene.fontSize}px`,
          fontWeight,
          textAlign: 'center',
          lineHeight: 1.4,
          fontStyle: 'italic',
        }}
      >
        {scene.text}
      </div>
      <div
        style={{
          ...animationStyle,
          width: '80px',
          height: '2px',
          backgroundColor: scene.color,
          margin: '40px 0',
          opacity: opacityValue * 0.5,
        }}
      />
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            color: scene.color,
            fontSize: `${scene.fontSize * 0.4}px`,
            fontWeight: 400,
            textAlign: 'center',
            opacity: opacityValue * 0.7,
          }}
        >
          — {scene.subText}
        </div>
      )}
    </AbsoluteFill>
  );
}
