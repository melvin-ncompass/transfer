import { Box, Typography, Grid, Divider } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { TextFieldElement } from "../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../components/atom/select-field/SingleSelect";
import { RepeaterElement } from "../../../../components/atom/form-repeater";
import { useState, useEffect } from "react";
import { useGetIdentityQuery, useUpdateIdentityMutation } from "./identity.api";
import type { MetaItem } from "../../../../types/types";
import { useMemo } from "react";
// import { getCodes, getName } from "country-list";
import { Country, State, City } from "country-state-city";

type MetaSnapshot = {
  key: string;
  value: string;
};

export default function EditIdentityModal({
  onSuccess,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const emptyForm = {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  };

  const [initialForm, setInitialForm] = useState(emptyForm);
  const [initialMeta, setInitialMeta] = useState<MetaSnapshot[]>([]);

  const { data, isLoading } = useGetIdentityQuery();
  const [updateIdentity] = useUpdateIdentityMutation();

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  const [meta, setMeta] = useState<MetaItem[]>([]);

  const normalizeForm = (form: any) => ({
    addressLine1: form.addressLine1 || "",
    addressLine2: form.addressLine2 || "",
    city: form.city || "",
    state: form.state || "",
    pincode: form.pincode || "",
    country: form.country || "",
  });

  const normalizeMeta = (meta: MetaItem[]) =>
    meta.map(({ key, value }) => ({
      key: key?.trim() || "",
      value: value?.trim() || "",
    }));

  // -----------------------------
  // PREFILL FORM WITH API DATA
  // -----------------------------
  useEffect(() => {
    if (!data || !data.company) return;

    const formData = normalizeForm({
      addressLine1: data.company.addressLine1,
      addressLine2: data.company.addressLine2,
      city: data.company.city,
      state: data.company.state,
      pincode: data.company.pincode,
      country: data.company.country,
    });

    const metaData: MetaItem[] = data.metadata.map((m: any) => ({
      key: m.label,
      value: m.value,
      errors: { key: "", value: "" },
    }));

    setForm(formData);
    setMeta(metaData);

    // stable snapshots
    setInitialForm(formData);
    setInitialMeta(normalizeMeta(metaData));
  }, [data]);

  if (isLoading) return <Typography>Loading...</Typography>;

  const canSubmit = useMemo(() => {
    const hasValue =
      Object.values(form).some((v) => v.trim() !== "") ||
      normalizeMeta(meta).some((m) => m.key !== "" || m.value !== "");

    const dirty =
      JSON.stringify(normalizeForm(form)) !== JSON.stringify(initialForm) ||
      JSON.stringify(normalizeMeta(meta)) !== JSON.stringify(initialMeta);

    const hasDuplicate = meta.some(
      (m) => m.errors?.key === "Duplicate label not allowed",
    );

    const hasEmptyErrors = meta.some((m) => !m.key.trim() || !m.value.trim());
    const isCreateMode =
      JSON.stringify(initialForm) === JSON.stringify(emptyForm) &&
      initialMeta.length === 0;

    if (isCreateMode) {
      return hasValue && !hasDuplicate && !hasEmptyErrors;
    }

    return dirty && !hasDuplicate && !hasEmptyErrors;
  }, [form, meta, initialForm, initialMeta]);

  // -----------------------------
  // COUNTRY options
  const countryOptions = Country.getAllCountries().map((c: any) => ({
    label: c.name,
    value: c.isoCode,
  }));

  // STATE options (depends on selected country)
  const stateOptions = State.getStatesOfCountry(form.country).map((s: any) => ({
    label: s.name,
    value: s.isoCode,
  }));

  // CITY options (depends on selected state)
  const cityOptions = City.getCitiesOfState(form.country, form.state).map(
    (c: any) => ({
      label: c.name,
      value: c.name,
    }),
  );

  // const validateDuplicateKeys = (meta: MetaItem[]) => {
  //   const seen = new Map<string, number[]>();

  //   meta.forEach((item, index) => {
  //     const key = item.key?.trim().toLowerCase();
  //     if (!key) return;

  //     if (!seen.has(key)) {
  //       seen.set(key, [index]);
  //     } else {
  //       seen.get(key)!.push(index);
  //     }
  //   });

  //   const updatedMeta = [...meta];

  //   seen.forEach((indexes) => {
  //     if (indexes.length > 1) {
  //       indexes.forEach((i) => {
  //         updatedMeta[i] = {
  //           ...updatedMeta[i],
  //           errors: {
  //             ...updatedMeta[i].errors,
  //             key: "Duplicate label not allowed",
  //           },
  //         };
  //       });
  //     }
  //   });

  //   return updatedMeta;
  // };

  const validateDuplicateKeys = (meta: MetaItem[]) => {
    const counts: Record<string, number> = {};

    meta.forEach((item) => {
      const key = item.key?.trim().toLowerCase();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });

    return meta.map((item) => {
      const key = item.key?.trim().toLowerCase();

      if (key && counts[key] > 1) {
        return {
          ...item,
          errors: {
            ...item.errors,
            key: "Duplicate label not allowed",
          },
        };
      }

      return {
        ...item,
        errors: {
          ...item.errors,
          key: "",
        },
      };
    });
  };
  const handleSubmit = async () => {
    let hasError = false;

    const validatedMeta = meta.map((item) => {
      const errors = {
        key: item.key?.trim() ? "" : "Key is required",
        value: item.value?.trim() ? "" : "Value is required",
      };

      if (errors.key || errors.value) hasError = true;
      return { ...item, errors };
    });

    setMeta(validatedMeta);

    if (hasError) return;
    const payload: any = {};

    // ALWAYS send meta (even empty)
    payload.companyMetaData = validatedMeta.map((m) => ({
      label: m.key,
      value: m.value,
    }));

    // Optional identity
    const companyIdentityPayload = {
      addressLine1: form.addressLine1.trim() === "" ? null : form.addressLine1,
      addressLine2: form.addressLine2.trim() === "" ? null : form.addressLine2,
      city: form.city.trim() === "" ? null : form.city,
      state: stateOptions.find((s) => s.value === form.state)?.label || null,
      pincode: form.pincode.trim() === "" ? null : form.pincode,
      country: form.country.trim() === "" ? null : form.country,
    };

    if (Object.keys(companyIdentityPayload).length) {
      payload.companyIdentity = companyIdentityPayload;
    }

    await updateIdentity(payload).unwrap();
    onSuccess();
  };

  return (
    <Box sx={{ width: "100%", height: "100%", px: 1 }}>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Company Address
      </Typography>

      <Grid container spacing={2}>
        {/* Address */}
        <Grid size={6}>
          <TextFieldElement
            fullWidth
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          />
        </Grid>

        <Grid size={6}>
          <TextFieldElement
            fullWidth
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
          />
        </Grid>

        {/* Country */}
        <Grid size={6}>
          <SingleSelectElement
            label="Country"
            value={form.country}
            onChange={(value) =>
              setForm({ ...form, country: value, state: "", city: "" })
            }
            options={[{ label: "---N/A---", value: "" }, ...countryOptions]}
            sx={{ width: "100%" }}
          />
        </Grid>

        {/* State */}
        <Grid size={6}>
          <SingleSelectElement
            label="State"
            value={form.state}
            onChange={(value) => setForm({ ...form, state: value, city: "" })}
            options={[{ label: "---N/A---", value: "" }, ...stateOptions]}
            disabled={!form.country}
            sx={{ width: "100%" }}
          />
        </Grid>

        {/* City */}
        <Grid size={6}>
          <SingleSelectElement
            label="City"
            value={form.city}
            onChange={(value) => setForm({ ...form, city: value })}
            options={[{ label: "---N/A---", value: "" }, ...cityOptions]}
            disabled={!form.state}
            sx={{ width: "100%" }}
          />
        </Grid>

        {/* Pincode */}
        <Grid size={6}>
          <TextFieldElement
            fullWidth
            label="Pincode"
            type="number"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <RepeaterElement
        label="Additional Info"
        items={meta}
        setItems={(items) => {
          const resolvedItems =
            typeof items === "function" ? items(meta) : items;

          const validated = validateDuplicateKeys(resolvedItems);
          setMeta(validated);
        }}
        initialItem={{ key: "", value: "", errors: { key: "", value: "" } }}
        gap={2}
        // minItems={1}
        renderItem={(item, index, onChange) => (
          <>
            <TextFieldElement
              label="label"
              value={item.key}
              error={!!item.errors.key}
              helperText={
                item.errors.key === "Duplicate label not allowed"
                  ? item.errors.key
                  : ""
              }
              onChange={(e) => onChange("key", e.target.value)}
              width={"75%"}
            />

            <TextFieldElement
              label="Value"
              value={item.value}
              error={!!item.errors.value}
              helperText={item.errors.value}
              onChange={(e) => onChange("value", e.target.value)}
              width={"75%"}
            />
          </>
        )}
      />

      {/* Footer */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {!isLoading ? "Save" : "Saving"}
        </PrimaryButton>
      </Box>
    </Box>
  );
}
