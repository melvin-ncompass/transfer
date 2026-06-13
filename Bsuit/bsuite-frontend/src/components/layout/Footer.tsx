import { Box, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";

function Footer() {
  const theme = useTheme();
  return (
    <Box
      // sx={{
      //   backgroundColor: "white",
      //   // boxShadow:"0px -2px 2px grey",
      //   position: "absolute",
      //   bottom: 0,
      //   left: 0,
      //   // right: 0,
      //   // height: "8vh",
      //   // Ensure it stays above page content & drawer
      //   zIndex: 1200,
      //   // marginTop: "20px",
      //   display: "flex",
      //   width: "100%",
      //   justifyContent: "center",
      //   padding: "10px",
      // }}
      sx={{
        backgroundColor: "white",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "10px",
        borderTop: `1px solid ${theme.palette.divider}`,
        flexShrink: 0, // important
      }}
    >
      <Box display={"flex"} alignItems={"center"} minWidth={400}>
        <Typography
          sx={{ color: theme.palette.secondary.main, fontSize: "12px" }}
          // variant="subtitle2"
        >
          Copyright © {new Date().getFullYear()}
        </Typography>
        <Link
          component={RouterLink}
          to="https://ncompass.inc/"
          target="_blank"
          sx={{
            all: "unset",

            marginLeft: "10px",
            "&:hover": {
              color: theme.palette.primary.main,
              cursor: "pointer",
            },
          }}
        >
          <Typography
            // variant="subtitle2"

            sx={{
              color: theme.palette.secondary.main,
              fontSize: "12px",
              ":hover": {
                color: theme.palette.primary.main,
                cursor: "pointer",
              },
            }}
          >
            NCompass Techstudio Pvt. Ltd.
          </Typography>
        </Link>
        <Typography
          sx={{
            fontSize: "13px",
            color: theme.palette.secondary.main,
            ml: 1,
          }}
        >
          {" "}
          All Rights Reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
