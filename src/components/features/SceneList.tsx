import { useSceneSpec } from '@/stores/sceneStore';
import type { Scene } from '@/types/SceneSpec';

interface SceneListProps {
  onSceneClick?: (scene: Scene) => void;
}

/**
 * Komponen untuk menampilkan daftar scenes secara horizontal.
 * Klik scene akan trigger callback untuk seek player ke startFrame scene tersebut.
 */
export function SceneList({ onSceneClick }: SceneListProps) {
  const sceneSpec = useSceneSpec();

  // Placeholder saat belum ada sceneSpec
  if (!sceneSpec || sceneSpec.scenes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border-t border-border bg-surface">
        <p className="text-sm text-fg-muted">Belum ada scene</p>
      </div>
    );
  }

  // Scene type badge colors
  const getSceneTypeColor = (type: Scene['type']): string => {
    switch (type) {
      case 'title':
      case 'subtitle':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'lowerThird':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'promo':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'blank':
        return 'bg-surface-2 text-fg-muted border-border';
      default:
        return 'bg-surface-2 text-fg-muted border-border';
    }
  };

  return (
    <div className="border-t border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Scenes ({sceneSpec.scenes.length})
        </h3>
        <span className="text-xs text-fg-muted">
          {sceneSpec.totalDuration}s @ {sceneSpec.fps}fps
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sceneSpec.scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => onSceneClick?.(scene)}
            className="group flex min-w-[200px] flex-col gap-2 rounded-md border border-border bg-surface-2 p-3 text-left transition-all hover:border-accent hover:bg-surface"
          >
            {/* Scene number and type badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-fg">Scene {index + 1}</span>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-medium ${getSceneTypeColor(scene.type)}`}
              >
                {scene.type}
              </span>
            </div>

            {/* Scene text preview */}
            <p className="line-clamp-2 text-sm text-fg">{scene.text}</p>

            {/* Scene timing */}
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <span>
                {(scene.startFrame / sceneSpec.fps).toFixed(1)}s -{' '}
                {(scene.endFrame / sceneSpec.fps).toFixed(1)}s
              </span>
              <span className="text-fg-muted/50">•</span>
              <span>{scene.animation}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
