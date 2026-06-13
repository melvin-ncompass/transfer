import {
  EditOutlined,
  CloseOutlined,
  Person,
  Check,
  DriveFileRenameOutline,
} from "@mui/icons-material";
import { Box, Typography, Tooltip, IconButton, Stack, useTheme } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import {
  clearError,
  setDisplayName,
  setEdit,
  setError,
  setModalState,
  setPfp,
  setPrevDisplayName,
  setProfileEmail,
  setSessions,
  setTwoFA,
} from "../profileSlice";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { useEffect, type ChangeEvent } from "react";
import type { User } from "../types/types";
import {
  useChangeDisplayNameMutation,
  useRemoveProfilePicMutation,
} from "../../api/profile.api";
import { showSnackbar } from "../../authSlice";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";

function ProfileHeader({ data }: { data: User }) {
  const pfp = useAppSelector((state) => state.profile);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [changeDisplayNameApi,{isLoading:nameChangeLoading}] = useChangeDisplayNameMutation();
  useEffect(() => {
    dispatch(setPfp(data.profilePicUrl ?? ""));
    dispatch(setSessions(data.sessions));
    dispatch(setDisplayName(data.displayName));
    dispatch(setProfileEmail(data.email));
    dispatch(setTwoFA(data.twoFAEnabled));
    dispatch(setPrevDisplayName(data.displayName));
  }, []);
  const validate = (text: string) => {
    // rule: required length
    if (text.trim().length < 3) return "Minimum length is 3";
    if (text.trim().length > 50) return "Maximum length is 50";

    // rule: not all numbers
    if (/^\d+$/.test(text)) return "Cannot contain only numbers";

    // rule: not only symbols
    if (/^[^a-zA-Z0-9]+$/.test(text)) return "Cannot contain only symbols";

    return "";
  };
  function handleEdit(e: ChangeEvent<HTMLInputElement>): void {
    const validationResults = validate(e.target.value);
    if (validationResults != "") {
      dispatch(setError(validationResults));
      //   setErrorMsg(validationResults);
    } else {
      dispatch(clearError());
    }
    dispatch(setDisplayName(e.target.value));
  }

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === "Escape") setEdit(false);
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);
  return (
    <>
      <Box
        sx={{
          flex: "1",
          borderRadius: "4px",
          boxShadow: "0px 0px 4px grey",
          pt: "20px",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* profile info */}
        <Typography
          variant="h6"
          sx={{
            pl: { xs: "", sm: "20px" },
            // position: "absolute",
            // top: "50px",
            // left:
            textAlign: { xs: "center", sm: "left" },
            // width: "100%",
          }}
        >
          Basic Information
        </Typography>
        <Box
          sx={{
            paddingX: "20px",
            // width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: "10px",
          }}
        >
          {/* profile picture container */}
          <Box>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                border: "1px solid grey",
                position: "relative",
                // overflow: "hidden",
                backgroundColor: "white",
              }}
            >
              {/* The actual image */}
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url("${pfp.pfp}")`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  display: "flex",
                  justifyContent: "center",
                  borderRadius: "50%",
                  alignItems: "center",
                }}
              >
                {!pfp.pfp && (
                  <Person
                    sx={{ fontSize: 80, color: theme.palette.secondary.main }}
                  />
                )}
              </Box>

              {/* TOP RIGHT - Change image */}
              <Tooltip title="Change Image">
                <IconButton
                  onClick={() =>
                    dispatch(setModalState({ modal: "pfpModal", value: true }))
                  }
                  sx={{
                    position: "absolute",
                    top: -10, // moved outward
                    right: -10, // moved outward
                    padding: 0,
                    backgroundColor: "white",
                    border: `2px solid ${theme.palette.secondary.main}`,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    boxShadow: 2,
                    ":hover": { backgroundColor: "white" },
                  }}
                >
                  <EditOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              {/* BOTTOM RIGHT - Remove image */}
              {pfp.pfp && (
                <Tooltip title="Remove Image">
                  <IconButton
                    onClick={async () => {
                      dispatch(
                        setModalState({ modal: "deleteModal", value: true })
                      );
                    }}
                    sx={{
                      position: "absolute",
                      bottom: -10, // moved outward
                      right: -10, // moved outward
                      padding: 0,
                      backgroundColor: theme.palette.error.main,
                      border: `2px solid white`,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      boxShadow: 2,
                      ":hover": { backgroundColor: theme.palette.error.main },
                    }}
                  >
                    <CloseOutlined sx={{ fontSize: 18, color: "white" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              // width: "calc(100% - 140px)",
              marginLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginBottom: "15px",
              alignItems: "center",
            }}
          >
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"cente"}
              // height={"100%"}
              gap={1}
            >
              {pfp.profile.edit ? (
                <TextFieldElement
                  onChange={handleEdit}
                  // error={pfp.error.active}
                  // helperText={pfp.error.message}
                  value={pfp.profile.displayName}
                  label={""}
                  sx={{
                    ml: "120px",
                    width: "max-content",
                    color: "white",
                    "& .MuiOutlinedInput-input": {
                      color: theme.palette.text.primary,
                    },
                    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor: "grey !important",
                      },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey !important",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor: "grey !important",
                      },
                    marginBottom: "10px",
                  }}
                />
              ) : (
                <Typography
                  variant="h5"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {pfp.profile.displayName}
                </Typography>
              )}
              {pfp.profile.edit ? (
                <Stack direction={"row"} marginBottom={"10px"} gap={0}>
                  <PrimaryButton
                    onClick={() => {
                      dispatch(setDisplayName(pfp.profile.prevDisplayName));
                      dispatch(setEdit(false));
                    }}
                    color="error"
                    variant="text"
                    sx={{
                      color: theme.palette.error.main,
                      borderColor: "white",
                    }}
                  >
                    <CloseOutlined />
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={async () => {
                      const displayName = pfp.profile.displayName.trim();

                      // Empty check
                      if (!displayName) {
                        dispatch(setError("Minimum length is 3"));
                        return;
                      }

                      // Validation error exists
                      if (pfp.error.active) {
                        return;
                      }

                      try {
                        await changeDisplayNameApi({ displayName }).unwrap();

                        dispatch(
                          setModalState({ modal: "successEdit", value: true })
                        );
                        dispatch(setEdit(false));
                      } catch (error: any) {
                        dispatch(
                          showSnackbar({
                            message:
                              error?.data?.message ||
                              error?.error ||
                              "Something went wrong",
                            color: "error",
                          })
                        );
                      }
                    }}
                    variant="text"
                    color="success"
                    sx={{
                      color: theme.palette.success.main,
                      borderColor: "white",
                    }}
                  >
                    {nameChangeLoading ? <CustomCircularProgress  size={20}/> : <Check />}
                  </PrimaryButton>
                </Stack>
              ) : (
                <IconButton
                  onClick={() => {
                    //   setPrevDisplayName(displayName);
                    // dispatch(setDisplayName(pfp.profile.displayName));
                    dispatch(setPrevDisplayName(pfp.profile.displayName));
                    dispatch(setEdit(true));
                  }}
                >
                  <DriveFileRenameOutline
                    sx={{ color: theme.palette.text.primary }}
                  />
                </IconButton>
              )}
            </Stack>
            <Typography color="textSecondary">{pfp.profile.email}</Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default ProfileHeader;
