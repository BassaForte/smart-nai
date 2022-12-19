import React, { useCallback, useState } from 'react';

const promptInputCss = '#prompt-input-0';

const initalState = {
  basePrompt: '',
  topics: [
    {
      name: 'New Topic',
      active: true,
      items: [
        {
          prompt: '',
          level: 0
        }
      ]
    }
  ],
}

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const entry = window.localStorage.getItem(key);
      return entry ? JSON.parse(entry) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

const isNullOrWhitespace = (str) => str === undefined || str.trim() === '';

const Topic = ({ topic, onChange, children, onDelete }) => {
  const { name, active, open } = topic;
  const change = useCallback((t) => {
    onChange({ ...topic, ...t });
  }, [topic, onChange])
  return (
    <div className='topic'>
      <input type='checkbox' checked={active} onChange={() =>
        change({ ...topic, active: !active })
      } />
      <button onClick={() => change({ open: !open })}>{name} {open ? '-' : '+'}</button>
      <button onClick={() => onDelete()}>x</button>
      {open && <>
        <input value={name} onChange={(e) => change({ name: e.target.value })} />
        {children}
      </>
      }
    </div>
  )
}

const Item = ({ item, onChange, onDelete }) => {
  const change = useCallback((i) => {
    onChange({ ...item, ...i });
  }, [item, onChange])
  const { prompt, level } = item;
  const space = ' ';
  return (
    <div className='inline'>
      <button onClick={() => onDelete()}>x </button>
      <input value={prompt} onChange={(e) => change({ prompt: e.target.value })} onBlur={() => { if (isNullOrWhitespace(prompt)) onDelete(); }} />
      <button onClick={() => change({ level: level - 1 })}>-</button>
      {space}{level}{space}
      <button onClick={() => change({ level: level + 1 })}>+</button>
    </div>
  )
}

const wrap = (str, num, startChar, endChar) => {
  const start = [...Array(num)].map(() => startChar).join('');
  const end = [...Array(num)].map(() => endChar).join('');
  return start + str + end;
}

const compilePrompt = (basePrompt, topics) => {
  const cleanedBase = (basePrompt ? basePrompt.trim().trimEnd(',') + ', ' : '');
  const items = [];
  topics.filter(x => x.active).forEach(topic => {
    topic.items.forEach(item => {
      let newPrompt = (item.prompt ?? '').trim().trimEnd(',');
      if (item.level > 0)
        newPrompt = wrap(newPrompt, item.level, '{', '}');
      else if (item.level < 0)
        newPrompt = wrap(newPrompt, Math.abs(item.level), '[', ']');

      items.push(newPrompt);
    })
  });
  return cleanedBase + items.join(', ');
}

const App = () => {
  const [loadedState, setStoredState] = useLocalStorage('appState', initalState);
  const [active, setActive] = useState(true);
  const [state, setState] = useState(loadedState);
  const { basePrompt, topics } = state;
  const [newPrompt, setNewPrompt] = useState('');
  const mainOnClick = useCallback(() => setActive(!active), [active, setActive])

  const updatePrompt = useCallback(() => {
    const promptInput = document.querySelector(promptInputCss);

    promptInput.value = compilePrompt(basePrompt, topics);
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));

    const newTopics = topics.map(t => ({ ...t, open: undefined }));
    setStoredState({ ...state, topics: newTopics });

  }, [basePrompt, topics, state]);

  const updateState = (n) => setState({ ...state, ...n });

  const inputRef = React.createRef();
  const onNewPromptBlur = (topicIndex) => {
    if (isNullOrWhitespace(newPrompt)) return;
    topics[topicIndex].items.push({ prompt: newPrompt, level: 0 });
    updateState({ topics: topics });
    setNewPrompt('');
  }

  return (
    <>
      <button onClick={mainOnClick}>Smart NAI {active ? '-' : '+'}</button>
      {active && <div className='app'>
        <input placeholder='Enter base prompt here' value={basePrompt} onChange={(e) => updateState({ basePrompt: e.target.value })} />
        <h3>Topics <button onClick={() => {
          topics.push({ name: 'New Topic', items: [], open: true })
          updateState({ topics: topics })
        }}>+</button>
        </h3>
        <ul>
          {topics.map((topic, ti) => (
            <li key={ti}>
              <Topic
                topic={topic}
                onChange={(nTopic) => {
                  topics[ti] = nTopic;
                  updateState({ topics: topics });
                }}
                onDelete={() => {
                  if (window.confirm(`Are you sure want to delete the topic "${topic.name}"?`)) {
                    topics.splice(ti, 1);
                    updateState({ topics: topics })
                  }
                }}>
                <ul className='items'>
                  {topic.items.map((item, ii) => (
                    <li key={ii}>
                      <Item
                        item={item}
                        onChange={(nItem) => {
                          topics[ti].items[ii] = nItem;
                          updateState({ topics: topics });
                        }}
                        onDelete={() => {
                          topics[ti].items.splice(ii, 1);
                          updateState({ topics: topics })
                        }}
                      />
                    </li>
                  ))}
                  <li>
                    <input key={newPrompt} autoFocus ref={inputRef} placeholder={'Start typing...'} value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} onBlur={() => onNewPromptBlur(ti)} onKeyDown={(e) => { if (e.key === 'Enter') onNewPromptBlur(ti); }} />
                  </li>
                </ul>
              </Topic>
            </li>
          ))}
        </ul>
        <br />
        <button className='update' onClick={updatePrompt}>Update Prompt</button>
      </div>
      }
    </>
  )
}

export default App;