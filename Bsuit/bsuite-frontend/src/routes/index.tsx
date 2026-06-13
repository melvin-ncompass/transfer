// import { lazy } from "react";
import { type RouteObject } from "react-router-dom";
import Layout from "../layout/Layout";
import appRoutes from "./AppRoutes";
import LoginSignupPage from "../pages/LoginSignupPage";
import ConfirmResetPasswordPage from "../pages/ConfirmResetPasswordPage";
import ExampleComponent from "../pages/Example";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import ResendEmailPage from "../pages/ResendEmailPage";
import NotFoundPage from "../pages/NotFoundPage";
import ErrorPage from "../pages/ErrorPage";
import LandingPage from "../pages/LandingPage";
import SetPasswordView from "../features/auth/views/SetPasswordView";
import TwoFARecoveryView from "../features/auth/views/TwoFARecoveryView";
import StyleGuide from "../pages/StyleGuide";
import AccessDeniedPage from "../pages/NoAccessPage";

// const Layout = lazy(() => import("../layout/Layout"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout/>,
    errorElement: <ErrorPage />,
    children: [...appRoutes],
  },
  {
    path: "/landing",
    element: <LandingPage/>,
  },
  {
    path: "/login",
    element: <LoginSignupPage/>,
    
  },
   {
    path: "/style-guide",
    element: <StyleGuide/>,
    
  },
  {
    path: "/example",
    element: <ExampleComponent/>,
    
  },
  {
    path: "/auth/confirm-reset-password/:token",
    element: <ConfirmResetPasswordPage/>,
  },
  {
    path: "auth/verify_email/:token",
    element: <VerifyEmailPage/>,
  },
  {
    path: "auth/resend_verfication_email/:token",
    element: <ResendEmailPage/>,
  },
  {
    path:'auth/set_password/:token',
    element:<SetPasswordView/>
  },
  {
    path:'auth/recovery_2fa/:token',
    element:<TwoFARecoveryView/>
  },
  {
    path:"*",
    element:<NotFoundPage/>
  },
  {
    path:"no-access",
    element:<AccessDeniedPage/>
  }
];

export default routes;
