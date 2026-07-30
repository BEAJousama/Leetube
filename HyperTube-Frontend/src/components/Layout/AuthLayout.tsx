import { Outlet } from "react-router-dom";
import NavigationTabs from "../ui/NavigationSection";
import ScrollToTop from "@/components/ScrollToTop";

const AuthLayout = () => {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <ScrollToTop behavior="smooth" />
      <div className="bg-white/10 backdrop-filter backdrop-blur-sm border border-white/30 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden w-full max-w-xs sm:max-w-lg">
        <NavigationTabs />
        <Outlet />
      </div>
    </main>
  );
};

export default AuthLayout;
