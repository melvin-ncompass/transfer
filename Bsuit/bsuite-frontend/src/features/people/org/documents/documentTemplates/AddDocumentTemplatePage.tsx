import {
  Card,
  IconButton,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useState } from "react";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import { Checkbox } from "../../../../../components/atom/check-box";
import { TextAreaField } from "../../../../../components/atom/text-area-field";
import { RepeaterDnD } from "../../../../../components/atom/form-repeater/DndRepeater";
import { useLazyGetEmployeesQuery } from "../../people/directory/api/directory.api";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../components/atom/button";
import TipTapEditorForTemplates from "./Editor";
import {
  ToggleButtonAtom,
  type ToggleOption,
} from "../../../../../components/atom/toggle-button-atom/ToggleButtonAtom";
import { GroupedTable } from "../../../../../components/tables/standard-table";
import type { GridColDef } from "@mui/x-data-grid";
import { ArrowBack, Check, ContentCopy } from "@mui/icons-material";
import { FileUploadField } from "../../../../../components/atom/file-upload-field";
import { useNavigate } from "react-router-dom";

// -----
// Types
// -----
type WorkflowStep = {
  type: string;
  assignees: string[];
  all: boolean;
  note: string;
};

type TemplateType = "EDITOR" | "WORD";

function AddDocumentTemplatePage() {
  // -----
  // Hooks
  // -----

  const navigate = useNavigate();

  //   ---------
  //   API Calls
  //   ---------

  const [triggerEmployees, { data }] = useLazyGetEmployeesQuery();

  // ------------------
  // Constant Variables
  // ------------------

  const defaultOptions = [
    { label: "Global Admin", value: "global_admin" },
    { label: "Employee (Self)", value: "self" },
  ];

  const initialWorkflowStep: WorkflowStep = {
    type: "",
    assignees: [],
    all: false,
    note: "",
  };

  const leaveToggleOptions: ToggleOption<TemplateType>[] = [
    { value: "EDITOR", label: "Editor" },
    { value: "WORD", label: "MS Word" },
  ];

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
    },
    {
      field: "placeholder",
      headerName: "Placeholder",
      renderCell: (row: any) => {
        const value = row.placeholder;
        const [copied, setCopied] = useState(false);

        const handleCopy = async () => {
          if (!value) return;

          await navigator.clipboard.writeText(value);
          setCopied(true);

          setTimeout(() => {
            setCopied(false);
          }, 1500);
        };

        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <PrimaryIconButton
              size="small"
              variant="outlined"
              onClick={handleCopy}
              icon={
                copied ? (
                  <Check fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )
              }
            />
            <Typography variant="body2">{value}</Typography>
          </Stack>
        );
      },
    },
    {
      field: "type",
      headerName: "Type",
    },
  ];

  const groupedRows = [
    {
      groupName: "Personal Information",
      items: [
        {
          id: 1,
          name: "First Name",
          placeholder: "Enter first name",
          type: "text",
          _depth: 0,
        },
        {
          id: 2,
          name: "Last Name",
          placeholder: "Enter last name",
          type: "text",
          _depth: 0,
        },
        {
          id: 3,
          name: "Contact",
          placeholder: "Enter contact",
          type: "group",
          _depth: 0,
        },
      ],
    },
    {
      groupName: "Job Details",
      items: [
        {
          id: 6,
          name: "Department",
          placeholder: "Select department",
          type: "select",
          _depth: 0,
        },
        {
          id: 7,
          name: "Role",
          placeholder: "Enter role",
          type: "text",
          _depth: 0,
        },
      ],
    },
    {
      groupName: "System Fields",
      items: [
        {
          id: 8,
          name: "Created At",
          placeholder: "-",
          type: "datetime",
          _depth: 0,
        },
        {
          id: 9,
          name: "Updated At",
          placeholder: "-",
          type: "datetime",
          _depth: 0,
        },
      ],
    },
  ];
  // ---------------
  // State Variables
  // ---------------
  const [activeStep, setActiveStep] = useState<number>(0);
  const [templateName, setTemplateName] = useState<string>("");
  const [templateDescription, setTemplateDescription] = useState<string>("");
  const [workflowEnabled, setWorkflowEnabled] = useState<boolean>(false);
  const [apiOptions, setApiOptions] =
    useState<{ label: string; value: any }[]>(defaultOptions);
  const [editorHtml, setEditorHtml] = useState<string>("");
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      type: "acknowledge",
      assignees: [],
      all: false,
      note: "",
    },
    {
      type: "approval",
      assignees: [],
      all: false,
      note: "",
    },
    {
      type: "signature",
      assignees: [],
      all: false,
      note: "",
    },
  ]);
  const [step2TabValue, setStep2TabValue] = useState<TemplateType>("EDITOR");

  // -----------
  // Use Effects
  // -----------

  useEffect(() => {
    if (data?.data) {
      const fetched = data.data.map((emp: any) => ({
        label: `${emp.contact?.name} (${emp.designation?.designationName})`,
        value: emp.id,
      }));
      // Merge with defaults only once
      setApiOptions((prev) => {
        // prevent duplicates
        const merged = [
          ...defaultOptions,
          ...fetched.filter((f: any) => !prev.some((p) => p.value === f.value)),
        ];
        return merged;
      });
    }
  }, [data]);
  //   --
  //   UI
  //   --
  return (
    <Card
      elevation={2}
      sx={{
        // p: 2.5,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "scroll",
        width: "100%",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          pb: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              bgcolor: "white",
              border: "1px solid",
              borderColor: "grey.300",
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Add Document Template
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create a new document template
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{ width: "100%", p: 1 }}
      >
        <Step sx={{ width: "100%" }}>
          <StepLabel>Setup</StepLabel>
          <StepContent sx={{ width: "100%" }}>
            <Box width={"100%"} gap={2}>
              <TextFieldElement
                label="Template Name"
                required={true}
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                }}
                sx={{ width: "49%" }}
              />
              <TextFieldElement
                label="Template Description"
                value={templateDescription}
                onChange={(e) => {
                  setTemplateDescription(e.target.value);
                }}
                sx={{ width: "49%", ml: "2%" }}
              />
              <Box
                bgcolor={"info.light"}
                p={1}
                mt={1}
                borderRadius={"8px"}
                display={"flex"}
                justifyContent={"space-between"}
              >
                <Stack>
                  <Typography variant="subtitle1">
                    Document template workflow
                  </Typography>
                  <Typography variant="body2">
                    Use acknowledge, approval or signature to define a workflow
                    for the document
                  </Typography>
                </Stack>
                <ToggleSwitch
                  label={""}
                  checked={workflowEnabled}
                  onChange={() => {
                    setWorkflowEnabled(!workflowEnabled);
                  }}
                />
              </Box>
              {workflowEnabled && (
                <RepeaterDnD<WorkflowStep>
                  label="Workflow Steps"
                  items={workflowSteps}
                  setItems={setWorkflowSteps}
                  initialItem={initialWorkflowStep}
                  disableDelete={() => workflowSteps.length == 1}
                  renderItem={(item, index, onChange) =>
                    renderWorkflowStep(
                      item,
                      index,
                      onChange,
                      apiOptions,
                      triggerEmployees,
                    )
                  }
                  gap={2}
                  gridcol={false}
                />
              )}
            </Box>
            <Box width={"100%"} display={"flex"} justifyContent={"end"}>
              <PrimaryButton
                disabled={
                  templateName == "" ||
                  (workflowEnabled && workflowSteps.length == 0)
                }
                onClick={() => {
                  setActiveStep(1);
                }}
              >
                Next
              </PrimaryButton>
            </Box>
          </StepContent>
        </Step>
        <Step sx={{ width: "100%" }}>
          <StepLabel>Compose</StepLabel>
          <StepContent sx={{ width: "100%" }}>
            <Stack
              direction={"row"}
              display={"flex"}
              justifyContent={"space-between"}
              width={"100%"}
              alignItems={"center"}
              mb={1}
            >
              <ToggleButtonAtom
                value={step2TabValue}
                options={leaveToggleOptions}
                onChange={(value) => {
                  setStep2TabValue(value);
                }}
              />
              {step2TabValue === "WORD" && (
                <FileUploadField
                  label={"Upload MS Word Template"}
                  onChange={(file) => {
                    console.log(file);
                  }}
                  multiple={false}
                  accept={".docx"}
                  value={null}
                />
              )}
            </Stack>
            {step2TabValue === "EDITOR" ? (
              <TipTapEditorForTemplates
                onChange={(html) => {
                  setEditorHtml(html);
                }}
                content={editorHtml}
              />
            ) : (
              <Box>
                <GroupedTable
                  columns={columns}
                  groupedRows={groupedRows}
                  loading={false}
                  expandAll={false}
                  useDepth
                />
              </Box>
            )}
            <Box width={"100%"} display={"flex"} justifyContent={"end"} gap={1}>
              <PrimaryButton
                onClick={() => {
                  setActiveStep(0);
                }}
                variant="outlined"
              >
                Back
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  setActiveStep(2);
                }}
              >
                Next
              </PrimaryButton>
            </Box>
          </StepContent>
        </Step>
        <Step sx={{ width: "100%" }}>
          <StepLabel>Finalize</StepLabel>
          <StepContent sx={{ width: "100%" }}>
            <HtmlRenderer html={editorHtml} />
            <Box width={"100%"} display={"flex"} justifyContent={"end"} gap={1}>
              <PrimaryButton
                onClick={() => {
                  setActiveStep(1);
                }}
                variant="outlined"
              >
                Back
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  setActiveStep(2);
                }}
              >
                Next
              </PrimaryButton>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Card>
  );
}

