import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useHasApiKey, useSettingsActions } from '@/stores/settingsStore';
import { getApiKeyStatus } from '@/lib/ipc';

interface EditorProps {
  onNavigateToSettings: () => void;
}

// Halaman editor utama. Layout final mengikuti PRD Section 5.1:
// HEADER | LEFT (PromptInput + SceneList) | CENTER (Preview) | BOTTOM (ExportBar)
// Fase skeleton: hanya placeholder agar app bisa dijalankan.

export function Editor({ onNavigateToSettings }: EditorProps) {
  const hasApiKey = useHasApiKey();
  const settingsActions = useSettingsActions();

  // Check API key status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getApiKeyStatus();
        settingsActions.setHasApiKey(status.hasKey);
      } catch (err) {
        console.error('Failed to check API key status:', err);
      }
    };
    checkStatus();
  }, [settingsActions]);

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-sm font-semibold tracking-wide">Motion Studio</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-fg-muted">v0.1.0 — skeleton</span>
          <Button variant="secondary" onClick={onNavigateToSettings}>
            Settings
          </Button>
        </div>
      </header>

      {/* API Key Warning Banner */}
      {!hasApiKey && (
        <div className="border-b border-error bg-error/10 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-error">
                ⚠ API key belum diset
              </p>
              <p className="text-xs text-fg-muted">
                Anda perlu mengatur Gemini API key untuk generate motion graphics.
              </p>
            </div>
            <Button variant="secondary" onClick={onNavigateToSettings}>
              Buka Settings
            </Button>
          </div>
        </div>
      )}

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium">Skeleton siap.</p>
          <p className="text-sm text-fg-muted">
            Implementasi fitur F-01 sampai F-05 akan menyusul lewat spec MVP.
          </p>
        </div>
      </main>
    </div>
  );
}
