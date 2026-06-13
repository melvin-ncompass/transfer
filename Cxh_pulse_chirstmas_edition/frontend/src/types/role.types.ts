import type { Permission } from '../api/permissionApi';
import type { User } from '../api/userApi';

export type RoleProps = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDefault?: boolean;
  systemPermissions: Permission[];
  businessPermissions: Permission[];
  users: User[]
};

type RoleDetails = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type RoleMapping = {
  id: string;
  role_id: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
  role: RoleDetails;
};

export interface FormState {
  name: string;
  permissions: string[];
}