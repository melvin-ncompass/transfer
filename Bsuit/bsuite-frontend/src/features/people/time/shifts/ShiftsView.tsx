import { forwardRef } from "react";
import { ShiftDetails, type ShiftDetailsRef } from "./components/ShiftDetails"


const ShiftsView = forwardRef<ShiftDetailsRef>((_, ref) => {
  return <ShiftDetails ref={ref} />;
});

export default ShiftsView;