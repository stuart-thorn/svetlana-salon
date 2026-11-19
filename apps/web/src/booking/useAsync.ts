import { useEffect, useState, type DependencyList } from "react";

type AsyncState<T> = { data: T | undefined; loading: boolean; error: Error | undefined };

/** Runs an async loader whenever `deps` change, ignoring stale responses. */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: undefined });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ data: s.data, loading: true, error: undefined }));
    load().then(
      (data) => !cancelled && setState({ data, loading: false, error: undefined }),
      (error: unknown) =>
        !cancelled &&
        setState({ data: undefined, loading: false, error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
