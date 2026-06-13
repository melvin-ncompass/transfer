// PayslipEditor.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Slider,
  FormGroup,
  Stack,
} from "@mui/material";
import { Checkbox } from "../../../../../../../components/atom/check-box";
import { numberToWords } from "../../../../../../../utils/NumberToWords";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { Grid } from "@mui/system";
// import { useGetImagesQuery } from "../../../../../../setting/companyDetails/api/companyBranding.api";
import { RadioButton } from "../../../../../../../components/atom/radio-button";
import {
  useGetPayslipTemplateByIdQuery,
  useCreatePayslipTemplateMutation,
  useUpdatePayslipTemplateMutation,
  useSetDefaultPayslipTemplateMutation,
} from "../api/payslip.api";
import { PrimaryButton } from "../../../../../../../components/atom/button";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
// import { useGetIdentityQuery } from "../../../../../../setting/companyIdentity/components/identity.api";

const MIN_HEADER = 200;
const MAX_HEADER = 600;
// change if your preview width is different

const pxToPercent = (px: number) =>
  Math.round(((px - MIN_HEADER) / (MAX_HEADER - MIN_HEADER)) * 100);

const percentToPx = (percent: number) =>
  Math.round(MIN_HEADER + (percent / 100) * (MAX_HEADER - MIN_HEADER));

export interface PayslipState {
  showHeader: boolean;

  headerLeftWidthPercent: number;
  headerAlignment: "left" | "center" | "right";
  logoSizePx: number;
  logoAlignment: "left" | "right";

  showOrgAddr: boolean;
  showDesignation: boolean;
  showBasedOnGross: boolean;
  showBankAccNumber: boolean;
  showDepartment: boolean;
  showUAN: boolean;
  showPan: boolean;
  showWorkLocation: boolean;

  companyName: string;
  companyAddress: string;
  month: string;

  employeeName: string;
  employeeId: string;
  dateOfJoining: string;
  designation: string;
  department: string;
  pan: string;
  uan: string;
  accountNumber: string;

  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  workingDays: number;
  lopDays: number;

  hra: number;
  bonus: number;
  insurance: number;
  professionalTax: number;

  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  netPayable: number;

  otherComponents: number;
  totalCost: number;
}

const initialState: PayslipState = {
  showHeader: true,
  headerLeftWidthPercent: 450,
  headerAlignment: "left",
  logoSizePx: 44,
  logoAlignment: "right",

  showOrgAddr: true,
  showDesignation: true,
  showBasedOnGross: true,
  showBankAccNumber: true,
  showDepartment: true,
  showUAN: true,
  showPan: true,
  showWorkLocation: true,

  companyName: "Power of N Techstudio Pvt Ltd",
  companyAddress: "Level 4 Tower A, Richa Tech Meadows, OMR Sholinganallur",
  month: "Jan 2026",

  employeeName: "John",
  employeeId: "EMP001",
  dateOfJoining: "01 Jan 2024",
  designation: "Engineer",
  department: "IT",
  pan: "ABCDE1234F",
  uan: "123456789",
  accountNumber: "XXXXXX1234",

  payPeriodStart: "01 Jan",
  payPeriodEnd: "31 Jan",
  payDate: "05 Feb",
  workingDays: 30,
  lopDays: 0,

  hra: 10000,
  bonus: 2000,
  insurance: 500,
  professionalTax: 200,

  totalEarnings: 12000,
  totalDeductions: 700,
  netPay: 11300,
  netPayable: 11300,

  otherComponents: 3000,
  totalCost: 15000,
};

