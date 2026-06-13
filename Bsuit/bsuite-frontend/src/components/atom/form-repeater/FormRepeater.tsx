import { Box, Stack, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { RepeaterElementProps } from "../../../types/types";
import { PrimaryIconButton } from "../button";

export function RepeaterElement<T>({
  label,
  items,
  setItems,
  initialItem,
  renderItem,
  onChange,
  gap = 1,
  boxed = true,
  separateItems = false,
  minItems = 0, // New prop with default value
  canDeleteItem,
  onDelete,
}: RepeaterElementProps<T>) {
  // -----------------------------
  // ADD ITEM
  // -----------------------------
  const handleAdd = () => {
    const newItem =
      typeof initialItem === "object" && initialItem !== null
        ? { ...(initialItem as any) }
        : (initialItem as any);

    const newItems = [...items, newItem];
    setItems(newItems);
    onChange?.(newItems);
  };

  // -----------------------------
  // REMOVE ITEM
  // -----------------------------
  const handleRemove = (index: number) => {
    onDelete?.(items.at(index));
    // Prevent deletion if we're at the minimum
    if (items.length <= minItems) return;

    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange?.(newItems);
  };

  const validateItem = (item: any) => {
    if (!item || typeof item !== "object") return {};

    // If item looks like a MetaItem with key/value, validate those fields.
    if ("key" in item || "value" in item) {
      return {
        key: item.key ? "" : "Key is required",
        value: item.value ? "" : "Value is required",
      };
    }

    // Generic objects: no built-in validation
    return {};
  };

  // -----------------------------
  // CHANGE ITEM VALUE
  // -----------------------------
  const handleChange = (index: number, field: keyof T, value: any) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const updatedItem: any = { ...newItems[index], [field]: value };
      const isMetaItem = "key" in updatedItem || "value" in updatedItem;
      if (isMetaItem) {
        const validation = validateItem(updatedItem);
        if (Object.keys(validation).length > 0) {
          updatedItem.errors = validation;
        } else {
          delete updatedItem.errors;
        }
      }

      newItems[index] = updatedItem;
      onChange?.(newItems);
      return newItems;
    });
  };

  return (
    <Box>
      {/* SECTION HEADER */}
      {/* {label && <Stack */}
      {label && (
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
          sx={{ marginBottom: "20px" }}
        >
          {label ? (
            <Typography variant="subtitle1" fontWeight={600}>
              {label}
            </Typography>
          ) : (
            <></>
          )}

          <PrimaryIconButton
            icon={<AddIcon />}
            variant="outlined"
            onClick={handleAdd}
            sx={{ textTransform: "none" }}
          >
            Add
          </PrimaryIconButton>
        </Stack>
      )}

      {/* ITEMS LIST */}
      <Stack spacing={separateItems ? Math.max(gap, 2) : gap}>
        {items.map((item, index) => {
          const canDelete = canDeleteItem ? canDeleteItem(index) : true;

          return (
            <Box
              key={index}
              borderRadius={separateItems ? 2 : boxed ? 2 : 0}
              sx={{
                transition: "0.2s ease",
                width: "100%",
                ...(separateItems && {
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "grey.50",
                  p: 2,
                }),
              }}
            >
              {separateItems && items.length > 1 && (
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {label ? `${label} ${index + 1}` : `Entry ${index + 1}`}
                </Typography>
              )}
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-start"
                flexWrap="wrap"
              >
                {/* INPUT FIELDS */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  {renderItem(item, index, (field, value) =>
                    handleChange(index, field, value),
                  )}
                </Box>

                {/* DELETE BUTTON */}
                <IconButton
                  color="error"
                  disabled={!canDelete || items.length <= minItems}
                  onClick={() => canDelete && handleRemove(index)}
                  sx={{ alignSelf: "center" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
