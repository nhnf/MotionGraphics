// Error class custom untuk Motion Studio. Setiap error menetapkan `name`
// eksplisit agar bisa dibedakan via `instanceof` maupun `error.name` walau
// melewati boundary serialisasi (mis. dilempar di `lib/ipc.ts`).
//
// `cause` ditangani lewat `ErrorOptions` bawaan ES2022 (`new Error(msg, { cause })`),
// jadi tidak perlu field manual. Akses lewat `error.cause`.
//
// Mapping pesan error ke UI string ditangani di hook level (`useGemini`,
// `useRender`) — class di sini hanya membawa konteks teknis.

/**
 * Error spesifik komunikasi dengan Gemini API: auth gagal, quota habis,
 * network down, atau respons HTTP non-2xx selain yang sudah ditangani.
 */
export class GeminiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GeminiError';
    // Maintain prototype chain saat compile target ES5+; aman juga di ES2022.
    Object.setPrototypeOf(this, GeminiError.prototype);
  }
}

/**
 * Error parsing/validasi output Gemini terhadap schema `SceneSpec`.
 * Dilempar dari `lib/sceneSchema.ts` saat type guard menolak data.
 */
export class ParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error rendering video di main process — bundling Remotion gagal,
 * `renderMedia` melempar, ffmpeg tidak ditemukan, dll.
 */
export class RenderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RenderError';
    Object.setPrototypeOf(this, RenderError.prototype);
  }
}
