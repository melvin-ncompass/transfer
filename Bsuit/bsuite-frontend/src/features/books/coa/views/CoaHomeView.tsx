import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Box,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  useMediaQuery,
  IconButton,
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useSearchParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
// import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";

import SearchBar from "../../../../components/searchbar/SearchBar";
import { PrimaryButton } from "../../../../components/atom/button";
import { Tooltip } from "../../../../components/atom/tooltip";
import {
  getSearchInputStyles,
  getTabStyles,
} from "../../../../themes/uiConstants";

// CONTACT IMPORTS
import ContactTable from "../contact/components/ContactTable";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import AddContactForm from "../contact/dialog/ContactForm";
import {
  useEditContactMutation,
  useExportContactMutation,
  useRegisterContactMutation,
} from "../contact/api/contact.api";
import type { IContactRegister } from "../contact/types/contact.types";
import { Snackbar } from "../../../../components/atom/snackbar";

// TAX IMPORTS
import TaxTable from "../../coa/tax/components/TaxTable";
import AddTaxDialog from "../tax/components/AddTaxDialog";
import {
  useAddTaxMutation,
  useExportTaxMutation,
  useUpdateTaxMutation,
} from "../../coa/tax/tax.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { closeEditModal } from "../tax/taxSlice";

// ACCOUNT IMPORTS
import {
  useExportAccountMutation,
  useGetAccCountQuery,
  useGetCountInfoQuery,
  useToggleMutation,
} from "../account/api/accounts.api";
import { useGetGroupsQuery } from "../account/api/groups.api";
import AccountsTable from "../account/components/AccountsTable";
import { AccountForm } from "../account/components/AccountForm";
import { GroupForm } from "../account/components/GroupForm";

// MenuAtom Import
import MenuAtom from "../../../../components/menuatom/MenuAtom";
import { Upload, FileDownload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { Account } from "../account/types/account.types";
import { useAllAccountOptions } from "../../transact/transactHome/hooks/useAllAccountOptions";
import { usePermission } from "../../../../context/PermissionContext";

// Type definitions
interface ApiError {
  message?: string;
  data?: {
    message?: string;
  };
  error?: string;
}

interface TaxFormData {
  taxName: string;
  abbreviation: string;
  taxRate: number;
  taxNumber: number;
}

interface AccountOption {
  label: string;
  value: string;
  groupId: string;
  accountType: string;
}

interface GroupOption {
  label: string;
  value: string | number;
  type: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: { xs: 1, sm: 1.5 } }}>{children}</Box>}
    </div>
  );
}