export default function PayslipEditor({
  title,
  open,
  data,
  branding,
  identity,
  onClose,
  onSuccess,
  onError,
}: {
  title?: string;
  open?: boolean;
  onClose: () => void;
  data?: any;
  branding?: any;
  identity?: any;
  onSuccess?: (data?: string) => void;
  onError?: (error?: string) => void;
}) {
  const companyAddress = identity?.company || {};
  const [s, setState] = useState<PayslipState>(initialState);
  const [name, setName] = useState<string>(data?.templateName || "");
  const [saved, setSaved] = useState(false);
  console.log(data);
  const { data: templateData, isLoading } = useGetPayslipTemplateByIdQuery(
    data?.id || 0,
    { skip: !data?.id ,refetchOnMountOrArgChange: true},
  );

  const [createPayslipTemplate, { isLoading: creating }] =
    useCreatePayslipTemplateMutation();
  const [updatePayslipTemplate, { isLoading: updating }] =
    useUpdatePayslipTemplateMutation();
  const [setDefaultTemplate] = useSetDefaultPayslipTemplateMutation();

  // ================= FETCH TEMPLATE DATA =================
  useEffect(() => {
    if (templateData) {
      console.log(templateData);
      setName(templateData.templateName || "");
      setState((p) => ({
        ...p,
        showHeader: templateData.showHeader,
        headerLeftWidthPercent: percentToPx(Number(templateData.headerSize)),
        showOrgAddr: templateData.showOrgAddress,
        showDesignation: templateData.showDesignation,
        showBasedOnGross: templateData.showBasedOnGross,
        showBankAccNumber: templateData.showBankAccountNumber,
        showDepartment: templateData.showDepartment,
        showUAN: templateData.showUanNumber,
        showPan: templateData.showPan,
        showWorkLocation: templateData.showWorkLocation,
        logoSizePx: Number(templateData.logoSize),
        logoAlignment: templateData.showLogo ? "left" : "right",
      }));
    }
  }, [templateData]);
  useEffect(() => {
    if (identity && branding) {
      setState((prev) => ({
        ...prev,
        companyName: branding?.data.companyName || prev.companyName,
        companyAddress: `${identity.company?.addressLine1}\n${identity.company?.addressLine2 || ""}\n${identity.company?.city}, ${identity.company?.state} ${identity.company?.pincode}\n${identity.company?.country}`,
      }));
    }
  }, [identity, branding]);
  // ================= FORMAT NUMBERS =================
  const fmt = (v: number | string | undefined) => {
    if (v === undefined || v === null || v === "") return "";
    const num = typeof v === "string" ? Number(v) : v;
    if (Number.isNaN(num)) return String(v);
    return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };

  // ================= SAVE HANDLER =================
  const handleSave = async () => {
    try {
      const payload = {
        templateName: name,
        showHeader: s.showHeader,
        headerSize: s.showHeader
          ? String(pxToPercent(s.headerLeftWidthPercent))
          : "0",

        showLogo: !s.showHeader,
        logoSize: !s.showHeader ? String(s.logoSizePx) : "0",
        showOrgAddress: s.showOrgAddr,
        showWorkLocation: s.showWorkLocation,
        showDesignation: s.showDesignation,
        showDepartment: s.showDepartment,
        showPan: s.showPan,
        showBankAccountNumber: s.showBankAccNumber,
        showUanNumber: s.showUAN,
        showBasedOnGross: s.showBasedOnGross,
      };

      if (data?.id) {
        await updatePayslipTemplate({ id: data.id, data: payload }).unwrap();
        onSuccess?.("Payslip template updated successfully");
      } else {
        await createPayslipTemplate(payload).unwrap();
        onSuccess?.("Payslip template created successfully");
      }
      setState(initialState);
      setName("");
      setSaved(true);
      onClose();
    } catch (err: any) {
      onError?.(err?.data?.message || "Failed to save template");
    }
  };
  // Reset form if modal closes without saving
  useEffect(() => {
    if (!open && !data?.id) {
      if (!saved) {
        setState(initialState);
        setName("");
      }
      setSaved(false);
    }
  }, [open,data?.id]);

  // ================= SET DEFAULT HANDLER =================
  const handleSetDefault = async () => {
    if (!data?.id) return;
    try {
      await setDefaultTemplate(data.id).unwrap();
      // setState(initialState)
      onSuccess?.("Template set as default");
    } catch (err: any) {
      onError?.(err?.data?.message || "Failed to set default");
    }
  };

  return (
    <ModalElement
      open={open || false}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      height={"100vh"}
    >
      <Box
        display="flex"
        gap={2}
        sx={{
          height: "75vh",
          overflow: "hidden", // important
        }}
      >
        {/* ================= LEFT : FORM ================= */}
        <Box
          sx={{
            width: "40%",
            height: "75vh",
            overflow: "hidden", // no scrolling here
            p: 1,
            pr: 2,
          }}
        >
          <TextFieldElement
            label="Template Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{
              htmlInput: {
                maxLength: 100,
              },
            }}
          />
          <Typography variant="subtitle1">Header & Logo</Typography>
          <Stack spacing={0.5}>
            <Stack direction={"row"} width={"100%"}>
              <RadioButton
                label="Show Header"
                checked={s.showHeader}
                onChange={() =>
                  setState((p) => ({ ...p, showHeader: !p.showHeader }))
                }
              />
              <RadioButton
                label="Show Logo"
                checked={!s.showHeader}
                onChange={() =>
                  setState((p) => ({ ...p, showHeader: !p.showHeader }))
                }
              />
            </Stack>
            <Divider />

            {s.showHeader ? (
              <>
                <Typography variant="subtitle2">
                  Header Customizations
                </Typography>

                <Box>
                  <Typography variant="body2">
                    Header Width: {s.headerLeftWidthPercent}px
                  </Typography>
                  <Slider
                    min={200}
                    max={600}
                    step={1}
                    value={s.headerLeftWidthPercent}
                    onChange={(_, v) => {
                      console.log(_);
                      setState((p) => ({
                        ...p,
                        headerLeftWidthPercent: v as number,
                      }));
                    }}
                  />
                </Box>

                {/* <FormGroup row>
                  {["left", "right"].map((a) => (
                    <Checkbox
                      key={a}
                      label={a}
                      checked={s.headerAlignment === a}
                      onChange={() =>
                        setState((p) => ({ ...p, headerAlignment: a as any }))
                      }
                    />
                  ))}
                </FormGroup> */}
              </>
            ) : (
              <>
                <Typography variant="subtitle2">Logo Customizations</Typography>

                <Box>
                  <Typography variant="body2">
                    Logo Size: {s.logoSizePx}px
                  </Typography>
                  <Slider
                    min={50}
                    max={80}
                    step={2}
                    value={s.logoSizePx}
                    onChange={(_, v) =>
                      setState((p) => ({ ...p, logoSizePx: v as number }))
                    }
                  />
                </Box>

                <FormGroup row>
                  {["left", "right"].map((a) => (
                    <Checkbox
                      key={a}
                      label={a}
                      checked={s.logoAlignment === a}
                      onChange={() =>
                        setState((p) => ({ ...p, logoAlignment: a as any }))
                      }
                    />
                  ))}
                </FormGroup>
              </>
            )}

            <Divider />

            <Stack direction="row">
              <FormGroup>
                <Checkbox
                  label="Show Organization Address"
                  checked={s.showOrgAddr}
                  onChange={() =>
                    setState((p) => ({ ...p, showOrgAddr: !p.showOrgAddr }))
                  }
                />
                <Checkbox
                  label="Show Designation"
                  checked={s.showDesignation}
                  onChange={() =>
                    setState((p) => ({
                      ...p,
                      showDesignation: !p.showDesignation,
                    }))
                  }
                />
                <Checkbox
                  label="Show PAN"
                  checked={s.showPan}
                  onChange={() =>
                    setState((p) => ({ ...p, showPan: !p.showPan }))
                  }
                />
                <Checkbox
                  label="Show UAN"
                  checked={s.showUAN}
                  onChange={() =>
                    setState((p) => ({ ...p, showUAN: !p.showUAN }))
                  }
                />
              </FormGroup>

              <FormGroup>
                {/* <Checkbox
                  label="Show WorkLocation"
                  checked={s.showWorkLocation}
                  onChange={() =>
                    setState((p) => ({
                      ...p,
                      showWorkLocation: !p.showWorkLocation,
                    }))
                  }
                /> */}
                <Checkbox
                  label="Show Department"
                  checked={s.showDepartment}
                  onChange={() =>
                    setState((p) => ({
                      ...p,
                      showDepartment: !p.showDepartment,
                    }))
                  }
                />
                <Checkbox
                  label="Show Bank Account Number"
                  checked={s.showBankAccNumber}
                  onChange={() =>
                    setState((p) => ({
                      ...p,
                      showBankAccNumber: !p.showBankAccNumber,
                    }))
                  }
                />
                <Checkbox
                  label="Show Based on Gross"
                  checked={s.showBasedOnGross}
                  onChange={() =>
                    setState((p) => ({
                      ...p,
                      showBasedOnGross: !p.showBasedOnGross,
                    }))
                  }
                />
              </FormGroup>
            </Stack>
          </Stack>
        </Box>

        {/* ================= RIGHT : PREVIEW ================= */}
        <Box
          sx={{
            width: "60%",
            bgcolor: "background.paper",
            boxShadow: 2,
            height: "100%",
            overflowY: "auto", // only this side scrolls
            pr: 1,
          }}
        >
          <Box
            sx={{
              p: 2,
              width: "100%",
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: s.showHeader
                  ? s.headerAlignment == "left"
                    ? "flex-start"
                    : "flex-end"
                  : s.logoAlignment == "left"
                    ? "flex-start"
                    : "flex-end",
              }}
            >
              {s.showHeader ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection:
                      s.logoAlignment === "left" ? "row-reverse" : "row",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        width: s.headerLeftWidthPercent,
                        minHeight: 80,
                        // backgroundColor:"blue"
                        border: !branding?.data.headerUrl
                          ? "1px solid #ccc"
                          : "none",
                        backgroundImage: `url(${branding?.data.headerUrl})`,
                        // color: "white",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        px: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      {branding?.data.headerUrl == ""
                        ? "No Header Image"
                        : null}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Box
                    sx={{
                      width: s.logoSizePx,
                      height: s.logoSizePx,
                      border: branding?.data.logoUrl
                        ? "none"
                        : "1px solid #ccc",
                      backgroundImage: `url(${branding?.data?.logoUrl})`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1,
                    }}
                  >
                    {branding?.data?.logoUrl ? null : "N/A"}
                  </Box>
                </Box>
              )}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
              {s.companyName}
            </Typography>

            {s.showOrgAddr && (
              <Typography
                sx={{ color: "text.secondary", whiteSpace: "pre-line" }}
              >
                {s.companyAddress}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              EMPLOYEE SUMMARY
            </Typography>

            <Grid container>
              <Grid size={{ xs: 6 }}>
                <Typography>Name</Typography>
                <Typography>ID</Typography>
                <Typography>Date of Joining</Typography>
                {s.showDesignation && <Typography>Designation</Typography>}
                {s.showDepartment && <Typography>Department</Typography>}
                {s.showPan && <Typography>PAN</Typography>}
                {s.showUAN && <Typography>UAN</Typography>}
                {s.showBankAccNumber && <Typography>Account</Typography>}
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography>: {s.employeeName}</Typography>
                <Typography>: {s.employeeId}</Typography>
                <Typography>: {s.dateOfJoining}</Typography>
                {s.showDesignation && (
                  <Typography>: {s.designation}</Typography>
                )}
                {s.showDepartment && <Typography>: {s.department}</Typography>}
                {s.showPan && <Typography>: {s.pan}</Typography>}
                {s.showUAN && <Typography>: {s.uan}</Typography>}
                {s.showBankAccNumber && (
                  <Typography>: {s.accountNumber}</Typography>
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: 700 }}>
              Total Net Payable : ₹ {fmt(s.netPayable)}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              {numberToWords(Number(s.netPayable || 0))}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              {/* ================= EARNINGS ================= */}
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  EARNINGS (A)
                </Typography>

                <Grid container>
                  <Grid size={{ xs: 8 }}>
                    <Typography>HRA</Typography>
                    <Typography>Basic</Typography>
                  </Grid>

                  <Grid size={{ xs: 4 }} textAlign="right">
                    <Typography>{fmt(s.hra)}</Typography>
                    <Typography>{fmt(s.bonus)}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                <Grid container>
                  <Grid size={{ xs: 8 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Total Earnings
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} textAlign="right">
                    <Typography sx={{ fontWeight: 600 }}>
                      {fmt(s.totalEarnings)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* ================= DEDUCTIONS ================= */}
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  DEDUCTIONS (B)
                </Typography>

                <Grid container>
                  <Grid size={{ xs: 8 }}>
                    <Typography>Insurance</Typography>
                    <Typography>Professional Tax</Typography>
                  </Grid>

                  <Grid size={{ xs: 4 }} textAlign="right">
                    <Typography>{fmt(s.insurance)}</Typography>
                    <Typography>{fmt(s.professionalTax)}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                <Grid container>
                  <Grid size={{ xs: 8 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Total Deductions
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} textAlign="right">
                    <Typography sx={{ fontWeight: 600 }}>
                      {fmt(s.totalDeductions)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* ================= A - B ================= */}
            <Divider sx={{ my: 2 }} />

            <Grid container>
              <Grid size={{ xs: 8 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  NET PAY (A - B)
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }} textAlign="right">
                <Typography sx={{ fontWeight: 700 }}>
                  {fmt(s.netPay)}
                </Typography>
              </Grid>
            </Grid>

            {/* ================= OTHER COMPONENTS ================= */}
         {s.showBasedOnGross &&    <Divider sx={{ my: 2 }} />}

            {s.showBasedOnGross && (
              <Grid container>
                <Grid size={{ xs: 8 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    OTHER COMPONENTS (C)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography >
                    Bonus
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }} textAlign="right">
                  <Typography>
                    {fmt(s.otherComponents)}
                  </Typography>
                </Grid>
              </Grid>
            )}

            {/* ================= A + C ================= */}
           {s.showBasedOnGross && <Divider sx={{ my: 2 }} />}

            {s.showBasedOnGross && (
              <Grid container>
                <Grid size={{ xs: 8 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    TOTAL COST TO COMPANY (A + C)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }} textAlign="right">
                  <Typography sx={{ fontWeight: 700 }}>
                    {fmt(s.totalCost)}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
      <Box width={"100%"} display={"flex"} justifyContent={"flex-end"}>
        {/* <PrimaryButton onClick={handleSetDefault}>Set Default</PrimaryButton> */}
        <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
      </Box>
    </ModalElement>
  );
}
