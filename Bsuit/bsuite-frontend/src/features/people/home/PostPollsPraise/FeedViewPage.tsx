import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
} from "@mui/material";
import PostCard from "./components/PostCard";
import { applyAnnouncementsStreamToCache } from "./applyFeedStreamUpdate";
import { useFeedActivityRefresh, type FeedActivityPayload } from "./feedActivityBus";
import {
  announcementsApi,
  useDeletePollMutation,
  useDeletePostMutation,
  useDeletePraiseMutation,
  useGetAnnouncementsFeedQuery,
} from "./api/announcements.api";

const LIMIT = 10;

interface FeedViewProps {
  currentUserId: number | null;
  refreshKey: number;
}

function FeedView({ currentUserId, refreshKey }: FeedViewProps) {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const isFirstMount = useRef(true);
  const pageRef = useRef(page);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAnnouncementsFeedQuery(
    { page, limit: LIMIT },
    { refetchOnMountOrArgChange: true }
  );

  const [deletePost] = useDeletePostMutation();
  const [deletePoll] = useDeletePollMutation();
  const [deletePraise] = useDeletePraiseMutation();

  pageRef.current = page;

  const resetToPage1AndRefetch = useCallback(() => {
    if (pageRef.current !== 1) {
      setPage(1);
    } else {
      refetch();
    }
  }, [refetch]);

  const refreshFeedFromStream = useCallback(() => {
    resetToPage1AndRefetch();
  }, [resetToPage1AndRefetch]);

  const handleStreamFeedActivity = useCallback(
    (payload: FeedActivityPayload) => {
      const removedFromCache = applyAnnouncementsStreamToCache(dispatch, payload);
      if (!removedFromCache) {
        refreshFeedFromStream();
      }
    },
    [dispatch, refreshFeedFromStream],
  );

  useFeedActivityRefresh(handleStreamFeedActivity);

  useEffect(() => {
    if (!data?.data) return;
    setHasMore(data.data.length >= LIMIT);
  }, [data]);

  const applyManualRefresh = useCallback(() => {
    resetToPage1AndRefetch();
  }, [resetToPage1AndRefetch]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    applyManualRefresh();
  }, [refreshKey, applyManualRefresh]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetching &&
          hasMore &&
          (data?.data?.length ?? 0) > 0
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { root: container, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isFetching, hasMore, data?.data?.length]);

  useEffect(() => {
    if (!data?.data?.length && page !== 1) {
      setPage(1);
    }
  }, [data?.data?.length, page]);

  const handleDelete = useCallback(async (item: any) => {
    try {
      setIsDeleting(true);
      switch (item.feedType) {
        case "post": await deletePost({ id: item.id }).unwrap(); break;
        case "poll": await deletePoll({ id: item.id }).unwrap(); break;
        case "praise": await deletePraise({ id: item.id }).unwrap(); break;
        default: return;
      }
      resetToPage1AndRefetch();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  }, [deletePost, deletePoll, deletePraise, resetToPage1AndRefetch]);

  const allItems = data?.data ?? [];

  const currentUserName = useMemo(() => {
    if (!currentUserId || !allItems.length) return "";
    for (const item of allItems) {
      const author = item.feedType === "praise" ? item.praisedBy : item.author;
      if (author.id === currentUserId) {
        if (author.contact?.name) {
          const last = author.contact.lastName ? ` ${author.contact.lastName}` : "";
          return `${author.contact.name}${last}`;
        }
        return author.nameAsPerPan ?? author.employeeId ?? "";
      }
    }
    return "";
  }, [currentUserId, allItems]);

  return (
    <Card
      elevation={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        p: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
          Recent Activity
        </Typography>
      </Box>

      <Box
        ref={scrollContainerRef}
        sx={{ flex: 1, overflowY: "auto", pr: 0.5, position: "relative" }}
      >
        {isLoading && (
          <Box sx={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.7)", backdropFilter: "blur(2px)", zIndex: 2,
          }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {isDeleting && (
          <Box sx={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.5)", backdropFilter: "blur(2px)", zIndex: 10,
          }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {isError && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
            Failed to load announcements.
          </Typography>
        )}

        {!isLoading && !isError && allItems.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
            No announcements yet.
          </Typography>
        )}

        {allItems.map((item) => (
          <Box key={`${item.feedType}-${item.id}`} sx={{ mb: 2 }}>
            <PostCard
              item={item}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onDelete={() => handleDelete(item)}
            />
          </Box>
        ))}

        <Box ref={sentinelRef} sx={{ py: 2, display: "flex", justifyContent: "center" }}>
          {isFetching && !isLoading && <CircularProgress size={24} />}
          {!hasMore && allItems.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              You're all caught up
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export default FeedView;