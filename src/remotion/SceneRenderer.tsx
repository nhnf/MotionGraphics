import type { Scene } from '@/types/SceneSpec';
import { BlankScene } from './scenes/BlankScene';
import { TitleCard } from './scenes/TitleCard';
import { QuoteCard } from './scenes/QuoteCard';
import { LowerThird } from './scenes/LowerThird';
import { PromoCard } from './scenes/PromoCard';

interface SceneRendererProps {
  scene: Scene;
}

export function SceneRenderer({ scene }: SceneRendererProps) {
  switch (scene.type) {
    case 'title':
    case 'subtitle':
      return <TitleCard scene={scene} />;
    case 'quote':
      return <QuoteCard scene={scene} />;
    case 'lowerThird':
      return <LowerThird scene={scene} />;
    case 'promo':
      return <PromoCard scene={scene} />;
    case 'blank':
      return <BlankScene scene={scene} />;
    default:
      console.warn(`Unknown scene type "${scene.type}" for scene "${scene.id}". Falling back to BlankScene.`);
      return <BlankScene scene={scene} />;
  }
}
