import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const promptInputCss = '#prompt-input-0';

const getNthParent = (element, num) => {
  let e = element;
  for (let i = num; i > 0; i--) {
    e = e.parentElement;
  }
  return e;
}

const waitForElm = (selector) => {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(_ => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

waitForElm(promptInputCss).then((elm) => {
  const app = document.createElement('div')
  app.id = 'smartnai-root'

  getNthParent(elm, 5).prepend(app);

  const container = document.getElementById('smartnai-root');
  const root = ReactDOM.createRoot(container);
  root.render(<App />)
})
