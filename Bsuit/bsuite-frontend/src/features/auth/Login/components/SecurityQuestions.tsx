import { Button, Stack, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { useState } from "react";
import { closeSecurity, showSnackbar, setAccessToken, goToLogin } from "../../authSlice";
import { useVerifyTwoFAMutation, useSendRecoveryEmailMutation } from "../../api/auth.api";
import { useAppDispatch } from "../../../../store/store";
import { useNavigate } from "react-router-dom";
import { setSessionId } from "../../profilePage/profileSlice";
import { baseApi } from "../../../../api/base.api";
import { notifySessionReplaced } from "../../utils/sessionCrossTabSync";

export default function SecurityQuestions() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [verifyTwoFA, { isLoading }] = useVerifyTwoFAMutation();
  const [sendRecoveryEmail] = useSendRecoveryEmailMutation();
  const tempToken = sessionStorage.getItem("temp_token") ?? "";
  // Step-based questions
  const [questionStep, setQuestionStep] = useState(1);

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");

  const [errorText, setErrorText] = useState("");

  const tryDifferentQuestion = () => {
    setErrorText("");
    setQuestionStep((prev) => (prev === 3 ? 1 : prev + 1));
  };

  const handleDirectRecoveryEmail = async () => {
    try {
      await sendRecoveryEmail().unwrap();
      dispatch(
        showSnackbar({
          message: "Recovery email sent! Check your inbox.",
          color: "success",
        })
      );
    } catch (error: any) {
      dispatch(
        showSnackbar({
          message: error?.data?.message || "Failed to send recovery email.",
          color: "error",
        })
      );
    }
  };

  const verifyAnswer = async () => {
    if (!tempToken) {
      dispatch(
        showSnackbar({
          message: "Missing temporary token. Please sign in again.",
          color: "error",
        })
      );
      return navigate("/login");
    }

    let payload: {
      tempToken: string;
      method: string;
      nickName?: string;
      color?: string;
      schoolName?: string;
    } = {
      tempToken,
      method: "questions",
    };

    // Add ONLY the answered field
    if (questionStep === 1) {
      if (!answer1) return setErrorText("Answer is required.");
      payload.nickName = answer1;
    } else if (questionStep === 2) {
      if (!answer2) return setErrorText("Answer is required.");
      payload.color = answer2;
    } else if (questionStep === 3) {
      if (!answer3) return setErrorText("Answer is required.");
      payload.schoolName = answer3;
    }

    try {
      const res = await verifyTwoFA(payload).unwrap();

      const { accessToken, sessionId } = res.data;

      dispatch(setAccessToken(accessToken));
      dispatch(setSessionId(sessionId));
      // Invalidate cached profile data so ProtectedRoute refetches with the new token
      dispatch(baseApi.util.invalidateTags(["Profile"]));
      notifySessionReplaced(sessionId);
      // dispatch(goToLogin()); // Reset step to "login" for next time

      dispatch(
        showSnackbar({
          message: "Security question verified!",
          color: "success",
        })
      );

      dispatch(closeSecurity());
      navigate("/profile");      
    } catch (err: any) {
      const status = err?.status;
      const message = err?.data?.message;

      if (status === 401 && message !== "Incorrect answer") {
        dispatch(
          showSnackbar({
            message: "Temporary session expired. Please sign in again.",
            color: "error",
          })
        );

      }
      setErrorText(message || "Incorrect answer, please try again.");
    }
  };

  return (
    <Stack spacing={2}>
      <>
        {/* ---------- SECURITY QUESTION CARD ---------- */}
        <Typography variant="h6" textAlign="center">
          Security Questions
        </Typography>

          {/* QUESTION 1 */}
          {questionStep === 1 && (
            <>
              <TextFieldElement
                label="What is your nickname?"
                fullWidth
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                error={!!errorText}
                helperText={errorText}
              />

              <PrimaryButton
                fullWidth
                onClick={verifyAnswer}
                disabled={answer1.length < 1 || isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </PrimaryButton>

              {errorText && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",
                      color: "#474747ff",
                      fontSize: "14px",
                      "&:hover": {
                        color: "primary.main",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={tryDifferentQuestion}
                  >
                    Try with another question
                  </Typography>
                </div>
              )}
            </>
          )}

          {/* QUESTION 2 */}
          {questionStep === 2 && (
            <>
              <TextFieldElement
                label="What is your favourite colour?"
                fullWidth
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                error={!!errorText}
                helperText={errorText}
              />

              <PrimaryButton
                fullWidth
                onClick={verifyAnswer}
                disabled={answer2.length < 1 || isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </PrimaryButton>

              {errorText && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",
                      color: "#474747ff",
                      fontSize: "14px",
                      "&:hover": {
                        color: "primary.main",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={tryDifferentQuestion}
                  >
                    Try with another question
                  </Typography>
                </div>
              )}
            </>
          )}

          {/* QUESTION 3 */}
          {questionStep === 3 && (
            <>
              <TextFieldElement
                label="What is the name of your pet?"
                fullWidth
                value={answer3}
                onChange={(e) => setAnswer3(e.target.value)}
                error={!!errorText}
                helperText={errorText}
              />

              <PrimaryButton
                fullWidth
                onClick={verifyAnswer}
                disabled={answer3.length < 1 || isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </PrimaryButton>

              {errorText && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "pointer",
                      color: "#474747ff",
                      fontSize: "14px",
                      "&:hover": {
                        color: "primary.main",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={handleDirectRecoveryEmail}
                  >
                    Verify via Email
                  </Typography>
                </div>
              )}
            </>
          )}
        </>

      {/* Back button */}
      <Button variant="text" onClick={() => {
        dispatch(closeSecurity());
        dispatch(goToLogin());
      }}>
        Back to Sign In
      </Button>
    </Stack>
  );
}
