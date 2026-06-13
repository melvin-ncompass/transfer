/**
 * @type {import("prettier").Config}
 * Need to restart IDE when changing configuration
 * Open the command palette (Ctrl + Shift + P) and execute the command > Reload Window.
 */
const config = {
  semi: true,
  tabWidth: 2,
  endOfLine: 'lf',
  printWidth: 100,
  singleQuote: true,
  relativeImportPaths: true,
  trailingComma: 'es5',
  // Import organization plugin configuration
  importOrder: [
    '^react',
    '^@mui',
    '^@reduxjs',
    '^src/services/api',
    '^src/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  // Organize imports on save
  plugins: [],
};

export default config;
