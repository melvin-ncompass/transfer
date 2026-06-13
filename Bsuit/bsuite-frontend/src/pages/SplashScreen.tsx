import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetDetailsQuery } from "../features/auth/api/profile.api";
import { Box } from "@mui/material";
import CustomCircularProgress from "../components/atom/circular-progress/CircularProgress";

function SplashScreen() {
  const { data, error, isError } = useGetDetailsQuery();
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      navigate("/profile");
      return;
    }

    if (isError) {
      if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status: number }).status;
        if (status === 401) {
          navigate("/login");
        } else {
          throw error;
        }
      }
    }
  }, [data, isError, error, navigate]);
  return (
    <Box
      height={"100vh"}
      width={"100vw"}
      bgcolor={"white"}
      justifyContent={"center"}
      alignItems={"center"}
      display={"flex"}
    >
      <CustomCircularProgress />
    </Box>
  );
}

export default SplashScreen;