export default AddDocumentTemplatePage;

function renderWorkflowStep(
  item: WorkflowStep,
  index: number,
  onChange: (field: keyof WorkflowStep, value: any) => void,
  assigneeOptions: { label: string; value: any }[],
  triggerEmployees: (arg?: any) => void,
) {
  return (
    <Box
      display="flex"
      alignItems="center"
      width="100%"
      gap={1}
      border="1px dashed silver"
      p={1}
      borderRadius="8px"
    >
      <Box>
        <Typography variant="subtitle1">Step</Typography>
        <Typography variant="subtitle1" textAlign="center">
          {index + 1}
        </Typography>
      </Box>

      <Box width="100%" display="flex" flexDirection="column" gap={1}>
        <Stack direction="row" width="100%" gap={1} alignItems="center">
          <SingleSelectElement
            label="Type"
            value={item.type}
            onChange={(value) => onChange("type", value)}
            options={[
              { label: "Acknowledge", value: "acknowledge" },
              { label: "Approval", value: "approval" },
              { label: "Signature", value: "signature" },
            ]}
            sx={{ flex: 1 }}
          />

          <MultiSelectElement
            label="Assignees"
            value={item.assignees}
            onChange={(value) => {
              onChange("assignees", value);
            }}
            onSearch={(text) => {
              if (text.length >= 2) {
                triggerEmployees({ search: text });
              }
            }}
            options={assigneeOptions}
            sx={{ flex: 1 }}
          />

          <Checkbox
            label="All"
            checked={item.all}
            onChange={(e) => onChange("all", e.target.checked)}
          />
        </Stack>

        <TextAreaField
          rows={1}
          sx={{ flex: 1, width: "100%" }}
          label="Instructions (Optional)"
          value={item.note}
          onChange={(value) => onChange("note", value)}
        />
      </Box>
    </Box>
  );
}
interface HtmlRendererProps {
  html: string;
}

export function HtmlRenderer({ html }: HtmlRendererProps) {
  return (
    <Box
      sx={{
        fontSize: "16px",
        lineHeight: 1.5,
        border: "1px solid #ccc",
        borderRadius: "8px",
        p: 1,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
