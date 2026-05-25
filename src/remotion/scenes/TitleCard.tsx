import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface TitleCardProps {
  scene: Scene;
}

export function TitleCard({ scene }: TitleCardProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.bgColor ?? '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          ...animationStyle,
          color: scene.color,
          fontSize: `${scene.fontSize}px`,
          fontWeight,
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '100%',
          wordWrap: 'break-word',
        }}
      >
        {scene.text}
      </div>
      {scene.subText && (
        <div
          style={{
            ...animationStyle,
            position: 'absolute',
            bottom: '120px',
            left: '80px',
            right: '80px',
            color: scene.color,
            fontSize: `${scene.fontSize * 0.4}px`,
            fontWeight: 400,
            textAlign: 'center',
            opacity: (typeof animationStyle.opacity === 'number' ? animationStyle.opacity : 1) * 0.8,
          }}
        >
          {scene.subText}
        </div>
      )}
    </AbsoluteFill>
  );
}
