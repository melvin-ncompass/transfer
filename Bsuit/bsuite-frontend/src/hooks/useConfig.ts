import { useContext } from 'react';
import { ConfigContext } from '../context/ConfigContext';

// CONFIG - HOOK  //

export default function useConfig() {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error('useConfig must be used inside ConfigProvider');
  }

  return context;
}