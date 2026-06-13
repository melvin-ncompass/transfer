import {
  Box,
  Typography,
  Stack,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { useState } from "react";
import {
  SecondaryButton,
  PrimaryButton,
} from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import OTPInput from "../components/OTPInput";
import {
  useTwoFactorSetupMutation,
  useTwoFactorVerifyMutation,
  useTwoFactorDisableMutation,
} from "../../api/auth.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import { setError } from "../profileSlice";

function TwoFactorModal({
  onError,
  onNext,
  onBack,

  onSave,
  enable,
}: {
  onError: (s: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSave: () => void;
  enable: boolean;
}) {
  const [part, setPart] = useState(0);
  // const pfp = useAppSelector((state) => state.profile);
  const [qr, setQr] = useState("");
  const [question1, setquestion1] = useState("");
  const [question2, setquestion2] = useState("");
  const [question3, setquestion3] = useState("");
  const [otp, setOtp] = useState("");
  const [twoFactorSetupApi, { isLoading: TwoFASetupLoading }] =
    useTwoFactorSetupMutation();
  const [twoFactorVerifyApi, { isLoading: TwoFAVerifyLoading }] =
    useTwoFactorVerifyMutation();
  const [twoFactorDisableApi, { isLoading: TwoFADisableLoading }] =
    useTwoFactorDisableMutation();
  const steps = ["Setup Security Question", "Enable Two Factor Authentication"];
  const dispatch = useAppDispatch();
  return (
    <Box>
      {enable ? (
        <Box>
          <Box py={"10px"} mb={"20px"}>
            <Stepper activeStep={part}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          {part == 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              gap={2}
              alignItems="start"
            >
              {/* <Typography>Enter your recovery questions</Typography> */}
              {/* Question 1 */}
              <TextFieldElement
                value={question1}
                onChange={(e) => {
                  setquestion1(e.target.value);
                }}
                fullWidth
                label="What is your nickname?"
                required
              />
              {/* {oldError && <Typography color="error">{oldError}</Typography>} */}

              {/* Question 2 */}
              <TextFieldElement
                value={question2}
                onChange={(e) => {
                  setquestion2(e.target.value);
                }}
                fullWidth
                label="What's your favourite colour?"
                required
              />
              {/* {newError && <Typography color="error">{newError}</Typography>} */}

              {/* Question 3 */}
              <TextFieldElement
                value={question3}
                onChange={(e) => {
                  setquestion3(e.target.value);
                }}
                fullWidth
                label="What's your school name?"
                required
              />
            </Box>
          ) : (
            <Box
              display={"flex"}
              flexDirection={"column"}
              width={"100%"}
              alignItems={"center"}
            >
              {/* <Typography variant="h6">
                Enable Two Factor Authentication
              </Typography> */}
              <Typography width={"70%"} textAlign={"center"}>
                Scan the below QR Code using the Authenticator App and enter the
                OTP
              </Typography>
              <Box
                height="215px"
                width="215px"
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={
                  qr
                    ? {
                        backgroundImage: `url(${qr})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }
                    : {
                        backgroundColor: "grey",
                      }
                }
              >
                {!qr && "Enter QR here"}
              </Box>

              <Typography variant="body1" marginTop={"10px"}>
                Enter OTP
              </Typography>
              <OTPInput setOTP={setOtp} />
            </Box>
          )}

          {/* BUTTONS */}
          <Stack
            direction="row"
            justifyContent="end"
            width="100%"
            gap={1}
            marginTop={"10px"}
          >
            {part != 0 && (
              <SecondaryButton
                onClick={() => {
                  setPart(0);
                  onBack();
                }}
              >
                Back
              </SecondaryButton>
            )}
            <PrimaryButton
              onClick={
                part === 0
                  ? async () => {
                      try {
                        const recQuestion = {
                          nickName: question1,
                          color: question2,
                          schoolName: question3,
                        };

                        const res =
                          await twoFactorSetupApi(recQuestion).unwrap();

                        // res IS the data
                        onNext();
                        setQr(res.data.qrCode);
                        setPart(1);
                      } catch (err: any) {
                        onError(err?.data?.message || "Failed to setup 2FA");
                      }
                    }
                  : async () => {
                      try {
                        const res = await twoFactorVerifyApi({
                          code: Number(otp),
                        }).unwrap();

                        // res IS the data
                        onSave();
                      } catch (err: any) {
                        onError(err?.data?.message || "Failed to verify 2FA");
                      }
                    }
              }
              disabled={
                part === 0
                  ? !question1 || !question2 || !question3
                  : otp.length < 5
              }
            >
              {part == 0
                ? TwoFASetupLoading
                  ? "Setting up..."
                  : "Next"
                : TwoFAVerifyLoading
                  ? "Verifying..."
                  : "Save"}
            </PrimaryButton>
          </Stack>
        </Box>
      ) : (
        <Box
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
          gap={2}
        >
          <Typography>Enter Two Factor Authentication Token</Typography>
          <OTPInput setOTP={setOtp} />
          <Stack direction="row" justifyContent="end" width="100%" gap={1}>
            {/* <SecondaryButton onClick={onSave}>Cancel</SecondaryButton> */}
            <PrimaryButton
              onClick={async () => {
                try {
                  const res = await twoFactorDisableApi({
                    code: Number(otp),
                  }).unwrap();

                  onSave();
                } catch (err: any) {
                  dispatch(
                    setError(err?.data?.message || "Failed to disable 2FA")
                  );
                }
              }}
              disabled={otp.length < 5}
            >
              {TwoFADisableLoading ? "Disabling..." : "Disable"}
            </PrimaryButton>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default TwoFactorModal;
