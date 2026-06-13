import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  IconButton,
  Modal,
  Stack,
  TextField,
  Checkbox,
  Box,
  Typography,
  Divider,
  alpha,
  Paper,
} from '@mui/material';

import { Iconify } from '../../../../src/components/iconify';
import { useCreateRoleMutation, useUpdateRoleMutation, useGetPermissionsQuery, type PermissionNode } from '../../../../src/api';
import { formatPermissionName } from '../../../../src/utils/format-text';
import { PrimaryButton } from '../../../../src/components/buttons';
import type { Permission } from '../../../../src/api';
import { PermissionName } from '../../../../src/types/permissions';

// Define the order for top-level business permissions
const BUSINESS_PERMISSION_ORDER = [
  PermissionName.DASHBOARD,
  PermissionName.DATA,
  PermissionName.CONFIG,
  PermissionName.HELP,
];

// Define the order for dashboard children
const DASHBOARD_CHILDREN_ORDER = [
  PermissionName.OVERVIEW,
  PermissionName.PROMPTS,
  PermissionName.CLIMATE,
  PermissionName.FORECAST,
];

// Sort business permissions according to the defined order
function sortBusinessPermissions(nodes: Permission[]): Permission[] {
  const sorted: { node: Permission; order: number }[] = [];
  const unsorted: Permission[] = [];
  const orderMap = new Map(BUSINESS_PERMISSION_ORDER.map((name, index) => [name, index]));

  // Separate nodes into sorted and unsorted
  nodes.forEach((node) => {
    const order = orderMap.get(node.name as PermissionName);
    if (order !== undefined) {
      sorted.push({ node, order });
    } else {
      unsorted.push(node);
    }
  });

  // Sort by order and combine
  sorted.sort((a, b) => a.order - b.order);
  return [...sorted.map((item) => item.node), ...unsorted];
}

// Sort dashboard children according to the defined order
function sortDashboardChildren(children: Permission[]): Permission[] {
  const sorted: { child: Permission; order: number }[] = [];
  const unsorted: Permission[] = [];
  const orderMap = new Map(DASHBOARD_CHILDREN_ORDER.map((name, index) => [name, index]));

  // Separate children into sorted and unsorted
  children.forEach((child) => {
    const order = orderMap.get(child.name as PermissionName);
    if (order !== undefined) {
      sorted.push({ child, order });
    } else {
      unsorted.push(child);
    }
  });

  // Sort by order and combine
  sorted.sort((a, b) => a.order - b.order);
  return [...sorted.map((item) => item.child), ...unsorted];
}

