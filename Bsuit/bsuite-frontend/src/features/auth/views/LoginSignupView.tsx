import { Snackbar } from "../../../components/atom/snackbar";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import { closeSnackbar } from "../authSlice";
import LoginSide from "../Login/components/LoginSide";
import SignUpSide from "../Login/components/SignUpSide";
import { useOAuthReturnNotify } from "../hooks/useOAuthReturnNotify";

export default function LoginSignupView() {
  const { isFlipped, snackbar } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  /** Google OAuth may redirect here before navigating into Layout — still broadcast session replacement. */
  useOAuthReturnNotify();

  return (
    <>
      <div style={{ perspective: "1000px", width: "100%", maxWidth: 420 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            transformStyle: "preserve-3d",
            transition: "transform 0.7s",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <LoginSide />
          <SignUpSide />
        </div>
      </div>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => dispatch(closeSnackbar())}
          autoClose={3000}
        />
      )}
    </>
  );
}
