import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    // Here you can define global queries options configurations
    queries: {
      retry: 1,

      throwOnError(_error, _query) {
        return true;
      },
    },
    mutations: {
      // Here you can define global mutation options configurations
      onError: (_error) => {
        // console.error("Global mutation error handler:", error); // Removed for lint compliance
      },
    },
  },
});

export function ApiProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
