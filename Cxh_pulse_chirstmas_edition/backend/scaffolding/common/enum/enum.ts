export enum ConfigType {
  EMAIL = 'email',
  PATH = 'path',
  BRANDING = 'branding'
}

export enum UserStatus { 
  ACTIVATE = 'Activation',
  DEACTIVATE = 'Deactivation'
}

export enum RequestStatus {
  APPROVED = 'approved',
  DENIED = 'denied',
}

export enum UserTypeEnum {
  USER = 'user',
  INVITE = 'invite',
  REQUEST = 'request',
}

export enum RequestStatusEnum {
  APPROVED = 'approved',
  DENIED = 'denied',
  PENDING = 'pending',
}

export enum PermissionEnum {
  MANAGE_DASHBOARD = 'MANAGE_DASHBOARD',
  MANAGE_OVERVIEW = 'MANAGE_OVERVIEW',
  MANAGE_DECKGL = 'MANAGE_DECKGL',
  MANAGE_LEAFLET = 'MANAGE_LEAFLET',
  MANAGE_GOOGLE_MAP = 'MANAGE_GOOGLE_MAP',
  MANAGE_CLIMATE = 'MANAGE_CLIMATE',
  MANAGE_TIMESERIES = 'MANAGE_TIMESERIES',
  MANAGE_PROMPTS = 'MANAGE_PROMPTS',
  MANAGE_CLIMATE_AND_HEALTH = 'MANAGE_CLIMATE_AND_HEALTH',
  MANAGE_DATA = 'MANAGE_DATA',
  MANAGE_CONFIG = 'MANAGE_CONFIG',
  MANAGE_HELP = 'MANAGE_HELP',
  MANAGE_USER = 'MANAGE_USER',
  MANAGE_ROLES = 'MANAGE_ROLES',
  READ_SESSION_LOGS = 'READ_SESSION_LOGS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
}

export enum DefaultRoleEnum {
  SUPER_ADMIN = 'Super Admin (Default)',
  USER = 'User (Default)',
}

export enum ArchiveStatus{
  GET_ALL='Get All'
}

export enum ApiResponseMessageEnum {
  SUCCESS = 'Success',
  ERROR = 'Error',
  NOT_FOUND = 'Not Found',
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Forbidden',
  BAD_REQUEST = 'Bad Request',
  INTERNAL_SERVER_ERROR = 'Internal Server Error'
}
