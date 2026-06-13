import { createContext, type ReactNode, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// types
import type { ConfigContextValue, ConfigStates } from '../types/types'

// ==============================|| CONFIG CONTEXT ||============================== //

interface Props {
  children: ReactNode;
}

// Create context
export const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// ==============================|| CONFIG PROVIDER ||============================== //

export function ConfigProvider({ children }: Props) {
  // Default config (light-only)
  const defaultConfig: ConfigStates = {
    presetColor: 'default'
  };

  // Persist config in localStorage
  const { state, setState, setField, resetState } = useLocalStorage<ConfigStates>('app-config', defaultConfig);

  const memoizedValue = useMemo(
    () => ({ state, setState, setField, resetState }),
    [state, setField, setState, resetState]
  );

  return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}
