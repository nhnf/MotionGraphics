// Custom hook untuk generate SceneSpec dari prompt teks menggunakan Gemini API.
// Mengelola state loading, error, dan update sceneStore dengan hasil generation.

import { useState, useCallback } from 'react';
import { generateSceneSpec } from '@/lib/gemini';
import { getApiKey } from '@/lib/ipc';
import { useSceneActions } from '@/stores/sceneStore';
import { useHasApiKey } from '@/stores/settingsStore';
import { GeminiError, ParseError } from '@/lib/errors';

interface UseGeminiResult {
  /** Fungsi untuk trigger generation. Async, bisa di-await atau pakai then/catch. */
  generate: (prompt: string) => Promise<void>;
  /** True saat sedang generate (loading state). */
  isGenerating: boolean;
  /** Error message jika generation gagal. Null jika tidak ada error. */
  error: string | null;
}

/**
 * Hook untuk generate SceneSpec dari prompt teks menggunakan Gemini API.
 *
 * Flow:
 * 1. Cek apakah API key sudah diset (dari settingsStore)
 * 2. Ambil API key dari secure store via IPC
 * 3. Panggil generateSceneSpec dengan prompt + API key
 * 4. Update sceneStore dengan hasil (sceneSpec, error, promptHistory)
 * 5. Set loading state selama proses berlangsung
 *
 * Error handling:
 * - GeminiError (auth, quota, network) → tampilkan pesan user-friendly
 * - ParseError (invalid output) → tampilkan pesan dengan saran retry
 * - Unknown error → tampilkan pesan generic
 *
 * @returns Object dengan fungsi `generate`, state `isGenerating`, dan `error`
 *
 * @example
 * ```tsx
 * function PromptInput() {
 *   const { generate, isGenerating, error } = useGemini();
 *   const [prompt, setPrompt] = useState('');
 *
 *   const handleGenerate = async () => {
 *     await generate(prompt);
 *   };
 *
 *   return (
 *     <div>
 *       <textarea value={prompt} onChange={e => setPrompt(e.target.value)} />
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate'}
 *       </button>
 *       {error && <p>{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGemini(): UseGeminiResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sceneActions = useSceneActions();
  const hasApiKey = useHasApiKey();

  const generate = useCallback(
    async (prompt: string) => {
      // Validasi prompt
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        setError('Prompt tidak boleh kosong');
        return;
      }

      // Cek API key status
      if (!hasApiKey) {
        setError('API key belum diset. Buka Settings untuk mengatur API key.');
        return;
      }

      // Reset error dan set loading
      setError(null);
      sceneActions.setGenerating(true);
      sceneActions.setError(null);
      setIsGenerating(true);

      try {
        // Ambil API key dari secure store
        const { apiKey } = await getApiKey();

        // Generate SceneSpec
        const sceneSpec = await generateSceneSpec(trimmedPrompt, apiKey);

        // Update store dengan hasil
        sceneActions.setSceneSpec(sceneSpec);
        sceneActions.addPromptToHistory(trimmedPrompt);
      } catch (err) {
        // Map error ke pesan user-friendly
        let errorMessage: string;

        if (err instanceof GeminiError) {
          // Error dari Gemini API (auth, quota, network)
          errorMessage = err.message;
        } else if (err instanceof ParseError) {
          // Error parsing/validasi output
          errorMessage = `${err.message}. Coba dengan prompt yang lebih spesifik atau coba lagi.`;
        } else if (err instanceof Error) {
          // Error lain dengan message
          errorMessage = `Gagal generate scene: ${err.message}`;
        } else {
          // Unknown error
          errorMessage = 'Terjadi kesalahan tidak terduga. Coba lagi.';
        }

        setError(errorMessage);
        sceneActions.setError(errorMessage);
      } finally {
        setIsGenerating(false);
        sceneActions.setGenerating(false);
      }
    },
    [hasApiKey, sceneActions],
  );

  return {
    generate,
    isGenerating,
    error,
  };
}
