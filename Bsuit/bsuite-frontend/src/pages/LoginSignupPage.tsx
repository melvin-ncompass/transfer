import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import LoginSignUp from "../features/auth/views/LoginSignupView";


function LoginSignupPage() {
 return (
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
        <LoginSignUp />
      </Box>
    </Box>
  );
}

export default LoginSignupPage;
