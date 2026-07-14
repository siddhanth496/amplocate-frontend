import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic loader hook. Pass a memoised fetcher; the hook handles loading,
 * error and stale-result protection. Use `deps` to control re-fetching.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} fetcher
 * @param {unknown[]} [deps]
 * @param {{ skip?: boolean, initialData?: T }} [options]
 */
export function useApiResource(fetcher, deps = [], options = {}) {
  const { skip = false, initialData = null } = options;
  const [state, setState] = useState({
    data: initialData,
    error: null,
    status: skip ? 'idle' : 'loading',
  });
  const requestId = useRef(0);

  const run = useCallback(
    async (signal) => {
      const myId = ++requestId.current;
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        const result = await fetcher(signal);
        if (signal?.aborted || myId !== requestId.current) return;
        setState({ data: result, error: null, status: 'success' });
      } catch (err) {
        if (signal?.aborted || err?.name === 'AbortError' || myId !== requestId.current) return;
        setState((prev) => ({ ...prev, status: 'error', error: err }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    if (skip) return undefined;
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [skip, run]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    return run(controller.signal);
  }, [run]);

  const setData = useCallback((updater) => {
    setState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  }, []);

  return { ...state, refetch, setData };
}
