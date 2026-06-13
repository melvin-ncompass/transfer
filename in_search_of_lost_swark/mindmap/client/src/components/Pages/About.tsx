import { useState } from "react";
import Sidebar from "../Sidebar";

export default function About() {
    const [openSidebar, setOpenSidebar] = useState(true);
  
  return (
    <div>
      <Sidebar open={openSidebar} setOpen={setOpenSidebar} />

      <h1>About Page</h1>
    </div>
  )
}
