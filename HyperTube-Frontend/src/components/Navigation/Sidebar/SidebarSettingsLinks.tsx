import { NavLink } from "react-router-dom";

interface SidebarSettingsLinksProps {
  settingsItems: Array<{ icon: any; label: string; to: string }>;
  closeSidebar: () => void;
}

const SidebarSettingsLinks = ({
  settingsItems,
  closeSidebar,
}: SidebarSettingsLinksProps) => (
  <nav className="mb-2">
    <ul className="space-y-2">
      {settingsItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <li key={index}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-primary-100/30 text-white"
                    : "text-gray-400 hover:text-gray-300 hover:bg-primary-100/20"
                }`
              }
              onClick={closeSidebar}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  </nav>
);

export default SidebarSettingsLinks;
