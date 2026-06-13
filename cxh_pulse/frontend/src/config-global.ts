import packageJson from '../package.json';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  useFlipCardLanding?: boolean;
  loginUrl?: string;
};

export const CONFIG: ConfigValue = {
  appName: 'CxH Pulse',
  appVersion: packageJson.version,
  useFlipCardLanding: true, // Set to true to use flip card version, false for header overlay version
  loginUrl: '/login',
};
