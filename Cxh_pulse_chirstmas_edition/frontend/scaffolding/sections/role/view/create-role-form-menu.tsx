import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  ListItemText,
  MenuItem,
  Typography,
  alpha,
} from '@mui/material';
import { Iconify } from '../../../../src/components/iconify';
import { formatPermissionName } from '../../../../src/utils/format-text';
import type { Permission } from '../../../../src/types';
import type { FormState } from '../../../../src/types/role.types';
import type { PermissionResponse, Permission as PermissionType } from '../../../../src/api';

//role names from children
function getAllNestedNames(node: any): string[] {
  if (!node.children || node.children.length === 0) return [];
  let list: string[] = [];
  for (const child of node.children) {
    list.push(child.name);
    list = [...list, ...getAllNestedNames(child)];
  }
  return list;
}

//recurison of children
function PermissionNode({
  node,
  form,
  setForm,
  setDisableBtn,
}: {
  node: any;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setDisableBtn: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  const allNames = [node.name, ...getAllNestedNames(node)];
  const checkedCount = allNames.filter((n) => form.permissions.includes(n)).length;

  const allChecked = checkedCount === allNames.length;
  const partialChecked = checkedCount > 0 && checkedCount < allNames.length;

  //for recursion of children with accords
  const toggleNode = () => {
    setDisableBtn(false);
    setForm((prev) => {
      if (!form.permissions.includes(node.name)) {
        return {
          ...prev,
          permissions: Array.from(new Set([...prev.permissions, ...allNames])),
        };
      }

      return {
        ...prev,
        permissions: prev.permissions.filter((p) => !allNames.includes(p)),
      };
    });
  };

  return (
    <Accordion
      expanded={open}
      disableGutters
      sx={{
        boxShadow: 'none',
        border: 'none',
        '&:before': { display: 'none' },
        '&.Mui-expanded': {
          margin: 0,
        },
        mb: 0.5,
      }}
    >
      <AccordionSummary
        expandIcon={
          hasChildren ? (
            <Iconify
              icon="eva:arrow-ios-downward-fill"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
              sx={{
                fontSize: 20,
                color: 'text.secondary',
                transition: 'transform 0.2s ease-in-out, color 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            />
          ) : null
        }
        onClick={(e) => {
          // If clicking on the expand icon area, just toggle expand/collapse
          if ((e.target as HTMLElement).closest('.MuiAccordionSummary-expandIconWrapper')) {
            setOpen((o) => !o);
            return;
          }
          // If clicking on the checkbox, it will handle its own toggle
          if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
              (e.target as HTMLElement).closest('.MuiCheckbox-root')) {
            return;
          }
          // Otherwise, toggle the checkbox when clicking on text/content
          toggleNode();
        }}
        sx={{
          pl: 2.5,
          pr: 1.5,
          py: 0.75,
          minHeight: 56,
          borderRadius: 1,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
          '&.Mui-expanded': {
            minHeight: 56,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
          '& .MuiAccordionSummary-content': {
            margin: '8px 0',
            '&.Mui-expanded': {
              margin: '8px 0',
            },
          },
        }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={partialChecked}
          onClick={(e) => {
            e.stopPropagation();
            toggleNode();
          }}
          sx={{
            mr: 1.5,
            color: 'text.secondary',
            '&.Mui-checked': {
              color: 'primary.main',
            },
            '&.MuiCheckbox-indeterminate': {
              color: 'primary.main',
            },
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            },
          }}
        />

        <ListItemText
          primary={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  transition: 'color 0.2s ease-in-out',
                  lineHeight: 1.5,
                }}
              >
                {formatPermissionName(node.name)}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  lineHeight: 1.4,
                  mt: 0.25,
                }}
              >
                {node.description}
              </Box>
            </Box>
          }
        />
      </AccordionSummary>

      {hasChildren && (
        <AccordionDetails
          sx={{
            pl: 4,
            pr: 1.5,
            pt: 0.5,
            pb: 0.5,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
            borderLeft: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            ml: 2,
            borderRadius: '0 0 4px 4px',
          }}
        >
          {node.children.map((child: any) => (
            <PermissionNode
              key={child.id}
              node={child}
              form={form}
              setForm={setForm}
              setDisableBtn={setDisableBtn}
            />
          ))}
        </AccordionDetails>
      )}
    </Accordion>
  );
}

