// Integrasi dengan Gemini API untuk generate SceneSpec dari prompt teks.
// Menggunakan SDK @google/generative-ai dengan structured output (responseSchema)
// dan retry logic untuk menangani output yang invalid.

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { validateSceneSpec } from './sceneSchema';
import { GeminiError, ParseError } from './errors';
import { GEMINI_SYSTEM_INSTRUCTION } from '@/constants/geminiPrompt';
import { GEMINI_MODEL, MAX_RETRY_COUNT, GEMINI_REQUEST_TIMEOUT_MS } from '@/constants';
import type { SceneSpec } from '@/types/SceneSpec';

/**
 * Response schema untuk Gemini API yang merefleksikan struktur SceneSpec.
 * Digunakan untuk guided generation agar output lebih konsisten dengan schema.
 */
const SCENE_SPEC_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    totalDuration: { type: SchemaType.NUMBER },
    fps: { type: SchemaType.NUMBER },
    width: { type: SchemaType.NUMBER },
    height: { type: SchemaType.NUMBER },
    bgColor: { type: SchemaType.STRING },
    scenes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          text: { type: SchemaType.STRING },
          subText: { type: SchemaType.STRING, nullable: true },
          color: { type: SchemaType.STRING },
          bgColor: { type: SchemaType.STRING, nullable: true },
          fontSize: { type: SchemaType.NUMBER },
          fontWeight: { type: SchemaType.STRING },
          startFrame: { type: SchemaType.NUMBER },
          endFrame: { type: SchemaType.NUMBER },
          animation: { type: SchemaType.STRING },
          exitAnimation: { type: SchemaType.STRING },
        },
        required: [
          'id',
          'type',
          'text',
          'color',
          'fontSize',
          'fontWeight',
          'startFrame',
          'endFrame',
          'animation',
          'exitAnimation',
        ],
      },
    },
  },
  required: ['title', 'totalDuration', 'fps', 'width', 'height', 'bgColor', 'scenes'],
};

/**
 * Mengirim prompt ke Gemini API dan mengembalikan SceneSpec terstruktur.
 * Melakukan validasi JSON dan retry otomatis jika output invalid (max 2x).
 *
 * Flow:
 * 1. Kirim request ke Gemini dengan system instruction + user prompt
 * 2. Parse response JSON
 * 3. Validasi dengan `validateSceneSpec` (throw ParseError jika invalid)
 * 4. Jika gagal, retry dengan prompt yang sama (max MAX_RETRY_COUNT kali)
 * 5. Return SceneSpec yang valid atau throw error
 *
 * @param prompt - Teks deskripsi animasi dari pengguna (max 500 karakter)
 * @param apiKey - Gemini API key yang tersimpan di settings
 * @returns Promise yang resolve ke SceneSpec yang valid
 * @throws {GeminiError} Jika API key invalid (401), quota habis (429), atau network error
 * @throws {ParseError} Jika output Gemini tidak bisa diparse atau invalid setelah MAX_RETRY_COUNT retry
 *
 * @example
 * ```typescript
 * try {
 *   const spec = await generateSceneSpec('Buat video promo produk baru', apiKey);
 *   console.log(spec.scenes.length); // 2
 * } catch (err) {
 *   if (err instanceof GeminiError) {
 *     // Handle API error (auth, quota, network)
 *   } else if (err instanceof ParseError) {
 *     // Handle invalid output
 *   }
 * }
 * ```
 */
export async function generateSceneSpec(
  prompt: string,
  apiKey: string,
): Promise<SceneSpec> {
  if (!prompt.trim()) {
    throw new ParseError('Prompt tidak boleh kosong');
  }

  if (!apiKey.trim()) {
    throw new GeminiError('API key tidak boleh kosong');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      // Type assertion needed due to complex nested schema structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: SCENE_SPEC_SCHEMA as any,
    },
  });

  let lastError: Error | null = null;

  // Retry loop: max MAX_RETRY_COUNT attempts
  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      // Set timeout untuk request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

      let result;
      try {
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new ParseError('Gemini mengembalikan response kosong');
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        throw new ParseError(
          `Gagal parse JSON dari Gemini: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }

      // Validate dengan schema validator
      try {
        const sceneSpec = validateSceneSpec(parsed);
        return sceneSpec; // Success!
      } catch (err) {
        if (err instanceof ParseError) {
          // Validation failed, akan retry
          lastError = err;
          console.warn(`Attempt ${attempt + 1} failed validation:`, err.message);
          continue;
        }
        throw err;
      }
    } catch (err) {
      // Map error ke GeminiError dengan pesan spesifik
      if (err instanceof ParseError) {
        lastError = err;
        continue; // Retry
      }

      // Check for specific API errors
      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        // 401 Unauthorized - API key invalid
        if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
          throw new GeminiError(
            'API key tidak valid. Periksa kembali di Settings.',
            err,
          );
        }

        // 429 Too Many Requests - Rate limit / Quota exceeded
        if (message.includes('quota') || message.includes('429') || message.includes('rate limit') || message.includes('resource_exhausted') || message.includes('too many requests')) {
          // Jangan retry untuk rate limit — langsung throw
          throw new GeminiError(
            'Rate limit Gemini API tercapai (429). Tunggu 1 menit lalu coba lagi. ' +
            'Free tier: maks 15 request/menit.',
          );
        }

        // Network errors
        if (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout') ||
          message.includes('aborted')
        ) {
          throw new GeminiError(
            'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.',
            err,
          );
        }

        // Generic Gemini error
        throw new GeminiError(
          `Gagal memanggil Gemini API: ${err.message}`,
          err,
        );
      }

      // Unknown error type
      throw new GeminiError('Terjadi kesalahan tidak terduga saat memanggil Gemini API');
    }
  }

  // Semua retry gagal
  throw new ParseError(
    `Gagal menghasilkan SceneSpec yang valid setelah ${MAX_RETRY_COUNT + 1} percobaan. ${
      lastError ? `Error terakhir: ${lastError.message}` : ''
    }`,
  );
}
