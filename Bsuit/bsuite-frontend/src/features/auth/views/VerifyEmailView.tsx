import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { PrimaryButton } from "../../../components/atom/button";
import { Error, Verified } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  useResendEmailMutation,
  useVerifyEmailMutation,
} from "../api/auth.api";
import { goToLogin, setEmail, showSnackbar } from "../authSlice";
import { useAppDispatch } from "../../../store/store";
import CustomCircularProgress from "../../../components/atom/circular-progress/CircularProgress";

function VerifyEmailView() {
  const { token } = useParams();
  const dispatch = useAppDispatch();
  const [verifyEmail, { isSuccess, isError, isLoading }] =
    useVerifyEmailMutation();
  const [resendEmail] = useResendEmailMutation();
  const [verified, setverified] = useState(false);
  useEffect(() => {
    if (token) {
      verifyEmail(token)
        .unwrap()
        .then((res) => {
          // The email is inside res.data.email
          setverified(true);
          dispatch(setEmail(res.data.email));
          dispatch(
            showSnackbar({
              message: "Your email has been verified successfully",
              color: "success",
            }),
          );
        })
        .catch((e: any) => {
          dispatch(showSnackbar({ message: e.data.message, color: "error" }));

          console.log("Verification failed");
        });
    }
  }, [token]);

  // const fullText =
  //   "\u00A0 A single place where you can handle all your accounting business stuff and human resource management.";
  const navigate = useNavigate();
  return !isLoading ? (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box
        sx={{
          width: {
            xs: "0%",
            sm: "40%",
            md: "60%",
          },
          display: {
            xs: "none",
            sm: "flex",
          },
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
          p: 4,
          backgroundColor: "#eeededff",
          boxShadow: "inset 0 5px 70px #0000001a",
          overflowY: "auto",
        }}
      >
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Typography variant="h3" color="primary.main">
            Welcome to BSuite
          </Typography>

          {/* <Typography
            variant="h6"
            color="primary.main"
            sx={{
              mt: 2,
              maxWidth: 700,
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              display: {
                xs: "none",
                sm: "none",
                md: "block",
              },
            }}
          >
            {fullText}
          </Typography> */}
        </motion.div>
      </Box>

      <Box
        sx={{
          width: {
            xs: "100%",
            sm: "60%",
            md: "40%",
          },
          display: "flex",
          justifyContent: "center",
          overflowY: "hidden",
          mt: 1,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            height: "270px",
            padding: "32px 28px",
            marginTop: 140,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, color: "#1A1A1A", lineHeight: 1.5 }}
          >
            {verified
              ? "Your email has been verified successfully"
              : "There was an error verifying your email. Try resending verification email"}
            {/* Your email has been {verified ? "verified" : "unverified"} successfully!{" "} */}
            {verified ? (
              <Verified color="success" style={{ verticalAlign: "middle" }} />
            ) : (
              <Error color="error" style={{ verticalAlign: "middle" }} />
            )}
          </Typography>

          {verified && (
            <Typography
              variant="body1"
              sx={{ color: "#555", mb: 3, lineHeight: 1.6 }}
            >
              You can now sign in to your account and continue.
            </Typography>
          )}

          <PrimaryButton
            onClick={async () => {
              if (verified) {
                dispatch(goToLogin());
                navigate("/login");
              } else {
                console.log(verified);
                try {
                  const res = await resendEmail(token!).unwrap();
                  console.log("Resend Verification Email", res);
                } catch (error: any) {
                  console.log("error Verification Email", error.data.message);
                  dispatch(
                    showSnackbar({
                      message: error.data.message,
                      color: "error",
                    }),
                  );
                }
              }
            }}
            fullWidth
          >
            {verified ? "Back to Sign In" : "Resend Verification Email"}
          </PrimaryButton>
        </div>
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CustomCircularProgress />
    </Box>
  );
}

export default VerifyEmailView;
