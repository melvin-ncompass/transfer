import { resolve } from 'path';
import { existsSync } from 'fs';
import { Type, DynamicModule, ForwardReference } from '@nestjs/common';

export function safeImportModule(
  relativePath: string,
): Type<any> | DynamicModule | ForwardReference<any> | null {
  // strip .ts/.js if present
  const clean = relativePath.replace(/\.(ts|js)$/, '');

  // absolute paths
  const tsFile = resolve(process.cwd(), `${clean}.ts`);
  const jsFile = resolve(process.cwd(), 'dist', `${clean}.js`);

  let fileToLoad: string | null = null;

  if (existsSync(jsFile)) {
    fileToLoad = jsFile;
  } else if (existsSync(tsFile)) {
    fileToLoad = tsFile;
  } else {
    console.warn(`safeImportModule: NOT FOUND: ${relativePath}`);
    return null;
  }

  try {
    const imported = require(fileToLoad);
    return imported.default || Object.values(imported)[0] || null;
  } catch (err: any) {
    console.warn(`safeImportModule: FAILED loading ${relativePath}:`, err.message);
    return null;
  }
}