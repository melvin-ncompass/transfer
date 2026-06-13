import { ConfirmDialog } from "../../../../components/dialogs/confirm-dialog";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { ImageCropper } from "./ImageUploader";
import ChangePassword from "../modals/ChangePassword";
import TwoFactorModal from "../modals/TwoFactorModal";
import {
  setPfp,
  setModalState,
  setTwoFASlide,
  setTwoFA,
  clearError,
  setSessions,
  setError,
} from "../profileSlice";
import { useDispatch } from "react-redux";
import { Snackbar } from "../../../../components/atom/snackbar";
import { useAppSelector } from "../../../../store/store";
import {
  useGetDetailsQuery,
  useLogoutOfAllSessionsMutation,
  useRemoveProfilePicMutation,
} from "../../api/profile.api";
import { useNavigate } from "react-router-dom";
import { goToLogin } from "../../authSlice";

function ProfileModals() {
  const [removePfpPic, { isLoading: deletePicLoading }] =
    useRemoveProfilePicMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pfp = useAppSelector((state) => state.profile);
  const [logoutAllSessionsApi] = useLogoutOfAllSessionsMutation();
  const { refetch } = useGetDetailsQuery();

  return (
    <>
      <ModalElement
        title="Profile Picture Uploader"
        maxWidth="md"
        open={pfp.modals.pfpModal}
        onClose={() =>
          dispatch(setModalState({ modal: "pfpModal", value: false }))
        }
      >
        <ImageCropper
          onCropComplete={(file: string) => {
            dispatch(setPfp(file));
            dispatch(setModalState({ modal: "pfpUpdate", value: true }));
            dispatch(setModalState({ modal: "pfpModal", value: false }));
          }}
        />
      </ModalElement>

      <ConfirmDialog
        open={pfp.modals.deleteModal}
        onClose={() =>
          dispatch(setModalState({ modal: "deleteModal", value: false }))
        }
        onConfirm={async () => {
          const res = await removePfpPic();
          dispatch(setPfp(""));
          dispatch(setModalState({ modal: "pfpRemove", value: true }));
          dispatch(setModalState({ modal: "deleteModal", value: false }));
        }}
        confirmText={deletePicLoading ? "Deleting..." : "Delete"}
        confirmColor="error"
        title="Delete Profile Picture"
        message="Are you sure you want to delete profile picture ?"
      />

      <ConfirmDialog
        open={pfp.modals.logoutAllModal}
        onClose={() =>
          dispatch(setModalState({ modal: "logoutAllModal", value: false }))
        }
        onConfirm={async () => {
          await logoutAllSessionsApi().unwrap();

          const refreshed = await refetch(); // fetch latest sessions
          dispatch(setSessions(refreshed.data?.data.sessions));

          dispatch(setModalState({ modal: "sessionDeleted", value: true }));
          dispatch(setModalState({ modal: "logoutAllModal", value: false }));
        }}
        title="Sign out of all sessions?"
        message="This will sign you out from all other devices."
        confirmText="Sign Out All"
        confirmColor="error"
      />

      <ModalElement
        title="Change Password"
        open={pfp.modals.changePasswordModal}
        onClose={() =>
          dispatch(
            setModalState({ modal: "changePasswordModal", value: false })
          )
        }
      >
        <ChangePassword
          onCancel={() =>
            dispatch(
              setModalState({ modal: "changePasswordModal", value: false })
            )
          }
          onSave={() => {
            dispatch(goToLogin());
            navigate("/login");
            dispatch(
              setModalState({ modal: "changePasswordModal", value: false })
            );
          }}
        />
      </ModalElement>

      <ModalElement
        title={
          !pfp.twoFa
            ? pfp.twoFASlide === 0
              ? "Enter Your Recovery Questions"
              : "Enable two factor authentication"
            : "Disable two factor authentication"
        }
        open={pfp.modals.twoFAModal}
        onClose={() =>
          dispatch(setModalState({ modal: "twoFAModal", value: false }))
        }
      >
        <TwoFactorModal
          enable={!pfp.twoFa}
          onBack={() => dispatch(setTwoFASlide(0))}
          onNext={() => dispatch(setTwoFASlide(1))}
          onError={(error: string) => dispatch(setError(error))    }
          onSave={() => {
            pfp.twoFa
              ? dispatch(
                  setModalState({ modal: "twofactorDisabled", value: true })
                )
              : dispatch(
                  setModalState({ modal: "twofactorEnabled", value: true })
                );
            dispatch(setTwoFA(!pfp.twoFa));
            dispatch(setModalState({ modal: "twoFAModal", value: false }));
          }}
        />
      </ModalElement>

      {pfp.modals.successEdit && (
        <Snackbar
          message="Display Name Updated Successfully"
          color="success"
          onClose={() =>
            dispatch(setModalState({ modal: "successEdit", value: false }))
          }
        />
      )}
      {pfp.error.active && (
        <Snackbar
          message={pfp.error.message}
          color="error"
          onClose={() => dispatch(clearError())}
        />
      )}
      {pfp.modals.pfpUpdate && (
        <Snackbar
          message="Profile Picture Update Successfully"
          color="success"
          onClose={() =>
            dispatch(setModalState({ modal: "pfpUpdate", value: false }))
          }
        />
      )}
      {pfp.modals.passwordChanged && (
        <Snackbar
          message="Password Changed Successfully"
          color="success"
          onClose={() =>
            dispatch(setModalState({ modal: "passwordChanged", value: false }))
          }
        />
      )}
      {pfp.modals.twofactorEnabled && (
        <Snackbar
          color="success"
          message="Two Factor Authentication Enabled Successfully"
          onClose={() =>
            dispatch(setModalState({ modal: "twofactorEnabled", value: false }))
          }
        />
      )}
      {pfp.modals.twofactorDisabled && (
        <Snackbar
          color="success"
          message="Two Factor Authentication Disabled Successfully"
          onClose={() =>
            dispatch(
              setModalState({ modal: "twofactorDisabled", value: false })
            )
          }
        />
      )}
      {pfp.modals.sessionDeleted && (
        <Snackbar
          color="success"
          message="Session Deleted Successfully"
          onClose={() =>
            dispatch(setModalState({ modal: "sessionDeleted", value: false }))
          }
        />
      )}
      {pfp.modals.pfpRemove && (
        <Snackbar
          color="success"
          message="Profile Picture Removed Successfully"
          onClose={() =>
            dispatch(setModalState({ modal: "pfpRemove", value: false }))
          }
        />
      )}
    </>
  );
}

export default ProfileModals;
