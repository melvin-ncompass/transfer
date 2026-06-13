export interface IContactRegister {
  name: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dialCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  pan: string;
  gstin: string;
  economicTerritory: string;
  isOrganization: boolean;
  tdsPrefillValue: number;
}

export interface IContactResponse extends IContactRegister {
  id: number;
  userBalance: number;
  isArchived: boolean;
  showInReports: boolean;
  contactBalance?: number;
}

export interface IAllContactResponse {
  message: string;
  data: IContactResponse[];
}

export interface IFormType {
  name: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dialCode: string;
  countryCode?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  pan: string;
  gstin: string;
  economicTerritory: string;
  tdsPrefillValue: string;
  isOrganization: boolean;
}
