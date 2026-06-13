
import { useState } from "react";
import Sidebar from "../Sidebar";

export default function Mindmaps() {
      const [openSidebar, setOpenSidebar] = useState(true);
  
  return (
    <div>
        <Sidebar open={openSidebar} setOpen={setOpenSidebar} />

        
        <h1>Mindmaps Page</h1>
    </div>
  )
}
