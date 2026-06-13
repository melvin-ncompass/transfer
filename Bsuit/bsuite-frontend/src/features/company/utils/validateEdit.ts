import type { Dispatch, SetStateAction } from "react";

interface ValidateParams {
  companyName: string;
  companyShortName: string;
  setErrors: Dispatch<
    SetStateAction<{
      companyName?: string;
      companyShortName?: string;
    }>
  >;
}

export const validateEdit = ({
  companyName,
  companyShortName,
  setErrors,
}: ValidateParams) => {
  const newErrors: { companyName?: string; companyShortName?: string } = {};

  if (!companyName) newErrors.companyName = "Company Name is required";
  else if (companyName.length < 3)
    newErrors.companyName = "Company Name must be at least 3 characters";
  else if (companyName.length > 100)
    newErrors.companyName = "Company Name cannot exceed 100 characters";

  if (!companyShortName) newErrors.companyShortName = "Short Name is required";
  else if (companyShortName.length < 1)
    newErrors.companyShortName = "Short Name must have at least 1 character";
  else if (companyShortName.length > 100)
    newErrors.companyShortName = "Short Name cannot exceed 100 characters";

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};
