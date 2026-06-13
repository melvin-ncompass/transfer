import { useEffect, useMemo, useState } from "react";
import { IconButton, Typography, Box, Stack } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockIcon from "@mui/icons-material/Lock";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom"; // Add this import

import { GroupedTable } from "../../../../../components/tables/standard-table/GroupedTable";
import type {
  AccountsTableProps,
  AccountGroup,
  Account,
} from "../types/account.types";
import {
  useArchiveAccountMutation,
  useDeleteAccountMutation,
  useGetAccountsQuery,
  useToggleReportMutation,
} from "../api/accounts.api";
import { Checkbox } from "../../../../../components/atom/check-box";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { AccountForm } from "./AccountForm";
import { getTypographyStyles } from "../../../../../themes/uiConstants";
import { useDeleteGroupMutation, useGetGroupsQuery } from "../api/groups.api";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { GroupForm } from "./GroupForm";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { Chip } from "../../../../../components/atom/chips/Chips";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";
import { useGetUserPermissionsQuery } from "../../../../../api/permission.api";

export default function AccountsTable({
  type,
  search,
  onOpenCreateGroup,
  zeroBalance,
}: AccountsTableProps) {
  const navigate = useNavigate(); // Add this hook
  const { data: usepermissionsData } = useGetUserPermissionsQuery();
  // Row action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<Partial<Account> | null>(null);
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [openEditGroup, setOpenEditGroup] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: string | number;
    groupName: string;
    groupType: string;
  } | null>(null);
  const [groupPrefillType, setGroupPrefillType] = useState<string | undefined>(
    undefined,
  );
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // -------------------------------
  //  API Hooks
  // -------------------------------
  const { data: aData, isLoading: accountsLoading } = useGetAccountsQuery({ type });
  const accountsData = aData?.data;

  const { data: gData, refetch: refetchGroups } = useGetGroupsQuery(type);
  const [deleteAccountApi, { isLoading: deleteGroupLoading }] =
    useDeleteAccountMutation();
  const [deleteGroupApi] = useDeleteGroupMutation();
  const [archiveAccount] = useArchiveAccountMutation();
  const [toggleReport] = useToggleReportMutation();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });

  // -------------------------------
  //  Local groups state for rerendering
  // -------------------------------
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (gData?.data) {
      setGroups(gData.data);
    }
  }, [gData]);

  const handleGroupUpdate = (updatedGroup: {
    id: string | number;
    groupName: string;
    groupType: string;
  }) => {
    // 1️⃣ Update local groups state
    setGroups((prevGroups) =>
      prevGroups.map((g: any) =>
        g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g,
      ),
    );

    // 2️⃣ Update group reference inside accountsData so table shows new name immediately
    if (accountsData) {
      accountsData.forEach((acc: Account) => {
        if (acc.groupId === updatedGroup.id) {
          acc.group = { ...acc.group, groupName: updatedGroup.groupName };
        }
      });
    }
  };

  // NEW: Handle transaction count click
  const handleTransactionCountClick = (account: any) => {
    if (account.transactionCount && account.transactionCount > 0) {
      // Navigate to transact home with both accountId and accountType in search params
      navigate(
        `/books/transact/home?accountId=${account.id}&accountType=${account.accountType}`,
      );
    }
  };

  // -------------------------------
  //  Row Actions (3-dot menu)
  // -------------------------------
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    rowId: string | number,
  ) => {
    setAnchorEl(event.currentTarget);
    const row =
      accountsData?.find(
        (acc: Account) => acc.id.toString() === rowId.toString(),
      ) || null;
    setSelectedRow(row);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => {
    handleOpenAddAccount();
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    const res: any = await deleteAccountApi(selectedRow?.id);
    if (res.error) {
      showSnack(res.error?.message || "Failed to delete account", "error");
    } else {
      showSnack("Account deleted successfully!", "success");
    }
    setOpenConfirmDialog(false);
    handleMenuClose();
  };

  const handleOpenAddAccount = () => setOpenAddAccount(true);
  const handleCloseAddAccount = () => setOpenAddAccount(false);

  const handleOpenCreateGroupFromAccount = (groupType: string) => {
    if (onOpenCreateGroup) onOpenCreateGroup(groupType);
    else {
      setGroupPrefillType(groupType || undefined);
      setOpenCreateGroup(true);
    }
  };

  const handleCloseCreateGroup = () => {
    setOpenCreateGroup(false);
    setGroupPrefillType(undefined);
  };

  const handleAddAccount = (group: { groupName: string; items: Account[] }) => {
    const grp = groups.find((g) => g.groupName === group.groupName);
    if (!grp) return;

    setSelectedRow({
      id: undefined,
      accountName: "",
      accountCode: "",
      accountCurrency: "",
      notes: "",
      isSubAccount: false,
      parentAccount: "",
      accountType: grp.groupType,
      groupId: grp.id,
    });

    handleOpenAddAccount();
  };

  const handleEditGroup = (group: { groupName: string; items: Account[] }) => {
    const grp = groups.find((g) => g.groupName === group.groupName);
    if (!grp) return;

    setSelectedGroup({
      id: grp.id,
      groupName: group.groupName,
      groupType: grp.groupType,
    });
    setOpenEditGroup(true);
  };

  const handleArchiveToggle = async () => {
    if (!selectedRow) return;

    try {
      const res = await archiveAccount(selectedRow?.id).unwrap();

      showSnack(
        res.data.isArchived
          ? "Account archived successfully!"
          : "Account unarchived successfully!",
        "success",
      );
    } catch (err: any) {
      showSnack(
        err?.data?.message || "Failed to update archive status",
        "error",
      );
    }
  };

  const handleDeleteGroup = async (group: {
    groupName: string;
    items: Account[];
  }) => {
    const grp = groups.find((g) => g.groupName === group.groupName);
    if (!grp) {
      showSnack(`Group "${group.groupName}" not found.`, "error");
      return;
    }
    if (group.items.length > 0) {
      showSnack("Cannot delete group with existing accounts.", "error");
      return;
    }

    const res: any = await deleteGroupApi(grp.id);
    if (res.error) {
      showSnack(res.error?.data?.message || "Failed to delete group", "error");
    } else {
      showSnack("Group deleted successfully!", "success");
      await refetchGroups();
      setOpenConfirmDeleteDialog(false);
    }
  };

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  // -------------------------------
  //  Columns
  // -------------------------------
  const hasManageCoaPermission = usepermissionsData?.data?.permissions?.includes(
    "manage_coa",
  );

  const columns: GridColDef<Account>[] = [
    {
      field: "accountName",
      headerName: "Account Name",
      flex: 1,
      renderCell: (params: any) => {
        const row = params?.row ?? params;

        if (!row || typeof row !== "object") return null;

        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              sx={{
                ...getTypographyStyles(),
                color: usepermissionsData?.data?.permissions?.includes("view_transactions") ? "primary.main" : "text.primary",
                "&:hover": {
                  color: usepermissionsData?.data?.permissions?.includes("view_transactions") ? "primary.dark" : "text.primary",
                  cursor: row.transactionCount > 0  && usepermissionsData?.data?.permissions?.includes("view_transactions") ? "pointer" : "default",
                },
              }}
            >
              {row.accountName ?? "—"}
            </Typography>
            {row.isArchived && (
              <Chip label="Archived" color="warning" size="xs" />
            )}
          </Stack>
        );
      },
    },
    {
      field: "accountBalance",
      headerName: "Balance",
      flex: 1,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const currency = (params as any).accountCurrency ?? "—";
        const balance = (params as any).accountBalance ?? 0;
        return (
          <Typography width="100%" textAlign="right" sx={getTypographyStyles()}>
            {formatCurrencyByCommaSeparation(
              balance,
              commaSeparation,
              currency.split("-")[0],
            )}
          </Typography>
        );
      },
    },
    {
      field: "transactionCount",
      headerName: "Transactions",
      flex: 1,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const count = (params as any).transactionCount || 0;
        const hasTransactions = count > 0 && usepermissionsData?.data?.permissions?.includes("view_transactions") ;

        return (
          <Typography
            width="100%"
            textAlign="right"
            sx={{
              ...getTypographyStyles(),
              cursor: hasTransactions ? "pointer" : "default",
              color: hasTransactions ? "primary.main" : "text.primary",
              fontWeight: hasTransactions ? 600 : 400,
              textDecoration: hasTransactions ? "underline" : "none",
              "&:hover": hasTransactions
                ? {
                  color: "primary.dark",
                }
                : {},
            }}
            onClick={(e) => {
              if (hasTransactions) {
                e.stopPropagation(); // Prevent row click
                handleTransactionCountClick(params);
              }
            }}
          >
            {count}
          </Typography>
        );
      },
    },
    ...(hasManageCoaPermission
      ? ([
        {
          field: "reports",
          headerName: "Reports",
          align: "center" as const,
          headerAlign: "center" as const,
          flex: 1,
          renderCell: (params) => (
            <Stack
              width={"100%"}
              alignItems="center"
              justifyContent="center"
              direction={"row"}
            >
              <Checkbox
                checked={(params as any).showInReports}
                onChange={async () => {
                  try {
                    const res = await toggleReport(params.id).unwrap();
                    showSnack("Report setting updated", "success");
                  } catch (err: any) {
                    showSnack(
                      err?.data?.message || "Failed to toggle report",
                      "error",
                    );
                  }
                }}
              />
            </Stack>
          ),
        },
      ] as GridColDef<Account>[])
      : []),
    ...(hasManageCoaPermission
      ? ([
        {
          field: "actions",
          headerName: "Actions",
          flex: 0.5,
          sortable: false,
          align: "center" as const,
          headerAlign: "center" as const,
          renderCell: (params) => {
            const isDefault = (params as any).default === true;

            return (
              <Stack
                width={"100%"}
                alignItems="center"
                justifyContent="center"
                direction={"row"}
              >
                {isDefault ? (
                  <IconButton size="small" disabled>
                    <LockIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </IconButton>
                ) : (
                  <PermissionGuard permission={"manage_coa"}>
                    <IconButton
                      onClick={(e) => {
                        handleMenuOpen(e, params.id);
                      }}
                      size="small"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </PermissionGuard>
                )}
              </Stack>
            );
          },
        },
      ] as GridColDef<Account>[])
      : []),
  ];

  // -------------------------------
  //  Parent Accounts & Groups Memo
  // -------------------------------
  const parentAccounts = useMemo(() => {
    return (
      accountsData?.map((acc: any) => ({
        label: acc.accountName,
        value: acc.id?.toString(),
        groupId: acc.group?.id ?? "",
        accountType: acc.accountType,
      })) || []
    );
  }, [accountsData]);

  const groupNames = useMemo(() => {
    return (
      groups?.map((grp: any) => ({
        id: grp.id,
        label: grp.groupName,
        value: String(grp.id),
        type: grp.groupType,
      })) || []
    );
  }, [groups]);

  const matchedGroupNames = useMemo(() => {
    if (!search) return [];

    const q = search.toLowerCase();

    return (gData?.data || [])
      .filter((group: any) => group.groupName.toLowerCase().includes(q))
      .map((g: any) => g.groupName);
  }, [search, gData]);

  const accountMap = useMemo(() => {
    const map: Record<string, Account> = {};
    (accountsData || []).forEach((acc: Account) => {
      map[String(acc.id)] = acc;
    });
    return map;
  }, [accountsData]);

  const collectParents = (acc: Account, map: Record<string, Account>) => {
    const result: Account[] = [];

    let current = acc;
    while (current?.parentAccount) {
      const parentId =
        typeof current.parentAccount === "object"
          ? current.parentAccount.id
          : current.parentAccount;

      const parent = map[String(parentId)];
      if (!parent) break;

      result.push(parent);
      current = parent;
    }

    return result;
  };

  const filteredAccounts = useMemo(() => {
    if (!accountsData) return [];

    if (!search) return accountsData;

    const q = search.toLowerCase();
    const result: Record<string, Account> = {};

    accountsData.forEach((acc: Account) => {
      const accMatches =
        acc.accountName?.toLowerCase().includes(q) ||
        acc.accountCode?.toString().includes(q) ||
        acc.notes?.toLowerCase().includes(q);

      const groupMatches = matchedGroupNames.includes(acc.group?.groupName);
      if (accMatches || groupMatches) {
        result[String(acc.id)] = acc;

        collectParents(acc, accountMap).forEach((parent) => {
          result[String(parent.id)] = parent;
        });
      }
    });

    return Object.values(result);
  }, [accountsData, search, matchedGroupNames, accountMap]);

  const buildTreeAndFlatten = (items: any[]) => {
    const map: Record<string, any> = {};
    const roots: any[] = [];

    const getId = (it: any) =>
      it.id !== undefined ? String(it.id) : undefined;
    const getParentId = (it: any) => {
      if (
        it.parentAccount !== undefined &&
        it.parentAccount !== null &&
        it.parentAccount.id !== it.id
      ) {
        if (
          typeof it.parentAccount === "object" &&
          it.parentAccount.id !== undefined
        )
          return String(it.parentAccount.id);
        else return String(it.parentAccount);
      }
      return null;
    };

    items.forEach((it) => {
      const id = getId(it);
      if (!id) return;
      map[id] = { ...it, children: [] };
    });

    Object.values(map).forEach((node: any) => {
      const pid = getParentId(node);
      if (pid && map[pid]) {
        node._parentId = pid;
        map[pid].children.push(node);
      } else {
        node._parentId = null;
        roots.push(node);
      }
    });

    const out: any[] = [];
    const walk = (nodes: any[], depth = 0) => {
      nodes.forEach((n) => {
        n._depth = depth;
        out.push(n);
        if (n.children.length) walk(n.children, depth + 1);
      });
    };
    walk(roots);
    return out;
  };

  const groupedRows: AccountGroup[] = useMemo(() => {
    const groupsList = gData?.data || [];
    const groupsMap: Record<string, AccountGroup> = {};

    groupsList.forEach((g: any) => {
      groupsMap[g.groupName] = { groupName: g.groupName, accounts: [] };
    });

    if (!groupsMap["Uncategorized"]) {
      groupsMap["Uncategorized"] = { groupName: "Uncategorized", accounts: [] };
    }

    const accountsToUse = search ? filteredAccounts : accountsData || [];

    accountsToUse.forEach((acc: Account) => {
      const grp = groupsList.find(
        (g: any) => String(g.id) == String(acc.group?.id ?? 0),
      );
      const name = grp?.groupName || acc.group?.groupName || "Uncategorized";

      if (!groupsMap[name]) {
        groupsMap[name] = { groupName: name, accounts: [] };
      }
      groupsMap[name].accounts.push(acc);
    });

    return Object.values(groupsMap);
  }, [gData, accountsData, filteredAccounts, search]);

  const mappedGroups = useMemo(() => {
    if (search && filteredAccounts.length === 0) {
      return [];
    }

    const groupsList = gData?.data || [];

    return groupedRows
      .filter((group) => {
        if (!search)
          return (
            group.groupName !== "Uncategorized" || group.accounts.length > 0
          );

        const searchMatchedGroups = new Set(matchedGroupNames);

        return (
          searchMatchedGroups.has(group.groupName) || group.accounts.length > 0
        );
      })
      .map((group) => {
        const originalGroup = groupsList.find(
          (g: any) => g.groupName === group.groupName,
        );

        const flattened = buildTreeAndFlatten(group.accounts || []);

        const filteredItems = zeroBalance
          ? flattened
          : flattened.filter((row: any) => {
            const balance = Number(row.accountBalance ?? 0);
            return balance !== 0;
          });

        return {
          groupName: group.groupName,
          items: filteredItems,
          default: originalGroup?.default ?? false,
        };
      });
  }, [groupedRows, search, matchedGroupNames, gData, zeroBalance]);

  useEffect(() => {
    console.log("zero", zeroBalance);
  }, [zeroBalance]);
  // -------------------------------
  //  Render
  // -------------------------------
  return (
    <>
      {/* Add Account Modal */}
      <ModalElement
        open={openAddAccount}
        title={selectedRow?.id ? "Edit Account" : "Add Account"}
        onClose={handleCloseAddAccount}
        keepMounted={openAddAccount}
        maxWidth="md"
        height="90vh"
      >
        {selectedRow && accountsData ? (
          <AccountForm
            mode="edit"
            editData={selectedRow}
            parentAccounts={parentAccounts}
            groupNames={groupNames}
            onOpenCreateGroup={handleOpenCreateGroupFromAccount}
            onSuccess={() => {
              selectedRow?.id
                ? showSnack("Account updated successfully!", "success")
                : showSnack("Account added successfully!", "success");
              handleCloseAddAccount();
            }}
          />
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography sx={getTypographyStyles()}>Loading...</Typography>
          </Box>
        )}
      </ModalElement>

      {/* Create Group Modal */}
      <ModalElement
        open={openCreateGroup}
        onClose={handleCloseCreateGroup}
        title="Add Group"
        maxWidth="sm"
      >
        <GroupForm
          initialGroupType={groupPrefillType}
          onSuccess={async () => {
            showSnack("Group added successfully!", "success");
            handleCloseCreateGroup();
            await refetchGroups();
          }}
        />
      </ModalElement>

      {/* Edit Group Modal */}
      <ModalElement
        open={openEditGroup}
        onClose={() => setOpenEditGroup(false)}
        title="Edit Group"
        maxWidth="sm"
      >
        <GroupForm
          editData={selectedGroup || undefined}
          onSuccess={async (updatedGroup) => {
            handleGroupUpdate(updatedGroup);
            showSnack("Group updated successfully!", "success");
            setOpenEditGroup(false);
            await refetchGroups();
          }}
        />
      </ModalElement>

      {/* Accounts Table */}
      <GroupedTable<Account>
        columns={columns}
        groupedRows={mappedGroups}
        loading={accountsLoading}
        expandAll={Boolean(search)}
        tableHeight="65vh"
        groupHeaderColumns={[
          {
            field: "groupName",
            headerName: "Account Group",
            renderCell: (group: any) => (
              <Typography fontWeight={600} sx={getTypographyStyles()}>
                {group.groupName}
              </Typography>
            ),
          },
          ...Array(
            hasManageCoaPermission ? columns.length - 2 : columns.length - 1
          )
            .fill(null)
            .map((_, i) => ({
              field: "",
            })),
          ...(hasManageCoaPermission
            ? [
              {
                field: "actions",
                headerName: "Actions",
                renderCell: (group: any) =>
                  group.groupName !== "Uncategorized" && (
                    <Box display={"flex"} justifyContent={"end"}>
                      <PermissionGuard permission={"manage_coa"}>
                        <IconButton
                          onClick={() => handleAddAccount(group)}
                          size="small"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </PermissionGuard>
                      {!(group as any).default && (
                        <PermissionGuard permission={"manage_coa"}>
                          <>
                            <IconButton
                              onClick={() => handleEditGroup(group)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                if (group.items.length == 0) {
                                  setOpenConfirmDeleteDialog(true);
                                  setConfirmAction(
                                    () => () => handleDeleteGroup(group),
                                  );
                                } else {
                                  showSnack(
                                    "Cannot delete group with existing accounts.",
                                    "error",
                                  );
                                }
                              }}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        </PermissionGuard>
                      )}
                    </Box>
                  ),
                align: "right",
              },
            ] as GridColDef<AccountGroup>[]
            : []),
        ]}
      />

      {/* Row Action Menu */}
      <MenuAtom
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onCloseAll={handleMenuClose}
        items={[
          { label: "Edit", onClick: handleEdit },
          {
            label: selectedRow?.isArchived ? "Unarchive" : "Archive",
            onClick: () => {
              setOpenArchiveDialog(true);
              setAnchorEl(null);
            },
          },
          ...(selectedRow &&
            !selectedRow.default &&
            selectedRow.transactionCount! == 0
            ? [
              {
                label: "Delete",
                onClick: () => {
                  setOpenConfirmDialog(true);
                  setConfirmAction(() => handleDelete);
                },
              },
            ]
            : []),
        ]}
      />

      <ConfirmDialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        title="Confirm Account Delete"
        message="Are you sure you want to delete this account?"
        onConfirm={confirmAction}
        confirmColor="error"
      />
      <ConfirmDialog
        open={openConfirmDeleteDialog}
        onClose={() => setOpenConfirmDeleteDialog(false)}
        title="Confirm Group Delete"
        message="Are you sure you want to delete this group?"
        onConfirm={confirmAction}
        confirmText={deleteGroupLoading ? "Deleting..." : "Delete"}
        confirmColor="error"
      />
      <ConfirmDialog
        open={openArchiveDialog}
        title={`Confirm ${selectedRow?.isArchived ? "Unarchive" : "Archive"}`}
        message={`Are you sure you want to ${selectedRow?.isArchived ? "unarchive" : "archive"
          } this account?`}
        onClose={() => setOpenArchiveDialog(false)}
        onConfirm={() => {
          handleArchiveToggle();
          setOpenArchiveDialog(false);
        }}
        confirmColor="error"
      />

      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
}
