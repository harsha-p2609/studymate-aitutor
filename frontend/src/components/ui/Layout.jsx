// ============================================================
// components/ui/Layout.jsx
// Layout component wrapping all authenticated views
// Includes Sidebar (desktop), Bottom Navigation (mobile), and Topbar
// ============================================================

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import useAuth from "../../hooks/useAuth";

const Layout = ({ children }) => {
  const { user } = useAuthContext();
  const { handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "My Study Plan", path: "/study-plan", icon: "event_note" },
    { name: "AI Tutor", path: "/ai-tutor", icon: "psychology" },
    { name: "Quizzes", path: "/quizzes", icon: "quiz" },
  ];

  const getPageTitle = () => {
    switch (currentPath) {
      case "/dashboard":
        return "Dashboard";
      case "/study-plan":
        return "My Study Plan";
      case "/ai-tutor":
        return "AI Tutor";
      case "/quizzes":
        return "Quizzes";
      default:
        if (currentPath.startsWith("/quiz/")) {
          return "Quiz Interface";
        }
        return "StudyMate AI";
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    const firstName = user?.name?.split(" ")[0] || "Student";
    if (hours < 12) return `Good Morning, ${firstName}!`;
    if (hours < 18) return `Good Afternoon, ${firstName}!`;
    return `Good Evening, ${firstName}!`;
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen antialiased flex flex-col">
      {/* ── Side Navigation (Desktop) ─────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full overflow-y-auto px-md py-lg w-[280px] hidden md:flex flex-col border-r border-outline-variant bg-surface-container-lowest z-40">
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">StudyMate AI</h1>
          <p className="font-label-md text-label-md text-on-surface-variant">Educational Partner</p>
        </div>
        
        <nav className="flex flex-col gap-xs flex-grow">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (item.path === "/quizzes" && currentPath.startsWith("/quiz/"));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-sm py-xs rounded-full flex items-center gap-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="font-label-md text-label-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-xs pt-lg border-t border-outline-variant">
          <div className="text-on-surface-variant hover:bg-surface-container-high px-sm py-xs rounded-full flex items-center gap-sm transition-colors cursor-pointer">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">{user?.name || "Profile"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-error hover:bg-error-container/10 px-sm py-xs rounded-full flex items-center gap-sm transition-colors text-left w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer Backdrop ───────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-full overflow-y-auto px-md py-lg w-[280px] bg-surface-container-lowest border-r border-outline-variant z-50 md:hidden flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-lg flex justify-between items-center">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary">StudyMate AI</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">Educational Partner</p>
          </div>
          <button onClick={toggleMobileMenu} className="material-symbols-outlined text-on-surface-variant">
            close
          </button>
        </div>

        <nav className="flex flex-col gap-xs flex-grow" onClick={toggleMobileMenu}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (item.path === "/quizzes" && currentPath.startsWith("/quiz/"));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-sm py-xs rounded-full flex items-center gap-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="font-label-md text-label-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-xs pt-lg border-t border-outline-variant">
          <div className="text-on-surface-variant px-sm py-xs flex items-center gap-sm">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">{user?.name}</span>
          </div>
          <button
            onClick={() => {
              toggleMobileMenu();
              handleLogout();
            }}
            className="text-error hover:bg-error-container/10 px-sm py-xs rounded-full flex items-center gap-sm transition-colors text-left w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center w-full px-gutter py-md md:ml-[280px] md:w-[calc(100%-280px)] bg-surface sticky top-0 z-30 border-b border-outline-variant/30">
        <div className="flex items-center gap-xs">
          <button className="md:hidden p-xs flex items-center" onClick={toggleMobileMenu}>
            <span className="material-symbols-outlined text-primary text-[28px]">menu</span>
          </button>
          <div className="hidden md:block">
            <h2 className="font-title-md text-title-md text-primary font-bold">{getGreeting()}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Your learning journey is on track.</p>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary md:hidden">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-md">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 border border-outline-variant rounded-full bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-64 text-label-md font-label-md"
              placeholder="Search resources..."
              type="text"
            />
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity">
            notifications
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center">
            {user?.avatar ? (
              <img className="w-full h-full object-cover" alt={user.name} src={user.avatar} />
            ) : (
              <div className="w-full h-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-md">
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Page Content ────────────────────────────────────────── */}
      <main className="md:ml-[280px] flex-grow flex flex-col">
        {children}
      </main>

      {/* ── Bottom Navigation (Mobile Only) ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full z-30 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant md:hidden shadow-lg">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === "/quizzes" && currentPath.startsWith("/quiz/"));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-100 ${
                isActive ? "bg-primary-container text-on-primary-container px-4" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-sm text-label-sm">{item.name.replace("My ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
