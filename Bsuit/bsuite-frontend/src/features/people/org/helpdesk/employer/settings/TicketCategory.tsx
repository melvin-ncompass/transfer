import { Box, Stack } from "@mui/system";
import {
  Divider,
  FormControlLabel,
  Radio,
  Typography,
  Card,
} from "@mui/material";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";
import { Add, ArrowBack, Delete, DragIndicator } from "@mui/icons-material";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MenuAtom from "../../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { useSnackbar } from "../../../../../../context/SnackbarContext";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
  useGetAllPrioritiesQuery,
  useLazyGetOneCategoryQuery,
} from "../../api/category.api";
import { useGetEmployeesQuery } from "../../../people/directory/api/directory.api";
import { useGetBusinessHourPoliciesQuery } from "../../api/businessHours.api";
import { getBackendMessage } from "../../common/utils/helpdeskUtils";
import { ToggleSwitch } from "../../../../../../components/atom/toggle-switch";
import { CategoryCard } from "./TicketCategoryCards";

type SlaFormRow = {
  priorityId: string;
  enabled: boolean;
  responseValue: string;
  responseUnit: TimeUnit;
  resolutionValue: string;
  resolutionUnit: TimeUnit;
};

type EscalationRuleFormRow = {
  id: string;
  level: number;
  triggerAfterValue: string;
  triggerAfterUnit: TimeUnit;
  escalateToEmployeeId: string;
  timeBreachType: "response" | "resolution";
};

type TimeUnit = "minutes" | "hours" | "days";

const TIME_UNIT_OPTIONS = [
  { label: "Minutes", value: "minutes" },
  { label: "Hours", value: "hours" },
  { label: "Days", value: "days" },
];

const DEFAULT_ESCALATION_RULE: EscalationRuleFormRow = {
  id: "response-1",
  level: 1,
  triggerAfterValue: "",
  triggerAfterUnit: "hours",
  timeBreachType: "response",
  escalateToEmployeeId: "",
};

let escalationRuleIdSeed = 0;

const TICKET_CATEGORY_SETTINGS_PATH =
  "/people/home?tab=4&mainTab=4&helpdeskTab=3";

const createEscalationRule = (
  timeBreachType: "response" | "resolution",
  level: number,
): EscalationRuleFormRow => ({
  ...DEFAULT_ESCALATION_RULE,
  id: `${timeBreachType}-${Date.now()}-${level}-${escalationRuleIdSeed++}`,
  level,
  timeBreachType,
});

const convertToMinutes = (value: string, unit: TimeUnit) => {
  const amount = Number(value);
  if (!value || Number.isNaN(amount)) return 0;
  if (unit === "days") return amount * 24 * 60;
  if (unit === "hours") return amount * 60;
  return amount;
};

const splitMinutes = (minutes?: number | null) => {
  const total = Number(minutes ?? 0);
  if (total > 0 && total % (24 * 60) === 0) {
    return { value: String(total / (24 * 60)), unit: "days" as TimeUnit };
  }
  if (total > 0 && total % 60 === 0) {
    return { value: String(total / 60), unit: "hours" as TimeUnit };
  }
  return { value: total ? String(total) : "", unit: "minutes" as TimeUnit };
};

// ─── Sortable escalation rule (unchanged) ────────────────────────────────────

type SortableEscalationRuleProps = {
  rule: EscalationRuleFormRow;
  index: number;
  employeeOptions: Array<{ label: string; value: string }>;
  canRemove: boolean;
  onUpdate: (index: number, changes: Partial<EscalationRuleFormRow>) => void;
  onRemove: (index: number) => void;
};

