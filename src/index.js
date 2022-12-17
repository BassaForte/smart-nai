import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = () => {
  let [ready, setReady] = useState(false);
  useEffect(() => setReady(true), [setReady]);

  const updatePrompt = useCallback(() => {
    const prompt = document.querySelector('#prompt-input-0');
    prompt.value = 'test5';
    prompt.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  console.log('loaded')
  if (!ready)
    return;

  console.log('injected')

  return <button onClick={updatePrompt}>Test it out</button>
}

const body = document.querySelector('body')
const app = document.createElement('div')
app.id = 'smartnai-root'

if (body)
  body.prepend(app);

const container = document.getElementById('smartnai-root');
const root = ReactDOM.createRoot(container);
root.render(<App />)