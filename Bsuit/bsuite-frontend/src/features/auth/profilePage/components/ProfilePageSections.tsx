import { Box, Divider, Stack, Typography, useTheme } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { setModalState } from "../profileSlice";

function ProfilePageSections() {
  const pfp = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex:"1",
        // marginTop:"50px",
        padding: "20px",
        // border:`1px solid ${theme.palette.secondary.main}`,
        borderRadius:"4px",
        display:"flex",
        flexDirection:"column",
        justifyContent:"center",
          boxShadow:"0px 0px 4px grey",

        
      }}
    >
      <Typography variant="h5">
        Security
      </Typography>
     
      <Stack
        // direction={{ xs: "column", sm: "row" }}
        direction={"row"}
        alignItems={"center" }
        width={"100%"}
        my={"20px"}
        justifyContent={"space-between"}
      >
        <Typography variant="h6" >
          Change Password
        </Typography>
        <PrimaryButton
          
          onClick={() => {
            // setChangePasswordModal(true);
            dispatch(
              setModalState({ modal: "changePasswordModal", value: true })
            );
          }}
        >
          Change
        </PrimaryButton>
      </Stack>
      <Divider variant="fullWidth" sx={{ borderBottomWidth: "1px" }} />
      <Stack
        direction={"row"}
        alignItems={"center" }
        width={"100%"}
        my={"20px"}
        justifyContent={"space-between"}
      >
        <Typography variant="h6" sx={{}}>
          Two Factor Authentication
        </Typography>
        <PrimaryButton
          sx={{
            // marginTop: "20px",
            
            backgroundColor: !pfp.twoFa
              ? theme.palette.primary.main
              : theme.palette.error.main,
            color: "white",
          }}
          onClick={() => {
            // setTwoFAModal(true);
            dispatch(setModalState({ modal: "twoFAModal", value: true }));

          }}
        >
          {pfp.twoFa ? "Disable" : "Enable"}
        </PrimaryButton>
      </Stack>
      {/* <Divider variant="fullWidth" sx={{ borderBottomWidth: "1px" }} /> */}
    </Box>
  );
}

export default ProfilePageSections;
