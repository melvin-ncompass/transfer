export interface ITableProperties {
  checked: boolean;
  width: number;
  label: string;
}

export interface ITable {
  lineItemNo: ITableProperties;
  item: ITableProperties;
  quantity: ITableProperties;
  rate: ITableProperties;
  taxAmount: ITableProperties;
  amount: ITableProperties;
}
