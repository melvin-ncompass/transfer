import { Box } from "@mui/material";
import COAHome from "../features/books/coa/views/CoaHomeView";

export default function BooksHomePage() {
  return (
    <Box sx={{borderRadius:"3px 3px 0 0",backgroundColor:"#fff",padding:"20px"}}>
      <COAHome />
    </Box>
  )
}
