import { Box, Stack, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function RepeaterDnD<T>({
  label,
  items,
  setItems,
  initialItem,
  renderItem,
  onChange,
  gap = 1,
  boxed = true,
  disableDelete,
  disableDrag,
  gridcol = true,
  header, // ✅ new optional prop
}: {
  label?: string;
  items: T[];
  setItems: (items: T[]) => void;
  initialItem: T;
  renderItem: (
    item: T,
    index: number,
    onChange: (field: keyof T, value: any) => void,
  ) => React.ReactNode;
  onChange?: (items: T[]) => void;
  gap?: number;
  boxed?: boolean;
  disableDelete?: (item: T, index: number) => boolean;
  disableDrag?: (item: T, index: number) => boolean;
  gridcol?: boolean;
  header?: React.ReactNode; // ✅ accepts JSX
}) {
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
  // INSERT ITEM BELOW INDEX
  // -----------------------------
  const handleInsert = (index: number) => {
    const newItem =
      typeof initialItem === "object" && initialItem !== null
        ? { ...(initialItem as any) }
        : (initialItem as any);

    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);

    setItems(newItems);
    onChange?.(newItems);
  };

  // -----------------------------
  // REMOVE ITEM
  // -----------------------------
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange?.(newItems);
  };

  // -----------------------------
  // CHANGE ITEM VALUE
  // -----------------------------
  const handleChange = (index: number, field: keyof T, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    onChange?.(newItems);
  };

  // -----------------------------
  // DRAG END
  // -----------------------------
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((_, i) => i.toString() === active.id);
    const newIndex = items.findIndex((_, i) => i.toString() === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onChange?.(newItems);
  };

  return (
    <Box p={1}>
      {/* HEADER */}
      <Stack direction="row" alignItems="center" gap={2}>
        {label && (
          <Typography variant="subtitle1" fontWeight={600}>
            {label}
          </Typography>
        )}

        {items.length === 0 && <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>}
      </Stack>
      {header && (
        <Box mt={1} mb={1}>
          {header}
        </Box>
      )}
      {/* LIST */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((_, i) => i.toString())}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={gap} direction={"column"}>
            {items.map((item, index) => (
              <SortableRow
                key={index}
                id={index.toString()}
                item={item}
                index={index}
                boxed={boxed}
                disableDelete={disableDelete?.(item, index)}
                disableDrag={disableDrag?.(item, index)}
                onRemove={() => handleRemove(index)}
                onAddBelow={() => handleInsert(index)} // 👈 NEW
                gridcol={gridcol}
              >
                {renderItem(item, index, (field, value) =>
                  handleChange(index, field, value),
                )}
              </SortableRow>
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
    </Box>
  );
} function SortableRow({
  id,
  children,
  boxed = true,
  disableDelete = false,
  disableDrag = false,
  onRemove,
  onAddBelow,
  gridcol,
}: any) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id,
    disabled: !!disableDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        overflow: "visible",
        py: 1,
        mb: 1,
        alignItems: "center",
        bgcolor: isDragging ? "action.selected" : "background.paper",
        display: "grid",
        gap: 1,
        gridTemplateColumns: gridcol
          ? {
            xs: "1fr",
            sm: "40px 1fr",
            md: "5% 25% 20% 15% 15% 5% 5%",
          }
          : "40px 1fr auto",
      }}
    >
      {/* DRAG LEFT */}
      <IconButton
        {...attributes}
        {...listeners}
        size="small"
        disabled={disableDrag}
        sx={{ cursor: disableDrag ? "default" : "grab" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      {/* CENTER CONTENT */}
      <>
        {children}
      </>

      {/* RIGHT ACTIONS */}
      {!gridcol && (
        <Stack direction="row">
          <IconButton size="small" onClick={onAddBelow}>
            <AddIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={onRemove}
            disabled={disableDelete}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}

      {/* Original layout when gridcol = true */}
      {gridcol && (
        <>
          <IconButton size="small" onClick={onAddBelow}>
            <AddIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={onRemove}
            disabled={disableDelete}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
}