import { Menu } from "lucide-react";
import useNavbar from "@/hooks/UseNavbar";

export default function SidebarToggle() {
  const { toggleSidebar } = useNavbar();
  return (
    <div className="lg:hidden block mr-2 sm:mr-4 cursor-pointer">
      <button
        onClick={toggleSidebar}
        className="p-2.5 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 border border-white/10 transition-colors duration-200"
      >
        <Menu className="w-5 h-5 text-gray-300 hover:text-white" />
      </button>
    </div>
  );
}
