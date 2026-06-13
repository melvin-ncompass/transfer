import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Menu,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tooltip } from "../../../atom/tooltip";
import { TAGS } from "../../../../api/tagTypes";
import {
  useGetAllCompanyQuery,
  useSetCompanyIdMutation,
} from "../../../../features/company/api/company.api";
import { useGetEmployeeInfoQuery, useLazyGetEmployeeInfoQuery } from "../../../../features/people/api/people.api";
import {
  logout,
  closeSecurity,
  goToLogin,
  showSnackbar,
} from "../../../../features/auth/authSlice";
import { isUnauthorizedError } from "../../../../features/auth/utils/rtkQueryAuthError";
import { resetProfileState } from "../../../../features/auth/profilePage/profileSlice";
import { useLogoutMutation } from "../../../../features/auth/api/auth.api";
import { baseApi } from "../../../../api/base.api";
import AddCompanyModal from "../../../../features/company/components/AddCompanyModal";
import { notifyCompanyChanged } from "../../../../features/company/utils/companyCrossTabSync";
import type { ICompanyResponse } from "../../../../features/company/types/company.types";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
interface CompanySwitcherProps {
  currentCompanyId?: string;
  currentCompanyName?: string;
  currentCompanyLogo?: string;
}

export default function CompanySwitcher({
  currentCompanyId,
  currentCompanyName,
  currentCompanyLogo,
}: CompanySwitcherProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openAddCompany, setOpenAddCompany] = useState(false);
  const [setCompanyId] = useSetCompanyIdMutation();
  const [getEmployeeInfo] = useLazyGetEmployeeInfoQuery();
  const [logoutApi] = useLogoutMutation();
  const { data: companiesData, isLoading } = useGetAllCompanyQuery();
  const { data: employeeInfo } = useGetEmployeeInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isEmployeeNonAdmin =
    employeeInfo?.data?.isEmployee === true && employeeInfo?.data?.isAdmin !== true;

  const companies = companiesData?.data || [];
  const open = Boolean(anchorEl);
  const isCompanyHome = location.pathname === "/company/home";

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
    window.dispatchEvent(new CustomEvent("profileClicked"));
    navigate("/company/settings");
  };

  const handleCompanySwitch = async (company: ICompanyResponse) => {
    if (company.companyId === currentCompanyId) {
      handleClose();
      return;
    }

    try {
      await setCompanyId({ companyId: company.companyId }).unwrap();
      handleClose();

      try {
        const { data: info } = await getEmployeeInfo().unwrap();
        notifyCompanyChanged(company.companyId);
        dispatch(baseApi.util.invalidateTags([...TAGS]));

        const isEmployeeNonAdminAfterSwitch =
          info?.isEmployee === true && info?.isAdmin !== true;

        if (isEmployeeNonAdminAfterSwitch) {
          navigate("/people/home?tab=2");
        } else {
          navigate("/books/transact/home");
        }
      } catch (err: unknown) {
        // Still sync other tabs with new company cookie; they no longer full-logout on transient /employee/info errors.
        notifyCompanyChanged(company.companyId);
        dispatch(baseApi.util.invalidateTags([...TAGS]));

        if (isUnauthorizedError(err)) {
          dispatch(resetProfileState());
          dispatch(logout());
          dispatch(goToLogin());
          dispatch(closeSecurity());
          navigate("/login", { replace: true });
          queueMicrotask(() => {
            dispatch(baseApi.util.resetApiState());
          });
          void logoutApi()
            .unwrap()
            .catch(() => {
              /* session may already be invalid */
            });
        } else {
          dispatch(
            showSnackbar({
              message:
                "Company switched, but we could not verify your role yet. Try refreshing.",
              color: "warning",
            }),
          );
          navigate("/company/home", { replace: true });
        }
      }
    } catch {
      console.error("Error switching company");
    }
  };

  const getCompanyInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderCompanyIcon = (company: ICompanyResponse, size = 34) => {
    if (company.companyLogo) {
      return (
        <Avatar
          src={company.companyLogo}
          alt={company.companyName}
          sx={{ width: size, height: size }}
        />
      );
    }

    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "4px",
          backgroundColor: theme.palette.primary.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.primary.contrastText,
          fontSize: size * 0.4,
          fontWeight: 600,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {getCompanyInitials(company.companyName)}
      </Box>
    );
  };

  const hasMultipleCompanies = companies.length > 1;

  return (
    <>
      <Tooltip
        title={currentCompanyName || "Switch Company"}
        placement="bottom"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Box
            data-company-switcher
            onClick={handleClick}
            sx={{
              width: 34,
              height: 34,
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              ...(hasMultipleCompanies && {
                boxShadow: `0px 8px 1px -3px ${theme.palette.primary.main}`,
              }),
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            {currentCompanyLogo ? (
              <Avatar
                src={currentCompanyLogo}
                alt={currentCompanyName}
                sx={{ width: 36, height: 36 }}
              />
            ) : currentCompanyName ? (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "4px",
                  backgroundColor: theme.palette.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.primary.contrastText,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {getCompanyInitials(currentCompanyName)}
              </Box>
            ) : (
              <BusinessIcon
                sx={{ fontSize: 20, color: theme.palette.text.secondary }}
              />
            )}
          </Box>
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              borderRadius: 2,
              boxShadow: theme.shadows[10],
              overflow: "hidden",
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {isLoading ? (
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : companies.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No companies available
              </Typography>
            </Box>
          ) : (
            companies.map((company) => {
              const isActive = company.companyId === currentCompanyId;

              return (
                <ListItemButton
                  key={company.companyId}
                  onClick={() => handleCompanySwitch(company)}
                  selected={isActive}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    minHeight: "auto",
                    position: "relative",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    backgroundColor: isActive
                      ? theme.palette.action.selected
                      : "transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 35,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {renderCompanyIcon(company, 24)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 600 : 400,
                          fontSize: "0.8rem",
                        }}
                      >
                        {company.companyName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {company.companyShortName}
                      </Typography>
                    }
                    sx={{
                      m: 0,
                      "& .MuiListItemText-primary": {
                        marginBottom: 0,
                      },
                      "& .MuiListItemText-secondary": {
                        marginTop: 0.125,
                      },
                    }}
                  />
                  {isActive && !isEmployeeNonAdmin && (
                    <PermissionGuard permission="view_business_settings">
                      <Box
                        onClick={handleSettingsClick}
                        sx={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          borderRadius: "4px",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <SettingsIcon
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                          }}
                        />
                      </Box>
                    </PermissionGuard>
                  )}
                </ListItemButton>
              );
            })
          )}
        </Box>

        <Divider />
        <ListItemButton
          selected={isCompanyHome}
          onClick={() => {
            handleClose();
            window.dispatchEvent(new CustomEvent("profileClicked"));
            navigate("/company/home");
          }}
          sx={{
            // py: 0.5,
            px: 1.5,
            minHeight: "auto",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
            backgroundColor: isCompanyHome
              ? theme.palette.action.selected
              : "transparent",
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 35,
              mr: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BusinessIcon
              sx={{ fontSize: 16, color: theme.palette.text.secondary }}
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  lineHeight: 1.2,
                }}
              >
                All Companies
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => {
            handleClose();
            setOpenAddCompany(true);
          }}
          sx={{
            // py: 0.5,
            px: 1.5,
            minHeight: "auto",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 35,
              mr: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: "4px",
                border: `1px dashed ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.palette.action.hover,
              }}
            >
              <AddIcon
                sx={{ fontSize: 16, color: theme.palette.text.secondary }}
              />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  lineHeight: 1.2,
                }}
              >
                Add Company
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </ListItemButton>
      </Menu>

      <AddCompanyModal
        open={openAddCompany}
        onClose={() => setOpenAddCompany(false)}
        onSuccess={() => {
          setOpenAddCompany(false);
          navigate("/company/home");
        }}
      />
    </>
  );
}
