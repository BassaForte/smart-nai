import React, { useCallback, useState } from 'react';

const promptInputCss = '#prompt-input-0';
const undesiredInputCss = 'textarea';

const initalState = {
  basePrompt: '',
  topics: [
    {
      name: 'New Topic',
      active: true,
      items: [],
      undesired: []
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
        <div className='inline'>
          <>Name: </>
          <input value={name} onChange={(e) => change({ name: e.target.value })} />
        </div>
        {children}
      </>
      }
    </div>
  )
}

const Item = ({ item, onChange, onDelete, allowNegativeLevel }) => {
  const { prompt, level } = item;
  const space = ' ';
  const change = useCallback((i) => {
    if (!allowNegativeLevel && i.level < 0) return;
    onChange({ ...item, ...i });
  }, [item, onChange])
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
  const promptItems = [];
  const undesiredItems = [];
  topics.filter(x => x.active).forEach(topic => {
    topic.items.forEach(item => {
      let newPrompt = (item.prompt ?? '').trim().trimEnd(',');
      if (item.level > 0)
        newPrompt = wrap(newPrompt, item.level, '{', '}');
      else if (item.level < 0)
        newPrompt = wrap(newPrompt, Math.abs(item.level), '[', ']');

      promptItems.push(newPrompt);
    });
    topic.undesired.forEach(und => {
      let newUnd = (und.prompt ?? '').trim().trimEnd(',');
      if (und.level > 0)
        newUnd = wrap(newUnd, und.level, '(', ')');

      undesiredItems.push(newUnd);
    });
  });
  return { promptText: cleanedBase + promptItems.join(', '), undesiredText: undesiredItems.join(', ') };
}

const App = () => {
  const [loadedState, setStoredState] = useLocalStorage('smartnai-state', initalState);
  const [active, setActive] = useState(true);
  const [state, setState] = useState(loadedState);
  const { basePrompt, topics } = state;
  const [newPrompt, setNewPrompt] = useState('');
  const [newUndesired, setNewUndesired] = useState('');
  const [inputFocus, setInputFocus] = useState('newPrompt');
  const mainOnClick = useCallback(() => setActive(!active), [active, setActive])

  const updatePrompt = useCallback(() => {
    const promptInput = document.querySelector(promptInputCss);
    const undesiredInputs = document.querySelectorAll(undesiredInputCss);
    let undesiredInput = undefined;

    undesiredInputs.forEach(i => {
      const parent = i.parentElement;
      if (parent.firstChild.textContent === 'Undesired Content')
        undesiredInput = i;
    });

    const { promptText, undesiredText } = compilePrompt(basePrompt, topics);
    promptInput.value = promptText;
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));

    if (undesiredInput) {
      undesiredInput.value = undesiredText;
      undesiredInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const newTopics = topics.map(t => ({ ...t, open: undefined }));
    setStoredState({ ...state, topics: newTopics });

  }, [basePrompt, topics, state]);

  const updateState = (n) => setState({ ...state, ...n });

  const onItemInputBlur = (topicIndex) => {
    if (isNullOrWhitespace(newPrompt)) return;
    topics[topicIndex].items.push({ prompt: newPrompt, level: 0 });
    updateState({ topics: topics });
    setNewPrompt('');
  }

  const onUndesiredInputBlur = (topicIndex) => {
    if (isNullOrWhitespace(newUndesired)) return;
    topics[topicIndex].undesired.push({ prompt: newUndesired, level: 0 });
    updateState({ topics: topics });
    setNewUndesired('');
  }

  return (
    <>
      <button onClick={mainOnClick}>Smart NAI {active ? '-' : '+'}</button>
      {active && <div className='app'>
        <input placeholder='Enter base prompt here' value={basePrompt} onChange={(e) => updateState({ basePrompt: e.target.value })} />
        <h3>Topics <button onClick={() => {
          topics.push({ name: 'New Topic', items: [], undesired: [], open: true })
          updateState({ topics: topics })
        }}>+</button>
        </h3>
        <ul>
          {topics.map((topic, ti) => (
            <li key={'topic-' + ti}>
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
                <h5>Prompt Items:</h5>
                <ul className='items'>
                  {topic.items?.map((item, ii) => (
                    <li key={'promptItem-' + ii}>
                      <Item
                        item={item}
                        allowNegativeLevel
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
                    <input
                      key={'prompt-' + newPrompt}
                      autoFocus={inputFocus === 'newPrompt'}
                      placeholder={'New prompt...'}
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      onBlur={() => onItemInputBlur(ti)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onItemInputBlur(ti); }}
                      onFocus={() => setInputFocus('newPrompt')}
                    />
                  </li>
                </ul>
                <br />
                <h5>Undesired Items:</h5>
                <ul className='items'>
                  {topic.undesired?.map((und, ui) => (
                    <li key={'undesiredItem-' + ui}>
                      <Item
                        item={und}
                        onChange={(nUnd) => {
                          topics[ti].undesired[ui] = nUnd;
                          updateState({ topics: topics });
                        }}
                        onDelete={() => {
                          topics[ti].undesired.splice(ui, 1);
                          updateState({ topics: topics })
                        }}
                      />
                    </li>
                  ))}
                  <li>
                    <input
                      key={'undesired-' + newUndesired}
                      autoFocus={inputFocus === 'newUndesired'}
                      placeholder={'New undesired...'}
                      value={newUndesired}
                      onChange={(e) => setNewUndesired(e.target.value)}
                      onBlur={() => onUndesiredInputBlur(ti)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onUndesiredInputBlur(ti); }}
                      onFocus={() => setInputFocus('newUndesired')}
                    />
                  </li>
                </ul>
              </Topic>
            </li>
          ))}
        </ul>
      </div>
      }
      {active && <button className='update' onClick={updatePrompt}>Update Prompt</button>}
    </>
  )
}

export default App;