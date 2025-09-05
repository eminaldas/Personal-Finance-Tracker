import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/Router";
import { AuthProvider } from "./features/auth/authContext";
import AuthGate from "./app/authGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
      <AuthProvider>
         <RouterProvider router={router} />
         
      </AuthProvider>
      </AuthGate>
    </QueryClientProvider>
  </React.StrictMode>
);
