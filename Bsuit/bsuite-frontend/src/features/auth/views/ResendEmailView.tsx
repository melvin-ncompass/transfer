import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { PrimaryButton } from "../../../components/atom/button";
import { SentimentVeryDissatisfied } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useResendEmailMutation } from "../api/auth.api";

function ResendEmailView() {
  const {token} = useParams();
  const [ resendEmail ] = useResendEmailMutation();
  // const fullText =
  //   "\u00A0 A single place where you can handle all your accounting business stuff and human resource management.";
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
  {/* LEFT PANEL */}
  <Box
    sx={{
      flexShrink: 0,
      width: {
        xs: "0%",      
        sm: "40%",     
        md: "55%",     
        lg: "60%",     
      },
      display: {
        xs: "none",
        sm: "flex",
      },
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      textAlign: "center",
      p: { xs: 2, sm: 4 },
      backgroundColor: "#eeededff",
      boxShadow: "inset 0 5px 70px #0000001a",
      overflowY: "auto",
    }}
  >
    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Typography variant="h3" color="primary.main">
        Welcome to BSuite
      </Typography>

      {/* <Typography
        variant="h6"
        color="primary.main"
        sx={{
          mt: 2,
          maxWidth: 600,
          display: { xs: "none", md: "block" },
          opacity: { xs: 0, md: 1 },
          transition: "opacity 0.3s ease",
        }}
      >
        {fullText}
      </Typography> */}
    </motion.div>
  </Box>

  {/* RIGHT PANEL */}
  <Box
    sx={{
      width: {
        xs: "100%",
        sm: "60%",
        md: "45%",
        lg: "40%",
      },
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      overflowY: "hidden",
      mt: { xs: 4, sm: 6 },
    }}
  >
    <div
      style={{
        maxWidth: 420,
        width: "100%",
        padding: "32px 28px",
        marginTop: 80,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
        transition: "all 0.3s ease",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ mb: 2, color: "#1A1A1A", lineHeight: 1.5 }}
      >
        Oops! Your token has expired
        <SentimentVeryDissatisfied
          sx={{ ml: 1, verticalAlign: "middle", opacity: 0.8 }}
        />
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: "#555", mb: 3, lineHeight: 1.6 }}
      >
        Please click the button below to resend the verification email.
      </Typography>

      <PrimaryButton fullWidth onClick={()=>resendEmail(token || "").then(()=>{
        console.log("Resend email request sent"); 
      })}>
        Resend Verification Email
      </PrimaryButton>
    </div>
  </Box>
</Box>

  );
}

export default ResendEmailView;
