import type { ICheckedTotal, ITotalValue } from "../types/total";

export const buildTotalDetails = (
  checked: ICheckedTotal,
  values: ITotalValue
) => {
  return Object.keys(checked)
    .filter((key) => checked[key as keyof ICheckedTotal])
    .map((key) => ({
      key,
      value: values[key as keyof ITotalValue] ?? null,
    }));
};
