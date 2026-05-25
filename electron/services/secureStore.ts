// Wrapper tipis di atas `electron-store` untuk persistensi Gemini API key.
// Hanya dipakai di main process — renderer mengakses lewat IPC `settings:*`
// agar key tidak pernah tersedia langsung di window. Lihat design.md
// "Persisted data (electron-store)" dan coding-rules Section 12.

import ElectronStore, { type Schema } from 'electron-store';

/**
 * Shape data yang persisten. MVP hanya menyimpan satu field — Gemini API key.
 * `apiKey` opsional karena store kosong saat aplikasi pertama kali dijalankan.
 */
interface StoreSchema {
  apiKey?: string;
}

/**
 * JSON Schema untuk validasi runtime oleh `electron-store` (ditangani via
 * AJV di internal `conf`). Memastikan tidak ada key liar yang masuk ke file
 * config dan `apiKey` selalu string saat ada. `additionalProperties: false`
 * di-enforce lewat `rootSchema` di bawah.
 */
const STORE_SCHEMA: Schema<StoreSchema> = {
  apiKey: {
    type: 'string',
    minLength: 1,
  },
};

/**
 * Encryption key statis untuk meng-obfuscate file `config.json` di disk.
 *
 * CATATAN KEAMANAN: ini bukan enkripsi level enterprise — `electron-store`
 * sendiri menyebut opsi ini sebagai "obscurity, not security" karena key
 * pasti ikut ter-bundle di binary aplikasi. Cukup untuk memenuhi PRD F-05
 * ("disimpan terenkripsi") dan menghalangi pembacaan langsung dari disk
 * oleh malware non-targeted, sebagaimana dijelaskan di design.md.
 */
const STORE_ENCRYPTION_KEY = 'motion-studio-v1-config-obfuscation-key';

/**
 * Singleton instance, di-instantiate lazily lewat `getStore()` agar import
 * modul ini tidak crash jika dipanggil sebelum Electron `app.whenReady()`.
 * `electron-store` perlu `app.getPath('userData')` saat konstruksi, yang
 * baru tersedia setelah app ready.
 */
let storeInstance: ElectronStore<StoreSchema> | null = null;

/**
 * Mengembalikan instance singleton `electron-store` yang sudah dikonfigurasi
 * dengan schema validation dan encryption key. Aman dipanggil berulang —
 * instance dibuat sekali dan di-cache untuk pemanggilan berikutnya.
 */
function getStore(): ElectronStore<StoreSchema> {
  if (storeInstance === null) {
    storeInstance = new ElectronStore<StoreSchema>({
      schema: STORE_SCHEMA,
      rootSchema: {
        additionalProperties: false,
      },
      encryptionKey: STORE_ENCRYPTION_KEY,
      clearInvalidConfig: true,
    });
  }
  return storeInstance;
}

/**
 * Mengambil Gemini API key yang tersimpan di disk.
 *
 * @returns String API key jika sudah pernah disimpan, atau `undefined` jika
 *   belum pernah di-set / sudah dihapus.
 */
export function getApiKey(): string | undefined {
  return getStore().get('apiKey');
}

/**
 * Menyimpan Gemini API key terenkripsi ke disk. Memvalidasi input agar
 * tidak menyimpan string kosong/whitespace yang akan gagal saat dipakai
 * memanggil Gemini API.
 *
 * @param key - API key dari Google AI Studio. Akan di-trim sebelum disimpan.
 * @throws {Error} Jika `key` bukan string non-empty setelah trim. Pesan error
 *   sengaja generik dan TIDAK menyertakan nilai key untuk menghindari
 *   kebocoran via stack trace / log (Property 2 di design.md).
 */
export function setApiKey(key: string): void {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('API key tidak boleh kosong');
  }

  getStore().set('apiKey', key.trim());
}

/**
 * Menghapus Gemini API key dari disk. No-op jika key memang belum tersimpan.
 */
export function deleteApiKey(): void {
  getStore().delete('apiKey');
}

/**
 * Mengecek apakah API key sudah pernah disimpan, tanpa membaca nilainya.
 * Dipakai untuk channel `settings:get-api-key-status` agar renderer bisa
 * tahu status tanpa pernah menerima string key-nya.
 *
 * @returns `true` jika ada `apiKey` non-empty di store, `false` jika tidak.
 */
export function hasApiKey(): boolean {
  return getStore().has('apiKey');
}
