
export interface CalculatedAmounts {
  baseAmount: string;
  accountAmount: string;
  counterAmount: string;

  accountCurrency: string;
  counterCurrency: string;

  accountExchangeRate: number;
  accountOriginalExchangeRate: number;

  counterExchangeRate: number;
  counterOriginalExchangeRate: number;
}
