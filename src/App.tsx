import React from 'react';
import { AutoDraftStudio } from './components/AutoDraftStudio';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <AutoDraftStudio />
    </ErrorBoundary>
  );
}

export default App;

