import type { LazyExoticComponent, ComponentType } from 'react';
import React, { lazy } from 'react';
import { useRouter } from '../hooks';

/**
 * Placeholder component shown when scaffolding module is not available
 */
function ScaffoldingUnavailablePlaceholder() {
  const router = useRouter(); // ✅ safe to use here
  React.useEffect(() => {
    router.replace('/access-denied');
  }, [router]);

  return null;
}

/**
 * Conditionally imports a module from scaffolding.
 */
// Map of scaffolding paths to their actual import paths
// This ensures Vite can statically analyze all imports at build time
const SCAFFOLDING_IMPORT_MAP: Record<string, () => Promise<any>> = {
  '/scaffolding/pages/user': () => import('../../../scaffolding/pages/user'),
  '/scaffolding/pages/role': () => import('../../../scaffolding/pages/role'),
  '/scaffolding/pages/session': () => import('../../../scaffolding/pages/session'),
  '/scaffolding/pages/profile': () => import('../../../scaffolding/pages/profile'),
  '/scaffolding/pages/settings': () => import('../../../scaffolding/pages/settings'),
  '/scaffolding/pages/style-guide': () => import('../../../scaffolding/pages/style-guide'),
  '/scaffolding/pages/forgot-password': () => import('../../../scaffolding/pages/forgot-password'),
  '/scaffolding/pages/reset-password': () => import('../../../scaffolding/pages/reset-password'),
  '/scaffolding/pages/page-not-found': () => import('../../../scaffolding/pages/page-not-found'),
  '/scaffolding/pages/accept-invite': () => import('../../../scaffolding/pages/accept-invite'),
  '/scaffolding/pages/accept-request': () => import('../../../scaffolding/pages/accept-request'),
  '/scaffolding/pages/access-denied': () => import('../../../scaffolding/pages/access-denied'),
  'src/pages/home': () => import('../../pages/home'),
};

export function lazyScaffoldingImport<T extends ComponentType<any>>(
  modulePath: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      // Check if we have a mapped import (for scaffolding and src paths)
      const importFn = SCAFFOLDING_IMPORT_MAP[modulePath];
      
      if (importFn) {
        const module = await importFn();
        if (!module || !module.default) {
          throw new Error(`Module ${modulePath} does not have a default export`);
        }
        return module;
      }

      // Fallback for unmapped paths
      let resolvedPath = modulePath;
      if (modulePath.startsWith('/scaffolding/')) {
        resolvedPath = `../../../${modulePath.slice(1)}`;
      } else if (modulePath.startsWith('src/')) {
        const pathWithoutSrc = modulePath.replace(/^src\//, '');
        resolvedPath = `../../${pathWithoutSrc}`;
      }

      // Dynamic import fallback - Vite cannot statically analyze this
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const module = await import(/* @vite-ignore */ resolvedPath);
      if (!module || !module.default) {
        throw new Error(`Module ${modulePath} does not have a default export`);
      }
      return module;
    } catch (error: any) {
      console.error('Failed to load scaffolding module:', modulePath, error);
      // Return placeholder component instead of redirecting directly
      return { default: ScaffoldingUnavailablePlaceholder };
    }
  }) as LazyExoticComponent<T>;
}
