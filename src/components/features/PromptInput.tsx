import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useGemini } from '@/hooks/useGemini';
import { usePromptHistory } from '@/stores/sceneStore';
import { useHasApiKey } from '@/stores/settingsStore';
import { MAX_PROMPT_LENGTH } from '@/constants';

interface PromptInputProps {
  onNavigateToSettings?: () => void;
}

/**
 * Komponen input prompt untuk generate motion graphics dari teks.
 * Fitur: textarea dengan validasi, tombol Generate, shortcut Ctrl+Enter,
 * dropdown riwayat 5 prompt terakhir, dan warning jika API key belum diset.
 */
export function PromptInput({ onNavigateToSettings }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { generate, isGenerating, error } = useGemini();
  const promptHistory = usePromptHistory();
  const hasApiKey = useHasApiKey();

  const charCount = prompt.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;
  const isEmpty = prompt.trim().length === 0;
  const canGenerate = hasApiKey && !isGenerating && !isEmpty && !isOverLimit;

  // Handle generate
  const handleGenerate = async () => {
    if (!canGenerate) return;
    await generate(prompt);
  };

  // Handle Ctrl+Enter shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && canGenerate) {
        e.preventDefault();
        generate(prompt);
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [canGenerate, prompt, generate]);

  // Handle history selection
  const handleSelectHistory = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Warning banner jika API key belum diset */}
      {!hasApiKey && (
        <div className="rounded-md border border-error bg-error/10 p-3">
          <p className="mb-1 text-sm font-medium text-error">⚠ API key belum diset</p>
          <p className="mb-2 text-xs text-fg-muted">
            Anda perlu mengatur Gemini API key untuk generate motion graphics.
          </p>
          {onNavigateToSettings && (
            <Button variant="secondary" onClick={onNavigateToSettings} className="text-xs">
              Buka Settings
            </Button>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Deskripsikan motion graphics yang ingin Anda buat... (contoh: 'Buat video promo produk baru dengan judul dan CTA')"
          className={`w-full resize-none rounded-md border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
            isOverLimit ? 'border-error' : 'border-border'
          }`}
          rows={4}
          disabled={isGenerating}
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={isOverLimit ? 'text-error' : 'text-fg-muted'}>
            {charCount} / {MAX_PROMPT_LENGTH}
          </span>
          {isOverLimit && (
            <span className="text-error">Prompt terlalu panjang</span>
          )}
        </div>
      </div>

      {/* Generate button + History dropdown */}
      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          isLoading={isGenerating}
          className="flex-1"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>

        {/* History dropdown */}
        {promptHistory.length > 0 && (
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowHistory(!showHistory)}
              disabled={isGenerating}
            >
              Riwayat ▾
            </Button>

            {showHistory && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowHistory(false)}
                />

                {/* Dropdown menu */}
                <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md border border-border bg-surface shadow-lg">
                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium text-fg-muted">
                      Prompt Terakhir
                    </p>
                    <div className="space-y-1">
                      {promptHistory.map((historyPrompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectHistory(historyPrompt)}
                          className="w-full rounded px-2 py-1.5 text-left text-xs text-fg hover:bg-surface-2"
                        >
                          <span className="line-clamp-2">{historyPrompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hint text */}
      {!error && !isGenerating && (
        <p className="text-xs text-fg-muted">
          Tip: Tekan <kbd className="rounded bg-surface-2 px-1">Ctrl+Enter</kbd> untuk
          generate
        </p>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-error bg-error/10 p-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
