import { Paper } from "@mui/material";
import SecurityQuestions from "./SecurityQuestions";
import TwoFA from "./TwoFA";
import LoginForm from "./LoginForm";
import ForgotPassword from "./ForgetPassword";
import { useAppSelector } from "../../../../store/store";

export default function LoginSide() {


  const { isForgotOpen, isSecurityOpen, step } = useAppSelector(
    (state) => state.auth
  );


  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        width: "100%",
        padding: 4,
        borderRadius: 3,
        backfaceVisibility: "hidden",
        overflow: "hidden",
      }}
    >
      {/* --------------- SECURITY QUESTIONS ---------------- */}
      {isSecurityOpen ? (
        <SecurityQuestions />
      ) : isForgotOpen ? (
        /* --------------- FORGOT PASSWORD ---------------- */
        <ForgotPassword />
      ) : step === "2fa" ? (
        /* --------------- TWO FACTOR AUTH ---------------- */
        <TwoFA />
      ) : (
        /* --------------- LOGIN FORM ---------------- */
        <LoginForm />
      )}
    </Paper>
  );
}
