// src/components/OtherDetails.tsx
import { useEffect } from "react";
import { Box, Checkbox, TextField, Typography, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../../store/store";
import {
  toggleShowBankDetails,
  toggleBankField,
  updateBankField,
  toggleShowIdentity,
  setIdentityFields,
  toggleIdentityField,
} from "../../slice/otherDetailsSlice";
import { useGetIdentityQuery } from "../../../companyIdentity/components/identity.api";

export default function OtherDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const { showBankDetails, showIdentity, bankDetails, identityFields } =
    useSelector((state: RootState) => state.invoice.otherDetails);

  const { data: identityData } = useGetIdentityQuery(undefined, {
    skip: identityFields.length > 0,
  });

  // Populate identity fields from API
  useEffect(() => {
    if (identityData?.metadata) {
      const identityArray = identityData.metadata.map(
        (f: any, index: number) => ({
          id: f.id ?? index,
          label: f.label,
          value: f.value ?? "",
          checked: true,
        }),
      );
      dispatch(setIdentityFields(identityArray));
    }
  }, [identityData, dispatch]);

  return (
    <Stack spacing={1}>
      {/* -------------------- Bank Details -------------------- */}
      <Box display="flex" alignItems="center">
        <Checkbox
          checked={showBankDetails}
          onChange={() => dispatch(toggleShowBankDetails())}
        />
        <Typography fontWeight="bold">Show Bank Details</Typography>
      </Box>

      {showBankDetails &&
        (Object.keys(bankDetails) as Array<keyof typeof bankDetails>).map(
          (key) => {
            const field = bankDetails[key];
            return (
              <Box
                key={key}
                display="grid"
                gridTemplateColumns="40px 1fr 1fr"
                gap={2}
                alignItems="center"
                pl={2}
                pb={2}
              >
                <Checkbox
                  checked={field.checked}
                  onChange={() => dispatch(toggleBankField(key))}
                />
                <TextField
                  size="small"
                  label="Label"
                  value={field.label}
                  onChange={(e) =>
                    dispatch(
                      updateBankField({
                        field: key,
                        prop: "label",
                        value: e.target.value,
                      }),
                    )
                  }
                />
                <TextField
                  size="small"
                  label="Value"
                  value={field.value}
                  onChange={(e) =>
                    dispatch(
                      updateBankField({
                        field: key,
                        prop: "value",
                        value: e.target.value,
                      }),
                    )
                  }
                />
              </Box>
            );
          },
        )}

      {/* -------------------- Identity Sections -------------------- */}
      {identityFields.length > 0 && (
        <Box display="flex" alignItems="center">
          <Checkbox
            checked={showIdentity}
            onChange={() => dispatch(toggleShowIdentity())}
          />
          <Typography fontWeight="bold">Show Identity Fields</Typography>
        </Box>
      )}

      {showIdentity && (
        <Stack spacing={1} pl={2}>
          {identityFields.map((field) => (
            <Box key={field.id} display="flex" alignItems="center">
              <Checkbox
                checked={field.checked}
                onChange={() => dispatch(toggleIdentityField(field.id))}
              />
              <Typography>{field.label}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
