import { Component, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Editor } from '@/pages/Editor';
import { Settings } from '@/pages/Settings';

// ---------------------------------------------------------------------------
// Error Boundary — mencegah layar hitam saat ada runtime error di komponen
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Motion Studio — uncaught error:', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-bg text-fg gap-4 p-8">
          <p className="text-2xl">⚠</p>
          <p className="text-base font-semibold">Terjadi kesalahan</p>
          <p className="text-sm text-fg-muted text-center max-w-md">
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
          >
            Coba lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// App root dengan routing sederhana
// ---------------------------------------------------------------------------

type Route = 'editor' | 'settings';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('editor');

  const navigateToEditor = () => setCurrentRoute('editor');
  const navigateToSettings = () => setCurrentRoute('settings');

  return (
    <ErrorBoundary>
      {/*
       * Gunakan visibility + display bukan conditional render agar Editor
       * tidak unmount saat navigasi ke Settings. Ini mencegah:
       * 1. State Editor (prompt, preview) hilang saat kembali
       * 2. useEffect di Editor re-run dan overwrite hasApiKey sementara
       */}
      <div style={{ display: currentRoute === 'editor' ? 'contents' : 'none' }}>
        <Editor onNavigateToSettings={navigateToSettings} />
      </div>
      {currentRoute === 'settings' && (
        <Settings onNavigateToEditor={navigateToEditor} />
      )}
    </ErrorBoundary>
  );
}