export function CreateRoleForm({
  open,
  onClose,
  onSuccess,
  onError,
  isEdit,
  selectedRoleId,
  selectedRoleName,
  selectedRolePermissions,
  selectedBusinessPermissions,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (err: string) => void;
  isEdit?: boolean;
  selectedRoleId?: string;
  selectedRoleName?: string;
  selectedRolePermissions?: any[];
  selectedBusinessPermissions?: any[];
}) {
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const { data: permissions, isLoading: permissionsLoading } = useGetPermissionsQuery();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    selectedPermissionIds: new Set<string>(), // Set of permission IDs for quick checking
  });
  const [originalForm, setOriginalForm] = useState<{
    name: string;
    selectedPermissionIds: Set<string>;
  } | null>(null);
  const [disableBtn, setDisableBtn] = useState(true);

  // Helper function to get all nested IDs for a permission node
  const getAllNestedIds = useCallback((node: Permission): string[] => {
    if (!node.children || node.children.length === 0) return [node.id];
    let list: string[] = [node.id];
    for (const child of node.children) {
      list = [...list, ...getAllNestedIds(child)];
    }
    return list;
  }, []);

  // Helper function to build hierarchical permission structure from selected permission IDs
  const buildPermissionHierarchy = useCallback((selectedPermissionIds: Set<string>, permissionTree: Permission[]): PermissionNode[] => {
    const result: PermissionNode[] = [];

    const processNode = (node: Permission): PermissionNode | null => {
      const hasSelectedChildren: PermissionNode[] = [];
      
      // Process children first
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const processedChild = processNode(child);
          if (processedChild) {
            hasSelectedChildren.push(processedChild);
          }
        }
      }

      // If this node is explicitly selected (by ID), include it
      // If it has selected children, include it as a parent
      const isSelected = selectedPermissionIds.has(node.id);
      const hasChildren = hasSelectedChildren.length > 0;

      if (isSelected || hasChildren) {
        // If node is selected but has no selected children, return as leaf
        if (isSelected && !hasChildren) {
          return { name: node.name };
        }
        // If node has selected children (or is selected with children), return with children
        return {
          name: node.name,
          ...(hasChildren && { children: hasSelectedChildren }),
        };
      }

      return null;
    };

    // Process system permissions (they don't have children, so just check if selected by ID)
    if (permissions?.system) {
      for (const sysPerm of permissions.system) {
        if (selectedPermissionIds.has(sysPerm.id)) {
          result.push({ name: sysPerm.name });
        }
      }
    }

    // Process business permissions
    if (permissionTree) {
      for (const node of permissionTree) {
        const processed = processNode(node);
        if (processed) {
          result.push(processed);
        }
      }
    }

    return result;
  }, [permissions?.system]);


  useEffect(() => {
    if (!open) return;

    if (isEdit && 
      (permissions?.system?.length || permissions?.business?.length)
    ) {
      // Extract all permission IDs from system permissions
      const systemPermIds = Array.isArray(selectedRolePermissions)
        ? selectedRolePermissions.map((p) => p.id)
        : [];

      // Extract all business permission IDs, including nested children
      const extractAllPermissionIds = (permissions: any[]): string[] => {
        const ids: string[] = [];
        const extract = (perm: any) => {
          if (perm.id) {
            ids.push(perm.id);
          }
          if (perm.children && Array.isArray(perm.children)) {
            perm.children.forEach((child: any) => extract(child));
          }
        };
        permissions.forEach(extract);
        return ids;
      };

      const businessPermIds = Array.isArray(selectedBusinessPermissions)
        ? extractAllPermissionIds(selectedBusinessPermissions)
        : [];

      // Create a set of all selected permission IDs
      const selectedPermIdsSet = new Set<string>([...systemPermIds, ...businessPermIds]);

      const initialForm = {
        name: selectedRoleName || '',
        selectedPermissionIds: selectedPermIdsSet,
      };

      setForm(initialForm);
      // Store original form state for change detection
      setOriginalForm({
        name: selectedRoleName || '',
        selectedPermissionIds: new Set(selectedPermIdsSet),
      });

    } else {
      setForm({
        name: '',
        selectedPermissionIds: new Set<string>(),
      });
      setOriginalForm(null);
      setDisableBtn(true);
    }

    setError(null);

  }, [
    open,
    isEdit,
    selectedRoleName,
    selectedRolePermissions,
    selectedBusinessPermissions,
    permissions,
  ]);


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();
    setForm((prev) => ({ ...prev, [name]: trimmedValue }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableBtn(true);
    setError(null);

    if (form.selectedPermissionIds.size === 0) {
      setDisableBtn(true);
      onError?.('Please select at least one permission');
      return;
    }

    // Build hierarchical permission structure from selected IDs
    const permissionHierarchy = buildPermissionHierarchy(
      form.selectedPermissionIds,
      permissions?.business || []
    );

    // update role
    if (isEdit) {
      try {
        const nameChanged = form.name !== selectedRoleName;

        await updateRole({
          id: selectedRoleId!,
          ...(nameChanged && { name: form.name }),
          permission: permissionHierarchy,
        }).unwrap();
        setForm({ name: '', selectedPermissionIds: new Set<string>() });
        onSuccess?.('role updated successfully');
        setDisableBtn(true);
        onClose();
      } catch (roleError: any) {
        console.error('Failed to update role:', roleError);
        onError?.(roleError.data?.message);
        setError(
          roleError.data?.message || roleError.message || 'Failed to update role. Please try again.'
        );
      }
    }

    // create role
    else {
      try {
        await createRole({
          roleName: form.name,
          permission: permissionHierarchy,
        }).unwrap();
        setForm({ name: '', selectedPermissionIds: new Set<string>() });
        onSuccess?.('role created successfully');
        onClose();
      } catch (roleError: any) {
        console.error('Failed to create role:', roleError);
        onError?.(roleError.data?.message);
        setError(
          roleError.data?.message || roleError.message || 'Failed to create role. Please try again.'
        );
      }
    }
  };

  // Clear form data when modal closes
  useEffect(() => {
    if (!open) {
      setForm({ name: '', selectedPermissionIds: new Set<string>() });
      setOriginalForm(null);
      setError(null);
    }
  }, [open]);

  // Helper function to check if two sets are equal
  const areSetsEqual = useCallback((set1: Set<string>, set2: Set<string>): boolean => {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }, []);

  // Enable/disable button based on form validity and changes
  useEffect(() => {
    const isValid = form.name.trim().length > 0 && form.selectedPermissionIds.size > 0;
    
    if (!isValid) {
      setDisableBtn(true);
      return;
    }

    // For edit mode, check if there are any changes
    if (isEdit && originalForm) {
      const nameChanged = form.name.trim() !== originalForm.name.trim();
      const permissionsChanged = !areSetsEqual(form.selectedPermissionIds, originalForm.selectedPermissionIds);
      const hasChanges = nameChanged || permissionsChanged;
      setDisableBtn(!hasChanges);
    } else {
      // For create mode, just check validity
      setDisableBtn(false);
    }
  }, [form.name, form.selectedPermissionIds, isEdit, originalForm, areSetsEqual]);

  // Toggle a single permission by ID
  const togglePermission = useCallback((permissionId: string) => {
    setForm((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return {
        ...prev,
        selectedPermissionIds: newSet,
      };
    });
  }, []);

  // Toggle all permissions in a node (including children) by ID
  const toggleNode = useCallback((node: Permission) => {
    // Get all nested IDs for this node
    const allIds = getAllNestedIds(node);
    
    // Check if all permissions in the node are currently selected
    const allSelected = allIds.every((id) => form.selectedPermissionIds.has(id));
    
    // Toggle state
    setForm((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (allSelected) {
        // Deselect all
        allIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        allIds.forEach(id => newSet.add(id));
      }
      return {
        ...prev,
        selectedPermissionIds: newSet,
      };
    });
  }, [form.selectedPermissionIds, getAllNestedIds]);

  // Toggle all system permissions
  const toggleAllSystem = useCallback((checked: boolean) => {
    const systemIds = permissions?.system?.map((p) => p.id) || [];
    setForm((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (checked) {
        systemIds.forEach(id => newSet.add(id));
      } else {
        systemIds.forEach(id => newSet.delete(id));
      }
      return {
        ...prev,
        selectedPermissionIds: newSet,
      };
    });
  }, [permissions?.system]);

  // Toggle all business permissions
  const toggleAllBusiness = useCallback((checked: boolean) => {
    const getAllBusinessIds = (nodes: Permission[]): string[] => {
      const ids: string[] = [];
      const collect = (node: Permission) => {
        ids.push(node.id);
        if (node.children) {
          node.children.forEach((child) => collect(child));
        }
      };
      nodes.forEach((n) => collect(n));
      return ids;
    };
    const businessIds = getAllBusinessIds(permissions?.business || []);
    setForm((prev) => {
      const newSet = new Set(prev.selectedPermissionIds);
      if (checked) {
        businessIds.forEach(id => newSet.add(id));
      } else {
        businessIds.forEach(id => newSet.delete(id));
      }
      return {
        ...prev,
        selectedPermissionIds: newSet,
      };
    });
  }, [permissions?.business]);

  // Check if all system permissions are selected
  const systemAllChecked = permissions?.system?.every((p) => form.selectedPermissionIds.has(p.id)) || false;
  const systemPartialChecked = permissions?.system?.some((p) => form.selectedPermissionIds.has(p.id)) && !systemAllChecked;

  // Check if all business permissions are selected
  const getAllBusinessIds = useCallback((nodes: Permission[]): string[] => {
    const ids: string[] = [];
    const collect = (node: Permission) => {
      ids.push(node.id);
      if (node.children) {
        node.children.forEach((child: Permission) => collect(child));
      }
    };
    nodes.forEach((n) => collect(n));
    return ids;
  }, []);
  
  const businessIds = getAllBusinessIds(permissions?.business || []);
  const businessAllChecked = businessIds.length > 0 && businessIds.every((id) => form.selectedPermissionIds.has(id));
  const businessPartialChecked = businessIds.some((id) => form.selectedPermissionIds.has(id)) && !businessAllChecked;

  // Recursive component for nested business permissions
  const PermissionNode = ({ node, level = 0 }: { node: Permission; level?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    
    // Check if permission is selected by ID
    const isSelected = form.selectedPermissionIds.has(node.id);
    
    // For children, check if they're selected by ID
    let checkedChildrenCount = 0;
    if (hasChildren && node.children) {
      checkedChildrenCount = node.children.filter((child: Permission) => {
        return form.selectedPermissionIds.has(child.id);
      }).length;
    }
    
    const allChecked = isSelected && (!hasChildren || checkedChildrenCount === (node.children?.length || 0));
    const partialChecked = !allChecked && (isSelected || checkedChildrenCount > 0);

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            py: 1,
            px: level > 0 ? 2 : 0,
            pl: level * 3 + (level > 0 ? 2 : 0),
            borderRadius: 1,
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                mr: 0.5,
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'transparent' },
              }}
            >
              <Iconify
                icon={expanded ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                width={16}
              />
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 24 }} />}
          <Checkbox
            checked={allChecked}
            indeterminate={partialChecked}
            onChange={() => toggleNode(node)}
            sx={{
              py: 0.5,
              color: 'text.secondary',
              '&.Mui-checked': { color: 'primary.main' },
              '&.MuiCheckbox-indeterminate': { color: 'primary.main' },
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 0.25,
              }}
            >
              {formatPermissionName(node.name)}
            </Typography>
            {node.description && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                }}
              >
                {node.description}
              </Typography>
            )}
          </Box>
        </Box>
        {hasChildren && expanded && (
          <Box sx={{ ml: level > 0 ? 2 : 0 }}>
            {(node.name === PermissionName.DASHBOARD
              ? sortDashboardChildren(node.children || [])
              : node.children || []
            ).map((child: Permission) => (
              <PermissionNode 
                key={child.id} 
                node={child} 
                level={level + 1}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="create-role-modal"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        pt: 8,
      }}
    >
      <Stack
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          width: '1200px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          boxShadow: (theme) => theme.shadows[24],
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {isEdit ? 'Update Role' : 'Create new Role'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isEdit ? '' : 'Define a role and assign permissions'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            aria-label="close"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Iconify icon="mingcute:close-line" width={24} />
          </IconButton>
        </Box>

        <Divider />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Stack
              spacing={3}
              sx={{ 
                px: 3, 
                py: 3, 
                flex: 1, 
                overflow: 'auto', 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Role Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Content Manager, Viewer"
            type="text"
            slotProps={{ htmlInput: { maxLength: 50 } }}
            helperText={
              form.name.length > 49 && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  Max limit: 50
                </Typography>
              )
            }
            autoFocus
          />

          {/* Permissions Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Permissions *
            </Typography>
            <Box
              sx={{
                display: {xs:'flex',md:'grid'},
                flexDirection:{xs:'column',md:''},
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                minHeight: '400px',
                maxHeight: {md:'500px'},
                flex: '1 1 auto',
              }}
            >
              {/* System Permissions Column */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1.5,
                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  }}
                >
                  <Checkbox
                    checked={systemAllChecked}
                    indeterminate={systemPartialChecked}
                    onChange={(e) => toggleAllSystem(e.target.checked)}
                    sx={{
                      mr: 1.5,
                      color: 'text.secondary',
                      '&.Mui-checked': { color: 'primary.main' },
                      '&.MuiCheckbox-indeterminate': { color: 'primary.main' },
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                    System Permissions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {permissions?.system?.filter((p: Permission) => form.selectedPermissionIds.has(p.id)).length || 0} / {permissions?.system?.length || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.3),
                      borderRadius: '4px',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.5),
                      },
                    },
                  }}
                >
                  {permissionsLoading ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Loading permissions...
                    </Typography>
                  ) : permissions?.system && permissions.system.length > 0 ? (
                    permissions.system.map((permission: Permission) => (
                      <Box
                        key={permission.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          py: 1.5,
                          px: 1,
                          borderRadius: 1,
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <Checkbox
                          checked={form.selectedPermissionIds.has(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          sx={{
                            py: 0.5,
                            color: 'text.secondary',
                            '&.Mui-checked': { color: 'primary.main' },
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 0.25,
                            }}
                          >
                            {formatPermissionName(permission.name)}
                          </Typography>
                          {permission.description && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: 'block',
                              }}
                            >
                              {permission.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No system permissions available
                    </Typography>
                  )}
                </Box>
              </Paper>

              {/* Business Permissions Column */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.02),
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1.5,
                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  }}
                >
                  <Checkbox
                    checked={businessAllChecked}
                    indeterminate={businessPartialChecked}
                    onChange={(e) => toggleAllBusiness(e.target.checked)}
                    sx={{
                      mr: 1.5,
                      color: 'text.secondary',
                      '&.Mui-checked': { color: 'primary.main' },
                      '&.MuiCheckbox-indeterminate': { color: 'primary.main' },
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                    Business Permissions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {businessIds.filter((id) => form.selectedPermissionIds.has(id)).length} / {businessIds.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.3),
                      borderRadius: '4px',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.5),
                      },
                    },
                  }}
                >
                  {permissionsLoading ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Loading permissions...
                    </Typography>
                  ) : permissions?.business && permissions.business.length > 0 ? (
                    sortBusinessPermissions(permissions.business).map((node) => (
                      <PermissionNode key={node.id} node={node} level={0} />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No business permissions available
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>

            </Stack>

            {/* Action Buttons - Always Visible at Bottom */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                flexShrink: 0,
              }}
            >
              <Stack 
                direction="row" 
                spacing={2} 
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {form.selectedPermissionIds.size} permission{form.selectedPermissionIds.size !== 1 ? 's' : ''} selected
                </Typography>
                <PrimaryButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={isLoading || isUpdating}
                  sx={{ minWidth: 140 }}
                  disabled={disableBtn || isLoading || isUpdating}
                >
                  {isEdit ? 'Update Role' : 'Create Role'}
                </PrimaryButton>
              </Stack>
            </Box>
          </form>
        </Box>
      </Stack>
    </Modal>
  );
}