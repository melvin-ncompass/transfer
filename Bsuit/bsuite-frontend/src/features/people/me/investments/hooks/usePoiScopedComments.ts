import { useEffect, useState } from "react";
import { useGetPOICommentsQuery, type POICommentsResponse } from "../api/itDeclaration.api";
import {
  getPoiScopedFetchCacheKey,
  type PoiScopedFetchParams,
} from "../utils/poiEntityTypes";

/**
 * Loads POI comments for one row without flashing the previous row's list.
 * Shows loading until the fetch for the current fetchKey has finished.
 */
export function usePoiScopedComments(
  fetchArgs: PoiScopedFetchParams | null,
  skip: boolean,
) {
  const fetchKey = fetchArgs ? getPoiScopedFetchCacheKey(fetchArgs) : null;
  const [settledKey, setSettledKey] = useState<string | null>(null);

  const query = useGetPOICommentsQuery(
    fetchArgs ?? { declarationId: 0, entityType: "" },
    { skip: skip || !fetchArgs, refetchOnMountOrArgChange: true },
  );

  const { data , isLoading, isFetching } = query;
  useEffect(() => {
    if (!fetchKey || isLoading || isFetching) return;
    setSettledKey(fetchKey);
  }, [fetchKey, isLoading, isFetching]);

  useEffect(() => {
    if (!fetchKey) setSettledKey(null);
  }, [fetchKey]);

  const loading =
    Boolean(fetchArgs) &&
    (isLoading || isFetching || fetchKey !== settledKey);

  const comments: POICommentsResponse = loading
  ? {
      comments: [],
      commentCount: 0,
    }
  : data ?? {
      comments: [],
      commentCount: 0,
    };
  return { ...query, comments, loading };
}
