import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { applyCombinedAnimation } from '../helpers/animations';
import type { Scene } from '@/types/SceneSpec';

interface LowerThirdProps {
  scene: Scene;
}

export function LowerThird({ scene }: LowerThirdProps) {
  const frame = useCurrentFrame();
  const animationStyle = applyCombinedAnimation(frame, scene);
  const fontWeight = scene.fontWeight === 'bold' ? 700 : 400;
  const barColor = scene.bgColor ?? '#1a1a1a';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
      }}
    >
      <div
        style={{
          ...animationStyle,
          width: '100%',
          backgroundColor: barColor,
          padding: '30px 60px',
          borderTop: `3px solid ${scene.color}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ color: scene.color, fontSize: `${scene.fontSize}px`, fontWeight, lineHeight: 1.2 }}>
          {scene.text}
        </div>
        {scene.subText && (
          <div style={{ color: scene.color, fontSize: `${scene.fontSize * 0.5}px`, fontWeight: 400, opacity: 0.8 }}>
            {scene.subText}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
