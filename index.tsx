import React from 'react';
import ReactDOM from 'react-dom/client';
import EditorPage from './app/editor/index.tsx';

// The main application entry point mounting the Editor Page
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <EditorPage />
  </React.StrictMode>
);