import { TdsType } from "../enum/transact.enum";

export type TaxType = "percent" | "value";

export interface AggregatedTax {
  taxId: number;
  taxName: string;
  abbreviation: string;
  type: TaxType;
  rateOrValue: number;
  totalAmount: number;
}

export interface AggregatedTds {
  type: TdsType;
  rateOrValue: number;
  totalAmount: number;
}
