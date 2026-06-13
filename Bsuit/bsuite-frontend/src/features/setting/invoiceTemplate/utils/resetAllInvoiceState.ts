
import { resetTransactionDetails } from "../slice/transactionDetailsSlice";
import { resetTableDetails } from "../slice/tableDetailsSlice";
import { resetOtherDetails } from "../slice/otherDetailsSlice";
import { resetPage } from "../slice/pageSlice";
import { resetHeader } from "../slice/previewHtmlSlice";
import { resetTemplateName } from "../slice/sideBarGeneralSlice";
import type { AppDispatch } from "../../../../store/store";

export const resetAllInvoiceState = (dispatch: AppDispatch) => {
  dispatch(resetTransactionDetails());
  dispatch(resetTableDetails());
  dispatch(resetOtherDetails());
  dispatch(resetPage());
  dispatch(resetHeader());
  dispatch(resetTemplateName());
};
