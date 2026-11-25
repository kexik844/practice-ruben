import { useState, useEffect } from 'react';

export function useResource(load, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(
    () => {
      const controller = new AbortController();
      let active = true;
      setState({ loading: true, data: null, error: null });
      Promise.resolve().then(() => load(controller.signal)).then(data => {
        if (active) setState({ loading: false, data, error: null });
      }).catch(error => {
        if (active && error.name !== 'AbortError') setState({ loading: false, data: null, error });
      });
      return () => {
        active = false;
        controller.abort();
      };
    },
    [...deps, version]
  );
  return { ...state, retry: () => setVersion(v => v + 1) };
}

export function useDebounce(value, delay = 400) {
  const [debounced, set] = useState(value);
  useEffect(
    () => {
      const t = setTimeout(() => set(value), delay);
      return () => clearTimeout(t);
    },
    [value, delay]
  );
  return debounced;
}
