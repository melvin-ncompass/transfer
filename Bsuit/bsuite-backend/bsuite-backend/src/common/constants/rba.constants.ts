// APP ORDER
export const APP_ORDER: Record<string, number> = {
  Books: 1,
  People: 2
};

// TOP-LEVEL MODULE ORDER
export const MODULE_ORDER: Record<string, number> = {
  "Organization Settings": 1,
  "Insights": 2,
  "Chart of Accounts": 3,
  "Transactions": 4,
};

// SUB-MODULE ORDER
export const SUBMODULE_ORDER: Record<string, number> = {
  "User Management": 2,
  "Reminders": 1,
};

// PERMISSION ORDER (by permissionNameAbrv)
export const PERMISSION_ORDER: Record<string, number> = {
  // Organization Settings
  view_business_settings: 1,
  update_business_settings: 2,
  view_export_activity: 3,
  import_export_business_settings: 4,
  manage_custom_domain_mapping: 5,

  // Reminders
  view_reminders: 1,
  manage_reminders: 2,

  // User Management
  view_user_management: 1,
  manage_user_management: 2,

  // Insights
  view_insights: 1,
  manage_insights: 2,
  export_insights: 3,

  // Chart of Accounts
  view_coa: 1,
  manage_coa: 2,
  export_coa: 3,

  // Transactions
  view_transactions: 1,
  manage_transactions: 2,
  export_transactions: 3,
  view_opening_balance: 4,
  manage_opening_balance: 5,
  manage_uncategorized_transactions: 6,
};

export const PROTECTED_ROLES = ['Global Admin', 'Books Admin'];
export const IMMUTABLE_ROLES = ['Global Admin'];

export const ROLE_PRIORITY_ORDER: string[] = [
  'Global Admin',
  'Books Admin',
  'Books Manager',
  'Books Guest',
];