import { useMemo } from 'react';
import { normalizeCountyLabel } from '../../../../../src/utils/location-normalize';

type ApiWard = {
  wardId: string;
  wardName: string;
};

type ApiSubcounty = {
  subcountyId: string;
  subcountyName: string;
  wards: ApiWard[];
};

type ApiCountyResponse = {
  countyId: string;
  countyName: string;
  subcounties: ApiSubcounty[];
};

export function useLocationData({
  wardsData,
  // selectedSubcountyId,
}: {
  wardsData?: ApiCountyResponse;
  // selectedSubcountyId: string;
}) {
  const countyData = {label: normalizeCountyLabel(wardsData?.countyName), id: wardsData?.countyId};
  const subcounties = wardsData?.subcounties ?? [];

  const availableSubcounties = useMemo(
    () =>
      subcounties.map((sc) => ({
        id: sc.subcountyId,
        name: sc.subcountyName,
      })),
    [subcounties]
  );

  const availableWards = useMemo(() => {
    if (!subcounties.length) return [];

    // if (selectedSubcountyId) {
    //   const sc = subcounties.find(
    //     (s) => s.subcountyId === selectedSubcountyId
    //   );

    //   return (
    //     sc?.wards.map((w) => ({
    //       id: w.wardId,
    //       name: w.wardName,
    //       subcountyId: sc.subcountyId,
    //     })) ?? []
    //   );
    // }


    return subcounties.flatMap((sc) =>
      sc.wards.map((w) => ({
        id: w.wardId,
        name: w.wardName,
        subcountyId: sc.subcountyId,
      }))
    );
  }, [subcounties]);

  const hierarchyData = useMemo(
    () =>
      Object.fromEntries(
        subcounties.map((sc) => [
          sc.subcountyId,
          sc.wards.map((w) => ({
            id: w.wardId,
            name: w.wardName,
          })),
        ])
      ),
    [subcounties]
  );

  return {
    countyData,
    availableSubcounties,
    availableWards,
    hierarchyData,
  };
}