// main
export default function RoleMenuMap({
  form,
  permissionList,
  setForm,
  permissionsLoading,
  disableBtn,
  setDisableBtn,
}: {
  form: FormState;
  permissionList: PermissionResponse;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  permissionsLoading: boolean;
  disableBtn: boolean;
  setDisableBtn: any;
}) {
  const [openSystem, setOpenSystem] = useState(true);
  const [openBusiness, setOpenBusiness] = useState(true);

  // Get all business permission names (memoized)
  const getAllBusinessNames = useMemo(() => {
    const names: string[] = [];
    const collect = (node: PermissionType) => {
      names.push(node.name);
      if (node.children) {
        node.children.forEach((child: PermissionType) => collect(child));
      }
    };
    permissionList.business.forEach((n: PermissionType) => collect(n));
    return names;
  }, [permissionList.business]);

  //system
  const systemList = permissionList.system.map((p: PermissionType) => p.name);
  const systemCheckedCount = systemList.filter((p: string) => form.permissions.includes(p)).length;
  const systemAllChecked = systemCheckedCount === systemList.length;
  const systemPartial = systemCheckedCount > 0 && systemCheckedCount < systemList.length;

  //business
  const businessCheckedCount = getAllBusinessNames.filter((name) =>
    form.permissions.includes(name)
  ).length;

  const businessAllChecked = businessCheckedCount === getAllBusinessNames.length;
  const businessPartial =
    businessCheckedCount > 0 && businessCheckedCount < getAllBusinessNames.length;

  if (!permissionList) {
    return (
      <MenuItem disabled>
        {permissionsLoading ? 'Loading permissions...' : 'No permissions available'}
      </MenuItem>
    );
  }

  const toggleAllSystem = (checked: boolean) => {
    setDisableBtn(false);
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...systemList]))
        : prev.permissions.filter((p) => !systemList.includes(p)),
    }));
  };

  const toggleSystemPerm = (name: string) => {
    setDisableBtn(false);
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(name)
        ? prev.permissions.filter((p) => p !== name)
        : [...prev.permissions, name],
    }));
  };

  const toggleAllBusiness = (checked: boolean) => {
    setDisableBtn(false);
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...getAllBusinessNames]))
        : prev.permissions.filter((p) => !getAllBusinessNames.includes(p)),
    }));
  };

  return (
    <Box sx={{ py: 0.5 }}>
      {/* System section */}
      <Accordion
        expanded={openSystem}
        disableGutters
        sx={{
          boxShadow: 'none',
          border: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
          mb: 1,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={
            <Iconify
              icon="eva:arrow-ios-downward-fill"
              onClick={(e) => {
                e.stopPropagation();
                setOpenSystem((o) => !o);
              }}
              sx={{
                fontSize: 20,
                color: 'text.secondary',
                transition: 'transform 0.2s ease-in-out, color 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            />
          }
          sx={{
            px: 2,
            py: 1,
            minHeight: 48,
            borderRadius: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            },
            '&.Mui-expanded': {
              minHeight: 48,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Checkbox
            checked={systemAllChecked}
            indeterminate={systemPartial}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => toggleAllSystem(e.target.checked)}
            sx={{
              mr: 1.5,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: 'primary.main',
              },
              '&.MuiCheckbox-indeterminate': {
                color: 'primary.main',
              },
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              },
            }}
          />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'text.primary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              transition: 'color 0.2s ease-in-out',
            }}
          >
            System
          </Typography>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            pt: 0.5,
            pb: 0.5,
            px: 0,
            bgcolor: 'background.paper',
          }}
        >
          {permissionList.system.map((permission: PermissionType) => (
            <MenuItem
              key={permission.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleSystemPerm(permission.name);
              }}
              sx={{
                pl: 3.5,
                pr: 2,
                py: 1,
                mx: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Checkbox
                checked={form.permissions.includes(permission.name)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSystemPerm(permission.name);
                }}
                onChange={() => toggleSystemPerm(permission.name)}
                sx={{
                  mr: 1.5,
                  color: 'text.secondary',
                  '&.Mui-checked': {
                    color: 'primary.main',
                  },
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              />
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        transition: 'color 0.2s ease-in-out',
                        lineHeight: 1.5,
                      }}
                    >
                      {formatPermissionName(permission.name)}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        lineHeight: 1.4,
                        mt: 0.25,
                      }}
                    >
                      {permission.description}
                    </Box>
                  </Box>
                }
              />
            </MenuItem>
          ))}
        </AccordionDetails>
      </Accordion>
      
      {/* Business section*/}
      <Accordion
        expanded={openBusiness}
        disableGutters
        sx={{
          boxShadow: 'none',
          border: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={
            <Iconify
              icon="eva:arrow-ios-downward-fill"
              onClick={(e) => {
                e.stopPropagation();
                setOpenBusiness((o) => !o);
              }}
              sx={{
                fontSize: 20,
                color: 'text.secondary',
                transition: 'transform 0.2s ease-in-out, color 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            />
          }
          sx={{
            px: 2,
            py: 1,
            minHeight: 48,
            borderRadius: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            },
            '&.Mui-expanded': {
              minHeight: 48,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Checkbox
            checked={businessAllChecked}
            indeterminate={businessPartial}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => toggleAllBusiness(e.target.checked)}
            sx={{
              mr: 1.5,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: 'primary.main',
              },
              '&.MuiCheckbox-indeterminate': {
                color: 'primary.main',
              },
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              },
            }}
          />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'text.primary',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              transition: 'color 0.2s ease-in-out',
            }}
          >
            Business
          </Typography>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            pt: 0.5,
            pb: 0.5,
            px: 0,
            bgcolor: 'background.paper',
          }}
        >
          {permissionList.business.map((node: PermissionType) => (
            <PermissionNode
              key={node.id}
              node={node}
              form={form}
              setForm={setForm}
              setDisableBtn={setDisableBtn}
            />
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}