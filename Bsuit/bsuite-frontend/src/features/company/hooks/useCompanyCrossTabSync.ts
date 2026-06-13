import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { baseApi } from "../../../api/base.api";
import { TAGS } from "../../../api/tagTypes";
import { subscribeCompanyChanged } from "../utils/companyCrossTabSync";

/**
 * When another tab switches company, the cookie is already shared; this invalidates
 * RTK Query caches so the current tab stays on the same URL and refetches for the new company.
 */
export function useCompanyCrossTabSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    return subscribeCompanyChanged(() => {
      dispatch(baseApi.util.invalidateTags([...TAGS]));
    });
  }, [dispatch]);
}
