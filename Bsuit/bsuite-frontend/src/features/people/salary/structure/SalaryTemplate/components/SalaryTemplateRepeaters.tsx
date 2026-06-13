import { Box, Typography } from "@mui/material";
import { RepeaterDnD } from "../../../../../../components/atom/form-repeater/DndRepeater";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { useEffect, useMemo } from "react";
import { formatNumberByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";

export interface EarningItem {
  earningComponent: string | null;
  calculationType: string;
  monthlyAmount: number;
  annualAmount: number;
}

export interface DeductionItem {
  deductionComponent: string | null;
  calculationType: string;
  monthlyAmount: number;
  annualAmount: number;
}

// ---------------- Earning ----------------
interface EarningRepeaterProps {
  items: EarningItem[];
  setItems: (items: EarningItem[]) => void;
  earningsData: any[];
  width?: string | number;
  height?: string | number;
  annualGross?: number;
  fixedAllowance?: number;
}

export function EarningRepeater({
  items,
  setItems,
  earningsData,
  width = "100%",
  height = "100%",
  annualGross = 0,
  fixedAllowance,
}: EarningRepeaterProps) {
  const { data: headerData } = useGetHeaderDataQuery();
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";
  const findDuplicate = (values: (string | null)[]) => {
    const seen = new Set<string>();
    for (const val of values) {
      if (!val) continue;
      if (seen.has(val)) return val;
      seen.add(val);
    }
    return null;
  };

  const getEarning = (id: string | number) =>
    earningsData.find((e) => String(e.id) === String(id));

  const getOtherSelectedEarningIds = (index: number) =>
    items
      .filter((_, i) => i !== index)
      .map((item) => item.earningComponent)
      .filter((id): id is string => Boolean(id));

  // ---------------- Calculate all earnings with dependencies ----------------
  const calculateEarningsWithDependencies = (currentItems: EarningItem[]) => {
    let updatedItems = [...currentItems];

    // ---------------- Auto-add missing parents for non-gross percentage ----------------
    const ensureParents = () => {
      let added = false;
      for (const item of updatedItems) {
        // Skip Fixed Allowance
        if (
          fixedAllowance &&
          item.earningComponent === fixedAllowance.toString()
        )
          continue;
        const earning = getEarning(item.earningComponent!);
        if (!earning) continue;
        if (
          earning.calculationType === "percentage" &&
          earning.percentageOf &&
          earning.percentageOf !== "gross"
        ) {
          const parentId = String(earning.percentageOf);
          const parentExists = updatedItems.some(
            (i) => i.earningComponent === parentId,
          );
          if (!parentExists) {
            const parentEarning = getEarning(parentId);
            if (parentEarning) {
              const parentItem: EarningItem = {
                earningComponent: parentId,
                calculationType: parentEarning.calculationType,
                monthlyAmount: 0,
                annualAmount: 0,
              };
              const index = updatedItems.indexOf(item);
              updatedItems.splice(index + 1, 0, parentItem);
              added = true;
            }
          }
        }
      }
      if (added) ensureParents(); // recursively ensure multi-level parents
    };

    ensureParents();

    // ---------------- Recalculate amounts ----------------
    const calculateItem = (item: EarningItem): EarningItem => {
      // Skip Fixed Allowance, let parent control its value
      if (
        fixedAllowance &&
        item.earningComponent === fixedAllowance.toString()
      ) {
        return item;
      }
      const earning = getEarning(item.earningComponent!);
      if (!earning) return item;
      let monthlyAmount = 0;
      if (earning.calculationType === "amount") {
        monthlyAmount = Number(earning.amount || 0);
      } else if (earning.calculationType === "percentage") {
        if (earning.percentageOf === "gross") {
          monthlyAmount =
            (Number(annualGross || 0) / 12) *
            (Number(earning.percentage || 0) / 100);
        } else if (earning.percentageOf) {
          const ref = updatedItems.find(
            (i) => i.earningComponent === String(earning.percentageOf),
          );
          monthlyAmount =
            (Number(earning.percentage || 0) *
              Number(ref?.monthlyAmount || 0)) /
            100;
        }
      }
      return {
        ...item,
        calculationType: earning.calculationType,
        monthlyAmount: Math.round(monthlyAmount),
        annualAmount: Math.round(Math.round(monthlyAmount) * 12),
      };
    };

    // Stabilize amounts in case of multi-level dependencies
    let stabilized = false;
    while (!stabilized) {
      const oldItems = updatedItems.map((i) => i.monthlyAmount);
      updatedItems = updatedItems.map(calculateItem);
      const newItems = updatedItems.map((i) => i.monthlyAmount);
      stabilized = oldItems.every((amt, idx) => amt === newItems[idx]);
    }
    return updatedItems;
  };

  const handleComponentChange = (index: number, value: string) => {
    let newItems = [...items];
    newItems[index] = { ...newItems[index], earningComponent: value };
    newItems = calculateEarningsWithDependencies(newItems);
    setItems(newItems);
  };

  useEffect(() => {
    const duplicate = findDuplicate(items.map((i) => i.earningComponent));
    if (duplicate) console.warn("Duplicate earning component:", duplicate);
  }, [items]);
  useEffect(() => {
    if (!items.length) return;

    const recalculated = calculateEarningsWithDependencies(items);

    const isSame = recalculated.every(
      (item, i) =>
        item.monthlyAmount === items[i]?.monthlyAmount &&
        item.annualAmount === items[i]?.annualAmount
    );

    if (!isSame) {
      setItems(recalculated);
    }
  }, [annualGross]);

  const salaryGrid = {
    width: "100%",
    display: "grid",
    gap: 1,
    p: 1,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "40px 1fr",
      md: "5% 25% 19% 16% 15% 5% 5%",
    },
    alignItems: "center",
  };
  return (
    <Box sx={{ width: width, height: height, overflow: "auto" }}>
      <RepeaterDnD<EarningItem>
        label="Earnings"
        items={items}
        setItems={setItems}
        initialItem={{
          earningComponent: "",
          calculationType: "",
          monthlyAmount: 0,
          annualAmount: 0,
        }}
        gridcol={true}
        disableDelete={(item, index) => {
          return (
            items.length === 1 ||
            Boolean(
              fixedAllowance &&
              item.earningComponent &&
              item.earningComponent == fixedAllowance.toString(),
            )
          );
        }}
        header={
          <Box sx={salaryGrid}>
            <div />
            <Typography variant="caption">Earning Component</Typography>
            <Typography variant="caption">Calculation Type</Typography>
            <Typography sx={{ textAlign: "right" }} variant="caption">Monthly Amount</Typography>
            <Typography sx={{ textAlign: "right" }} variant="caption">Annual Amount</Typography>
            <div />
          </Box>
        }
        renderItem={(item, index) => {
          const earning = earningsData.find(
            (e) => String(e.id) === String(item.earningComponent)
          );

          let calculationLabel = "";

          if (earning?.calculationType === "amount") {
            calculationLabel = "Fixed Amount";
          } else if (earning?.percentage) {
            calculationLabel = `${earning.percentage}%`;
          }

          if (earning?.calculationType === "percentage") {
            calculationLabel += " of ";

            if (earning.percentageOf === "gross") {
              calculationLabel += "gross";
            } else {
              const base = earningsData.find(
                (e) => String(e.id) === String(earning.percentageOf)
              );
              calculationLabel += base?.earningName || "";
            }
          }
          // const currentItem = useMemo(() => { earningsData.find((e) => e.id == item.earningComponent) }, [items])
          return (
            <>
              <SingleSelectElement
                value={item.earningComponent!}
                label="Earning Component"
                options={earningsData
                  .filter((e) => {
                    if (String(e.id) === String(fixedAllowance)) {
                      return item.earningComponent === String(fixedAllowance);
                    }
                    return e.isActive && e.earningFrequency === "recurring";
                  })
                  .map((e) => ({
                    label: e.earningName,
                    value: String(e.id),
                  }))
                  .filter((option) => {
                    const used = getOtherSelectedEarningIds(index);
                    return (
                      option.value === item.earningComponent ||
                      !used.includes(option.value)
                    );
                  })
                }
                sx={{ width: "100%" }}
                onChange={(val) => handleComponentChange(index, val)}
                disabled={Boolean(
                  fixedAllowance &&
                  item.earningComponent === String(fixedAllowance)
                )}
              />
              <Typography
                sx={{ textAlign: "center" }}
                variant="caption"
              >
                {calculationLabel}
              </Typography>
              {/* Column 3 */}{" "}
              <Typography
                sx={{
                  textAlign: { xs: "center", md: "right" },
                  fontSize: "1rem",
                }}
              >
                {
                  formatNumberByCommaSeparation(
                    Math.round(item.monthlyAmount),
                    commaseperation,
                  ).split(".")[0]
                }{" "}
              </Typography>{" "}
              {/* Column 4 */}{" "}
              <Typography
                sx={{
                  textAlign: { xs: "center", md: "right" },
                  fontSize: "1rem",
                }}
              >
                {
                  formatNumberByCommaSeparation(
                    Math.round(item.annualAmount),
                    commaseperation,
                  ).split(".")[0]
                }
              </Typography>
            </>
          )
        }}
      />
    </Box>
  );
}

