import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import ThemeCustomization from "./themes/index.tsx";
import { ConfigProvider } from "./context/ConfigContext.tsx"; // import your provider
import { PermissionProvider } from "./context/PermissionContext.tsx";
import { SnackbarProvider } from "./context/SnackbarContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider>
      <ThemeCustomization>
        <Provider store={store}>
          <PermissionProvider>
            <SnackbarProvider>
              <App />
            </SnackbarProvider>
          </PermissionProvider>
        </Provider>
      </ThemeCustomization>
    </ConfigProvider>
  </StrictMode>,
);
