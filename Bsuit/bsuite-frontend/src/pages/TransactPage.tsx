import { Box, Card } from "@mui/material";
import { TransactHomeView } from "../features/books/transact/views/TransactHomeView";

export default function TransactHomepage() {
  return (
    <Card sx={{backgroundColor:"#fff", padding:"10px" }}>
      <TransactHomeView />
    </Card>
  )
}
