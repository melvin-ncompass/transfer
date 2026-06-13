import { forwardRef } from "react";
import { EarningsSection, type EarningsSectionRef } from "./components/EarningsSection";

export const EarningsView = forwardRef<EarningsSectionRef>((_, ref) => {
  return (
    <EarningsSection ref={ref} />
  );
});

EarningsView.displayName = 'EarningsView';