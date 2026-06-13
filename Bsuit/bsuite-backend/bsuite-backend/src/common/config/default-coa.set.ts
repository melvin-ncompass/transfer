import { ACCOUNTS_CONFIG, GROUPS_CONFIG } from "src/company/default-accounts";


export const DEFAULT_ACCOUNT_KEYS = new Set(
  ACCOUNTS_CONFIG.map(acc => `${acc.name}::${acc.type}`)
);

export const DEFAULT_GROUP_KEYS = new Set(
  GROUPS_CONFIG.map(acc => `${acc.name}`)
);