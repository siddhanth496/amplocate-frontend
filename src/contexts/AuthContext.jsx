import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getToken, setToken as persistToken, clearToken as persistClear } from '../common/utils/auth';
import { getMe } from '../common/api/users';
import { ApiError } from '../common/utils/apiClient';
import { AuthContext } from './authContextValue';

const initialState = () => {
  const token = getToken();
  return {
    token,
    user: null,
    status: token ? 'loading' : 'unauthenticated',
    error: null,
    isNewUser: false,
  };
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const requestId = useRef(0);

  useEffect(() => {
    if (state.status !== 'loading' || !state.token) return undefined;
    const myId = ++requestId.current;
    let cancelled = false;
    (async () => {
      try {
        const user = await getMe();
        if (cancelled || myId !== requestId.current) return;
        setState((prev) => ({ token: prev.token, user, status: 'authenticated', error: null, isNewUser: prev.isNewUser }));
      } catch (err) {
        if (cancelled || myId !== requestId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          persistClear();
          setState({ token: null, user: null, status: 'unauthenticated', error: null });
          return;
        }
        setState({ token: state.token, user: null, status: 'error', error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [state.status, state.token]);

  const signIn = useCallback(async (token, isNewUser = false) => {
    persistToken(token);
    setState({ token, user: null, status: 'loading', error: null, isNewUser });
  }, []);

  const signOut = useCallback(() => {
    requestId.current++;
    persistClear();
    setState({ token: null, user: null, status: 'unauthenticated', error: null });
  }, []);

  const refresh = useCallback(() => {
    if (!state.token) return;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
  }, [state.token]);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, refresh }),
    [state, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
