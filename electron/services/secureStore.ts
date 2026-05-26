// Wrapper untuk persistensi Gemini API key menggunakan electron-store v8 (CJS).
// Hanya dipakai di main process — renderer mengakses lewat IPC `settings:*`.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ElectronStore = require('electron-store');

const STORE_SCHEMA = {
  apiKey: {
    type: 'string',
    minLength: 1,
  },
};

const STORE_ENCRYPTION_KEY = 'motion-studio-v1-config-obfuscation-key';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storeInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStore(): any {
  if (storeInstance === null) {
    storeInstance = new ElectronStore({
      schema: STORE_SCHEMA,
      encryptionKey: STORE_ENCRYPTION_KEY,
      clearInvalidConfig: true,
    });
  }
  return storeInstance;
}

/**
 * Mengambil Gemini API key yang tersimpan di disk.
 * @returns String API key jika ada, atau `undefined` jika belum di-set.
 */
export function getApiKey(): string | undefined {
  return getStore().get('apiKey') as string | undefined;
}

/**
 * Menyimpan Gemini API key terenkripsi ke disk.
 * @throws {Error} Jika key kosong/whitespace.
 */
export function setApiKey(key: string): void {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('API key tidak boleh kosong');
  }
  getStore().set('apiKey', key.trim());
}

/**
 * Menghapus Gemini API key dari disk. No-op jika belum ada.
 */
export function deleteApiKey(): void {
  getStore().delete('apiKey');
}

/**
 * Cek apakah API key sudah tersimpan tanpa membaca nilainya.
 */
export function hasApiKey(): boolean {
  return getStore().has('apiKey');
}
