import React from "react";
import { Button, Container, Typography, Paper } from "@mui/material";
import { FaGithub } from "react-icons/fa";


const Login: React.FC = () => {
  const handleLogin = async () => {
    const data = await fetch("http://localhost:3000/auth/github/login");
    const res = await data.json()
    console.log(res);
    window.location.href = res.gitHub_OAuth_URL;
  };

  return (

    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          textAlign: "center",
          borderRadius: 3,
          bgcolor: "#161B22",
          color: "#C9D1D9",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          mb={3}
          sx={{ color: "#C9D1D9" }}
        >
          Sign in to Mindmap
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleLogin}
          sx={{
            py: 1.5,
            bgcolor: "#238636",
            "&:hover": { bgcolor: "#2EA043" },
            fontWeight: "bold",
            color: "#fff",
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          <FaGithub fontSize={20} style={{ marginRight: 8 }} />
          Login with GitHub
        </Button>
      </Paper>
    </Container>
  );
};

export default Login;
