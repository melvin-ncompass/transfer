import { Card, CardContent, CardHeader } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DraggableCard({ id, title, content }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    minWidth: 230,
    touchAction: "none",
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardHeader  title={title} />
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export default DraggableCard;
