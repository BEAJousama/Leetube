import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./NavigationSection.css";
import { AppRoutes } from "@/api/Routes";

const NavigationSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname.includes("register") ? "register" : "login";

  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${mode === "login" ? "active" : ""}`}
        onClick={() => navigate(AppRoutes.LOGIN)}
        type="button"
      >
        Login
      </button>
      <button
        className={`mode-btn ${mode === "register" ? "active" : ""}`}
        onClick={() => navigate(AppRoutes.REGISTER)}
        type="button"
      >
        Register
      </button>
      <div
        className={`mode-indicator ${mode === "register" ? "register" : ""}`}
      />
    </div>
  );
};

export default NavigationSection;
