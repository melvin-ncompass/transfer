export interface IIdentityField {
  id: number;
  label: string;
  value: string;
  checked: boolean;
}

export interface IIdentityDetailsState {
  showIdentity: boolean;
  identityFields: Record<number, IIdentityField>;
}
