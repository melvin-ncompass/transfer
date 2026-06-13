export function disableConsole() {
  if (process.env.NODE_ENV !== 'production') 
    return;

  const noop = () => {};

  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
}
