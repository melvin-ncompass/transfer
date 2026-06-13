import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, Fade, Grid, Pagination, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useMemo, useRef, useState } from "react";
import DraggableCard from "./DraggableCard";
import {
  useLazyGetDashboardQuery,
  useUpdateOrderMutation,
} from "../api/insights.api";
import { useGetHeaderDataQuery } from "../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../utils/numberFormatter";
import { useNavigate } from "react-router-dom";
import { useGetUserPermissionsQuery } from "../../../../api/permission.api";

interface DashboardItem {
  id: number;
  name: string;
  type: string;
  position: number;
  balance: string;
}

const SCROLL_SPEED = 15;
const EDGE_THRESHOLD = 120;

function Dashboard({ data }: { data: any }) {
  const {data:userpermissionsData} = useGetUserPermissionsQuery(); 
  const hasViewTransactions = userpermissionsData?.data?.permissions?.includes("view_transactions");
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const [lazyGetDashboard] = useLazyGetDashboardQuery();
  const [updateOrder] = useUpdateOrderMutation();
  const { data: headerData } = useGetHeaderDataQuery();

  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];

  const [cards, setCards] = useState<DashboardItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  /* Scrolling Refs */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!data?.data) return;

    const normalized: DashboardItem[] = data.data
      .map((item: any) => ({
        ...item,
        position: Number(item.position),
      }))
      .sort((a: any, b: any) => a.position - b.position);

    setCards(normalized);
    setCards(normalized);

    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }

  }, [data]);

  const getCompositeId = (item: DashboardItem) =>
    `${item.id}-${item.type}`;


  /* Dragging logic for pages */
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    setCards((prev) => {
      const oldIndex = prev.findIndex(
        (c) => getCompositeId(c) === active.id
      );

      const overIndex = prev.findIndex(
        (c) => getCompositeId(c) === over.id
      );

      if (oldIndex === -1 || overIndex === -1) return prev;

      const reordered = arrayMove(prev, oldIndex, overIndex);

      const updated = reordered.map((item, index) => ({
        ...item,
        position: index + 1,
      }));

      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }

      updateTimeout.current = setTimeout(() => {
        updateOrder({
          reportRepositionArray: updated.map((item) => ({
            id: item.id,
            position: item.position,
            accountType: item.type,
          })),
        });
      }, 400);

      return updated;
    });
  };

  /* Scrolling logic */
  const startAutoScroll = (direction: "left" | "right") => {
    if (scrollInterval.current) return;

    scrollInterval.current = setInterval(() => {
      if (!scrollContainerRef.current) return;

      scrollContainerRef.current.scrollBy({
        left: direction === "right" ? SCROLL_SPEED : -SCROLL_SPEED,
      });
    }, 16);
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleDragMove = (event: any) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const clientX = event?.activatorEvent?.clientX;

    if (!clientX) return;

    if (clientX > rect.right - EDGE_THRESHOLD) {
      startAutoScroll("right");
    } else if (clientX < rect.left + EDGE_THRESHOLD) {
      startAutoScroll("left");
    } else {
      stopAutoScroll();
    }
  };

  const handleNameClick = (item: DashboardItem) => {
    const isContact = item.type === "Contact";
    if (isContact) {
      navigate(`/books/transact/home?contactId=${item.id}`);
    } else {
      navigate(`/books/transact/home?accountId=${item.id}&accountType=${item.type}`);
    }
  };

  return (
    <Card sx={{p:2}}>
     
<Typography variant="h5"  >Dashboard</Typography>
      {cards.length > 0 ? (
        <CardContent sx={{p:0}}>
          <DndContext
            sensors={userpermissionsData?.data?.permissions?.includes("manage_insights") ?  sensors : []}
            collisionDetection={closestCenter}
            
            onDragStart={() => {
              setIsDragging(true);
            }}
            onDragMove={handleDragMove}
            onDragEnd={(e) => {
              stopAutoScroll();
              setIsDragging(false);
              handleDragEnd(e);
            }}
          >
            <SortableContext
              items={cards.map((c) => getCompositeId(c))}
              strategy={rectSortingStrategy}
            >
              <Box
                ref={scrollContainerRef}
                sx={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    // pb: 1,
                    minWidth: "max-content",
                  }}
                >
                  {cards.map((card) => (
                    <Grid
                      size={{ xs: 12, sm: 6, md: 2 }}
                      key={getCompositeId(card)}
                    >
                      <DraggableCard
                        id={getCompositeId(card)}
                        title={
                          <Typography
                            color={hasViewTransactions ? "primary" : "text.secondary"}
                            textAlign="center"
                            variant="body1"
                            sx={{
                              cursor: hasViewTransactions ? "pointer" : "default",
                              fontWeight: 550,
                              "&:hover": hasViewTransactions ? {
                                textDecoration: "underline",
                              } : {},
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasViewTransactions) {
                                handleNameClick(card);
                              }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {card.name}
                          </Typography>
                        }

                        content={
                          <Stack alignItems="center">
                            <Typography variant="subtitle2">{card.type}</Typography>
                            <Typography variant="subtitle2">
                              {formatCurrencyByCommaSeparation(
                                card.balance,
                                commaSeparation,
                                currency
                              )}
                            </Typography>
                          </Stack>
                        }
                      />
                    </Grid>
                  ))}
                </Box>
              </Box>
            </SortableContext>
          </DndContext>
        </CardContent>
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="150px"
        >
          <Typography>No Data Available</Typography>
        </Box>
      )}
    </Card>
  );
}

export default Dashboard;
