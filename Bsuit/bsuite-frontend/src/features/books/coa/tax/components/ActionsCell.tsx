import { IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";
import {
  openDeleteModal,
  openEditModal,
} from "../../../coa/tax/taxSlice";
import { useDispatch } from "react-redux";
import MenuAtom, { type MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";

const ActionsCell = ({ params, onEdit, onDelete }: any) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event: any) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const dispatch = useDispatch();

  const menuItems: MenuAtomItem[] = [
    {
      label: "Edit",
      onClick: () => {
        dispatch(openEditModal(params.row));
        handleClose();
      },
      disableAutoClose: true,
    },
    {
      label: "Delete",
      onClick: () => {
        dispatch(openDeleteModal(params.row));
        handleClose();
      },
      disableAutoClose: true,
    },
  ];

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon />
      </IconButton>

      <MenuAtom
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onCloseAll={handleClose}
        items={menuItems}
      />
    </>
  );
};

export default ActionsCell;
