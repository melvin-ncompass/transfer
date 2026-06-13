import { useCallback } from 'react';
import { SelectionMode } from '../overview-view';

type Ward = {
  id: string;
  subcountyId: string;
};

type UseLocationHandlersProps = {
  setCounty: (value: string | ((prev: string) => string)) => void;
  setWard: (value: string) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  isPopulationMode: boolean;
  wards: Ward[];
};

export function useLocationHandlers({
  setCounty,
  setWard,
  setSelectionMode,
  isPopulationMode,
  wards,
}: UseLocationHandlersProps) {
  // -------- Subcounty --------
  const handleCountyChange = useCallback(
    (subcountyId: string) => {
      // Clear ward selection when selecting a subcounty
      setWard('');
      // Set the new subcounty (this will clear previous subcounty selection)
      setCounty(subcountyId);

      if (isPopulationMode) {
        setSelectionMode(SelectionMode.SUBCOUNTY);
      }
    },
    [isPopulationMode, setCounty, setWard, setSelectionMode]
  );

  // -------- Ward --------
  const handleWardChange = useCallback(
    (wardId: string) => {
      if (!wardId) {
        setWard('');
        setSelectionMode(SelectionMode.SUBCOUNTY);
        return;
      }

      // Clear previous ward selection by setting new one
      setWard(wardId);

      const parentSubcounty = wards.find((w) => w.id === wardId)?.subcountyId;

      if (parentSubcounty) {
        // Only set county if not already set, to avoid clearing it unnecessarily
        setCounty((prev) => prev || parentSubcounty);
      }

      if (isPopulationMode) {
        setSelectionMode(SelectionMode.WARD);
      }
    },
    [wards, isPopulationMode, setWard, setCounty, setSelectionMode]
  );

  return {
    handleCountyChange,
    handleWardChange,
  };
}