export default function COAHome() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { selectedTax, isEditModalOpen } = useAppSelector((s) => s.tax);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const {permissions} = usePermission();
  const [value, setValue] = useState(
    tabParam?.startsWith("a")
      ? 0
      : tabParam?.startsWith("l")
        ? 1
        : tabParam?.startsWith("i")
          ? 2
          : tabParam?.startsWith("e")
            ? 3
            : tabParam === "contacts"
              ? 4
              : tabParam === "tax"
                ? 5
                : 0,
  );
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [showZeroBalance, setShowZeroBalance] = useState(false);

  // Define tab mapping
  const tabNames = [
    "asset",
    "liability",
    "income",
    "expense",
    "contacts",
    "tax",
  ];

  // Sync tabParam with tab index on load
  useEffect(() => {
    if (!tabParam) return;
    const index = tabNames.indexOf(tabParam.toLowerCase());
    if (index !== -1) {
      setValue(index);
    }
  }, [tabParam]);

  // Update URL params when tab changes
  const handleTabChange = (newIndex: number) => {
    setValue(newIndex);
    refetch();
    setSearchParams({ tab: tabNames[newIndex] });
  };

  // ---------------- CONTACT MODAL STATE ----------------
  const [openContactModal, setOpenContactModal] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<IContactRegister | null>(null);
  const [editContactIndex, setEditContactIndex] = useState<number | null>(null);
  const [exportAccount] = useExportAccountMutation();
  const [exportTax] = useExportTaxMutation();
  const [exportContact] = useExportContactMutation();
  const [registerContact] = useRegisterContactMutation();
  const [editContact] = useEditContactMutation();
  const { data: countData } = useGetCountInfoQuery();
  // ---------------- TAX MODAL STATE ----------------
  const [openTaxDialog, setOpenTaxDialog] = useState(false);
  const [addTaxApi] = useAddTaxMutation();
  const [updateTaxApi] = useUpdateTaxMutation();

  const [toggle] = useToggleMutation();
  useEffect(() => {
    if (isEditModalOpen) setOpenTaxDialog(true);
  }, [isEditModalOpen]);

  // SNACKBAR
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // MENU ACTIONS
  const openAddContact = () => {
    setSelectedContact(null);
    setEditContactIndex(null);
    setOpenContactModal(true);
    setAnchorEl(null);
  };

  const openAddTax = () => {
    dispatch(closeEditModal());
    setOpenTaxDialog(true);
    setAnchorEl(null);
  };

  // Export handlers
  const handleExportAccountWithGroup = async () => {
    // TODO: Implement export account with group functionality
    console.log("Export account with group");
    try {
      const { blob, fileName } = await exportAccount({
        includeGroup: true,
      }).unwrap();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName; // now uses backend filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      showSnack("Accounts Exported Successfully", "success");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showSnack(apiError?.message || "Export failed", "error");
    }

    setAnchorEl(null);
  };

  const handleExportAccountWithoutGroup = async () => {
    try {
      const result = await exportAccount({ includeGroup: false }).unwrap();

      // Make sure `result.blob` exists and is really a Blob
      if (!(result?.blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      showSnack("Accounts Exported Successfully", "success");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showSnack(apiError?.message || "Export failed", "error");
    }

    setAnchorEl(null);
  };

  const handleExportContact = async () => {
    // TODO: Implement export contact functionality
    console.log("Export contact");
    try {
      const res = await exportContact().unwrap();
      if (!(res?.blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      showSnack("Contacts Exported Successfully", "success");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showSnack(apiError?.message || "Export failed", "error");
    }
    setAnchorEl(null);
  };

  const handleExportTax = async () => {
    // TODO: Implement export tax functionality
    console.log("Export tax");
    try {
      const res = await exportTax().unwrap();
      console.log(res);
      if (!(res?.blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      showSnack("Taxes Exported Successfully", "success");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showSnack(apiError?.message || "Export failed", "error");
    }

    setAnchorEl(null);
  };

  // Contact edit callback
  const handleContactEdit = (contact: IContactRegister, index: number) => {
    setSelectedContact(contact);
    setEditContactIndex(index);
    setOpenContactModal(true);
  };

  const handleSubmitContact = async (data: IContactRegister) => {
    try {
      if (editContactIndex !== null) {
        await editContact({ id: editContactIndex, updateData: data }).unwrap();
        showSnack("Contact updated successfully!", "success");
      } else {
        await registerContact(data).unwrap();
        showSnack("Contact added successfully!", "success");
      }
      setOpenContactModal(false);
      setSelectedContact(null);
      setEditContactIndex(null);

      setValue(4);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleSubmitTax = async (data: TaxFormData) => {
    try {
      if (selectedTax) {
        await updateTaxApi({
          id: selectedTax.id,
          body: {
            taxName: data.taxName,
            abbreviation: String(data.abbreviation),
            taxNumber: Number(data.taxNumber),
            taxRate: Number(data.taxRate),
          },
        }).unwrap();
        showSnack("Tax updated successfully!", "success");
        setValue(5);
      } else {
        await addTaxApi({
          taxName: String(data.taxName),
          abbreviation: String(data.abbreviation),
          taxNumber: Number(data.taxNumber),
          taxRate: Number(data.taxRate),
        }).unwrap();
        showSnack("Tax added successfully!", "success");
        setValue(5);
      }
      setOpenTaxDialog(false);
      dispatch(closeEditModal());
    } catch (err: any) {
      showSnack(err?.data?.message || "Tax action failed!", "error");
      throw err; // rethrow so AddTaxDialog keeps modal open
    }
  };

  // Account and Group
  const [openAddAccount, setOpenAddAccount] = useState(false);
  const [openAddGroup, setopenAddGroup] = useState(false);
  const [groupPrefillType, setGroupPrefillType] = useState<string | undefined>(
    undefined,
  );

  const handleOpenAddGroup = () => {
    const tabToTypeMap: { [key: number]: string } = {
      0: "Asset",
      1: "Liability",
      2: "Income",
      3: "Expense",
    };
    setGroupPrefillType(tabToTypeMap[value] || undefined);
    setopenAddGroup(true);
  };
  const handleCloseAddGroup = () => {
    setopenAddGroup(false);
    setGroupPrefillType(undefined);
  };

  const handleOpenCreateGroupFromAccount = (groupType: string) => {
    setGroupPrefillType(groupType || undefined);
    setopenAddGroup(true);
  };

  const handleOpenAddAccount = () => {
    const map: { [key: number]: string } = {
      0: "Asset",
      1: "Liability",
      2: "Income",
      3: "Expense",
    };
    setType(map[value]);
    setOpenAddAccount(true);
  };

  const handleCloseAddAccount = () => {
    setOpenAddAccount(false);
    setType("");
  };
  const navigate = useNavigate();
  const { accountsData } = useAllAccountOptions(
    null,
    false
  );
  const { data: cData, refetch } = useGetAccCountQuery("");
  const { data: gData } = useGetGroupsQuery("");
  const groupsData = gData?.data;
  const safeAccounts = Array.isArray(accountsData?.data) ? accountsData.data : [];
  const safeGroups = groupsData ?? [];
  // const safeCounts = cData?.data ?? {
  //   Asset: 0,
  //   Liability: 0,
  //   Income: 0,
  //   Expense: 0,
  //   Contact: 0,
  //   Tax: 0,
  // };

  const [type, setType] = useState<string>("");

  // Fetch all groups

  const parentAccounts = useMemo((): AccountOption[] => {
    return (
      safeAccounts?.map((acc: Account) => ({
        label: acc.accountName,
        value: acc.id?.toString(),
        groupId: acc.group?.id ?? "",
        accountType: acc.accountType,
      })) || []
    );
  }, [safeAccounts]);

  // Memoize edit data passed to AccountForm to avoid recreating the object
  // on every render (which would reset AccountForm's internal state).
  const accountEditData = useMemo(() => ({ accountType: type }), [type]);
  console.log(accountEditData);
  const groupNames = useMemo((): GroupOption[] => {
    return (
      safeGroups?.map(
        (grp: {
          groupName: string;
          id: string | number;
          groupType: string;
        }) => ({
          label: grp.groupName,
          value: grp.id,
          type: grp.groupType,
        }),
      ) || []
    );
  }, [safeGroups]);

  const hasManage = permissions.includes("manage_coa");
  const hasExport = permissions.includes("export_coa");
  const fullMenuItems = [
    {
      label: "Account",
      icon: <AccountBalanceIcon fontSize="small" />,
      children: [
        { label: "Account", onClick: handleOpenAddAccount },
        { label: "Group", onClick: handleOpenAddGroup },
      ],
    },
    {
      label: "Contact",
      icon: <PersonIcon fontSize="small" />,
      children: [{ label: "Contact", onClick: openAddContact }],
    },
    {
      label: "Tax",
      icon: <ReceiptIcon fontSize="small" />,
      children: [{ label: "Tax", onClick: openAddTax }],
    },
    {
      label: "Import",
      icon: <Upload fontSize="small" />,
      children: [
        {
          label: "Contact",
          onClick: () => {
            navigate("/contacts/import");
          },
        },
        {
          label: "Account",
          onClick: () => {
            navigate("/accounts/import");
          },
        },
      ],
    },
    {
      label: "Export",
      icon: <FileDownload fontSize="small" />,
      children: [
        { label: "Account with group", onClick: handleExportAccountWithGroup },
        {
          label: "Account without group",
          onClick: handleExportAccountWithoutGroup,
        },
        { label: "Contact", onClick: handleExportContact },
        { label: "Tax", onClick: handleExportTax },
      ],
    },
  ];
  const menuItems = fullMenuItems.filter(item => {
    if (item.label === "Export") return hasExport;
    return hasManage;
  });

  useEffect(() => {
    setShowZeroBalance(countData?.data?.zeroBalance)
  }, [countData])

  return (
    <>
      <Box sx={{ width: "100%", height: "100%" }}>
        {/* Account Modal */}
        {openAddAccount && (
          <ModalElement
            open={openAddAccount}
            keepMounted={true}
            onClose={handleCloseAddAccount}
            title="Add Account"
            maxWidth="md"
            height={"90vh"}
          >
            <AccountForm
              mode={"edit"}
              key={accountEditData.accountType}
              editData={accountEditData}
              parentAccounts={parentAccounts}
              groupNames={groupNames}
              onOpenCreateGroup={handleOpenCreateGroupFromAccount}
              onSuccess={() => {
                // showSnack("Account added successfully!", "success");
                setOpenAddAccount(false);

                // Navigate to correct tab based on account type
                const typeToIndex: Record<string, number> = {
                  Asset: 0,
                  Liability: 1,
                  Income: 2,
                  Expense: 3,
                };

                setValue(typeToIndex[type] ?? 0);
              }}
            />
          </ModalElement>
        )}

        {/* Group Modal */}
        <ModalElement
          open={openAddGroup}
          onClose={handleCloseAddGroup}
          title="Add Group"
          maxWidth="sm"
        >
          <GroupForm
            initialGroupType={groupPrefillType}
            onSuccess={() => {
              setSnackbar({
                open: true,
                message: "Group added successfully!",
                color: "success",
              });
              handleCloseAddGroup();
            }}
          />
        </ModalElement>

        {/* Header */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1 }}>
          {/* Top Row: Tabs + Search + Buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: { xs: 2, sm: 3 },
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            {/* Tabs */}
            <Box
              sx={{
                flex: 1,
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 3,
                },
              }}
            >
              <Tabs
                value={value}
                onChange={(_, v) => handleTabChange(v)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                sx={{
                  minHeight: getTabStyles().minHeight,
                  "& .MuiTab-root": {
                    ...getTabStyles(),
                    px: { xs: 1, sm: 1.5 },
                    minWidth: { xs: "auto", sm: 80 },
                  },
                }}
              >
                <Tab label={`Asset (${cData?.data.Asset || 0})`} />
                <Tab label={`Liability (${cData?.data.Liability || 0})`} />
                <Tab label={`Income (${cData?.data.Income || 0})`} />
                <Tab label={`Expense (${cData?.data.Expense || 0})`} />
                <Tab label={`Contact (${cData?.data.Contact || 0})`} />
                <Tab label={`Tax (${cData?.data.Tax || 0})`} />
              </Tabs>
            </Box>

            {/* Buttons */}
            {!isMobile && (
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
               {(hasManage || hasExport) && (
                 <Tooltip title="Add" placement="bottom">
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      color: "white",
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
               )}
                <Tooltip title="Settings" placement="bottom">
                  <PrimaryButton
                    onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                    sx={{ minWidth: "auto", px: 1, boxShadow: "none" }}
                  >
                    <SettingsIcon fontSize="small" />
                  </PrimaryButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </Box>
            )}

            {/* SearchBar (desktop only) */}
            {!isMobile && (
              <SearchBar
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                sx={{
                  flex: 1,
                  maxWidth: 300,
                  "& .MuiInputBase-root": getSearchInputStyles(),
                }}
              />
            )}
          </Box>

          {/* Mobile controls */}
          {isMobile && (
            <Box
              sx={{ px: 2, display: "flex", flexDirection: "column", gap: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 0.5,
                  alignItems: "center",
                }}
              >
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
               
                {(hasManage || hasExport) && (
                  <Tooltip title="Add" placement="bottom">
                    <IconButton
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: "white",
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Settings" placement="bottom">
                  <PrimaryButton
                    onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                    sx={{ minWidth: "auto", px: 1, boxShadow: "none" }}
                  >
                    <SettingsIcon fontSize="small" />
                  </PrimaryButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </Box>
              <SearchBar
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                sx={{
                  width: "100%",
                  "& .MuiInputBase-root": getSearchInputStyles(),
                }}
              />
            </Box>
          )}

          {/* Menus (rendered for both mobile and desktop) */}
          <MenuAtom
            items={menuItems}
            open={Boolean(anchorEl)}
            onCloseAll={() => setAnchorEl(null)}
            anchorEl={anchorEl}
            submenuDirection="right"
          />

          <MenuAtom
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onCloseAll={() => setSettingsAnchorEl(null)}
            items={[
              {
                render: () => (
                  <FormControlLabel
                    sx={{
                      m: 0,
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                    control={
                      <Switch
                        checked={showZeroBalance}
                        onChange={async () => {
                          try {
                            await toggle({
                              accountZeroBalance: !showZeroBalance,
                            }).unwrap();
                            showSnack(
                              !showZeroBalance
                                ? "Zero Balance Added Successfully"
                                : "Zero Balance Removed Successfully",
                              "success",
                            );
                            setShowZeroBalance(!showZeroBalance);
                            setSettingsAnchorEl(null);
                          } catch (error: any) {
                            showSnack(
                              error.data.message ?? "its an error",
                              "error",
                            );
                          }
                        }}
                      // onChange={(e) => setShowZeroBalance(e.target.checked)}
                      />
                    }
                    label="Show Zero Balance"
                  />
                ),
              },
            ]}
          />
        </Box>

        {/* Content */}
        <Box
          sx={{
            overflow: "auto",
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 4,
            },
          }}
        >
          <CustomTabPanel value={value} index={0}>
            <AccountsTable type="Asset" search={search} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <AccountsTable type="Liability" search={search} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <AccountsTable type="Income" search={search} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            <AccountsTable type="Expense" search={search} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={4}>
            <ContactTable search={search} onEdit={handleContactEdit} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={5}>
            <TaxTable search={search} zeroBalance={showZeroBalance} />
          </CustomTabPanel>
        </Box>
      </Box>

      {/* Modals and Snackbar */}
      <ModalElement
        open={openContactModal}
        onClose={() => setOpenContactModal(false)}
        title={selectedContact ? "Edit Contact" : "Add Contact"}
        maxWidth="md"
      >
        <AddContactForm
          selectedContact={selectedContact}
          onSubmit={handleSubmitContact}
        />
      </ModalElement>

      <AddTaxDialog
        data={selectedTax || undefined}
        open={openTaxDialog}
        onClose={() => {
          setOpenTaxDialog(false);
          dispatch(closeEditModal());
        }}
        onSubmit={handleSubmitTax}
      />

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
