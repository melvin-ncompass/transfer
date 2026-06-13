import { Box } from "@mui/system";
import { StandardTable } from "../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../types/types";
import { IconButton } from "@mui/material";
import { Add, MoreVert } from "@mui/icons-material";
import MenuAtom, {
  type MenuAtomItem,
} from "../../../../../components/menuatom/MenuAtom";
import { useState } from "react";
import { TabsAtom, type TabItem } from "../../../../../components/tabs";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import { useNavigate } from "react-router-dom";

function DocumentTemplateView({ hideTabs = false, activeTab = 0 }: { hideTabs?: boolean; activeTab?: number }) {
  // -----
  // Hooks
  // -----
  const navigate = useNavigate();
  // ---------------
  // State Variables
  // ---------------
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number | null>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  //   ----------------
  //   Helper Functions
  //   ----------------
  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
  };
  const handleTabChange = (index: number) => {
    console.log(index);
    if (index === 0) {
      console.log("Show Active Templates");
    } else if (index === 1) {
      console.log("Show Archived Templates");
    }
  };
  // ------------------
  // Constant Variables
  // ------------------

  const tabs: TabItem[] = [
    {
      label: "Active",
    },
    {
      label: "Archive",
    },
  ];
  const menuItems: MenuAtomItem[] = [
    {
      label: "Edit",
      onClick: () => {
        console.log("edit clicked");
        console.log(selectedRow);
        closeMenu();
      },
    },
    {
      label: "Delete",
      onClick: () => {
        console.log("delete clicked");
        console.log(selectedRow);
        closeMenu();
      },
    },
  ];
  const columns: StandardTableColumn[] = [
    {
      id: "name",
      label: "Name",
    },
    {
      id: "createdBy",
      label: "Created by",
    },
    {
      id: "lastUsed",
      label: "Last Used",
    },
    {
      id: "lastUpdatedBy",
      label: "Last Updated by",
    },
    {
      id: "actions",
      label: "Actions",
      render(row) {
        return (
          <>
            <IconButton
              onClick={(e) => {
                setMenuOpen(true);
                setSelectedRow(row.id);
                openMenu(e);
              }}
            >
              <MoreVert />
            </IconButton>
            {/* Menu for edit and delete */}
            <MenuAtom
              items={menuItems}
              onCloseAll={() => {
                setMenuOpen(false);
              }}
              open={menuOpen}
              anchorEl={menuAnchor}
            />
          </>
        );
      },
    },
  ];
  const rows: any[] = [];

  if (hideTabs) {
    return <StandardTable rows={rows} columns={columns} />;
  }

  return (
    <Box>
      <TabsAtom
        tabs={tabs}
        onChange={(n) => {
          handleTabChange(n);
        }}
        action={
          <>
            <PrimaryIconButton
              icon={<Add fontSize="small" />}
              onClick={() => {
                console.log("Add Clicked");
                navigate("/people/document/template/add");
              }}
              variant="outlined"
            />
          </>
        }
      />
      <StandardTable rows={rows} columns={columns} />
    </Box>
  );
}

export default DocumentTemplateView;
