import { forwardRef } from "react";
import type { TabSectionRef } from "../../salary/structure/SalaryStructureView";
import { TimesheetsSection } from "./components/TimesheetsSection";

const TimesheetsView = forwardRef<TabSectionRef>((_, ref) => {
  return <TimesheetsSection />;
});

TimesheetsView.displayName = "TimesheetsView";

export default TimesheetsView;
