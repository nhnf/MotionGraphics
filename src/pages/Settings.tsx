import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiKeyStatus, setApiKey, getApiKey, deleteApiKey } from '@/lib/ipc';
import { useSettingsActions } from '@/stores/settingsStore';
import { GOOGLE_AI_STUDIO_URL, GEMINI_MODEL } from '@/constants';

interface SettingsProps {
  onNavigateToEditor: () => void;
}

/**
 * Halaman Settings untuk mengelola Gemini API key.
 * Fitur: input API key, test connection, delete key, link ke Google AI Studio.
 */
export function Settings({ onNavigateToEditor }: SettingsProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const settingsActions = useSettingsActions();

  // Check API key status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getApiKeyStatus();
        setHasKey(status.hasKey);
        settingsActions.setHasApiKey(status.hasKey);
      } catch (err) {
        console.error('Failed to check API key status:', err);
      }
    };
    checkStatus();
  }, [settingsActions]);

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!apiKeyInput.trim()) {
      setError('API key tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      await setApiKey(apiKeyInput.trim());
      setHasKey(true);
      settingsActions.setHasApiKey(true);
      setApiKeyInput('');
      setSuccessMessage('API key berhasil disimpan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsTesting(true);

    try {
      // Get API key from secure store
      const { apiKey } = await getApiKey();

      // Test with minimal Gemini API call
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      await model.generateContent('Hello');

      setSuccessMessage('Koneksi berhasil! API key valid.');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('API key')) {
          setError('API key tidak valid. Periksa kembali di Google AI Studio.');
        } else if (err.message.includes('quota')) {
          setError('Kuota API habis. Coba lagi nanti.');
        } else {
          setError('Gagal terhubung ke Gemini API. Periksa koneksi internet.');
        }
      } else {
        setError('Terjadi kesalahan saat test connection');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    try {
      await deleteApiKey();
      setHasKey(false);
      settingsActions.setHasApiKey(false);
      setApiKeyInput('');
      setSuccessMessage('API key berhasil dihapus');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus API key');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAIStudio = () => {
    window.open(GOOGLE_AI_STUDIO_URL, '_blank');
  };

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onNavigateToEditor}>
            ← Kembali
          </Button>
          <h1 className="text-sm font-semibold tracking-wide">Settings</h1>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="mb-2 text-xl font-semibold">Gemini API Key</h2>
            <p className="text-sm text-fg-muted">
              API key digunakan untuk generate motion graphics dari prompt teks.
            </p>
          </div>

          {/* API Key Status */}
          {hasKey && (
            <div className="rounded-md border border-success bg-success/10 p-3">
              <p className="text-sm text-success">✓ API key sudah tersimpan</p>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-3">
            <Input
              label="API Key"
              type="password"
              placeholder={hasKey ? '••••••••••••••••' : 'Masukkan API key dari Google AI Studio'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              error={error || undefined}
              helperText={
                hasKey
                  ? 'Masukkan API key baru untuk mengganti yang lama'
                  : 'Dapatkan API key gratis dari Google AI Studio'
              }
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} isLoading={isLoading} className="flex-1">
                {hasKey ? 'Update' : 'Simpan'}
              </Button>
              {hasKey && (
                <>
                  <Button
                    variant="secondary"
                    onClick={handleTestConnection}
                    isLoading={isTesting}
                  >
                    Test Connection
                  </Button>
                  <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                    Hapus
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md border border-success bg-success/10 p-3">
              <p className="text-sm text-success">{successMessage}</p>
            </div>
          )}

          {/* Link to Google AI Studio */}
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-medium">Belum punya API key?</p>
            <p className="mb-3 text-xs text-fg-muted">
              Dapatkan API key gratis dari Google AI Studio. Proses hanya membutuhkan akun Google.
            </p>
            <Button variant="secondary" onClick={handleOpenAIStudio} className="w-full">
              Buka Google AI Studio →
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
