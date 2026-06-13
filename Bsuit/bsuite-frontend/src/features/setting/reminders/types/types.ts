// Frequency of the reminder
export enum ReminderFrequency {
  ONE_TIME = "ONE_TIME",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  EVERY_WEEKDAY = "EVERY_WEEKDAY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

// Units for "remind before" field
export enum ReminderBeforeUnit {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
}

// Units for repeating reminders
export enum RepeatUnit {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
  YEARS = "YEARS",
}

// Status of a reminder
export enum ReminderStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}
