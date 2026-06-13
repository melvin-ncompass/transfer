import { forwardRef } from "react";
import { DeductionsSection, type DeductionsSectionRef } from "./components/DeductionsSection";

export const DeductionsView = forwardRef<DeductionsSectionRef>((_, ref) => {
    return (
        <DeductionsSection ref={ref} />
    );
});