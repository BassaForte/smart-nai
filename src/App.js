import React, { useCallback, useState } from 'react';
import { promptInputCss } from './content';

const App = () => {
  const [active, setActive] = useState(false);
  const [state, setState] = useState({});
  const mainOnclick = useCallback(() => setActive(!active), [active, setActive])

  const updatePrompt = useCallback(() => {
    const prompt = document.querySelector(promptInputCss);
    console.log(state.basePrompt);
    prompt.value = state.basePrompt;
    prompt.dispatchEvent(new Event('input', { bubbles: true }));
  }, [state]);

  const updateState = (n) => setState({ ...state, ...n });

  return (
    <>
      <button onClick={mainOnclick}>Smart NAI {active ? '-' : '+'}</button>
      {active && <>
        <input placeholder='Enter base prompt here' onChange={(e) => updateState({ basePrompt: e.target.value })} />
        <button onClick={updatePrompt}>Update Prompt</button>
      </>
      }
    </>
  )
}

export default App;