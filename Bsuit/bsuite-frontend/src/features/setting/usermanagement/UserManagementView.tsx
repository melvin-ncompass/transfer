import { Card } from "@mui/material";
import { Header } from "./components/header/Header";
import UserTable from "./components/table/UserTable";
import { PermissionGuard } from "../../../guards/ComponentGuard";

export default function UserManagementView({ data }: any) {
  return (
    <PermissionGuard permission="view_user_management">
      
      <Card
        id="user-management-section"
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Header />
        <UserTable data={data} />
      </Card>
    </PermissionGuard>
  );
}
