import { forwardRef } from "react";
import {  WeekOffDetails, type WeekOffRef } from "./components/WeekOffDetails"


const WeekOffsView = forwardRef<WeekOffRef>((_, ref) => {
  return <WeekOffDetails ref={ref} />;
});

export default WeekOffsView;