function SortableEscalationRule({
  rule,
  index,
  employeeOptions,
  canRemove,
  onUpdate,
  onRemove,
}: SortableEscalationRuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  return (
    <Box
      ref={setNodeRef}
      display={"grid"}
      gridTemplateColumns={{ xs: "1fr", md: "44px 80px 1fr 1fr auto" }}
      gap={1.5}
      alignItems={"center"}
      bgcolor={"#f5f6f8"}
      borderRadius={1}
      p={2}
      sx={{
        opacity: isDragging ? 0.75 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        sx={{ cursor: "grab", color: "text.secondary" }}
      >
        <DragIndicator fontSize="small" />
      </Box>

      <Typography fontSize={13} fontWeight={600}>
        Level {rule.level}
      </Typography>

      <Box display={"flex"} gap={1}>
        <TextFieldElement
          label="Trigger after"
          type="number"
          value={rule.triggerAfterValue}
          onChange={(event) => onUpdate(index, { triggerAfterValue: event.target.value })}
          width={"50%"}
        />
        <SingleSelectElement
          label="Unit"
          value={rule.triggerAfterUnit}
          onChange={(value) => onUpdate(index, { triggerAfterUnit: value as TimeUnit })}
          options={TIME_UNIT_OPTIONS}
          sx={{ width: "50%" }}
        />
      </Box>

      <SingleSelectElement
        label="Escalate To"
        value={rule.escalateToEmployeeId}
        onChange={(value) => onUpdate(index, { escalateToEmployeeId: value })}
        options={employeeOptions}
      />

      <Box display={"flex"} alignItems={"center"} gap={1}>
        {canRemove && (
          <PrimaryIconButton
            icon={<Delete />}
            variant="outlined"
            size="small"
            color="error"
            onClick={() => onRemove(index)}
          />
        )}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export type TicketCategoryRef = { openAddMenu: (e: React.MouseEvent<HTMLElement>) => void };

export default forwardRef<TicketCategoryRef, { searchQuery?: string }>(function TicketCategory(
  { searchQuery = "" },
  ref,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const { showSnackbar } = useSnackbar();
  const [searchText, setSearchText] = useState<string>("");
  const effectiveSearch = searchQuery || searchText;
  const isAddPage = location.pathname.endsWith("/helpdesk/categories/add");
  const isEditPage = Boolean(categoryId);
  const isFormPage = isAddPage || isEditPage;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // ── API ──────────────────────────────────────────────────────────────────────

  const { data: categoryData, isLoading } = useGetAllCategoriesQuery();
  const { data: employeesData } = useGetEmployeesQuery();
  const { data: prioritiesData } = useGetAllPrioritiesQuery();
  const { data: businessHourPoliciesData } = useGetBusinessHourPoliciesQuery();

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [getOneCategory, { isFetching: isFetchingCategory }] = useLazyGetOneCategoryQuery();

  // ── Options ──────────────────────────────────────────────────────────────────

  const employeeOptions = useMemo(
    () =>
      employeesData?.data?.map((employee: any) => ({
        label: employee.name || employee.contact?.name || "Unnamed Employee",
        value: String(employee.id),
      })) ?? [],
    [employeesData],
  );

  const priorityOptions = useMemo(
    () =>
      prioritiesData?.data?.map((priority: any) => ({
        label: priority.name,
        value: String(priority.id),
      })) ?? [],
    [prioritiesData],
  );

  const ticketPrioritizationPriorityOptions = useMemo(
    () =>
      priorityOptions.filter(
        (p: any) => p.label?.trim().toLowerCase() !== "not applicable",
      ),
    [priorityOptions],
  );

  const notApplicablePriority = useMemo(
    () =>
      priorityOptions.find(
        (p: any) => p.label?.trim().toLowerCase() === "not applicable",
      ),
    [priorityOptions],
  );

  const parentCategoryOptions = useMemo(
    () =>
      categoryData?.data
        ?.filter((cat: any) => cat.id !== selectedCategory?.id)
        .map((cat: any) => ({ label: cat.categoryName, value: String(cat.id) })) ?? [],
    [categoryData, selectedCategory],
  );

  const businessHourPolicyOptions = useMemo(
    () =>
      businessHourPoliciesData?.data?.map((policy: any) => ({
        label: policy.name,
        value: String(policy.id),
      })) ?? [],
    [businessHourPoliciesData],
  );

  // ── Form state ───────────────────────────────────────────────────────────────

  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [parentId, setParentId] = useState("");
  const [priority, setPriority] = useState("");
  const [ticketPrioritizationDefaultPriority, setTicketPrioritizationDefaultPriority] = useState("");
  const [categoryLead, setCategoryLead] = useState("");
  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [businessHourPolicyId, setBusinessHourPolicyId] = useState("");
  const [notifyOnCreate, setNotifyOnCreate] = useState(false);
  const [enableOnHold, setEnableOnHold] = useState(false);
  const [ticketPrioritizationEnabled, setTicketPrioritizationEnabled] = useState(true);
  const [slaRows, setSlaRows] = useState<SlaFormRow[]>([]);
  const [ticketEscalationEnabled, setTicketEscalationEnabled] = useState(false);
  const [responseEscalationEnabled, setResponseEscalationEnabled] = useState(true);
  const [resolutionEscalationEnabled, setResolutionEscalationEnabled] = useState(false);
  const [notifyResponseBreach, setNotifyResponseBreach] = useState(false);
  const [notifyResolutionBreach, setNotifyResolutionBreach] = useState(false);
  const [responseEscalationRules, setResponseEscalationRules] = useState<EscalationRuleFormRow[]>(
    [createEscalationRule("response", 1)],
  );
  const [resolutionEscalationRules, setResolutionEscalationRules] = useState<EscalationRuleFormRow[]>(
    [createEscalationRule("resolution", 1)],
  );
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setSlaRows((currentRows) =>
      ticketPrioritizationPriorityOptions.map((option: any, index: number) => {
        const existing = currentRows.find((row) => row.priorityId === option.value);
        return (
          existing ?? {
            priorityId: option.value,
            enabled: true,
            responseValue: String((index + 1) * 4),
            responseUnit: "hours" as TimeUnit,
            resolutionValue: String(index === 0 ? 1 : index === 1 ? 2 : 4),
            resolutionUnit: "days" as TimeUnit,
          }
        );
      }),
    );
  }, [ticketPrioritizationPriorityOptions]);

  useEffect(() => {
    if (!isEditPage && !ticketPrioritizationDefaultPriority && notApplicablePriority?.value) {
      setTicketPrioritizationDefaultPriority(notApplicablePriority.value);
    }
  }, [isEditPage, notApplicablePriority, ticketPrioritizationDefaultPriority]);

  // ── Add menu ─────────────────────────────────────────────────────────────────

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  useImperativeHandle(ref, () => ({ openAddMenu: openMenu }));

  // ── Filtered categories ───────────────────────────────────────────────────────

  const filteredCategories = useMemo(() => {
    if (!categoryData?.data) return [];
    return categoryData.data.filter((item: any) =>
      item.categoryName?.toLowerCase().includes(effectiveSearch.toLowerCase()),
    );
  }, [categoryData, effectiveSearch]);

  // ── Reset form ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setCategoryTitle("");
    setCategoryDescription("");
    setIsSubCategory(false);
    setParentId("");
    setPriority("");
    setTicketPrioritizationDefaultPriority(notApplicablePriority?.value ?? "");
    setCategoryLead("");
    setAssignedEmployees([]);
    setBusinessHourPolicyId("");
    setNotifyOnCreate(false);
    setEnableOnHold(false);
    setTicketPrioritizationEnabled(true);
    setSlaRows((rows) =>
      rows.map((row) => ({
        ...row,
        enabled: true,
        responseValue: "",
        responseUnit: "hours" as TimeUnit,
        resolutionValue: "",
        resolutionUnit: "days" as TimeUnit,
      })),
    );
    setTicketEscalationEnabled(false);
    setResponseEscalationEnabled(true);
    setResolutionEscalationEnabled(false);
    setNotifyResponseBreach(false);
    setNotifyResolutionBreach(false);
    setResponseEscalationRules([createEscalationRule("response", 1)]);
    setResolutionEscalationRules([createEscalationRule("resolution", 1)]);
    setSelectedCategory(null);
  };

  // ── Populate form for edit ────────────────────────────────────────────────────

  const populateForm = (category: any) => {
    setCategoryTitle(category.categoryName ?? "");
    setCategoryDescription(category.description ?? "");
    setIsSubCategory(category.isSubCategory ?? false);
    setParentId(category.parentId ? String(category.parentId) : "");
    setPriority(category.defaultPriority ? String(category.defaultPriority) : "");
    setTicketPrioritizationDefaultPriority(
      category.defaultPriority ? String(category.defaultPriority) : "",
    );
    setCategoryLead(category.categoryLead ? String(category.categoryLead) : "");
    setAssignedEmployees(category.members?.map((id: number) => String(id)) ?? []);
    setBusinessHourPolicyId(
      category.businessHourPolicyId ? String(category.businessHourPolicyId) : "",
    );
    setEnableOnHold(category.enableOnHold ?? false);

    const existingSlaMappings = category.slaMappings ?? [];
    const hasSLAMappings = existingSlaMappings.length > 0;
    const prioritizationEnabled = category.isPrioritizationEnabled ?? hasSLAMappings;
    setTicketPrioritizationEnabled(prioritizationEnabled);

    setSlaRows((currentRows) =>
      currentRows.map((row) => {
        const mapping = existingSlaMappings.find(
          (item: any) => String(item.priorityId) === row.priorityId,
        );
        if (!mapping) return { ...row, enabled: false, responseValue: "", resolutionValue: "" };
        const responseTime = splitMinutes(mapping.defaultResponseTimeMinutes);
        const resolutionTime = splitMinutes(mapping.defaultResolutionTimeMinutes);
        return {
          ...row,
          enabled: true,
          responseValue: responseTime.value,
          responseUnit: responseTime.unit,
          resolutionValue: resolutionTime.value,
          resolutionUnit: resolutionTime.unit,
        };
      }),
    );

    const existingResponseEscalationRules = category.responseEscalationRules ?? [];
    const existingResolutionEscalationRules = category.resolutionEscalationRules ?? [];

    setTicketEscalationEnabled(
      existingResponseEscalationRules.length > 0 || existingResolutionEscalationRules.length > 0,
    );

    const mapEscalationRules = (
      rules: any[],
      timeBreachType: "response" | "resolution",
    ) =>
      rules.length
        ? rules.map((rule: any, index: number) => {
          const triggerAfter = splitMinutes(rule.triggerAfterMinutes);
          return {
            id:
              rule.id !== undefined
                ? `${timeBreachType}-${rule.id}`
                : `${timeBreachType}-${Date.now()}-${index}`,
            level: rule.level ?? index + 1,
            triggerAfterValue: triggerAfter.value,
            triggerAfterUnit: triggerAfter.unit,
            timeBreachType,
            escalateToEmployeeId: String(rule.escalateToEmployeeId ?? ""),
          };
        })
        : [createEscalationRule(timeBreachType, 1)];

    setResponseEscalationEnabled(existingResponseEscalationRules.length > 0);
    setResolutionEscalationEnabled(existingResolutionEscalationRules.length > 0);
    setNotifyResponseBreach(category.notifyResponseBreach ?? false);
    setNotifyResolutionBreach(category.notifyResolutionBreach ?? false);
    setResponseEscalationRules(mapEscalationRules(existingResponseEscalationRules, "response"));
    setResolutionEscalationRules(
      mapEscalationRules(existingResolutionEscalationRules, "resolution"),
    );
    setNotifyOnCreate(false);
  };

  useEffect(() => {
    if (isAddPage) { resetForm(); return; }
    if (!categoryId) return;
    const loadCategory = async () => {
      try {
        const result = await getOneCategory(Number(categoryId)).unwrap();
        const category = result?.data ?? result;
        setSelectedCategory(category);
        populateForm(category);
      } catch (error) {
        console.error(error);
      }
    };
    loadCategory();
  }, [categoryId, isAddPage]);

  // ── Payload helpers ───────────────────────────────────────────────────────────

  const getEscalationRulePayload = (rules: EscalationRuleFormRow[], catId: number) =>
    rules
      .filter((rule) => rule.escalateToEmployeeId && Number(rule.triggerAfterValue) > 0)
      .map((rule) => ({
        categoryId: catId,
        level: rule.level,
        triggerAfterMinutes: convertToMinutes(rule.triggerAfterValue, rule.triggerAfterUnit),
        escalateToEmployeeId: Number(rule.escalateToEmployeeId),
      }));

  const getCategoryPayload = (catId = 0) => ({
    categoryName: categoryTitle,
    categoryLead: Number(categoryLead),
    defaultPriority: ticketPrioritizationEnabled
      ? Number(ticketPrioritizationDefaultPriority || priority)
      : undefined,
    description: categoryDescription || null,
    isSubCategory,
    parentId: isSubCategory && parentId ? Number(parentId) : null,
    members: assignedEmployees.map(Number),
    businessHourPolicyId: businessHourPolicyId ? Number(businessHourPolicyId) : undefined,
    enableOnHold,
    prioritizationEnabled: ticketPrioritizationEnabled,
    slaMappings: ticketPrioritizationEnabled
      ? slaRows
        .filter(
          (row) =>
            row.enabled &&
            row.priorityId &&
            Number(row.responseValue) > 0 &&
            Number(row.resolutionValue) > 0,
        )
        .map((row) => ({
          categoryId: catId,
          priorityId: Number(row.priorityId),
          defaultResponseTimeMinutes: convertToMinutes(row.responseValue, row.responseUnit),
          defaultResolutionTimeMinutes: convertToMinutes(row.resolutionValue, row.resolutionUnit),
        }))
      : undefined,
    responseEscalationRules:
      ticketEscalationEnabled && responseEscalationEnabled
        ? getEscalationRulePayload(responseEscalationRules, catId)
        : undefined,
    resolutionEscalationRules:
      ticketEscalationEnabled && resolutionEscalationEnabled
        ? getEscalationRulePayload(resolutionEscalationRules, catId)
        : undefined,
    notifyResponseBreach:
      ticketEscalationEnabled && responseEscalationEnabled ? notifyResponseBreach : false,
    notifyResolutionBreach:
      ticketEscalationEnabled && resolutionEscalationEnabled ? notifyResolutionBreach : false,
  });

  // ── Save / Update / Delete ────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      const response = await createCategory(getCategoryPayload()).unwrap();
      showSnackbar(response.message ?? "Category created successfully", "success");
      resetForm();
      navigate(TICKET_CATEGORY_SETTINGS_PATH);
    } catch (error) {
      console.error(error);
      showSnackbar(getBackendMessage(error, "Failed to create category"), "error");
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;
    try {
      const response = await updateCategory({
        id: selectedCategory.id,
        body: getCategoryPayload(selectedCategory.id),
      }).unwrap();
      showSnackbar(response.message ?? "Category updated successfully", "success");
      resetForm();
      navigate(TICKET_CATEGORY_SETTINGS_PATH);
    } catch (error) {
      console.error(error);
      showSnackbar(getBackendMessage(error, "Failed to update category"), "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      const response = await deleteCategory(selectedCategory.id).unwrap();
      showSnackbar(response.message ?? "Category deleted successfully", "success");
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error(error);
      showSnackbar(getBackendMessage(error, "Failed to delete category"), "error");
    }
  };

  // ── Escalation helpers ────────────────────────────────────────────────────────

  const updateSlaRow = (priorityId: string, changes: Partial<Omit<SlaFormRow, "priorityId">>) =>
    setSlaRows((rows) =>
      rows.map((row) => (row.priorityId === priorityId ? { ...row, ...changes } : row)),
    );

  const resequenceEscalationRules = (rules: EscalationRuleFormRow[]) =>
    rules.map((rule, index) => ({ ...rule, level: index + 1 }));

  const updateEscalationRule = (
    type: "response" | "resolution",
    index: number,
    changes: Partial<EscalationRuleFormRow>,
  ) => {
    const setter = type === "response" ? setResponseEscalationRules : setResolutionEscalationRules;
    setter((rules) =>
      rules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...changes } : rule)),
    );
  };

  const addEscalationRule = (type: "response" | "resolution") => {
    const setter = type === "response" ? setResponseEscalationRules : setResolutionEscalationRules;
    setter((rules) => [...rules, createEscalationRule(type, rules.length + 1)]);
  };

  const removeEscalationRule = (type: "response" | "resolution", index: number) => {
    const setter = type === "response" ? setResponseEscalationRules : setResolutionEscalationRules;
    setter((rules) =>
      resequenceEscalationRules(rules.filter((_, ruleIndex) => ruleIndex !== index)),
    );
  };

  const handleEscalationDragEnd = (type: "response" | "resolution", event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const setter = type === "response" ? setResponseEscalationRules : setResolutionEscalationRules;
    setter((rules) => {
      const oldIndex = rules.findIndex((rule) => rule.id === active.id);
      const newIndex = rules.findIndex((rule) => rule.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return rules;
      return resequenceEscalationRules(arrayMove(rules, oldIndex, newIndex));
    });
  };

  // ── Form body ─────────────────────────────────────────────────────────────────

  const formBody = (
    <>
      <Box width="100%" display="flex" gap={1} my={1}>
        <TextFieldElement
          label="Category Title *"
          width="50%"
          value={categoryTitle}
          onChange={(e) => setCategoryTitle(e.target.value)}
        />
          <TextFieldElement
          label="Category Description"
          width="50%"
          value={categoryDescription}
          onChange={(e) => setCategoryDescription(e.target.value)}
        />
      
      </Box>

     

      <Box width="100%" display="flex" gap={1} my={2}>
          <SingleSelectElement
          label="Category Lead *"
          value={categoryLead}
          onChange={setCategoryLead}
          options={employeeOptions}
          sx={{ width: "50%" }}
        />
        <MultiSelectElement
          label="Assign Members"
          value={assignedEmployees}
          onChange={setAssignedEmployees}
          options={employeeOptions}
          sx={{ width: "50%" }}
        />
        <SingleSelectElement
          label="Business Hour Policy"
          value={businessHourPolicyId}
          onChange={setBusinessHourPolicyId}
          options={businessHourPolicyOptions}
          sx={{ width: "50%" }}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        gap={2}
        my={1}
      >
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Checkbox
            label="This is a sub-category"
            checked={isSubCategory}
            onChange={() => { setIsSubCategory(!isSubCategory); if (isSubCategory) setParentId(""); }}
          />
          {isSubCategory && (
            <SingleSelectElement
              label="Parent Category *"
              value={parentId}
              onChange={setParentId}
              options={parentCategoryOptions}
              sx={{ minWidth: 200 }}
            />
          )}
        </Box>

        <Checkbox
          label="Notify assigned employees when a ticket is created in this category"
          checked={notifyOnCreate}
          onChange={() => setNotifyOnCreate(!notifyOnCreate)}
        />

        <Checkbox
          label="Enable on-hold status for tickets in this category"
          checked={enableOnHold}
          onChange={() => setEnableOnHold(!enableOnHold)}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Ticket Prioritization */}
      <Box width="100%" border="1px solid #e0e0e0" borderRadius={2} p={2} my={2}>
        <Box display="flex" alignItems="center" gap={0} mb={2}>
          <ToggleSwitch
            label="Ticket Prioritization"
            checked={ticketPrioritizationEnabled}
            onChange={(e) => setTicketPrioritizationEnabled(e.target.checked)}
            color="secondary"
          />
        </Box>

        {ticketPrioritizationEnabled && (
          <Box display="flex" flexDirection="column" gap={2}>
            {slaRows.map((row) => {
              const option = ticketPrioritizationPriorityOptions.find(
                (o: any) => o.value === row.priorityId,
              );
              return (
                <Box
                  key={row.priorityId}
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr", md: "220px 1fr 1fr" }}
                  gap={2}
                  alignItems="center"
                  bgcolor="#f5f6f8"
                  borderRadius={1}
                  p={2}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <ToggleSwitch
                      label={option?.label ?? "Priority"}
                      checked={row.enabled}
                      onChange={(e) => updateSlaRow(row.priorityId, { enabled: e.target.checked })}
                      color="secondary"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextFieldElement
                      label="First Response time"
                      type="number"
                      value={row.responseValue}
                      onChange={(e) => updateSlaRow(row.priorityId, { responseValue: e.target.value })}
                      disabled={!row.enabled}
                      width="50%"
                    />
                    <SingleSelectElement
                      label="Unit"
                      value={row.responseUnit}
                      onChange={(value) => updateSlaRow(row.priorityId, { responseUnit: value as TimeUnit })}
                      options={TIME_UNIT_OPTIONS}
                      disabled={!row.enabled}
                      sx={{ width: "50%" }}
                    />
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextFieldElement
                      label="Expected resolution time"
                      type="number"
                      value={row.resolutionValue}
                      onChange={(e) => updateSlaRow(row.priorityId, { resolutionValue: e.target.value })}
                      disabled={!row.enabled}
                      width="50%"
                    />
                    <SingleSelectElement
                      label="Unit"
                      value={row.resolutionUnit}
                      onChange={(value) => updateSlaRow(row.priorityId, { resolutionUnit: value as TimeUnit })}
                      options={TIME_UNIT_OPTIONS}
                      disabled={!row.enabled}
                      sx={{ width: "50%" }}
                    />
                  </Box>
                </Box>
              );
            })}

            <Box mt={1}>
              <Typography fontWeight={600} mb={1}>
                Default priority for tickets in this category
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {priorityOptions
                  .filter(
                    (option: any) =>
                      option.label?.trim().toLowerCase() !== "not applicable" &&
                      slaRows.some((row) => row.priorityId === option.value && row.enabled),
                  )
                  .map((option: any) => (
                    <FormControlLabel
                      key={option.value}
                      control={
                        <Radio
                          checked={ticketPrioritizationDefaultPriority === option.value}
                          onChange={() => setTicketPrioritizationDefaultPriority(option.value)}
                          color="secondary"
                        />
                      }
                      label={option.label}
                    />
                  ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Ticket Escalation */}
      <Box width="100%" border="1px solid #e0e0e0" borderRadius={2} p={2} my={2}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ToggleSwitch
            label="Ticket Escalation"
            checked={ticketEscalationEnabled}
            onChange={(e) => setTicketEscalationEnabled(e.target.checked)}
            color="secondary"
          />
        </Box>

        {ticketEscalationEnabled && (
          <Box display="flex" flexDirection="column" gap={2}>
            {/* <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <ToggleSwitch
                  label=""
                  checked={responseEscalationEnabled}
                  onChange={(e) => setResponseEscalationEnabled(e.target.checked)}
                  color="secondary"
                  size="small"
                />
                <Typography fontWeight={600}>Response breach</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <ToggleSwitch
                  label=""
                  checked={resolutionEscalationEnabled}
                  onChange={(e) => setResolutionEscalationEnabled(e.target.checked)}
                  color="secondary"
                  size="small"
                />
                <Typography fontWeight={600}>Resolution breach</Typography>
              </Box>
            </Box> */}

            {/* <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
              <Checkbox
                label="Notify Response Breach"
                checked={notifyResponseBreach}
                onChange={() => setNotifyResponseBreach(!notifyResponseBreach)}
              />
              <Checkbox
                label="Notify Resolution Breach"
                checked={notifyResolutionBreach}
                onChange={() => setNotifyResolutionBreach(!notifyResolutionBreach)}
              />
            </Box> */}

<Divider/>
            {responseEscalationEnabled && (
              <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                <ToggleSwitch
                  label="Response Breach Escalation"
                  checked={responseEscalationEnabled}
                  onChange={(e) => setResponseEscalationEnabled(e.target.checked)}
                  color="secondary"
                  size="small"
                  bold={true}
                />
                <Stack direction="row" alignItems="center" spacing={2} >
                  <Typography fontWeight={600}>Response Levels</Typography>
                  <PrimaryIconButton icon={<Add />} variant="outlined" onClick={() => addEscalationRule("response")} />

                </Stack>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleEscalationDragEnd("response", e)}
                >
                  <SortableContext
                    items={responseEscalationRules.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {responseEscalationRules.map((rule, index) => (
                        <SortableEscalationRule
                          key={rule.id}
                          rule={rule}
                          index={index}
                          employeeOptions={employeeOptions}
                          canRemove={responseEscalationRules.length > 1}
                          onUpdate={(i, changes) => updateEscalationRule("response", i, changes)}
                          onRemove={(i) => removeEscalationRule("response", i)}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
                <Checkbox
                  label="Notify Response Breach"
                  checked={notifyResponseBreach}
                  onChange={() => setNotifyResponseBreach(!notifyResponseBreach)}
                />
              </Box>
            )}
<Divider/>
            {resolutionEscalationEnabled && (
              <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                <ToggleSwitch
                  label="Resolution Breach Escalation"
                  checked={resolutionEscalationEnabled}
                  onChange={(e) => setResolutionEscalationEnabled(e.target.checked)}
                  color="secondary"
                  size="small"
                  bold={true}
                />
                <Stack direction="row" alignItems="center" spacing={2} >
                  <Typography fontWeight={600}>Resolution Levels</Typography>
                  <PrimaryIconButton icon={<Add />} variant="outlined" onClick={() => addEscalationRule("resolution")} />

                </Stack>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleEscalationDragEnd("resolution", e)}
                >
                  <SortableContext
                    items={resolutionEscalationRules.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {resolutionEscalationRules.map((rule, index) => (
                        <SortableEscalationRule
                          key={rule.id}
                          rule={rule}
                          index={index}
                          employeeOptions={employeeOptions}
                          canRemove={resolutionEscalationRules.length > 1}
                          onUpdate={(i, changes) => updateEscalationRule("resolution", i, changes)}
                          onRemove={(i) => removeEscalationRule("resolution", i)}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
                <Checkbox
                  label="Notify Resolution Breach"
                  checked={notifyResolutionBreach}
                  onChange={() => setNotifyResolutionBreach(!notifyResolutionBreach)}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );

  // ── Form page ─────────────────────────────────────────────────────────────────

  if (isFormPage) {
    const isSaving = isCreating || isUpdating;
    const pageTitle = isEditPage ? "Edit Category" : "Add Category";

    return (
      <Card elevation={2} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          borderBottom="1px solid #e0e0e0"
          bgcolor="#fafafa"
          px={2}
          py={1.5}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <PrimaryIconButton icon={<ArrowBack />} variant="outlined" onClick={() => navigate(-1)} />
            <Box>
              <Typography variant="h6" fontWeight={600}>{pageTitle}</Typography>
              <Typography variant="caption" color="text.secondary">
                Configure category assignment, SLA, and escalation settings
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box flex={1} overflow="auto" p={2.5}>
          {isEditPage && isFetchingCategory ? (
            <Box py={4} textAlign="center">Loading…</Box>
          ) : (
            <>
              {formBody}
              <Box
                display="flex"
                justifyContent="flex-end"
                pt={2}
                mt={2}
                borderTop="1px solid #e0e0e0"
              >
                <PrimaryButton
                  onClick={isEditPage ? handleUpdate : handleSave}
                  loading={isSaving}
                  disabled={isEditPage && isFetchingCategory}
                >
                  {isEditPage ? "Update" : "Save"}
                </PrimaryButton>
              </Box>
            </>
          )}
        </Box>
      </Card>
    );
  }

  // ── List page ─────────────────────────────────────────────────────────────────

  // ── List page ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <MenuAtom
          items={[
            {
              label: "Choose from predefined categories",
              onClick() {
                closeMenu();
              },
            },
            {
              label: "Create from scratch",
              onClick() {
                resetForm();
                navigate("/people/helpdesk/categories/add");
                closeMenu();
              },
            },
          ]}
          onCloseAll={closeMenu}
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
        />
      </Box>

      {/* Remaining space */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // important for internal scroll
          overflow: "auto",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            alignContent: "start",
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                gridColumn: "1/-1",
                display: "flex",
                justifyContent: "center",
                py: 6,
              }}
            >
              <Typography color="text.secondary">
                Loading…
              </Typography>
            </Box>
          ) : filteredCategories.length === 0 ? (
            <Box
              sx={{
                gridColumn: "1/-1",
                display: "flex",
                justifyContent: "center",
                py: 6,
              }}
            >
              <Typography fontSize={13} color="text.secondary">
                {searchText
                  ? "No categories match your search."
                  : "No categories found."}
              </Typography>
            </Box>
          ) : (
            filteredCategories.map((category: any) => (
              <CategoryCard
                key={category.id}
                category={category}
                employeesData={employeesData}
                onEdit={(id) =>
                  navigate(
                    `/people/helpdesk/categories/edit/${id}`
                  )
                }
                onDelete={(cat) => {
                  setSelectedCategory(cat);
                  setDeleteDialogOpen(true);
                }}
              />
            ))
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Category"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>{selectedCategory?.categoryName}</strong>?
            Categories with active tickets cannot be deleted.
          </>
        }
        confirmText="Delete"
        confirmColor="error"
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
});