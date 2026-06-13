import sideIndexReducer from "./sideIndexSlice";
import sideGeneralReducer from "./sideBarGeneralSlice";
import previewHtmlReducer from "./previewHtmlSlice";
import pageSetUpReducer from "./pageSlice";
import transactionDetailsReducer from "./transactionDetailsSlice";
import tableDetailReducer from "./tableDetailsSlice";
import totalReducer from "./totalSlice";
import otherDetailsReducer from "./otherDetailsSlice";
import { combineReducers } from "@reduxjs/toolkit";
const invoiceReducer = combineReducers({
  sideIndex: sideIndexReducer,
  sideGeneral: sideGeneralReducer,
  previewHtml: previewHtmlReducer,
  pageSetUp: pageSetUpReducer,
  transactionDetails: transactionDetailsReducer,
  tableDetail: tableDetailReducer,
  totalReducer: totalReducer,
  otherDetails: otherDetailsReducer,
});

export default invoiceReducer;
