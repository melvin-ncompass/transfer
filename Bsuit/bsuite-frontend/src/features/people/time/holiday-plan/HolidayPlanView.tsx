
import { forwardRef } from "react";
import { HolidayPlanDetails, type HolidayPlanRef } from "./components/HolidayPlanDetails";

export const HolidayPlanView = forwardRef<HolidayPlanRef>((_, ref) => {
    return <HolidayPlanDetails ref={ref} />;
});

export default HolidayPlanView;