// ---------------- Deductions ----------------
interface DeductionsRepeaterProps {
  items: DeductionItem[];
  setItems: (items: DeductionItem[]) => void;
  deductionsData: any[];
  width?: string | number;
  height?: string | number;
}

export function DeductionsRepeater({
  items,
  setItems,
  deductionsData,
  width = "100%",
  height = "100%",
}: DeductionsRepeaterProps) {
  const { data: headerData } = useGetHeaderDataQuery();
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";
  const findDuplicate = (values: (string | null)[]) => {
    const seen = new Set<string>();
    for (const val of values) {
      if (!val) continue;
      if (seen.has(val)) return val;
      seen.add(val);
    }
    return null;
  };

  const getOtherSelectedDeductionIds = (index: number) =>
    items
      .filter((_, i) => i !== index)
      .map((item) => item.deductionComponent)
      .filter((id): id is string => Boolean(id));

  const handleComponentChange = (index: number, value: string) => {
    const earning = deductionsData.find((d) => String(d.id) === value);
    if (!earning) return;
    const newItems = [...items];
    newItems[index] = {
      deductionComponent: value,
      calculationType: earning.calculationType,
      monthlyAmount: Number(earning.amount || 0),
      annualAmount: Number(earning.amount || 0) * 12,
    };
    setItems(newItems);
  };

  useEffect(() => {
    const duplicate = findDuplicate(items.map((i) => i.deductionComponent));
    if (duplicate) console.warn("Duplicate deduction component:", duplicate);
  }, [items]);
  const salaryGrid = {
    width: "100%",
    display: "grid",
    gap: 1,
    p: 1,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "40px 1fr",
      md: "5% 25% 19% 16% 15% 5% 5%",
    },
    alignItems: "center",
  };
  return (
    <Box sx={{ width: width, height: height, overflow: "auto" }}>
      <RepeaterDnD<DeductionItem>
        label="Deductions"
        items={items}
        setItems={setItems}
        initialItem={{
          deductionComponent: "",
          calculationType: "",
          monthlyAmount: 0,
          annualAmount: 0,
        }}
        header={
          <Box sx={salaryGrid}>
            <div />
            <Typography variant="caption">Deduction Component</Typography>
            <Typography variant="caption">Calculation Type</Typography>
            <Typography sx={{ textAlign: "right" }} variant="caption">Monthly Amount</Typography>
            <Typography sx={{ textAlign: "right" }} variant="caption">Annual Amount</Typography>
            <div />
          </Box>
        }
        renderItem={(item, index) => (
          <>
            <SingleSelectElement
              value={item.deductionComponent!}
              label="Deduction Component"
              options={deductionsData
                .filter(
                  (d) =>
                    d.deductionName !== "PF- Employee Contribution" &&
                    d.deductionName !== "PF- Employer Contribution" &&
                    d.isActive &&
                    d.deductionFrequency === "recurring"
                )
                .map((d) => ({
                  label: d.deductionName,
                  value: String(d.id),
                }))
                .filter((option) => {
                  const used = getOtherSelectedDeductionIds(index);
                  return (
                    option.value === item.deductionComponent ||
                    !used.includes(option.value)
                  );
                })
              }
              onChange={(val) => handleComponentChange(index, val)}
            />
            <Typography
              variant="caption"
            >
              {item.calculationType === "amount"
                ? "Fixed Amount"
                : item.calculationType === "percentage"
                  ? "Percentage"
                  : ""}
            </Typography>
            {/* Column 3 */}
            <Typography
              sx={{
                textAlign: { xs: "center", md: "right" },
                fontSize: "1rem",

              }}
            >
              {
                formatNumberByCommaSeparation(
                  Math.round(item.monthlyAmount),
                  commaseperation,
                ).split(".")[0]
              }
            </Typography>
            {/* Column 4 */}{" "}
            <Typography
              sx={{
                textAlign: { xs: "center", md: "right" },
                fontSize: "1rem",

              }}
            >
              {
                formatNumberByCommaSeparation(
                  Math.round(item.annualAmount),
                  commaseperation,
                ).split(".")[0]
              }
            </Typography>
          </>
        )}
      />
    </Box>
  );
}
