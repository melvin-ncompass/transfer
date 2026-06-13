import type { Dispatch, SetStateAction } from "react";


interface ValidateParams {
  companyName: string;
  companyShortName: string;
  reportingCurrency: string;
  setErrors: Dispatch<SetStateAction<{
    companyName?: string;
    companyShortName?: string;
    currency?: string;
  }>>;
}

export const validateSave = ({
  companyName,
  companyShortName,
  reportingCurrency,
  setErrors,
}: ValidateParams) => {
  const newErrors: {
    companyName?: string;
    companyShortName?: string;
    currency?: string;
  } = {};

  if (!companyName) newErrors.companyName = "Company Name is required";
  else if (companyName.length < 3)
    newErrors.companyName = "Company Name must be at least 3 characters";
  else if (companyName.length > 100)
    newErrors.companyName = "Company Name cannot exceed 100 characters";

  if (!companyShortName) newErrors.companyShortName = "Company Short Name is required";
  else if (companyShortName.length < 1)
    newErrors.companyShortName = "Short Name must have at least 1 character";
  else if (companyShortName.length > 100)
    newErrors.companyShortName = "Short Name cannot exceed 100 characters";

  if (!reportingCurrency.trim()) newErrors.currency = "Currency is required";

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};
