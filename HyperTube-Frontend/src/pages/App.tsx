import { RouterProvider } from "react-router-dom";
import BackgroundLayout from "@/components/Layout/BackgroundLayout";
import { routes } from "@/config/Router";
import "@config/I18n";

export function App() {
  return (
    <BackgroundLayout>
      <RouterProvider router={routes} />
    </BackgroundLayout>
  );
}
