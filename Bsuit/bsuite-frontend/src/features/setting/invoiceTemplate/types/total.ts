export interface ICheckedTotal {
  subTotal: boolean;
  discount: boolean;
  sampleTax: boolean;
  total: boolean;
  paymentMade: boolean;
  balanceDue: boolean;
  amountInWords: boolean;
  tds: boolean;
}

export interface ITotalValue {
  subTotal: number;
  discount: number;
  sampleTax: number;
  total: number;
  paymentMade: number;
  balanceDue: number;
  tds: number;
}

export interface ITotal {
  checkedTotal: ICheckedTotal;
  value: ITotalValue;
}
