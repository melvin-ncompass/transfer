export interface IBankField {
  checked: boolean;
  label: string;
  value: string;
}

export interface IIdentityField {
  id: number;
  label: string;
  value: string;
  checked: boolean;
}

export interface IOtherDetailsState {
  showBankDetails: boolean;
  showIdentity: boolean;
  bankDetails: {
    bankName: IBankField;
    accountName: IBankField;
    accountNumber: IBankField;
    ifscCode: IBankField;
    branch: IBankField;
    swiftCode: IBankField;
  };
  identityFields: IIdentityField[] ;
}
