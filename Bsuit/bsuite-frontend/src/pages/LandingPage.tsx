import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

function LandingPage() {
  // const fullText =
  //   "\u00A0 A single place where you can handle all your accounting business stuff and human resource management.";

  return (
    <Box
      sx={{
        width: "100%",
        display: {
          xs: "none",
          sm: "flex",
        },
        height:"100vh",
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
  );
}

export default LandingPage;
