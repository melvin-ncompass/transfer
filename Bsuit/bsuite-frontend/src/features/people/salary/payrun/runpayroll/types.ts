export type NonRecurringKind = "earning" | "deduction";

export type NonRecurringDraftRow = {
  id: number;
  componentId: string;
  monthlyAmount: string;
};

export type RemoveOption = { componentId: number; label: string };

export type LopAction = "add_lop" | "remove_lop";
