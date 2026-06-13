import { type RouteObject, Navigate } from "react-router-dom";
import { type ComponentType, lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { Box } from "@mui/material";
import { AnalyticsBarLoader } from "../components/atom/circular-progress/AnimatedBarChart";
import { RouteGuard } from "../guards/RouteGuard";
import BooksLayout from "../features/books/BooksLayout";

const lazyWithSuspense = (
  factory: () => Promise<{ default: ComponentType<any> }>,
) => {
  const Component = lazy(factory);
  return (
    <Suspense
      fallback={
        <Box
          display={"flex"}
          height={"84vh"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <AnalyticsBarLoader />
        </Box>
      }
    >
      <Component />
    </Suspense>
  );
};

const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedRoute redirectTo="/login" permission={""} />,
    children: [
      {
        path: "",
        element: lazyWithSuspense(() => import("../pages/SplashScreen")),
      },
      {
        path: "profile/",
        element: lazyWithSuspense(() => import("../pages/ProfilePage")),
      },
      {
        path: "company/home",
        element: lazyWithSuspense(() => import("../pages/CompanyHomePage")),
      },
      {
        path: "company/settings",
        children: [
          {
            path: "",
            element: (
              <RouteGuard permission="view_business_settings">
                {lazyWithSuspense(() => import("../pages/Settings"))}
              </RouteGuard>
            ),
          },
          {
            path: "activity",
            element: lazyWithSuspense(() => import("../pages/ActivityPage")),
          },
          {
            path: "invoice",
            element: lazyWithSuspense(
              () => import("../pages/InvoiceTemplatePage"),
            ),
          },
        ],
      },

      // BOOKS SECTION
      {
        path: "books/",
        element: <BooksLayout />,
        children: [
          {
            path: "coa/home",
            element: <RouteGuard permission="view_coa">{lazyWithSuspense(() => import("../pages/CoaHomePage"))}</RouteGuard>,
          },
          {
            path: "transact/home",
            element: <RouteGuard permission="view_transactions">{lazyWithSuspense(() => import("../pages/TransactPage"))}</RouteGuard>,
          },
          {
            path: "transact/bank-statements-import",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/books/transact/uncatogorized/import/components/BankAccountStatementImportView"
                ),
            ),
          },
          {
            path: "insights",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/InsightsPage"))}</RouteGuard>
          },
          {
            path: "insights/profit-and-loss",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/ProfitAndLossPage"))}</RouteGuard>
          },
          {
            path: "insights/balance-sheet",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/BalanceSheetPage"))}</RouteGuard>
          },
          {
            path: "insights/tax-summary",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/TaxSummaryPage"))}</RouteGuard>
          },
          {
            path: "insights/tds-summary",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/TDSSummaryPage"))}</RouteGuard>
          },
          {
            path: "insights/trial-balance",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(() => import("../pages/TrialBalancePage"))}</RouteGuard>
          },
          {
            path: "insights/invoice-summary",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(
              () => import("../pages/InvoiceSummaryPage"),
            )}</RouteGuard>
          },
          {
            path: "insights/contact-balance-summary",
            element: <RouteGuard permission="view_insights">{lazyWithSuspense(
              () => import("../pages/ContactBalanceSummaryPage"),
            )}</RouteGuard>
          },
        ],
      },

      // PEOPLE SECTION — PeopleLayout provides sidebar + Outlet for all people routes
      {
        path: "people",
        element: lazyWithSuspense(
          () => import("../features/people/PeopleLayout"),
        ),
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          {
            path: "home",
            element: lazyWithSuspense(() => import("../pages/PeopleHomePage")),
          },
          {
            path: "directory/add",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/org/people/directory/pages/AddEmployeeLayoutPage"
                ),
            ),
          },
          {
            path: "directory/edit/:id",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/org/people/directory/pages/EditEmployeeLayoutPage"
                ),
            ),
          },
          {
            path: "directory/employee/:id",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/org/people/directory/pages/EmployeeDetailsLayoutPage"
                ),
            ),
          },
          {
            path: "directory/employee/:id/investment/add",
            element: lazyWithSuspense(
              () => import("../features/people/org/people/directory/components/investments/ITDeclarationModal")
            ),
          },
          {
            path: "directory/employee/:id/investment/edit",
            element: lazyWithSuspense(
              () => import("../features/people/org/people/directory/components/investments/ITDeclarationModal")
            ),
          },
          {
            path: "configs",
            children: [
              {
                path: ":id",
                element: lazyWithSuspense(
                  () =>
                    import(
                      "../features/people/salary/payrun/settings/IncomeTax/components/ConfigDetailsPage"
                    ),
                ),
              },
            ],
          },
          {
            path: "time/holiday-plan/import",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/time/holiday-plan/components/HolidayPlanImport"
                ),
            ),
          },
          {
            path: "salary/template/add",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/salary/structure/SalaryTemplate/components/SalaryTemplateModal"
                ),
            ),
          },
          {
            path: "salary/template/edit/:id",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/salary/structure/SalaryTemplate/components/EditSalaryTemplate"
                ),
            ),
          },
          {
            path: "salary/template/duplicate/:id/",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/salary/structure/SalaryTemplate/components/EditSalaryTemplate"
                ),
            ),
          },
          {
            path: "salary/template/import",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/salary/structure/SalaryTemplate/components/ImportSalaryTemplate"
                ),
            ),
          },
          {
            path: "employee/import",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/employee/importEmployee/components/ImportEmployeePage"
                ),
            ),
          },
          {
            path: "salary-template/revise/edit/:id/:templateId",
            element: lazyWithSuspense(() => import("../features/people/org/people/directory/components/EditSalaryRevision"))
          },
          {
            path: "salary-template/revise/:id",
            element: lazyWithSuspense(() => import("../features/people/org/people/directory/components/SalaryRevision"))
          },
          {
            path: "salary-template/:id",
            element: lazyWithSuspense(() => import("../features/people/org/people/directory/components/SalaryDetails"))
          },
          {
            path: "approvals/poi/:employeeId",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/approvals/pages/PoiApprovalDetailPage"
                ),
            ),
          },
          {
            path: "investment",
            children: [
              {
                path: "add",
                element: lazyWithSuspense(
                  () =>
                    import(
                      "../features/people/me/investments/components/ITDeclarationModal"
                    ),
                ),
              },
              {
                path: "edit",
                element: lazyWithSuspense(
                  () =>
                    import(
                      "../features/people/me/investments/components/ITDeclarationModal"
                    ),
                ),
              },
            ],
          },
          {
            path: "document/template",
            children: [
              {
                path: "add",
                element: lazyWithSuspense(
                  () =>
                    import(
                      "../features/people/org/documents/documentTemplates/AddDocumentTemplatePage"
                    ),
                ),
              },
            ],
          },
          {
            path: "me/document/acknowledge/:id",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/me/documents/pages/AcknowledgeDocumentPage"
                ),
            ),
          },
          {
            path: "org/document/acknowledge/:id",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/me/documents/pages/AcknowledgeDocumentPage"
                ),
            ),
          },
          {
            path: "document/acknowledge/pending",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/me/documents/pages/AcknowledgeDocumentPage"
                ),
            ),
          },
          {
            path: "salary/payrun/:payrunId",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/salary/payrun/runpayroll/PayrollDetailsPage"
                ),
            ),
          },
          {
            path: "projects/:projectId",
            element: lazyWithSuspense(
              () =>
                import(
                  "../features/people/projects-timesheets/projects/components/ProjectDetailsSection"
                ),
            ),
          },{
            path:"document/template",
            children:[
              {path:"add",element:lazyWithSuspense(()=>import("../features/people/org/documents/documentTemplates/AddDocumentTemplatePage"))}
            ]
          },
          {
            path:"helpdesk/chat/:id",
            element:lazyWithSuspense(()=>import("../features/people/org/helpdesk/employer/views/Chat"))
          },
          {
            path: "helpdesk/tickets/:id",
            element: lazyWithSuspense(
              () => import("../features/people/org/helpdesk/employer/views/TicketDetail"),
            ),
          },
          {
            path: "helpdesk/categories/add",
            element: lazyWithSuspense(
              () => import("../features/people/org/helpdesk/employer/settings/TicketCategory"),
            ),
          },
          {
            path: "helpdesk/categories/edit/:categoryId",
            element: lazyWithSuspense(
              () => import("../features/people/org/helpdesk/employer/settings/TicketCategory"),
            ),
          }
        ],
      },

      //  ROLE MANAGEMENT
      {
        path: "role/",
        children: [
          {
            path: "create",
            element: <RouteGuard permission={"manage_user_management"}>
              {lazyWithSuspense(
                () => import("../pages/RbaCreateRolePage"),
              )}
            </RouteGuard>
          },
          {
            path: "edit",
            element:
              <RouteGuard permission={"manage_user_management"}>
                {lazyWithSuspense(
                  () => import("../pages/RbaCreateRolePage"),
                )}
              </RouteGuard>
          },
          {
            path: "home",
            element: <RouteGuard permission={"manage_user_management"}>
              {lazyWithSuspense(
                () => import("../pages/RbaHomePage"), 
              )}
            </RouteGuard>
          },
        ],
      },

      //  IMPORT ROUTES
      {
        path: "contacts/import",
        element: lazyWithSuspense(() => import("../pages/ContactsImportPage")),
      },
      {
        path: "accounts/import",
        element: lazyWithSuspense(() => import("../pages/AccountsImportPage")),
      },
    ],
  },
];

export default appRoutes;
