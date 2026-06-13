import React, { useState, useEffect } from "react";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import {
  Box,
  FormControlLabel,
  List,
  ListItem,
  Typography,
  Divider,
} from "@mui/material";
import { Checkbox } from "../../../../components/atom/check-box";
import { PrimaryButton } from "../../../../components/atom/button";
import { SearchBoxAtom } from "../../../../components/searchbar/SearchBoxAtom"; // Import SearchBoxAtom
import { Chip } from "../../../../components/atom/chips";
import type { IRoleUser } from "../../types/rba.types";

interface IUser {
  userId: string;
  userName: string;
}

interface IManageUserModal {
  roleId: string;
  open: boolean;
  onClose: () => void;
  allUser: IUser[]; // Full user list
  modalAssignedUsers: IRoleUser[]; // Assigned users for this role
  onSave: (selectedUserIds: string[]) => void;
}

const ManageUserModal: React.FC<IManageUserModal> = ({
  open,
  onClose,
  allUser,
  modalAssignedUsers,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>(allUser);

  // Prefill the selectedIds from modalAssignedUsers when the modal is opened
  useEffect(() => {
    if (open) {
      const preselectedIds = modalAssignedUsers.map((user) => user.id);
      setSelectedIds(preselectedIds);
    }
  }, [modalAssignedUsers, open]);

  // Filter users based on search input
  const handleFilteredUsers = (filtered: IUser[]) => {
    setFilteredUsers(filtered);
  };

  // Checkbox states
  const allSelected =
    allUser.length > 0 && selectedIds.length === allUser.length;
  const selectedCount = selectedIds.length;

  // Toggle Select All
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allUser.map((u) => u.userId));
    }
  };

  // Toggle individual user
  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  // Save handler
  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  return (
    <ModalElement open={open} title="Manage Users" onClose={onClose}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Search Box */}
        <SearchBoxAtom<IUser>
          data={allUser}
          searchKeys={["userName"]}
          onFilteredData={handleFilteredUsers}
          placeholder="Search users..."
          size="small"
        />

        {/* Select All Checkbox */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "16px",
            marginBottom: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox checked={allSelected} onChange={toggleSelectAll} />
            }
            label="Select All"
            sx={{
              marginRight: 2,
              display: "flex",
              alignItems: "center",
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Chip
              label={String(selectedCount)}
              sx={{ marginRight: 1, height: 30, fontSize: "14px" }}
            />
            user{selectedCount !== 1 ? "s" : ""} selected
          </Typography>
        </Box>

        <Divider />

        {/* User List */}
        <Box
          sx={{
            maxHeight: 250,
            overflowY: "auto",
            pr: 1,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888", // Light grey color for scrollbar thumb
              borderRadius: 6,
              "&:hover": {
                backgroundColor: "#555", // Darker grey on hover
              },
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1", // Light background for the track
              borderRadius: 6,
            },
          }}
        >
          {filteredUsers.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ padding: "16px", textAlign: "center" }}
            >
              No users found
            </Typography>
          ) : (
            <List dense>
              {filteredUsers.map((user) => (
                <ListItem key={user.userId}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "4px 0",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedIds.includes(user.userId)}
                          onChange={() => toggleUser(user.userId)}
                        />
                      }
                      label={user.userName}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Save Button */}
        <Box
          sx={{
            marginTop: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            paddingTop: 2,
          }}
        >
          <PrimaryButton onClick={handleSave} sx={{ padding: "10px 20px" }}>
            Save
          </PrimaryButton>
        </Box>
      </Box>
    </ModalElement>
  );
};

export default ManageUserModal;
