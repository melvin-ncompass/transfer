/**
 * Priority Levels
 * Order: danger sign/urgent (leftmost/highest), high (middle), low (end/lowest)
 */
export const PRIORITY_LEVELS = ['danger sign/urgent', 'high', 'low'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/**
 * Priority Levels for Heatmap Y-axis
 * Order: danger sign/urgent (top), high (middle), low (bottom)
 * Note: Same order as PRIORITY_LEVELS but kept separate for clarity
 */
export const PRIORITY_LEVELS_HEATMAP = ['danger sign/urgent', 'high', 'low'] as const;

/**
 * Risk Categories
 * Order: maternal_risk (left), baby_risk (right)
 */
export const RISK_CATEGORIES = ['maternal_risk', 'baby_risk'] as const;

export type RiskCategory = (typeof RISK_CATEGORIES)[number];

/**
 * Priority Level Display Names
 */
export const PRIORITY_LEVEL_DISPLAY_NAMES: Record<PriorityLevel, string> = {
  high: 'High',
  'danger sign/urgent': 'Danger Sign/Urgent',
  low: 'Low',
};

/**
 * Risk Category Display Names
 */
export const RISK_CATEGORY_DISPLAY_NAMES: Record<RiskCategory, string> = {
  maternal_risk: 'Maternal Risk',
  baby_risk: 'Baby Risk',
};

/**
 * Priority Level Colors
 * Centralized color scheme for priority levels used across all charts
 * Order matches PRIORITY_LEVELS: [danger sign/urgent, high, low]
 */
export const PRIORITY_LEVEL_COLORS: Record<PriorityLevel, string> = {
  'danger sign/urgent': '#008B8B', // dark teal
  high: '#40E0D0', // light teal
  low: '#FFA500', // orange
};

/**
 * Priority Level Colors Array
 * Array format for charts that need ordered color arrays
 * Order matches PRIORITY_LEVELS: [danger sign/urgent, high, low]
 */
export const PRIORITY_LEVEL_COLORS_ARRAY = PRIORITY_LEVELS.map(
  (priority) => PRIORITY_LEVEL_COLORS[priority]
);
