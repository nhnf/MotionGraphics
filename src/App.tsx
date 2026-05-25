import { useState } from 'react';
import { Editor } from '@/pages/Editor';
import { Settings } from '@/pages/Settings';

type Route = 'editor' | 'settings';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('editor');

  const navigateToEditor = () => setCurrentRoute('editor');
  const navigateToSettings = () => setCurrentRoute('settings');

  return (
    <>
      {currentRoute === 'editor' && (
        <Editor onNavigateToSettings={navigateToSettings} />
      )}
      {currentRoute === 'settings' && (
        <Settings onNavigateToEditor={navigateToEditor} />
      )}
    </>
  );
}
