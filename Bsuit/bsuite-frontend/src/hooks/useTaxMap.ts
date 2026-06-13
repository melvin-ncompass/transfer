import { useMemo } from "react";
import { useAllAccountOptions } from "../features/books/transact/transactHome/hooks/useAllAccountOptions";

type TaxMeta = {
  name: string;
  rate: number;
};

export function useTaxMap() {
  const { taxesData: tData} = useAllAccountOptions();

  return useMemo<Map<string, TaxMeta>>(() => {
    const taxes = tData?.data || [];

    return new Map(
      taxes.map((t: any) => [
        String(t.id),
        {
          name: t.taxName,
          abbreviation: t.abbreviation,
          rate: Number(t.taxRate),
        },
      ])
    );
  }, [tData]);
}
