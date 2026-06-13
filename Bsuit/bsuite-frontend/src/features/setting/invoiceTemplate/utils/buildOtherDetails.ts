import type { IOtherDetailsState, IIdentityField } from "../types/otherDetails";

export const buildOtherDetails = (state: IOtherDetailsState) => {
  // Build bankDetails with only checked values
  const bankDetails: IOtherDetailsState["bankDetails"] = {
    bankName: state.bankDetails.bankName.checked
      ? state.bankDetails.bankName
      : { ...state.bankDetails.bankName, value: "" },
    accountName: state.bankDetails.accountName.checked
      ? state.bankDetails.accountName
      : { ...state.bankDetails.accountName, value: "" },
    accountNumber: state.bankDetails.accountNumber.checked
      ? state.bankDetails.accountNumber
      : { ...state.bankDetails.accountNumber, value: "" },
    ifscCode: state.bankDetails.ifscCode.checked
      ? state.bankDetails.ifscCode
      : { ...state.bankDetails.ifscCode, value: "" },
    branch: state.bankDetails.branch.checked
      ? state.bankDetails.branch
      : { ...state.bankDetails.branch, value: "" },
    swiftCode: state.bankDetails.swiftCode.checked
      ? state.bankDetails.swiftCode
      : { ...state.bankDetails.swiftCode, value: "" },
  };

  // Flatten checked identity fields
  const identityFields: IIdentityField[] = state.identityFields.filter(
    (field) => field.checked
  );

  return {
    showBankDetails: state.showBankDetails,
    bankDetails,
    showIdentity: state.showIdentity,
    identityFields,
  };
};