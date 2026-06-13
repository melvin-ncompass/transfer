import { Box, Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import { getHighestAndRest } from "./transact.utils";
import { IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
interface AccountsDisplayProps {
  accounts: any[];
}

export const AccountsDisplay = ({ accounts }: AccountsDisplayProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const distinctAccounts = useMemo(() => {
    if (!accounts?.length) return [];
    const seen = new Set<string>();
    return accounts.filter((acc: any) => {
      const key = acc.id != null ? String(acc.id) : String(acc.name ?? "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [accounts]);

  if (!distinctAccounts.length) return <Typography>-</Typography>;

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const { highest, rest } = getHighestAndRest(distinctAccounts);

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Main account name */}
      <Typography variant="body2" fontSize="0.9rem" sx={{ pr: 1 }}>
        {highest?.name ?? "-"}
      </Typography>

      {/* IconButton showing count if more accounts */}
      {rest.length > 0 && (
        <Tooltip title="View all accounts">
          <IconButton
            size="small"
            onClick={handleOpenModal}
            sx={{
              position: "absolute",
              top: 1,
              right: -20,
              color: "primary.main",
              p: 0.3,
            }}
            aria-label="Show accounts"
          >
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Modal showing list */}

      <ModalElement
        open={isModalOpen}
        onClose={handleCloseModal}
        title={`Accounts (${distinctAccounts.length})`}
        maxWidth="sm"
        height="50vh"
      >
        <Box sx={{ maxHeight: "100%", overflowY: "auto" }}>
          {[highest, ...rest].map((acc, idx) => (
            <Box
              key={acc.id ?? acc.name ?? idx}
              sx={{
                display: "flex",
                alignItems: "center",
                py: 1,
                px: 2,
                borderBottom:
                  idx !== distinctAccounts.length - 1
                    ? "1px solid #eee"
                    : "none",
              }}
            >
              {/* Number */}
              <Typography
                sx={{
                  width: 24,
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                {idx + 1}.
              </Typography>

              {/* Account Name */}
              <Typography>{acc.name}</Typography>
            </Box>
          ))}
        </Box>
      </ModalElement>
    </Box>
  );
};
